# Implementation Plan: Homepage

**Spec:** `docs/specs/FEAT-009-homepage.md`
**Created:** 2026-02-27
**Status:** Draft

## Summary

The homepage is a frontend-only feature that composes a static hero section with a paginated content feed. The hero includes a heading, motivational message, and a reusable `NavigationCreateMenu` dropdown. Content is fetched from `GET /api/content?page=N` and displayed via the existing `ContentItemList` component. The URL's `?page=` query parameter (1-based) stays in sync with the currently displayed page.

**Backend deviation:** The spec states "no backend changes required," but `GET /api/content` currently returns `ContentItemResponse` **without** an `authorName` field, while `ContentItemCard` requires one. The `ContentItem` entity already has a lazy `@ManyToOne author` relation to `UserProfile`, so the fix is a one-line addition to the response mapping. This plan includes that minimal backend change because the alternative (making `authorName` optional across multiple components) is far more invasive.

## Key Design Decisions

1. **Add `authorName` to `ContentItemResponse`** — The `ContentItem` entity already has a lazy `author` relation. Adding `item.author.fullName` to the response mapping in `ContentItemsResource` is a trivial change and avoids cascading optionality across the entire `ContentItemSummary`/`ContentItemCard` chain.

2. **New `content.ts` service module** — Create `src/main/webui/src/services/content.ts` with a `getAllContent(page)` function. This keeps content-browsing concerns separate from `profiles.ts` (which serves profile-scoped content) and `prompts.ts` (which serves prompt CRUD). The response type mirrors `MyContentPageResponse` but maps from `ContentItemPageResponse`.

3. **New `useAllContent` composable** — Follows the exact shape of `useMyContent`/`useProfileContent` (returns `{ items, pageIndex, totalPages, loading, error, fetchPage }`). The key difference: it does **not** auto-fetch on mount (the view handles initial fetch based on the URL query param).

4. **`HomeHeroSection` as a presentational component** — A stateless component in `src/main/webui/src/components/home/HomeHeroSection.vue` that renders the heading, message, and reuses `NavigationCreateMenu`. No props needed — all content is static. Wrapping it in its own component keeps `HomeView` clean and testable.

5. **URL ↔ page sync in `HomeView`** — Use `useRoute().query.page` to read the initial page on mount, and `useRouter().replace()` (not `push`) to update the URL on page change. The `replace` avoids polluting browser history with every page click. Conversion: `pageIndex = Math.max(0, parseInt(page) - 1)` with NaN/invalid defaulting to 0.

6. **Error state** — When the API call fails, show a static error message in place of the content list while keeping the hero visible (per EC-6 in the spec). The error state is managed by the `useAllContent` composable's `error` ref.

## Implementation Steps

### Phase 1: Backend — Add `authorName` to Content Feed

**Step 1.1:** Update `ContentItemResponse` to include `authorName`.

- **File:** `src/main/kotlin/com/infosupport/promptyard/content/ContentItemResponse.kt`
- Add `val authorName: String` field to the data class.

**Step 1.2:** Map `author.fullName` in `ContentItemsResource`.

- **File:** `src/main/kotlin/com/infosupport/promptyard/content/ContentItemsResource.kt`
- In the `getContentItems` method, add `authorName = item.author.fullName` to the `ContentItemResponse` construction.

**Step 1.3:** Update `ContentItemsResourceTest` to verify `authorName`.

- **File:** `src/test/kotlin/com/infosupport/promptyard/content/ContentItemsResourceTest.kt`
- If this test file exists, add assertions that verify `authorName` is present and correct in the response. If it doesn't exist, create it following the `PromptsResourceTest` pattern.

### Phase 2: Frontend — Service & Composable

**Step 2.1:** Create the `content` service module.

