# Implementation Plan: Prompt Detail Page

**Spec:** docs/specs/FEAT-005-prompt-detail-page.md
**Created:** 2026-02-26
**Status:** Draft

## Summary

This feature adds a `GET /api/content/prompts/{slug}` backend endpoint that returns prompt data with embedded author profile and content counts, and a frontend `PromptDetailView` at `/content/prompts/:slug` displaying the prompt in a two-column layout (80/20) with metadata card, readonly Monaco editor with copy button, breadcrumb navigation, and AuthorCard sidebar. The existing `PromptDetailView` stub is replaced with the full implementation.

## Key Design Decisions

1. **Add a `GET` method to the existing `PromptsResource` rather than creating a new resource class.** The `PromptsResource` is already `@Path("/api/content/prompts")` and handles POST and DELETE. Adding GET for `/{slug}` keeps all prompt-specific endpoints together in one resource, consistent with the functional slice pattern (ADR007).

2. **Create `PromptDetailResponse` and `AuthorSummary` as new `@Serializable` DTOs in the content module.** The detail response is distinct from the existing `ContentItemResponse` (which is a lightweight list DTO without content or author data). `AuthorSummary` is embedded in the response, not a standalone endpoint, because the spec requires a single API call per page load.

3. **Compute author content counts via a new `countByAuthorIdAndContentType` repository method.** The `ContentItemRepository` gets a new method that counts content items by author and content type. This avoids N+1 queries and keeps the counting logic in the repository where it belongs. Since only "prompt" type exists currently, the other counts (skill, agent, workflow) return 0 from the same method pattern — this is accurate and will naturally return correct values as those content types are added.

4. **Use the existing `MonacoEditor` component in readonly mode (`:disabled="true"`) for the content display.** The component already supports a `disabled` prop that sets `readOnly: true` on Monaco options. No new editor component is needed.

5. **Build a custom breadcrumb with semantic HTML (`<nav>`, `<ol>`) rather than installing the shadcn/vue Breadcrumb component.** The spec requires exactly three static segments with simple styling. A 15-line template with proper ARIA attributes is simpler and avoids adding a new shadcn/vue component for a one-off usage pattern. This keeps the dependency surface minimal.

6. **Create a `usePromptDetail` composable (not a Pinia store) for fetching prompt data.** The prompt detail is view-scoped, not shared across components. A composable with `ref`s for `prompt`, `loading`, and `error` state follows the same pattern as `useUnsavedChanges` — lightweight, testable, and discarded when the view unmounts. No Pinia store is needed.

7. **Add `getPromptBySlug` to the existing `services/prompts.ts` file.** This follows the established service-per-domain pattern (like `services/profiles.ts`). The function returns the `PromptDetailResponse` type or throws on error, consistent with `createPrompt`.

8. **Use `navigator.clipboard.writeText()` with a `copied` ref and `setTimeout` for the copy feedback.** The copy button toggles between a Copy icon and a Check icon with "Copied!" text. If the Clipboard API is unavailable (EC-4), a try/catch shows a brief error message.

## Implementation Steps

### Phase 1: Backend — Repository & DTOs

#### Step 1.1: Add `countByAuthorIdAndContentType` to `ContentItemRepository`

Add a new method to `src/main/kotlin/com/infosupport/promptyard/content/ContentItemRepository.kt`:

```kotlin
fun countByAuthorIdAndContentType(authorId: Long, contentType: String): Long {
    return count("authorId = ?1 and contentType = ?2", authorId, contentType)
}
```

This uses Panache's built-in `count` method with a query string, consistent with the existing `existsBySlugAndContentType` method.

#### Step 1.2: Create `AuthorSummary` DTO

Create `src/main/kotlin/com/infosupport/promptyard/content/AuthorSummary.kt`:

```kotlin
@Serializable
data class AuthorSummary(
    val fullName: String,
    val jobTitle: String?,
    val profileSlug: String,
    val promptCount: Long,
    val skillCount: Long,
    val agentCount: Long,
    val workflowCount: Long,
)
```

