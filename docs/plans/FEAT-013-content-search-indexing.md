# Implementation Plan: Content Search Indexing

**Spec:** `docs/specs/FEAT-013-content-search-indexing.md`
**Created:** 2026-02-28
**Status:** Draft

## Summary

This feature introduces an event-driven pipeline that keeps an OpenSearch index (`content_items`) in sync with content item mutations in PostgreSQL. When a prompt is created, updated, or deleted, the existing `PromptsResource` publishes a fire-and-forget event on the Vert.x event bus. A new `search` package contains a consumer that receives these events and indexes/deletes documents in OpenSearch. The pipeline is fully decoupled: indexing failures are logged at WARN and never block content authoring.

## Key Design Decisions

1. **New `search` package as a separate functional slice.** Per ADR007, each domain concern gets its own package. Search indexing is a cross-cutting concern that reacts to content changes but has no direct relationship to the content authoring domain. Placing it in `com.infosupport.promptyard.search` keeps the `content` package focused on CRUD.

2. **Vert.x event bus with `requestAndForget` for publishing.** The event bus is already bundled with Quarkus (via the `quarkus-vertx` extension, which is a transitive dependency). Using `EventBus.requestAndForget("content-item.changed", event)` in the resource layer provides fire-and-forget semantics. The consumer uses `@ConsumeEvent(value = "content-item.changed", blocking = true)` because OpenSearch calls are blocking I/O.

3. **Single event address with event type discriminator.** Use one address `content-item.changed` for all three event types (CREATED, UPDATED, DELETED). The consumer inspects `eventType` to decide whether to index or delete. This avoids proliferating addresses and keeps the consumer logic centralized.

4. **Local codec for event objects.** Quarkus provides a default local codec for the Vert.x event bus that handles arbitrary objects delivered within the same JVM. No custom codec is needed because the event bus is local-only (no clustering).

5. **Index document uses database ID as string.** The OpenSearch document `_id` is `contentItem.id.toString()`. This makes create and update idempotent (same ID = upsert) and delete straightforward.

6. **OpenSearch client injected via CDI.** The Quarkiverse extension provides `OpenSearchClient` as a CDI bean. The consumer injects it directly -- no wrapper or abstraction layer needed.

7. **Index mapping created at startup via `@Observes StartupEvent`.** A startup observer in the search package calls `client.indices().create(...)` with explicit field mappings (keyword, text, keyword array). If the index already exists, catch `OpenSearchException` and log at INFO. This ensures the index is ready before any events arrive.

8. **Event payload carries denormalized data (not entity references).** CREATED/UPDATED events carry the full document payload (slug, contentType, content, description, tags, authorFullName) so the consumer does not need to query the database. DELETE events carry only `contentItemId`, `contentType`, and `eventType`. This avoids coupling the search consumer to JPA entities or repositories.

9. **OpenSearch dev services for testing.** The Quarkiverse OpenSearch extension provides automatic dev services (starts an OpenSearch container). No manual Docker setup needed. The extension property `quarkus.opensearch.devservices.enabled=true` is the default behavior when `quarkus.opensearch.hosts` is not set.

10. **Version for `quarkus-opensearch-java-client`: use `3.2.2` with `quarkus-opensearch-transport-apache` for transport.** Both artifacts are from `io.quarkiverse.opensearch`. The transport artifact inherits its version from the java-client parent BOM, so only the java-client needs an explicit version.

## Implementation Steps

### Phase 1: Maven Dependencies

**Step 1.1:** Add OpenSearch dependencies to the server POM.

- **File:** `apps/server/pom.xml`
- Add two dependencies in the `<dependencies>` section:

```xml
<dependency>
    <groupId>io.quarkiverse.opensearch</groupId>
    <artifactId>quarkus-opensearch-java-client</artifactId>
    <version>3.2.2</version>
</dependency>
<dependency>
    <groupId>io.quarkiverse.opensearch</groupId>
    <artifactId>quarkus-opensearch-transport-apache</artifactId>
    <version>3.2.2</version>
</dependency>
```

No additional Vert.x dependency is needed -- `quarkus-vertx` is already a transitive dependency of `quarkus-rest`.

### Phase 2: Event Model