- **New file:** `src/main/webui/src/services/content.ts`
- Define `ContentPageResponse` and `ContentPageItem` interfaces matching the backend's `ContentItemPageResponse` shape (now including `authorName`).
- Export `getAllContent(page: number): Promise<ContentPageResponse>` that calls `GET /api/content?page=${page}`.

**Step 2.2:** Create the `useAllContent` composable.

- **New file:** `src/main/webui/src/composables/useAllContent.ts`
- Follow the `useMyContent` pattern: `data` ref, `loading` ref, `error` ref, computed `items`/`pageIndex`/`totalPages`, `fetchPage` function.
- Map `ContentPageItem` → `ContentItemSummary` (constructing `url` as `/content/${contentType}s/${slug}`).
- **Do not** call `fetchPage` in `onMounted` — the calling view controls when the initial fetch happens based on URL state.
- Return `{ items, pageIndex, totalPages, loading, error, fetchPage }`.

### Phase 3: Frontend — Components

**Step 3.1:** Create the `HomeHeroSection` component.

- **New file:** `src/main/webui/src/components/home/HomeHeroSection.vue`
- Renders:
  - `<h1>` with text "Help your colleagues adopt AI"
  - `<p>` with text "Share your prompts, skills, agents, and workflows with the rest of the organization."
  - `<NavigationCreateMenu />` component
- Layout: centered text with the Create button below the message. Use Tailwind utilities — no new CSS. Keep it responsive (stack vertically on mobile, comfortable spacing on desktop).
- The component accepts no props and emits no events.

**Step 3.2:** Create a barrel export for the `home` component directory.

- **New file:** `src/main/webui/src/components/home/index.ts`
- Export `HomeHeroSection`.

### Phase 4: Frontend — HomeView Composition

**Step 4.1:** Rewrite `HomeView.vue` to compose hero + content list.

- **File:** `src/main/webui/src/views/HomeView.vue`
- Template structure:
  ```
  <HomeHeroSection />
  <div v-if="error" class="...">Failed to load content.</div>
  <ContentItemList v-else :items="items" :page-index="pageIndex" :total-pages="totalPages" :loading="loading" @page-change="onPageChange" />
  ```
- Script:
  - Import `useRoute`, `useRouter` from `vue-router`.
  - Import `useAllContent` composable.
  - Import `HomeHeroSection` from `@/components/home`.
  - Import `ContentItemList` from `@/components/content`.
  - On setup:
    1. Read `route.query.page`, parse to integer, convert from 1-based to 0-based: `Math.max(0, parseInt(String(route.query.page)) - 1)` — NaN becomes -1, `Math.max(0, -1)` → 0.
    2. Call `fetchPage(initialPageIndex)` to trigger the initial load.
  - `onPageChange(newPageIndex)`:
    1. Call `fetchPage(newPageIndex)`.
    2. Call `router.replace({ query: { page: String(newPageIndex + 1) } })` to update URL.
    3. If `newPageIndex === 0`, use `router.replace({ query: {} })` to remove the param entirely (clean URL for page 1, per SC-003).

### Phase 5: Tests

**Step 5.1:** Write unit tests for `useAllContent` composable.

- **New file:** `src/main/webui/src/composables/__tests__/useAllContent.spec.ts`
- Follow the `useMyContent.spec.ts` pattern (mount helper component, mock `@/services/content`).
- Test cases:
  - Does not auto-fetch on mount (unlike `useMyContent`)
  - `fetchPage(0)` calls `getAllContent(0)` and sets items/pageIndex/totalPages
  - Maps items to `ContentItemSummary` with correct URLs
  - Sets `loading` true during fetch, false after
  - Sets `error` true on failure
  - Clears error on successful subsequent fetch

**Step 5.2:** Write unit tests for `HomeHeroSection`.

- **New file:** `src/main/webui/src/components/home/__tests__/HomeHeroSection.spec.ts`
- Test cases:
  - Renders `<h1>` with the expected heading text
  - Renders the motivational message paragraph
  - Renders `NavigationCreateMenu` component

