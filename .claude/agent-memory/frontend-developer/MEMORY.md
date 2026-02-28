# Frontend Developer Memory

## Project Structure
- Frontend root: `src/main/webui/`
- shadcn/vue components: `src/main/webui/src/components/ui/`
- Navigation components: `src/main/webui/src/components/navigation/`
- Views/pages: `src/main/webui/src/views/`
- Layouts: `src/main/webui/src/layouts/`
- Pinia stores: `src/main/webui/src/stores/`
- Services (API calls): `src/main/webui/src/services/`
- Router: `src/main/webui/src/router/index.ts`
- Utils: `src/main/webui/src/lib/`

## Installed shadcn/vue Components
Button, Input, Avatar, DropdownMenu, Separator, Form, Checkbox, Card, Label, Badge, Pagination, Skeleton

## Key Patterns

### shadcn/vue Form Pattern (vee-validate + zod)
- Use `toTypedSchema` from `@vee-validate/zod` to wrap zod schemas
- Use `useForm` from `vee-validate` with `validationSchema` and `initialValues`
- FormField wraps each field; text inputs use `v-slot="{ componentField }"` + `v-bind="componentField"`
- Checkboxes use `v-slot="{ value, handleChange }"` + `:checked="value"` + `@update:checked="handleChange"`
- Add `type="checkbox"` prop to FormField for checkbox fields
- zod v3 required (not v4) due to `@vee-validate/zod` peer dep

### Testing reka-ui / shadcn/vue Components in jsdom
- reka-ui Checkbox click events don't work in jsdom
- Use `defineExpose({ form, onSubmit })` to expose vee-validate form + submit handler
- In tests, call `form.setFieldValue()` for inputs and `onSubmit()` directly
- `trigger('submit')` on `<form>` does NOT reliably invoke vee-validate's handleSubmit in jsdom
- See `src/main/webui/src/views/__tests__/WelcomeView.spec.ts` for reference pattern

### Test Patterns
- Tests use `__tests__/` directories colocated with source
- Use `vi.mock()` for module mocking, `vi.clearAllMocks()` in beforeEach (not restoreAllMocks)
- `vi.clearAllMocks()` clears call counts; `vi.restoreAllMocks()` does NOT clear vi.fn() from vi.mock
- Pinia stores: `setActivePinia(createPinia())` in beforeEach
- Router guard tests: use `vi.resetModules()` + dynamic `import()` for fresh router each test
- Service tests: mock `globalThis.fetch` with `vi.spyOn`

### Architecture
- Profile store (`useProfileStore`): centralized profile state, idempotent fetchProfile
- Navigation guard: global `beforeEach` on router, fetches profile, redirects to /welcome if missing
- `/welcome` route is outside DefaultLayout (no nav bar for new users)
- NavigationBar and NavigationUserMenu read from Pinia store (no props)
- DefaultLayout no longer fetches profile data (guard handles it)

### Content Domain Components
- `ContentItemCard` in `src/main/webui/src/components/content/ContentItemCard.vue`
- `ContentItemList` in `src/main/webui/src/components/content/ContentItemList.vue` (paginated list of cards)
- `ContentItemListSkeleton` in same dir (internal sub-component, NOT exported from barrel)
- `ContentItemSummary` interface in `src/main/webui/src/lib/content-types.ts` (matches ContentItemCard props)
- Barrel export: `src/main/webui/src/components/content/index.ts`
- Content type config: `src/main/webui/src/lib/content-types.ts` (ContentType union, CONTENT_TYPE_CONFIG record)
- Tag overflow composable: `src/main/webui/src/composables/useTagOverflow.ts`
- shadcn/vue Card `data-slot` attributes: card, card-header, card-content, card-footer, card-title (useful for test selectors)

### shadcn/vue Pagination Component API
- Generated components use different names than reka-ui: `PaginationContent` (wraps PaginationList), `PaginationItem` (wraps PaginationListItem), `PaginationPrevious` (wraps PaginationPrev)
- `PaginationItem` has `isActive` prop for active page styling (uses outline variant)
- `data-slot` attributes: pagination, pagination-content, pagination-item, pagination-previous, pagination-next, pagination-ellipsis
- Total pages trick: pass `total = totalPages * 10` and `items-per-page = 10` to get correct page count
- Skeleton `data-slot`: "skeleton"

### Profiles Domain Components
- `AuthorCard` in `src/main/webui/src/components/profiles/AuthorCard.vue`
- Barrel export: `src/main/webui/src/components/profiles/index.ts`
- Uses shadcn/vue Card, Avatar, Separator, Button + RouterLink
- `getInitials` utility in `src/main/webui/src/lib/format.ts` (first + last word initials)

### Utility Functions
- `getInitials(name)` in `src/main/webui/src/lib/format.ts`: first letter of first word + first letter of last word, uppercased
- `cn()` in `src/main/webui/src/lib/utils.ts`: Tailwind class merge utility (clsx + tailwind-merge)

### Boolean Props in Test Stubs
- Bare `disabled` attribute on a stub component (with `props: ['disabled']`) passes `""` not `true`
- Use `:disabled="true"` in templates to pass actual boolean to stubs in tests
- Only affects stubs; real components with typed `defineProps` handle bare attributes correctly

### PromptDetailView Patterns
- `PromptDetailView` at `src/main/webui/src/views/PromptDetailView.vue`
- Uses `getPromptBySlug()` from `@/services/prompts` (GET /api/content/prompts/{slug})
- Two-column grid layout: `grid-cols-[1fr_auto]` with AuthorCard sidebar (w-72)
- Breadcrumb: semantic `<nav aria-label="Breadcrumb">` with `<ol>` markup
- Monaco editor in readonly mode with copy-to-clipboard button
- States: loading, not-found (404), error (with retry), loaded

### Vitest Configuration
- `pnpm test:unit` runs two projects: jsdom (unit tests) + storybook (browser/Playwright)
- `--project=0` does NOT work (expects string name); use `npx vitest --run "path/to/test.spec.ts"` to run specific tests
- Storybook project name is "storybook"; jsdom project has no name

### Component Testing with RouterLink
- Mock vue-router with `vi.mock('vue-router', ...)` providing a stub RouterLink
- Also pass RouterLink stub in `global.stubs` to ensure it overrides in the component
- Test link href by finding `a[href="..."]` elements

### Dependencies
- zod: v3.x (required by @vee-validate/zod)
- @vee-validate/zod: v4.x
- vee-validate: v4.x (already installed)