**Step 2.1:** Create the `ContentItemEventType` enum.

- **New file:** `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemEventType.kt`
- Define a simple enum with three values: `CREATED`, `UPDATED`, `DELETED`.

```kotlin
package com.infosupport.promptyard.search

enum class ContentItemEventType {
    CREATED,
    UPDATED,
    DELETED
}
```

**Step 2.2:** Create the `ContentItemEvent` data class.

- **New file:** `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemEvent.kt`
- This is a plain Kotlin data class (not `@Serializable` -- it is only used in-process on the event bus, never serialized to JSON over HTTP).
- Fields for CREATED/UPDATED: `contentItemId`, `eventType`, `slug`, `contentType`, `content`, `description`, `tags`, `authorFullName`.
- Fields for DELETED: `contentItemId`, `eventType`, `contentType` (other fields null).
- Use nullable types for the fields that are absent on DELETE events.

```kotlin
package com.infosupport.promptyard.search

data class ContentItemEvent(
    val contentItemId: Long,
    val eventType: ContentItemEventType,
    val contentType: String,
    val slug: String? = null,
    val content: String? = null,
    val description: String? = null,
    val tags: List<String>? = null,
    val authorFullName: String? = null,
)
```

### Phase 3: Publish Events from PromptsResource

**Step 3.1:** Inject `EventBus` and publish a CREATED event after `persist()` in `submitPrompt`.

- **File:** `apps/server/src/main/kotlin/com/infosupport/promptyard/content/PromptsResource.kt`
- Add `@Inject lateinit var eventBus: io.vertx.mutiny.core.eventbus.EventBus`.
- After `contentItemRepository.persist(prompt)` in `submitPrompt()`, construct a `ContentItemEvent` with `eventType = CREATED` and call `eventBus.requestAndForget("content-item.changed", event)`.
- The author's full name is available from `userProfile.fullName` which is already loaded in scope.

**Step 3.2:** Publish an UPDATED event at the end of `updatePrompt`.

- **File:** `apps/server/src/main/kotlin/com/infosupport/promptyard/content/PromptsResource.kt`
- After updating the prompt fields (before the `return`), construct a `ContentItemEvent` with `eventType = UPDATED`.
- The prompt's `authorId` matches `userProfile.id` (already verified), so use `userProfile.fullName` for `authorFullName`.
- Use the existing in-scope prompt fields for slug, content, description, tags.

**Step 3.3:** Publish a DELETED event before `contentItemRepository.delete(prompt)` in `deletePrompt`.

- **File:** `apps/server/src/main/kotlin/com/infosupport/promptyard/content/PromptsResource.kt`
- Before `contentItemRepository.delete(prompt)`, construct a `ContentItemEvent` with `eventType = DELETED`, carrying only `contentItemId`, `contentType`, and `eventType`.
- Publish via `eventBus.requestAndForget("content-item.changed", event)`.

**Important:** The event must be published before delete because after `delete()` the entity's ID may not be reliably accessible (depending on JPA provider behavior). Publishing before delete also ensures the event is sent even if the delete were to fail (though in practice both happen in the same transaction).

### Phase 4: OpenSearch Index Initialization

**Step 4.1:** Create the `ContentItemIndexInitializer` startup observer.

- **New file:** `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemIndexInitializer.kt`
- An `@ApplicationScoped` bean that observes `StartupEvent`.
- Injects `OpenSearchClient`.
- On startup, checks if the `content_items` index exists via `client.indices().exists(...)`. If not, creates it with explicit mappings:
  - `slug`: `keyword`
  - `contentType`: `keyword`
  - `content`: `text`
  - `description`: `text`
  - `tags`: `keyword` (array)
  - `authorFullName`: `text` with a `keyword` sub-field for exact matching
- Wrap the creation in a try-catch. If the index already exists (e.g., OpenSearch returns an error), log at INFO and continue.
- Log at INFO on successful creation: "Created OpenSearch index 'content_items'".

