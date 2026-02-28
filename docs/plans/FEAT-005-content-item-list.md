# Implementation Plan: Content Item List

**Spec:** docs/specs/FEAT-005-content-item-list.md
**Created:** 2026-02-26
**Status:** Draft

## Summary

This feature adds a reusable `ContentItemList` Vue 3 component that renders a vertical list of `ContentItemCard` components with pagination, loading skeletons, and empty state handling. The component is data-agnostic -- it receives paged content as props and emits page-change events, allowing any parent page (homepage, search results, user profile) to supply data however it sees fit. Two new shadcn/vue components (Pagination and Skeleton) must be installed first.

## Key Design Decisions

1. **Use the shadcn/vue `Pagination` component for the pager bar.** The spec requires page numbers, prev/next arrows, ellipsis truncation (FR-003, FR-011), and disabled states (FR-005, FR-006). The shadcn/vue Pagination component -- built on reka-ui's `PaginationRoot` -- provides all of this out of the box with proper accessibility attributes (keyboard navigation, aria-labels). It supports ellipsis truncation natively. This avoids building a custom pager and keeps the project consistent with ADR008.

2. **Use the shadcn/vue `Skeleton` component for loading placeholders.** The spec requires 3 skeleton card shapes during loading (FR-009). The Skeleton primitive from shadcn/vue renders animated placeholder rectangles. Three skeleton "cards" will be composed from multiple Skeleton elements (mimicking the ContentItemCard layout: title line, description lines, tag badges, author line) wrapped in the same Card component used by ContentItemCard for visual consistency.

3. **Place the component at `src/main/webui/src/components/content/ContentItemList.vue`.** This follows the existing functional slice organization (ADR007) where content-related components live in `components/content/`. The barrel export in `components/content/index.ts` will be updated.

4. **Extract a `ContentItemListSkeleton` as a private sub-component rather than inlining skeleton markup.** The skeleton layout is a self-contained visual pattern (3 card-shaped placeholders). Extracting it into `ContentItemListSkeleton.vue` in the same directory keeps `ContentItemList.vue` focused on the list/pagination logic. This component is not exported from the barrel -- it is an internal implementation detail.

5. **Define `ContentItemSummary` as a TypeScript interface in `lib/content-types.ts`.** The spec defines a `ContentItemSummary` data shape that maps to `ContentItemCard` props. Since `lib/content-types.ts` already holds `ContentType` and its configuration, this is the natural home for the summary interface. It keeps content-related type definitions co-located.

6. **Use zero-based page indexing internally, converting to one-based for the shadcn/vue Pagination component.** The spec uses zero-based `pageIndex` (matching typical backend pagination). The shadcn/vue Pagination component uses one-based page numbers. The `ContentItemList` component will translate between these at its boundary: props use zero-based, the Pagination component receives `pageIndex + 1`, and emitted `page-change` events convert back to zero-based.

7. **Do not click-emit on the already-active page (EC-4).** The Pagination component's `@update:page` handler will compare the incoming page to the current `pageIndex` and skip emitting `page-change` if they are equal.

## Implementation Steps

### Phase 1: shadcn/vue Dependencies

#### Step 1.1: Add shadcn/vue `Pagination` component

```bash
cd src/main/webui && npx shadcn-vue@latest add pagination
```

This generates `src/main/webui/src/components/ui/pagination/` with sub-components: `Pagination`, `PaginationEllipsis`, `PaginationFirst`, `PaginationLast`, `PaginationNext`, `PaginationPrev`, `PaginationList`, `PaginationListItem`, and an `index.ts` barrel.

#### Step 1.2: Add shadcn/vue `Skeleton` component

```bash
cd src/main/webui && npx shadcn-vue@latest add skeleton
```

This generates `src/main/webui/src/components/ui/skeleton/Skeleton.vue` and `index.ts`.

### Phase 2: Type Definitions

#### Step 2.1: Add `ContentItemSummary` interface to `src/main/webui/src/lib/content-types.ts`

Add the following interface after the existing `CONTENT_TYPE_CONFIG` export:

```typescript
export interface ContentItemSummary {
  title: string
  description: string
  tags: string[]
  contentType: ContentType
  authorName: string
  url: string
}
```

This interface matches the `ContentItemCard` props exactly and serves as the contract between parent pages and the `ContentItemList` component.

### Phase 3: Component Implementation

#### Step 3.1: Create `src/main/webui/src/components/content/ContentItemListSkeleton.vue`