Uses `Long` for counts because `PanacheRepository.count()` returns `Long`.

#### Step 1.3: Create `PromptDetailResponse` DTO

Create `src/main/kotlin/com/infosupport/promptyard/content/PromptDetailResponse.kt`:

```kotlin
@Serializable
data class PromptDetailResponse(
    val title: String,
    val slug: String,
    val description: String,
    val content: String,
    val tags: List<String>,
    val contentType: String,
    val createdAt: String,
    val modifiedAt: String?,
    val author: AuthorSummary,
)
```

Dates serialized as ISO strings (consistent with `ContentItemResponse`).

### Phase 2: Backend — API Endpoint

#### Step 2.1: Add `GET /{slug}` to `PromptsResource`

Add a new method to `src/main/kotlin/com/infosupport/promptyard/content/PromptsResource.kt`:

```kotlin
@GET
@Path("/{slug}")
@Produces(MediaType.APPLICATION_JSON)
fun getPromptBySlug(@PathParam("slug") slug: String): Response {
    val contentItem = contentItemRepository.findBySlug(slug)
        ?: return Response.status(Response.Status.NOT_FOUND).build()

    if (contentItem.contentType != "prompt") {
        return Response.status(Response.Status.NOT_FOUND).build()
    }

    val prompt = contentItem as Prompt
    val author = prompt.author

    val authorSummary = AuthorSummary(
        fullName = author.fullName,
        jobTitle = author.jobTitle,
        profileSlug = author.slug,
        promptCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "prompt"),
        skillCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "skill"),
        agentCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "agent"),
        workflowCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "workflow"),
    )

    val response = PromptDetailResponse(
        title = prompt.title,
        slug = prompt.slug,
        description = prompt.description,
        content = prompt.content,
        tags = prompt.tags,
        contentType = "prompt",
        createdAt = prompt.createdAt.toString(),
        modifiedAt = prompt.modifiedAt?.toString(),
        author = authorSummary,
    )

    return Response.ok(response).build()
}
```

Key details:
- The `ContentItem` entity has a lazy `author` ManyToOne relation that JPA resolves automatically when accessed.
- Returns 404 if the slug doesn't exist or if it's not a prompt content type.
- No `@Transactional` needed — this is a read-only operation.
- No ownership check — any authenticated user can view any prompt (per spec FR-012).

### Phase 3: Backend — Tests

#### Step 3.1: Add `GET /api/content/prompts/{slug}` tests to `PromptsResourceTest`

Add test methods to `src/test/kotlin/com/infosupport/promptyard/content/PromptsResourceTest.kt`:

Tests to add:

1. **`returns 200 with prompt details when prompt exists`** — Create a profile and prompt via `TestObjectFactory`. GET the slug. Assert 200 and validate response fields: title, slug, description, content, tags, contentType, createdAt, and `author.fullName`, `author.profileSlug`, `author.promptCount`.

2. **`returns author content counts in the response`** — Create a profile, create 3 prompts. GET one by slug. Assert `author.promptCount` equals 3 and other counts are 0.

3. **`returns 404 when no prompt exists with the given slug`** — Create a profile only. GET a nonexistent slug. Assert 404.

4. **`returns 404 when slug belongs to a non-prompt content type`** — This is a defensive test. Since only prompts exist currently, test that a valid slug for a different content type (if applicable) returns 404. If not yet testable, skip this test and add a comment noting it's needed when other content types exist.

5. **`redirects to login when not authenticated`** — No `@TestSecurity`. Use `redirects().follow(false)`. Assert 302.

6. **`returns null modifiedAt when prompt has not been modified`** — Create a prompt, GET it. Assert `modifiedAt` is null in the JSON response.

Update `TestObjectFactory.createPrompt` to also accept optional parameters for `tags` and `description` to support richer test data:

```kotlin
fun createPrompt(
    author: UserProfile,
    title: String,
    tags: List<String> = emptyList(),
    description: String = "Description for $title",
    content: String = "Content for $title",
): Prompt
```