```kotlin
package com.infosupport.promptyard.search

import io.quarkus.runtime.StartupEvent
import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.event.Observes
import jakarta.inject.Inject
import org.opensearch.client.opensearch.OpenSearchClient
import org.opensearch.client.opensearch._types.mapping.KeywordProperty
import org.opensearch.client.opensearch._types.mapping.Property
import org.opensearch.client.opensearch._types.mapping.TextProperty
import org.jboss.logging.Logger

@ApplicationScoped
class ContentItemIndexInitializer {

    @Inject
    lateinit var client: OpenSearchClient

    private val log = Logger.getLogger(ContentItemIndexInitializer::class.java)

    fun onStartup(@Observes event: StartupEvent) {
        try {
            val exists = client.indices().exists { it.index("content_items") }.value()
            if (!exists) {
                client.indices().create { builder ->
                    builder.index("content_items")
                        .mappings { m ->
                            m.properties("slug", Property.of { p -> p.keyword(KeywordProperty.of { it }) })
                                .properties("contentType", Property.of { p -> p.keyword(KeywordProperty.of { it }) })
                                .properties("content", Property.of { p -> p.text(TextProperty.of { it }) })
                                .properties("description", Property.of { p -> p.text(TextProperty.of { it }) })
                                .properties("tags", Property.of { p -> p.keyword(KeywordProperty.of { it }) })
                                .properties("authorFullName", Property.of { p ->
                                    p.text(TextProperty.of { t ->
                                        t.fields("keyword", Property.of { f ->
                                            f.keyword(KeywordProperty.of { it })
                                        })
                                    })
                                })
                        }
                }
                log.info("Created OpenSearch index 'content_items'")
            } else {
                log.info("OpenSearch index 'content_items' already exists")
            }
        } catch (e: Exception) {
            log.warn("Failed to initialize OpenSearch index 'content_items'", e)
        }
    }
}
```

### Phase 5: Event Consumer (Search Indexer)

**Step 5.1:** Create the `ContentItemSearchDocument` data class.

- **New file:** `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemSearchDocument.kt`
- A plain data class representing the document shape stored in OpenSearch. Used as the generic type for `IndexRequest<ContentItemSearchDocument>`.

```kotlin
package com.infosupport.promptyard.search

data class ContentItemSearchDocument(
    val slug: String,
    val contentType: String,
    val content: String?,
    val description: String?,
    val tags: List<String>,
    val authorFullName: String,
)
```

**Step 5.2:** Create the `ContentItemIndexer` event consumer.

- **New file:** `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemIndexer.kt`
- An `@ApplicationScoped` bean with a method annotated `@ConsumeEvent(value = "content-item.changed", blocking = true)`.
- The method accepts a `ContentItemEvent` parameter and returns `void` (fire-and-forget).
- `blocking = true` because OpenSearch client calls are blocking I/O.
- On CREATED or UPDATED: build an `IndexRequest<ContentItemSearchDocument>` with `index("content_items")`, `id(event.contentItemId.toString())`, and a `ContentItemSearchDocument` constructed from the event fields. Call `client.index(request)`.
- On DELETED: call `client.delete { it.index("content_items").id(event.contentItemId.toString()) }`.
- Wrap all OpenSearch calls in try-catch. On failure, log at WARN with the content item ID and event type (per NFR-003). Never rethrow.

```kotlin
package com.infosupport.promptyard.search

import io.quarkus.vertx.ConsumeEvent
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import org.opensearch.client.opensearch.OpenSearchClient
import org.jboss.logging.Logger

@ApplicationScoped
class ContentItemIndexer {

    @Inject
    lateinit var client: OpenSearchClient

    private val log = Logger.getLogger(ContentItemIndexer::class.java)

    @ConsumeEvent(value = "content-item.changed", blocking = true)
    fun onContentItemChanged(event: ContentItemEvent) {
        try {
            when (event.eventType) {
                ContentItemEventType.CREATED, ContentItemEventType.UPDATED -> indexDocument(event)
                ContentItemEventType.DELETED -> deleteDocument(event)
            }
        } catch (e: Exception) {
            log.warn(
                "Failed to process search index event: " +
                    "contentItemId=${event.contentItemId}, eventType=${event.eventType}",
                e
            )
        }
    }

    private fun indexDocument(event: ContentItemEvent) {
        val document = ContentItemSearchDocument(
            slug = event.slug!!,
            contentType = event.contentType,
            content = event.content,
            description = event.description,
            tags = event.tags ?: emptyList(),
            authorFullName = event.authorFullName!!,
        )

        client.index { builder ->
            builder
                .index("content_items")
                .id(event.contentItemId.toString())
                .document(document)
        }

        log.debug("Indexed content item ${event.contentItemId} in search index")
    }

    private fun deleteDocument(event: ContentItemEvent) {
        client.delete { builder ->
            builder
                .index("content_items")
                .id(event.contentItemId.toString())
        }

        log.debug("Deleted content item ${event.contentItemId} from search index")
    }
}
```

