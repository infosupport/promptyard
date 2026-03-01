# Backend Code Reviewer Memory

## Project Patterns

### Security
- Auth is global via `application.properties`: `quarkus.http.auth.permission.authenticated.paths=/*`
- No `@Authenticated` annotation needed on individual resource classes (global policy handles it)
- `SecurityIdentity` is injected for identity info (subject, name, email from attributes)
- In test profile (`%test`), OIDC tenant is disabled; unauthenticated requests return 401 (not 302)

### Resource Pattern
- Thin resource: Entity -> Repository -> Resource (no service layer)
- FQN references with `_root_ide_package_` prefix appear throughout (IDE artifact, likely from IntelliJ)
- Also FQN references with `com.infosupport.promptyard.` prefix on injected types
- Resources have no explicit CDI scope annotation (default `@RequestScoped` for JAX-RS)

### Test Patterns
- `@QuarkusTest` + `@TestSecurity` + REST Assured Kotlin extensions
- `TestObjectFactory` is CDI bean in `content/` package (cross-slice, used by profiles and search tests)
- `@AfterEach @Transactional` cleanup with `repository.deleteAll()`
- Unauthenticated tests: no `@TestSecurity`, assert 401 (OIDC disabled in test profile)
- Each endpoint has unauthenticated test
- `TestObjectFactory.createPrompt()` accepts optional `createdAt` param
- Search tests create data via API (not factory) to trigger event bus indexing
- Async indexing tests use polling helpers (`awaitIndexed`, `awaitDocumentField`, `awaitNotIndexed`)

### DTOs
- `@Serializable` (kotlinx.serialization) data classes for REST request/response
- OpenSearch documents use plain `data class` (no `@Serializable` -- Jackson via OS client)
- `ContentItemAuthorResponse` has `fullName` and `slug` fields (slug added FEAT-014)
- `ContentItemPageResponse` reused by both content list and search endpoints
- `Instant` fields serialized as `.toString()` (ISO-8601 strings) in response DTOs
- Nullable `modifiedAt` for entities that haven't been edited

### Entity Pattern
- Single-table inheritance: `ContentItem` (base) -> `Prompt` (via `@DiscriminatorValue("prompt")`)
- `authorId: Long` is FK column; `author: UserProfile` is lazy `@ManyToOne` for reading
- Entity IDs are `Long?` (Panache convention), accessed with `!!` after DB load

### Repository
- Repositories extend `PanacheRepository<T>` with `@ApplicationScoped`
- Use positional HQL parameters (`?1`, `?2`)
- `findBySlug` returns nullable entity
- `countByAuthorIdAndContentType` for author content counts

### Flyway
- Convention: `V{n}__Description.sql` in `src/main/resources/db/migration/`
- V1: user_profile, V2: content_item, V3: privacy_accepted_at column, V4: comment table

### Search / OpenSearch (FEAT-013 + FEAT-014)
- `search/` package: `SearchResource`, `ContentItemIndexer`, `ContentItemIndexInitializer`, event/document models
- Event-driven indexing via Vert.x event bus (`content-item.changed` address, `@ConsumeEvent`)
- `ContentItemEvent` uses nullable fields for DELETED events (only needs id, eventType, contentType)
- `ContentItemIndexer.indexDocument()` uses `requireNotNull` to validate CREATED/UPDATED events
- Index mapping: `slug`/`contentType`/`tags`/`authorSlug` as keyword; `title`/`content`/`description`/`authorFullName` as text; `createdAt`/`modifiedAt` as date
- `tags` is keyword-only -- multi_match only finds exact tag values (no partial match)
- `SearchResource` at `GET /api/search?q={query}&page={page}` -- queries OpenSearch directly (no Panache)
- Error handling: 503 on OpenSearch failure, 400 on query > 1000 chars, empty results for empty/whitespace queries
- `PAGE_SIZE = 12` in SearchResource companion object (matches content list page size)
- Index initialization on startup; logs warning and continues if OpenSearch unavailable
- `PromptsResource` fires events on create, update, delete with `eventBus.requestAndForget`

### Cross-Slice Dependencies
- Profiles slice importing `ContentItemRepository` from content slice is acceptable for read-only queries
- Search slice imports `ContentItemResponse`/`ContentItemPageResponse`/`ContentItemAuthorResponse` from content (per spec FR-003)
- DTOs for cross-slice data belong in the consuming slice (profiles), not the data-owning slice (content)

### Route Ordering (confirmed FEAT-007, extended FEAT-008)
- JAX-RS resolves literal path segments before parameterized ones
- Current order: `/me` (PUT), `/me` (GET), `/me/content` (GET), `/{slug}/content` (GET), `/{slug}` (GET)

### Pagination Pattern
- Global listing (`findPaged`): sorts by `modifiedAt DESC, createdAt DESC`
- Author-specific listing (`findPagedByAuthorId`): sorts by `createdAt DESC` only
- Page size constant `PAGE_SIZE = 12` in ContentItemRepository
- Panache `PanacheQuery.pageCount()` returns 1 for empty results (not 0)

### Known Issues
- `_root_ide_package_` prefix scattered through source and test files (IDE artifact)
- `PromptsResource.createUserProfile()` bypasses onboarding: creates profiles without `privacyAcceptedAt`
- `UserProfileResponse` exposes `id` field (internal DB identifier)
- N+1 risk in `CommentsResource.getComments` (lazy author access per comment)
- `CommentsResource.getComments` returns raw type instead of `Response` (inconsistent)
- Full test suite may fail due to Keycloak testcontainer OOM (pre-existing)

### Comment Entity & Resource (FEAT-012)
- `Comment` entity uses dual-column FK pattern (raw `authorId`/`contentItemId` + lazy `@ManyToOne`)
- `CommentsResource` at `/api/content/prompts/{slug}/comments` with GET and POST
- V4 migration uses `TIMESTAMP WITH TIME ZONE` (V1-V3 use `TIMESTAMP` without timezone)
