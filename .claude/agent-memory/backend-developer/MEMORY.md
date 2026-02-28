# Backend Developer Memory

## Project Structure
- Backend source: `src/main/kotlin/com/infosupport/promptyard/`
- Test source: `src/test/kotlin/com/infosupport/promptyard/`
- Flyway migrations: `src/main/resources/db/migration/` (currently at V4)
- Architecture docs: `docs/architecture/`

## Key Patterns
- **Serialization**: Project uses kotlinx.serialization, NOT Jackson. `mapOf()` cannot be used as response entities because `SingletonMap` is not `@Serializable`. Always use `@Serializable` data classes for response bodies. **CRITICAL**: `List<T>` cannot be returned via `Response.ok(list).build()` — kotlinx.serialization throws "Serializer for class 'ArrayList' is not found." Instead, return `List<T>` directly from the endpoint method and use `throw NotFoundException()` for error cases.
- **IDE artifacts**: Codebase contains `_root_ide_package_` prefix on some class references (e.g., `_root_ide_package_.com.infosupport.promptyard.profiles.UserProfile()`). This is an IDE artifact; keep consistent with existing code to avoid unrelated diffs.
- **Auth**: No `@Authenticated` annotations on resources; auth is enforced globally via `quarkus.http.auth.permission.authenticated` in `application.properties`.
- **REST Assured Kotlin extensions**: Use `Given`/`When`/`Then` from `io.restassured.module.kotlin.extensions`. The `Given` lambda must return `RequestSpecification` (not `Unit`) — for GET tests that don't need a request body, use `When` directly without `Given`. For extracting values from responses, use standard `io.restassured.RestAssured.given()` chain instead of the Kotlin extension `Extract` (which may have import issues).
- **TestObjectFactory**: Located in `src/test/kotlin/com/infosupport/promptyard/content/TestObjectFactory.kt`. Methods: `createUserProfile(subjectName, fullName, emailAddress, privacyAcceptedAt?, jobTitle?)`, `createPrompt(author, title, tags?, description?, content?, createdAt?)`, and `createComment(author, contentItem, text, createdAt?)`.
- **Test cleanup**: `@AfterEach @Transactional fun cleanUp()` pattern with `repository.deleteAll()`.
- **Test security**: Use `@TestSecurity(user = "...")` with `@OidcSecurity(claims = [Claim(key = "name", value = "..."), Claim(key = "email", value = "...")])`.

## Entity Conventions
- JPA entities use `@Column` annotations with explicit `name`, `nullable`, and `columnDefinition` parameters.
- IDs use `@GeneratedValue(strategy = GenerationType.IDENTITY)` with `var id: Long? = null`.
- Required string fields use `lateinit var`.
- Optional fields use `var field: Type? = null`.
- Timestamps use `java.time.Instant`.
- ContentItem uses `@ManyToOne(fetch = FetchType.LAZY)` for `author` relation with `@JoinColumn(insertable = false, updatable = false)` alongside a separate `authorId` column.

## Repository Patterns
- `ContentItemRepository` extends `PanacheRepository<ContentItem>`.
- Methods: `existsBySlugAndContentType`, `findBySlug`, `findPaged`, `findPagedByAuthorId`, `countByAuthorIdAndContentType`.
- `CommentRepository` extends `PanacheRepository<Comment>`. Methods: `findByContentItemId(contentItemId)` — sorted by createdAt DESC.
- Count queries use Panache's `count("field = ?1 and field2 = ?2", val1, val2)` pattern.

## OpenSearch Patterns
- **Index name**: `content_items` (constant `CONTENT_ITEMS_INDEX` in search package)
- **SearchResource**: `GET /api/search?q={query}&page={pageIndex}`, returns `ContentItemPageResponse`
- **Test isolation**: Use `@BeforeEach` to `deleteByQuery` + `indices().refresh()` the OpenSearch index before each test. `@AfterEach` `deleteByQuery` alone is insufficient because other test classes may leave stale documents.
- **OpenSearch Refresh**: `deleteByQuery` `refresh` param expects `Refresh` enum, not boolean. Use separate `indices().refresh()` call.
- **ContentItemSearchDocument**: Has slug, title, contentType, content, description, tags, authorFullName, authorSlug, createdAt, modifiedAt
- **ContentItemAuthorResponse**: Has `fullName` and `slug` fields.

## Current Test Counts
- `ContentItemsResourceTest`: 6 tests
- `PromptsResourceTest`: 24 tests (GET: 8 incl. isOwner, POST: 4, PUT: 7, DELETE: 5)
- `UserProfilesResourceTest`: 25 tests
- `UserProfileSlugGeneratorTest`: 10 tests
- `MyContentResourceTest`: 9 tests
- `CommentsResourceTest`: 9 tests (POST: 5, GET: 4)
- `ContentItemIndexerTest`: 6 tests
- `SearchResourceTest`: 9 tests
- `ProfileContentResourceTest`: 9 tests
- Total: 107 tests

## Infrastructure Notes
- Running the full test suite may OOM the Keycloak testcontainer if system memory is constrained. Run test classes individually or in small batches as a workaround.
- Keycloak devservices java-opts must be configured for `%test` profile too (not just `%dev`). Without this, the Keycloak testcontainer OOMs during test runs.