### Phase 6: Application Configuration

**Step 6.1:** Add OpenSearch dev services configuration.

- **File:** `apps/server/src/main/resources/application.properties`
- Add OpenSearch dev services configuration for dev and test profiles. Constrain memory to avoid resource exhaustion alongside Keycloak and PostgreSQL dev services.

```properties
# OpenSearch
%dev.quarkus.opensearch.devservices.enabled=true
%test.quarkus.opensearch.devservices.enabled=true
%dev.quarkus.opensearch.devservices.java-opts=-Xms256m -Xmx512m
%test.quarkus.opensearch.devservices.java-opts=-Xms256m -Xmx512m
```

No `quarkus.opensearch.hosts` is set for dev/test profiles, so dev services will automatically start an OpenSearch container. For production, `quarkus.opensearch.hosts` should be set via environment variable:

```properties
%prod.quarkus.opensearch.hosts=${OPENSEARCH_HOSTS:localhost:9200}
```

### Phase 7: Integration Tests

**Step 7.1:** Create `ContentItemIndexerTest` for the search indexing pipeline.

- **New file:** `apps/server/src/test/kotlin/com/infosupport/promptyard/search/ContentItemIndexerTest.kt`
- Uses `@QuarkusTest` with `@TestSecurity` for authentication.
- Injects `OpenSearchClient` directly to verify index contents.
- Injects `TestObjectFactory` and repositories for setup/cleanup.
- Tests verify the end-to-end flow: call the REST API to create/update/delete a prompt, then query OpenSearch to verify the document was indexed/updated/removed.
- After each mutating API call, add a brief wait (up to 5 seconds with polling) for eventual consistency before asserting against OpenSearch.
- `@AfterEach @Transactional` cleans up both the database (via repository `deleteAll`) and the OpenSearch index (via `client.indices().delete`/recreate or `client.deleteByQuery`).

Test cases to implement:

1. **New prompt is indexed (SC-001, SC-006):** POST a prompt, wait, verify the document exists in OpenSearch with correct fields and that the document ID matches the database ID.
2. **Updated prompt is re-indexed (SC-002):** POST a prompt, PUT an update (change description), wait, verify the document in OpenSearch reflects the new description.
3. **Updated tags are reflected (SC-003):** POST a prompt with `["kotlin"]`, PUT with `["kotlin", "quarkus"]`, wait, verify tags in OpenSearch.
4. **Deleted prompt is removed from index (SC-004):** POST a prompt, DELETE it, wait, verify the document is gone from OpenSearch.
5. **Delete of non-existent document does not fail (SC-005):** Create a prompt, delete it from the DB directly (bypassing the API, so no event), then call DELETE on the API to trigger a delete event for an ID that's not in the index. Verify no error is raised.

```kotlin
// Polling helper for eventual consistency
private fun awaitIndexed(client: OpenSearchClient, id: String, timeoutMs: Long = 5000) {
    val deadline = System.currentTimeMillis() + timeoutMs
    while (System.currentTimeMillis() < deadline) {
        try {
            val response = client.get({ it.index("content_items").id(id) }, ContentItemSearchDocument::class.java)
            if (response.found()) return
        } catch (_: Exception) {}
        Thread.sleep(200)
    }
    throw AssertionError("Document $id not found in index within ${timeoutMs}ms")
}

private fun awaitNotIndexed(client: OpenSearchClient, id: String, timeoutMs: Long = 5000) {
    val deadline = System.currentTimeMillis() + timeoutMs
    while (System.currentTimeMillis() < deadline) {
        try {
            val response = client.get({ it.index("content_items").id(id) }, ContentItemSearchDocument::class.java)
            if (!response.found()) return
        } catch (_: Exception) { return }
        Thread.sleep(200)
    }
    throw AssertionError("Document $id still found in index after ${timeoutMs}ms")
}
```

