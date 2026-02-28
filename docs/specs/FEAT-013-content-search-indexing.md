# Feature Specification: Content Search Indexing

## 1. Overview

| Field           | Value                                              |
| --------------- | -------------------------------------------------- |
| Feature ID      | FEAT-013                                           |
| Status          | Draft                                              |
| Author          | Claude Code                                        |
| Created         | 2026-02-28                                         |
| Last updated    | 2026-02-28                                         |
| Epic / Parent   | Content Search                                     |
| Arc42 reference | 5. Building Block View, 6. Runtime View            |

### 1.1 Problem Statement

Promptyard stores content items (prompts, and future types like skills, agents, workflows) in PostgreSQL, but offers no full-text search capability. As the content library grows, users will need to find content quickly by keyword, tag, or author — which requires a search index that stays in sync with the relational data.

### 1.2 Goal

Every content item create, update, or delete is reflected in an OpenSearch index (`content_items`) via an event-driven pipeline. The index contains the fields needed to power future search queries: slug, content type, content body, description, tags, and author full name.

### 1.3 Non-Goals

- **Search query API** — No REST endpoint for querying the index (separate feature)
- **Search UI** — No frontend search components
- **Backfill/reindex tooling** — Not needed; no production data exists yet
- **Comment indexing** — Comments are not indexed as part of this feature
- **Index mapping management UI** — Index mapping is managed in code, not configurable at runtime

## 2. User Stories

### US-001: Index new content

**As a** content author,
**I want** my newly created content item to be indexed in OpenSearch,
**so that** it becomes discoverable through future search functionality.

### US-002: Update indexed content

**As a** content author,
**I want** my updated content item to be re-indexed in OpenSearch,
**so that** search results reflect the latest version of my content.

### US-003: Remove deleted content from index

**As a** content author,
**I want** my deleted content item to be removed from the OpenSearch index,
**so that** deleted content no longer appears in future search results.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                      | Priority | User Story       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- |
| FR-001 | The system shall publish an event on the Vert.x event bus when a content item is created                                                                         | Must     | US-001           |
| FR-002 | The system shall publish an event on the Vert.x event bus when a content item is updated                                                                         | Must     | US-002           |
| FR-003 | The system shall publish an event on the Vert.x event bus when a content item is deleted                                                                         | Must     | US-003           |
| FR-004 | The system shall consume content item events and index the document in OpenSearch with fields: slug, contentType, content, description, tags, and authorFullName  | Must     | US-001, US-002   |
| FR-005 | The system shall consume content item delete events and remove the corresponding document from the OpenSearch index                                               | Must     | US-003           |
| FR-006 | The system shall use the content item's database ID as the unique document identifier in the OpenSearch index                                                     | Must     | US-001, US-002   |

## 4. Acceptance Scenarios

### SC-001: New content item is indexed (FR-001, FR-004)

```gherkin
Given a content author has created a new prompt with title "My Prompt"
When the system processes the content item created event
Then the OpenSearch index "content_items" contains a document with the content item's database ID
  And the document contains the slug, contentType, content, description, tags, and authorFullName fields
```

### SC-002: Updated content item is re-indexed (FR-002, FR-004)

```gherkin
Given a prompt exists in the OpenSearch index with description "Old description"
When the content author updates the prompt's description to "New description"
  And the system processes the content item updated event
Then the document in the OpenSearch index reflects the updated description "New description"
```

### SC-003: Updated content item reflects new tags (FR-002, FR-004)

```gherkin
Given a prompt exists in the OpenSearch index with tags ["kotlin"]
When the content author updates the prompt's tags to ["kotlin", "quarkus"]
  And the system processes the content item updated event
Then the document in the OpenSearch index contains tags ["kotlin", "quarkus"]
```

### SC-004: Deleted content item is removed from index (FR-003, FR-005)

```gherkin
Given a prompt exists in the OpenSearch index
When the content author deletes the prompt
  And the system processes the content item deleted event
Then the document is no longer present in the OpenSearch index "content_items"
```

### SC-005: Deleting a non-existent document does not fail (FR-003, FR-005)

```gherkin
Given a content item's database ID does not exist in the OpenSearch index
When the system processes a content item deleted event for that ID
Then no error is raised
```

### SC-006: Index document uses database ID (FR-006)

```gherkin
Given a content author creates a prompt that is assigned database ID 42
When the system processes the content item created event
Then the OpenSearch document ID is "42"
```

## 5. Domain Model

This feature does not introduce new database entities. It adds an event model and a search document model that mirror existing domain concepts.

### 5.1 Entities

No new database entities. The feature operates on existing `ContentItem` and `UserProfile` entities.