**Step 5.3:** Write unit tests for `HomeView`.

- **New file:** `src/main/webui/src/views/__tests__/HomeView.spec.ts`
- Follow the `MyProfileView.spec.ts` pattern: mock `vue-router`, mock `useAllContent`, stub child components.
- Test cases:
  - SC-001: Renders `HomeHeroSection` component
  - SC-003: Calls `fetchPage(0)` when no `page` query param (defaults to page 1 → index 0)
  - SC-004: Shows `ContentItemList` with `loading: true` while fetching
  - SC-005: Calls `fetchPage(1)` when URL has `?page=2`
  - SC-006: On `page-change` event, calls `fetchPage` and updates URL via `router.replace`
  - SC-007: Shows empty state (delegated to `ContentItemList` with empty items)
  - SC-008: Invalid page param (e.g., `?page=-1`) defaults to page index 0
  - EC-2: Non-numeric page param (e.g., `?page=abc`) defaults to page index 0
  - EC-6: Shows error message when `error` ref is true, hero still visible

## File Inventory

### New Files

- `src/main/webui/src/services/content.ts` — Service to call `GET /api/content?page=N`
- `src/main/webui/src/composables/useAllContent.ts` — Composable for homepage content state
- `src/main/webui/src/components/home/HomeHeroSection.vue` — Hero section component
- `src/main/webui/src/components/home/index.ts` — Barrel export for home components
- `src/main/webui/src/composables/__tests__/useAllContent.spec.ts` — Composable tests
- `src/main/webui/src/components/home/__tests__/HomeHeroSection.spec.ts` — Hero component tests
- `src/main/webui/src/views/__tests__/HomeView.spec.ts` — View integration tests

### Modified Files

- `src/main/kotlin/com/infosupport/promptyard/content/ContentItemResponse.kt` — Add `authorName` field
- `src/main/kotlin/com/infosupport/promptyard/content/ContentItemsResource.kt` — Map `author.fullName` in response
- `src/main/webui/src/views/HomeView.vue` — Full rewrite from placeholder to composed homepage

### Potentially Modified Files

- `src/test/kotlin/com/infosupport/promptyard/content/ContentItemsResourceTest.kt` — Add/update test for `authorName` (create if it doesn't exist)

## Testing Strategy

### Backend

- Verify `GET /api/content?page=0` returns items with `authorName` populated.
- Use `@QuarkusTest` + `@TestSecurity` + `TestObjectFactory` to create content items with known authors and assert the `authorName` field in the JSON response.

### Frontend — Composable (`useAllContent`)

- Mock `@/services/content` at module level.
- Mount a wrapper component that calls `useAllContent()`.
- Verify: no auto-fetch, manual `fetchPage` triggers API call, response maps to `ContentItemSummary` with correct URLs, loading/error states toggle correctly.

### Frontend — Component (`HomeHeroSection`)

- Mount with RouterLink stub (for NavigationCreateMenu's internal links).
- Assert heading text, message text, and presence of NavigationCreateMenu.

### Frontend — View (`HomeView`)

- Mock `vue-router` (`useRoute`, `useRouter`, `RouterLink`).
- Mock `@/composables/useAllContent` returning controlled refs.
- Stub `HomeHeroSection` and `ContentItemList` as named stubs with `data-testid`.
- Verify: initial `fetchPage` call based on URL, prop passing to `ContentItemList`, `page-change` handler updates URL, error state rendering.

### Edge Cases to Cover

- `?page=0` → page index 0 (treat as page 1)
- `?page=-5` → page index 0
- `?page=abc` → page index 0
- `?page=2` → page index 1
- No `page` param → page index 0
- API failure → error message shown, hero still visible

## Migration Notes

- The `authorName` addition to `ContentItemResponse` is a backwards-compatible additive change — no database migration needed, as the data comes from the existing `author` JPA relation.
- No feature flags needed — the homepage replaces a static placeholder.