**Step 7.2:** Update `PromptsResourceTest` to ensure existing tests still pass.

- **File:** `apps/server/src/test/kotlin/com/infosupport/promptyard/content/PromptsResourceTest.kt`
- No code changes needed -- existing tests should continue to pass because event publishing is fire-and-forget. The OpenSearch dev service will be started automatically.
- Run the existing test suite to confirm no regressions.

### Phase 8: Verify and Validate

**Step 8.1:** Run all backend tests.

```bash
./mvnw -pl apps/server test
```

Verify that:
- All existing `PromptsResourceTest` tests pass (no regressions from event publishing).
- All new `ContentItemIndexerTest` tests pass.
- OpenSearch dev services start automatically alongside PostgreSQL and Keycloak.

## File Inventory

### New Files

| File | Purpose |
|------|---------|
| `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemEventType.kt` | Enum: CREATED, UPDATED, DELETED |
| `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemEvent.kt` | Event bus payload data class |
| `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemSearchDocument.kt` | OpenSearch document model |
| `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemIndexInitializer.kt` | Creates index mapping at startup |
| `apps/server/src/main/kotlin/com/infosupport/promptyard/search/ContentItemIndexer.kt` | Event consumer that indexes/deletes documents |
| `apps/server/src/test/kotlin/com/infosupport/promptyard/search/ContentItemIndexerTest.kt` | Integration tests for the indexing pipeline |

### Modified Files

| File | Changes |
|------|---------|
| `apps/server/pom.xml` | Add `quarkus-opensearch-java-client` and `quarkus-opensearch-transport-apache` dependencies |
| `apps/server/src/main/kotlin/com/infosupport/promptyard/content/PromptsResource.kt` | Inject `EventBus`, publish events in `submitPrompt`, `updatePrompt`, `deletePrompt` |
| `apps/server/src/main/resources/application.properties` | Add OpenSearch dev services and production configuration |

## Testing Strategy

### Integration Tests (ContentItemIndexerTest)

All tests use the `@QuarkusTest` harness with OpenSearch dev services. They exercise the full pipeline end-to-end:

1. **Setup:** `TestObjectFactory` creates user profiles and test data.
2. **Action:** REST Assured calls to `POST/PUT/DELETE /api/content/prompts/...`.
3. **Wait:** Polling loop (max 5 seconds) checks OpenSearch for the expected state.
4. **Assert:** Verify document fields match expectations using the OpenSearch Java client's `GetRequest`.
5. **Cleanup:** `@AfterEach` deletes all content items from the database and clears the OpenSearch index.

### Edge Cases Covered

| Scenario | Test approach |
|----------|---------------|
| EC-1: OpenSearch unavailable | Not explicitly tested (would require stopping the container mid-test). Covered by code review of try-catch in `ContentItemIndexer`. |
| EC-2: Delete non-existent document | Test creates a prompt, manually deletes it from DB, then calls DELETE API to trigger an event for an ID not in the index. |
| EC-3: Rapid updates | Test sends two PUTs in quick succession, then verifies the final state in the index reflects the last update. |
| EC-4: No tags, no description | Test creates a prompt with empty tags and empty description, verifies indexed document has empty tags list and empty/null description. |
| EC-5: Stale author name | Accepted by spec -- not tested. |

### Regression Safety

Existing `PromptsResourceTest`, `ContentItemsResourceTest`, `CommentsResourceTest`, and profile tests are not modified. They continue to pass because:
- Event publishing is fire-and-forget (does not affect HTTP response).
- OpenSearch dev services start alongside existing dev services without conflict.

## Migration Notes

- **No database migration needed.** This feature does not modify the PostgreSQL schema.
- **No backfill needed.** Per the spec's non-goals, no production data exists yet. The index starts empty and is populated by future content mutations.
- **Backwards compatible.** No API contracts change. The event publishing is an internal side effect invisible to API consumers.
- **OpenSearch container in CI.** The dev services container will be started automatically during `mvnw test`. CI pipelines that run backend tests will need Docker available (which is already required for PostgreSQL and Keycloak dev services).