A private component rendering 3 skeleton card placeholders. Each placeholder uses the `Card` and `Skeleton` components to mimic the ContentItemCard layout:

- A `Card` with `CardHeader` containing a Skeleton for the icon (16x16 circle) and a Skeleton for the title (60% width, h-5).
- A `CardContent` with two Skeleton lines for the description (100% width h-4 and 75% width h-4).
- A `CardContent` with three small Skeleton badges (h-5, varying widths like w-16, w-20, w-14).
- A `CardContent` with a Skeleton for the author name (w-24, h-3).

Wrap the three cards in a `div.space-y-4` to match the spacing of the real list.

This component takes no props. It always renders exactly 3 skeleton cards.

#### Step 3.2: Create `src/main/webui/src/components/content/ContentItemList.vue`

Props (matching the spec's `ContentItemListProps`):

```typescript
interface Props {
  items: ContentItemSummary[]
  pageIndex: number
  totalPages: number
  loading?: boolean
}
```

Default: `loading` defaults to `false`.

Emits:

```typescript
defineEmits<{
  'page-change': [pageIndex: number]
}>()
```

Template structure:

```html
<div>
  <!-- Loading state (FR-009) -->
  <ContentItemListSkeleton v-if="loading" />

  <!-- Empty state (FR-010) -->
  <div v-else-if="items.length === 0" role="status" class="...">
    <p>No content items found</p>
  </div>

  <!-- Content state (FR-001) -->
  <template v-else>
    <div class="space-y-4">
      <ContentItemCard
        v-for="(item, index) in items"
        :key="index"
        :title="item.title"
        :description="item.description"
        :tags="item.tags"
        :content-type="item.contentType"
        :author-name="item.authorName"
        :url="item.url"
      />
    </div>

    <!-- Pagination (FR-003, FR-011) -->
    <Pagination
      v-if="totalPages > 1"
      :total="totalPages * 10"
      :items-per-page="10"
      :page="pageIndex + 1"
      :sibling-count="1"
      show-edges
      class="mt-6"
      @update:page="onPageChange"
    >
      <PaginationList v-slot="{ items: paginationItems }" class="flex items-center gap-1">
        <PaginationPrev />
        <template v-for="(item, i) in paginationItems" :key="i">
          <PaginationListItem v-if="item.type === 'page'" :value="item.value" as-child>
            <Button variant="outline" size="icon"
              :class="{ 'bg-accent': item.value === pageIndex + 1 }">
              {{ item.value }}
            </Button>
          </PaginationListItem>
          <PaginationEllipsis v-else :index="i" />
        </template>
        <PaginationNext />
      </PaginationList>
    </Pagination>
  </template>
</div>
```

Script logic:

- Import `ContentItemCard` from the local directory (not through barrel to avoid circular reference).
- Import `ContentItemListSkeleton` from `./ContentItemListSkeleton.vue`.
- Import Pagination sub-components from `@/components/ui/pagination`.
- Import `Button` from `@/components/ui/button`.
- Import `ContentItemSummary` type from `@/lib/content-types`.
- The `onPageChange` handler converts from one-based (Pagination component) to zero-based (spec contract):

```typescript
function onPageChange(page: number) {
  const zeroBasedPage = page - 1
  if (zeroBasedPage !== props.pageIndex) {
    emit('page-change', zeroBasedPage)
  }
}
```

The guard `zeroBasedPage !== props.pageIndex` handles EC-4 (clicking the already-active page).

Note on the Pagination `total` trick: shadcn/vue Pagination takes a `total` item count and `items-per-page`, computing the page count as `Math.ceil(total / itemsPerPage)`. Since we already know `totalPages`, we pass `total = totalPages * 10` and `items-per-page = 10` to produce the correct number of page buttons. This avoids needing to know the actual item count (which the component deliberately does not receive per FR-008).

The `sibling-count="1"` combined with `show-edges` produces the ellipsis truncation pattern (e.g., 1 2 3 ... 18 19 20) required by FR-011.

Prev/Next disabled states (FR-005, FR-006) are handled automatically by the shadcn/vue Pagination component based on the current page value.

Accessibility:
- The shadcn/vue Pagination provides keyboard navigation and aria-labels for all buttons (NFR-001, NFR-002).
- The empty state `<div>` uses `role="status"` so screen readers announce it (NFR-003).
- The component fills its container width via the parent's layout (NFR-004).

#### Step 3.3: Update `src/main/webui/src/components/content/index.ts`

Add the new export:

```typescript
export { default as ContentItemList } from './ContentItemList.vue'
```

Do NOT export `ContentItemListSkeleton` -- it is an internal implementation detail.

### Phase 4: Tests

#### Step 4.1: Create `src/main/webui/src/components/content/__tests__/ContentItemList.spec.ts`

Setup:
- Import `mount` from `@vue/test-utils`.
- Import `ContentItemList` from `../ContentItemList.vue`.
- Import `ContentItemSummary` from `@/lib/content-types`.
- Stub `RouterLink` (used internally by `ContentItemCard`) using `global.stubs` as done in `ContentItemCard.spec.ts`.
- Define a helper `createItems(count: number): ContentItemSummary[]` that generates test items.
- Define a helper `mountList(propsOverride)` that provides sensible defaults: `items: createItems(5), pageIndex: 0, totalPages: 3, loading: false`.

Test cases (mapped to acceptance scenarios):

**SC-001: List renders content item cards (FR-001, FR-002)**
- Mount with 5 items, pageIndex 0, totalPages 3.
- Assert 5 `[data-slot="card"]` elements are rendered.
- Assert each card contains the corresponding item's title.

**SC-002: Pager displays page numbers and arrows (FR-003, FR-004)**
- Mount with items, pageIndex 1, totalPages 5.
- Assert the pagination nav element exists.
- Assert button with text "2" has the active/highlighted class (`bg-accent`).
- Assert prev and next buttons exist.

**SC-003: Prev arrow disabled on first page (FR-005)**
- Mount with pageIndex 0, totalPages 5.
- Find the prev button (via aria-label or data attribute from reka-ui).
- Assert it is disabled (`aria-disabled="true"` or `disabled` attribute).
- Assert the next button is NOT disabled.

**SC-004: Next arrow disabled on last page (FR-006)**
- Mount with pageIndex 4, totalPages 5.
- Assert the next button is disabled.
- Assert the prev button is NOT disabled.

**SC-005: Clicking a page number emits page-change event (FR-007)**
- Mount with pageIndex 0, totalPages 5.
- Click the button with text "3".
- Assert `wrapper.emitted('page-change')` contains `[[2]]` (zero-based).

**SC-006: Clicking the next arrow emits page-change event (FR-007)**
- Mount with pageIndex 0, totalPages 5.
- Click the next button.
- Assert emitted `page-change` contains `[[1]]`.

**SC-007: Clicking the prev arrow emits page-change event (FR-007)**
- Mount with pageIndex 2, totalPages 5.
- Click the prev button.
- Assert emitted `page-change` contains `[[1]]`.

**SC-008: Total item count is not displayed (FR-008)**
- Mount with items.
- Assert the rendered text does not contain any number that matches the total item count (e.g., the component never shows "15 items" or similar).

**SC-009: Loading state shows skeleton cards (FR-009)**
- Mount with `loading: true`.
- Assert skeleton elements are rendered (look for `data-slot="skeleton"` or `.animate-pulse` elements).
- Assert no `[data-slot="card"]` content cards are rendered.
- Assert no pagination is rendered.

**SC-010: Empty state shows message (FR-010)**
- Mount with `items: [], loading: false`.
- Assert text "No content items found" is present.
- Assert no pagination is rendered.

**SC-011: Pager truncates with ellipsis for many pages (FR-011)**
- Mount with pageIndex 0, totalPages 20.
- Assert that fewer than 20 page number buttons are rendered.
- Assert that an ellipsis element exists (the `PaginationEllipsis` renders a `...` or a specific element).

**SC-012: Pager hidden when only one page (FR-003)**
- Mount with items, pageIndex 0, totalPages 1.
- Assert cards are rendered.
- Assert no pagination nav element exists.

**EC-4: Clicking the active page does not emit (FR-007)**
- Mount with pageIndex 0, totalPages 5.
- Click the button with text "1" (the active page).
- Assert `wrapper.emitted('page-change')` is undefined or empty.

**EC-3: Loading true with stale items shows skeleton, not items**
- Mount with `loading: true, items: createItems(5)`.
- Assert skeleton is rendered.
- Assert no content cards are rendered.

**EC-6: Loading transitions from true to false with empty items**
- Mount with `loading: true, items: []`.
- Assert skeleton is rendered.
- Remount (or use `wrapper.setProps`) with `loading: false, items: []`.
- Assert "No content items found" message is displayed.

#### Step 4.2: Create `src/main/webui/src/components/content/__tests__/ContentItemListSkeleton.spec.ts`

A lightweight test to ensure the skeleton renders correctly:

- Mount `ContentItemListSkeleton`.
- Assert it renders exactly 3 card containers.
- Assert skeleton elements (animated placeholders) are present within each card.

### Phase 5: Storybook Stories

#### Step 5.1: Create `src/main/webui/src/components/content/ContentItemList.stories.ts`

Meta:
```typescript
const meta = {
  title: 'Content/ContentItemList',
  component: ContentItemList,
  tags: ['autodocs'],
} satisfies Meta<typeof ContentItemList>
```

Stories:

- **Default**: 5 items, pageIndex 0, totalPages 3. Demonstrates the standard populated list with pagination.
- **SecondPage**: 5 items, pageIndex 1, totalPages 3. Shows the pager with the second page highlighted and both prev/next enabled.
- **SinglePage**: 3 items, pageIndex 0, totalPages 1. No pager shown.
- **Empty**: items: [], pageIndex 0, totalPages 0 (or 1). Shows "No content items found" message.
- **Loading**: loading: true. Shows 3 skeleton card placeholders, no pager.
- **ManyPages**: 5 items, pageIndex 0, totalPages 20. Demonstrates ellipsis truncation in the pager.
- **LastPage**: 2 items, pageIndex 19, totalPages 20. Shows pager with next disabled and ellipsis.
- **MixedContentTypes**: Items with different contentType values (prompt, skill, agent, workflow) to demonstrate how cards render different border colors and icons in a list context.

Each story uses a helper function to generate realistic `ContentItemSummary` arrays with varied content types, titles, descriptions, tags, and author names.

## File Inventory

### New Files

- `src/main/webui/src/components/content/ContentItemList.vue` -- Main list component with pagination
- `src/main/webui/src/components/content/ContentItemListSkeleton.vue` -- Skeleton loading state (internal)
- `src/main/webui/src/components/content/ContentItemList.stories.ts` -- Storybook stories
- `src/main/webui/src/components/content/__tests__/ContentItemList.spec.ts` -- Unit tests
- `src/main/webui/src/components/content/__tests__/ContentItemListSkeleton.spec.ts` -- Skeleton unit tests

### Generated Files (via shadcn/vue CLI)

- `src/main/webui/src/components/ui/pagination/` -- Pagination component and sub-components
- `src/main/webui/src/components/ui/skeleton/` -- Skeleton component

### Modified Files

- `src/main/webui/src/lib/content-types.ts` -- Add `ContentItemSummary` interface
- `src/main/webui/src/components/content/index.ts` -- Add `ContentItemList` export

## Testing Strategy

### Unit Tests (Vitest + jsdom)

**ContentItemList** (`ContentItemList.spec.ts`):
- Covers all 12 acceptance scenarios from the spec plus edge cases EC-3, EC-4, EC-6.
- Uses `@vue/test-utils` mount with `global.stubs` for `RouterLink` (same pattern as `ContentItemCard.spec.ts`).
- Generates test data via a `createItems()` helper.
- Tests pagination behavior by clicking buttons and asserting emitted events.
- Tests loading/empty states by asserting DOM content presence/absence.

**ContentItemListSkeleton** (`ContentItemListSkeleton.spec.ts`):
- Lightweight structural test: 3 cards, skeleton elements present.

### Storybook Visual Tests

- 8 stories covering all visual states: populated, empty, loading, single page, many pages, last page, mixed content types.
- Stories are picked up by the Storybook vitest project (already configured in `vitest.config.ts`) for automated visual/a11y checks.
- The `@storybook/addon-a11y` addon (already installed) validates accessibility.

### What NOT to test

- `ContentItemCard` rendering details -- already covered by its own test suite (`ContentItemCard.spec.ts`).
- Pagination component internals (ellipsis algorithm, button rendering) -- that is shadcn/vue / reka-ui responsibility. We test that the correct page-change events are emitted and that the pager appears/disappears at the right times.

## Migration Notes

- No database migrations required.
- No backend changes required.
- No new npm dependencies required -- only shadcn/vue components are generated into the project source. The underlying `reka-ui` dependency (already installed at v2.8.2) provides the pagination primitives.
- The `ContentItemSummary` interface is additive -- it does not change any existing type.
- The component is not wired into any page yet. Parent pages (e.g., HomeView) will integrate it in a future feature when the content list API and data fetching logic are built. This plan covers only the reusable component itself.