### Phase 4: Frontend — Service Layer

#### Step 4.1: Add `PromptDetailResponse` and `getPromptBySlug` to `services/prompts.ts`

Add to `src/main/webui/src/services/prompts.ts`:

```typescript
export interface AuthorSummary {
  fullName: string
  jobTitle: string | null
  profileSlug: string
  promptCount: number
  skillCount: number
  agentCount: number
  workflowCount: number
}

export interface PromptDetailResponse {
  title: string
  slug: string
  description: string
  content: string
  tags: string[]
  contentType: string
  createdAt: string
  modifiedAt: string | null
  author: AuthorSummary
}

export async function getPromptBySlug(slug: string): Promise<PromptDetailResponse> {
  const response = await fetch(`/api/content/prompts/${encodeURIComponent(slug)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch prompt: ${response.status}`)
  }
  return response.json()
}
```

The function throws on any non-ok response (including 404). The view component distinguishes 404 from other errors by checking the message.

### Phase 5: Frontend — shadcn/vue Dependency

#### Step 5.1: No new shadcn/vue components needed

All required UI components are already installed:
- `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` — for metadata and content cards
- `Badge` — for tags
- `Button` — for copy button
- `Avatar`, `AvatarFallback` — used by AuthorCard
- `Separator` — used by AuthorCard

The breadcrumb is built with semantic HTML (see Design Decision 5), so no `Breadcrumb` component is needed.

### Phase 6: Frontend — PromptDetailView

#### Step 6.1: Implement `PromptDetailView.vue`

Replace the stub at `src/main/webui/src/views/PromptDetailView.vue` with the full implementation.

**Script setup:**
- Import `ref`, `onMounted` from Vue, `useRoute` from vue-router.
- Import `getPromptBySlug`, `type PromptDetailResponse` from `@/services/prompts`.
- Import UI components: `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`, `Badge`, `Button` from shadcn/vue.
- Import `MonacoEditor` from `@/components/content`.
- Import `AuthorCard` from `@/components/profiles/AuthorCard.vue`.
- Import `Copy`, `Check` icons from `lucide-vue-next`.
- Get `slug` from `useRoute().params.slug`.
- Reactive state: `prompt: ref<PromptDetailResponse | null>(null)`, `loading: ref(true)`, `error: ref('')`, `notFound: ref(false)`, `copied: ref(false)`.
- `onMounted`: call `getPromptBySlug(slug)`, set `prompt.value` on success, set `notFound.value = true` on 404, set `error.value` on other errors, set `loading.value = false` in finally.
- `copyContent()` async function: try `navigator.clipboard.writeText(prompt.value.content)`, set `copied.value = true`, `setTimeout(() => copied.value = false, 2000)`. Catch: show error state.

**Template structure:**

```
<div>
  <!-- Breadcrumb (FR-008) -->
  <nav aria-label="Breadcrumb" class="mb-6">
    <ol class="flex items-center gap-1.5 text-sm text-muted-foreground">
      <li><RouterLink to="/" class="hover:text-foreground">Promptyard</RouterLink></li>
      <li class="...">/<li>
      <li>Prompts</li>
      <li class="...">/<li>
      <li class="text-foreground font-medium truncate">{{ prompt.title }}</li>
    </ol>
  </nav>

  <!-- Loading state (FR-010) -->
  <div v-if="loading">Loading...</div>

  <!-- Not found state (FR-009) -->
  <div v-else-if="notFound">
    <p>Prompt not found</p>
    <RouterLink to="/">Back to home</RouterLink>
  </div>

  <!-- Error state (EC-5) -->
  <div v-else-if="error">
    <p>{{ error }}</p>
    <Button @click="retry">Retry</Button>
  </div>

  <!-- Main content -->
  <div v-else-if="prompt" class="grid grid-cols-[1fr_auto] gap-6">
    <!-- Main column (80%) -->
    <div class="space-y-6 min-w-0">
      <!-- Metadata card (FR-003) -->
      <Card>
        <CardHeader>
          <CardTitle>{{ prompt.title }}</CardTitle>
          <CardDescription v-if="prompt.description">{{ prompt.description }}</CardDescription>
        </CardHeader>
        <CardContent v-if="prompt.tags.length > 0">
          <div class="flex flex-wrap gap-2">
            <Badge v-for="tag in prompt.tags" :key="tag" variant="secondary">{{ tag }}</Badge>
          </div>
        </CardContent>
      </Card>

      <!-- Content card with Monaco editor (FR-004, FR-005) -->
      <Card>
        <CardHeader class="flex-row items-center justify-between">
          <CardTitle class="text-base">Content</CardTitle>
          <Button variant="ghost" size="sm" @click="copyContent" :aria-label="'Copy prompt content to clipboard'">
            <Check v-if="copied" class="h-4 w-4" />
            <Copy v-else class="h-4 w-4" />
            {{ copied ? 'Copied!' : 'Copy' }}
          </Button>
        </CardHeader>
        <CardContent>
          <MonacoEditor :model-value="prompt.content" disabled />
        </CardContent>
      </Card>
    </div>

    <!-- Sidebar (20%) -->
    <aside>
      <AuthorCard
        :full-name="prompt.author.fullName"
        :job-title="prompt.author.jobTitle ?? undefined"
        :prompt-count="prompt.author.promptCount"
        :skill-count="prompt.author.skillCount"
        :agent-count="prompt.author.agentCount"
        :workflow-count="prompt.author.workflowCount"
        :profile-url="`/profiles/${prompt.author.profileSlug}`"
      />
    </aside>
  </div>
</div>
```

The two-column layout uses `grid grid-cols-[1fr_auto]` where the sidebar width is driven by AuthorCard's fixed `w-72` class. This naturally produces an ~80/20 split in the `max-w-7xl` container.

The breadcrumb is only shown when `prompt` is loaded (not during loading/error states).

### Phase 7: Frontend — Tests

#### Step 7.1: Add `getPromptBySlug` tests to `services/__tests__/prompts.spec.ts`

Create `src/main/webui/src/services/__tests__/prompts.spec.ts` (or add to existing if it exists):

Test cases:
- **Success case**: Mock `fetch` to return 200 with a full `PromptDetailResponse`. Assert the function returns the parsed object.
- **404 case**: Mock `fetch` to return 404. Assert the function throws with message containing "404".
- **Server error case**: Mock `fetch` to return 500. Assert the function throws.
- **URL encoding**: Call with slug `"my prompt"`. Assert `fetch` was called with `/api/content/prompts/my%20prompt`.

#### Step 7.2: Create `views/__tests__/PromptDetailView.spec.ts`

Create `src/main/webui/src/views/__tests__/PromptDetailView.spec.ts`.

Setup (following CreatePromptView.spec.ts patterns):
- `vi.mock('vue-router')` — provide `useRoute` returning `{ params: { slug: 'test-prompt' } }` and RouterLink stub.
- `vi.mock('@/services/prompts')` — mock `getPromptBySlug`.
- Stub `MonacoEditor` as a `<div>` (readonly, no interaction needed).
- `createPinia`/`setActivePinia` in `beforeEach`.

Test cases:

1. **SC-001: Renders prompt metadata** — Mock API to return prompt data. Assert title, description, and tag badges are rendered.
2. **SC-002: Renders Monaco editor with content** — Assert the MonacoEditor stub receives the correct `model-value` prop and `disabled` is true.
3. **SC-003: Copy button exists** — Assert a button with accessible label "Copy prompt content to clipboard" is rendered.
4. **SC-004: AuthorCard rendered with author data** — Assert the AuthorCard component receives correct props (fullName, jobTitle, counts, profileUrl).
5. **SC-005: Breadcrumb renders with correct segments** — Assert breadcrumb `<nav>` with aria-label exists, contains "Promptyard" link to `/`, "Prompts" text, and the prompt title.
6. **SC-006: Not found state** — Mock API to throw with "404". Assert "not found" message and home link are displayed.
7. **SC-007: Loading state** — Assert loading indicator appears before API resolves.
8. **EC-1: Empty description hidden** — Mock prompt with empty description. Assert no CardDescription is rendered.
9. **EC-2: Empty tags hidden** — Mock prompt with empty tags array. Assert no Badge elements rendered.
10. **EC-5: Network error shows retry** — Mock API to throw generic error. Assert error message and retry button are displayed.

### Phase 8: Frontend — Storybook

No new stories needed. The `PromptDetailView` is a full page view, not a reusable component. The existing `AuthorCard.stories.ts` and `MonacoEditor.stories.ts` already cover the key sub-components. If the team wants a page-level story, it can be added later when a Storybook page decorator pattern is established.

## File Inventory

### New Files

- `src/main/kotlin/com/infosupport/promptyard/content/AuthorSummary.kt` — Serializable DTO for embedded author data
- `src/main/kotlin/com/infosupport/promptyard/content/PromptDetailResponse.kt` — Serializable DTO for prompt detail API response
- `src/main/webui/src/services/__tests__/prompts.spec.ts` — Unit tests for prompt service functions
- `src/main/webui/src/views/__tests__/PromptDetailView.spec.ts` — Unit tests for PromptDetailView

### Modified Files

- `src/main/kotlin/com/infosupport/promptyard/content/ContentItemRepository.kt` — Add `countByAuthorIdAndContentType` method
- `src/main/kotlin/com/infosupport/promptyard/content/PromptsResource.kt` — Add `GET /{slug}` endpoint method
- `src/test/kotlin/com/infosupport/promptyard/content/PromptsResourceTest.kt` — Add GET endpoint tests
- `src/test/kotlin/com/infosupport/promptyard/content/TestObjectFactory.kt` — Add optional params to `createPrompt`
- `src/main/webui/src/services/prompts.ts` — Add `PromptDetailResponse`, `AuthorSummary` types and `getPromptBySlug` function
- `src/main/webui/src/views/PromptDetailView.vue` — Replace empty stub with full implementation

## Testing Strategy

### Backend Integration Tests (REST Assured)

- Test the `GET /api/content/prompts/{slug}` endpoint through `PromptsResourceTest`.
- Use `TestObjectFactory` to create profiles and prompts with known data.
- Validate response structure: all fields present, author embedded correctly, counts accurate.
- Test error cases: 404 for missing slug, 302 redirect for unauthenticated.
- Clean up with `@AfterEach @Transactional` deleting from repos (existing pattern).

### Frontend Service Tests (Vitest)

- Mock `fetch` with `vi.stubGlobal('fetch', vi.fn())`.
- Test success, 404, and error responses.
- Verify URL construction includes proper encoding.

### Frontend View Tests (Vitest + @vue/test-utils)

- Mock the service layer (not fetch) to control API responses.
- Stub MonacoEditor to avoid loading Monaco in jsdom.
- Test all view states: loading, loaded, not-found, error.
- Verify component props are passed correctly to AuthorCard.
- Test breadcrumb structure and accessibility attributes.

### Edge Cases Covered

| Edge Case | Where Tested |
|-----------|-------------|
| EC-1: Empty description | View test (assert CardDescription not rendered) |
| EC-2: Empty tags | View test (assert no Badge elements) |
| EC-3: Very long content | MonacoEditor handles scroll natively |
| EC-4: Clipboard unavailable | Manual testing (try/catch in copyContent) |
| EC-5: Network error | View test (error state with retry) |
| EC-6: Author has no job title | AuthorCard already handles this (v-if on jobTitle) |

## Migration Notes

- **No database migrations needed.** All required tables and columns already exist.
- **No breaking changes.** The new GET endpoint is additive. The existing POST and DELETE endpoints are unchanged.
- **No feature flags needed.** The page is only reachable via direct URL or after creating a prompt (redirect from FEAT-004). Authentication is enforced by the existing global auth policy.
- **Backwards compatibility.** The `TestObjectFactory.createPrompt` signature change uses default parameters, so existing test calls remain valid.