#### ContentItemSearchDocument

*A denormalized representation of a content item stored in the OpenSearch index. Not a database entity.*

| Attribute      | Type           | Constraints                        | Description                                    |
| -------------- | -------------- | ---------------------------------- | ---------------------------------------------- |
| id             | long           | Document ID, from ContentItem.id   | OpenSearch document identifier                 |
| slug           | string         | required                           | URL-friendly identifier                        |
| contentType    | string         | required                           | Discriminator value (e.g., "prompt")           |
| content        | string         | optional                           | Body text of the content item                  |
| description    | string         | optional                           | Short description                              |
| tags           | list\<string\> | may be empty                       | Tags assigned to the content item              |
| authorFullName | string         | required                           | Full name of the author (from UserProfile)     |

### 5.2 Value Objects

#### ContentItemEvent

*Payload published on the Vert.x event bus when a content item changes.*

For CREATED and UPDATED events:

| Attribute      | Type           | Constraints | Description                        |
| -------------- | -------------- | ----------- | ---------------------------------- |
| contentItemId  | long           | required    | Database ID of the content item    |
| eventType      | enum           | [CREATED, UPDATED, DELETED] | What happened        |
| slug           | string         | required    | Slug at time of event              |
| contentType    | string         | required    | Discriminator value                |
| content        | string         | optional    | Body text                          |
| description    | string         | optional    | Short description                  |
| tags           | list\<string\> | may be empty | Tags                              |
| authorFullName | string         | required    | Author's full name                 |

For DELETED events:

| Attribute      | Type   | Constraints | Description                        |
| -------------- | ------ | ----------- | ---------------------------------- |
| contentItemId  | long   | required    | Database ID of the content item    |
| eventType      | enum   | DELETED     | What happened                      |
| contentType    | string | required    | Discriminator value                |

### 5.3 Relationships

- A **ContentItemSearchDocument** is a denormalized projection of a **ContentItem** and its **UserProfile** author — it is not linked by foreign key, only by the shared database ID.

### 5.4 Domain Rules and Invariants

- **One document per content item**: The OpenSearch index contains at most one document per content item database ID. Creates and updates are idempotent upserts.
- **Eventual consistency**: The search index is eventually consistent with the database. There is no guarantee that the index is updated before the HTTP response returns to the client.
- **Delete idempotency**: Removing a document that doesn't exist in the index is a no-op, not an error.

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                          |
| ------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Reliability   | Indexing failures shall not cause the content create/update/delete HTTP request to fail or return an error to the user |
| NFR-002 | Performance   | Content items shall appear in the search index within 5 minutes of creation or update under normal operating conditions |
| NFR-003 | Observability | Indexing failures shall be logged at WARN level with the content item ID and event type                               |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                                        | Expected Behavior                                                                            |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| EC-1 | OpenSearch is unavailable when an event is consumed             | Log the failure; do not retry; content authoring is unaffected                               |
| EC-2 | Delete event received for a document not in the index           | No-op, no error                                                                              |
| EC-3 | Two rapid updates to the same content item produce two events   | Both are processed; last write wins (the second upsert overwrites the first)                 |
| EC-4 | Content item created with no tags and no description            | Index the document with empty tags list and null/empty description                           |
| EC-5 | Author updates their profile name after content was indexed     | Indexed authorFullName becomes stale; accepted until reindex feature is built                |

## 8. Success Criteria

| ID     | Criterion                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| SC-001 | All acceptance scenarios pass in CI with OpenSearch dev services                                              |
| SC-002 | Creating, updating, or deleting a content item via the API results in the corresponding change in the index  |
| SC-003 | An OpenSearch outage does not cause content authoring API errors                                              |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **Quarkus OpenSearch extension** (`io.quarkiverse.opensearch:quarkus-opensearch-java-client`) with Apache HttpClient5 transport
- **Vert.x event bus** (bundled with Quarkus, no additional dependency)
- **OpenSearch dev services** for local development and testing (provided by the Quarkus OpenSearch extension)

### 9.2 Constraints

- The indexing pipeline is fire-and-forget; failed index operations are not retried until a backfill/reindex feature is built.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| 5. Building Block View           | New `search` package added alongside existing `content` and `profiles` packages        |
| 6. Runtime View                  | Event-driven flow: Resource → Vert.x event bus → Search consumer → OpenSearch          |
| 8. Crosscutting Concepts         | Error handling (fire-and-forget), logging patterns                                     |
| 9. Architecture Decisions (ADRs) | ADR007 (functional slicing) governs package structure for the new search module        |

## 10. Open Questions

No open questions remain.

