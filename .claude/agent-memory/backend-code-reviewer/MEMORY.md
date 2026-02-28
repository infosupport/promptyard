# Backend Code Reviewer Memory

## Project Patterns

### Security
- Auth is global via `application.properties`: `quarkus.http.auth.permission.authenticated.paths=/*`
- No `@Authenticated` annotation needed on individual resource classes (global policy handles it)
- `SecurityIdentity` is injected for identity info (subject, name, email from attributes)

### Resource Pattern
- Thin resource: Entity -> Repository -> Resource (no service layer)
- FQN references with `_root_ide_package_` prefix appear throughout (IDE artifact, likely from IntelliJ)
- Also FQN references with `com.infosupport.promptyard.` prefix on injected types

### Test Patterns
- `@QuarkusTest` + `@TestSecurity` + REST Assured Kotlin extensions
- `TestObjectFactory` is CDI bean in `content/` package (cross-slice, used by profiles tests too)
- `@AfterEach @Transactional` cleanup with `repository.deleteAll()`
- Unauthenticated tests: no `@TestSecurity`, use `redirects().follow(false)`, assert 302
- Each endpoint has unauthenticated test in content tests
- `TestObjectFactory.createPrompt()` accepts optional `createdAt` param (added after FEAT-007 review)

### DTOs
- `@Serializable` (kotlinx.serialization) data classes
- Request DTOs: `OnboardUserRequest`, `UpdateProfileRequest`, `SubmitPromptRequest`, `UpdatePromptRequest`
- Response DTOs: `UserProfileResponse`, `OnboardUserResponse`, `SubmitPromptResponse`, `UpdatePromptResponse`, `PromptDetailResponse`, `AuthorSummary`
- `PromptDetailResponse` includes `isOwner: Boolean` field (added FEAT-010)
- `MyContentPageResponse` / `MyContentItemResponse` reused for both `/me/content` and `/{slug}/content` (FEAT-008)
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
- V1: user_profile, V2: content_item, V3: privacy_accepted_at column

### Known Issues (found in FEAT-001 review)
- `_root_ide_package_` prefix scattered through source and test files (IDE artifact)
- `PromptsResource.createUserProfile()` bypasses onboarding: creates profiles without `privacyAcceptedAt`
- `UserProfileResponse` exposes `id` field (internal DB identifier); should consider removing
- No unauthenticated tests for profile endpoints

### Cross-Slice Dependencies (confirmed FEAT-007)
- Profiles slice importing `ContentItemRepository` from content slice is acceptable for read-only queries
- DTOs for cross-slice data (e.g., `MyContentItemResponse`) belong in the consuming slice (profiles), not the data-owning slice (content)

### Route Ordering (confirmed FEAT-007, extended FEAT-008)
- JAX-RS resolves literal path segments before parameterized ones
- `/me/content` is more specific than `/{slug}/content` -- no conflict
- `/{slug}/content` is more specific than `/{slug}` -- no conflict
- Current order: `/me` (PUT), `/me` (GET), `/me/content` (GET), `/{slug}/content` (GET), `/{slug}` (GET)

### Pagination Pattern
- Global listing (`findPaged`): sorts by `modifiedAt DESC, createdAt DESC`
- Author-specific listing (`findPagedByAuthorId`): sorts by `createdAt DESC` only
- Page size is shared constant `PAGE_SIZE = 12` in ContentItemRepository
- Panache `PanacheQuery.pageCount()` returns 1 for empty results (not 0)

### Duplication Pattern (noted FEAT-008)
- `getMyContent` and `getProfileContent` differ only in profile lookup (by subjectName vs by slug)
- Both share identical query + mapping logic; extractable to private helper
- Plan explicitly chose DTO reuse over creating separate ProfileContent DTOs -- good pragmatic call

### Review Findings (FEAT-007)
- Missing sort-order test for `createdAt DESC` in MyContentResourceTest -- flagged as should-fix
- `TestObjectFactory.createPrompt()` had optional `createdAt` param added (resolved)

### Build Issues (noted FEAT-008)
- Full suite may fail due to Keycloak testcontainer OOM or ContentItemsResourceTest class loading error
- These are pre-existing issues, not related to feature changes

### Comment Entity & Resource (FEAT-012)
- `Comment` entity uses same dual-column FK pattern as `ContentItem` (raw `authorId`/`contentItemId` + lazy `@ManyToOne`)
- `CommentsResource` at `/api/content/prompts/{slug}/comments` with GET (list) and POST (create)
- `CommentRepository.findByContentItemId` sorts by `createdAt DESC` (newest first)
- `TestObjectFactory.createComment()` accepts `author`, `contentItem`, `text`, and optional `createdAt`
- V4 migration: `TIMESTAMP WITH TIME ZONE` (note: V1-V3 use `TIMESTAMP` without timezone)
- Comments FK to `content_item` with `ON DELETE CASCADE`; FK to `user_profile` without cascade

### Review Findings (FEAT-012)
- N+1 query risk: `getComments` iterates comments and accesses lazy `comment.author.fullName` per comment
- Fix: use `JOIN FETCH c.author` in repository query (also prevents LazyInitializationException)
- Inconsistent return type: `getComments` returns `List<CommentResponse>` + throws `NotFoundException`; rest of codebase returns `Response`
- All resources in project return `Response`; `CommentsResource.getComments` is first to return raw type
