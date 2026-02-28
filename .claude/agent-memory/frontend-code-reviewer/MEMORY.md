# Frontend Code Reviewer Memory

## Project Patterns

### Component Organization
- Navigation components live in `src/main/webui/src/components/navigation/` with barrel export in `index.ts`
- Content domain components in `src/main/webui/src/components/content/` with barrel export
- Profile domain components in `src/main/webui/src/components/profiles/` with barrel export (AuthorCard, ProfileDetailsCard)
- shadcn/vue UI components in `src/main/webui/src/components/ui/` (atoms: button, input, avatar, dropdown-menu, separator, form, checkbox, card, label, badge, pagination, skeleton, alert-dialog, textarea)
- Layouts in `src/main/webui/src/layouts/` (DefaultLayout wraps routes with NavigationBar)
- Views in `src/main/webui/src/views/`
- Domain slice convention: components organized by domain (content, profiles, navigation), not by atomic level
- Private sub-components (e.g., ContentItemListSkeleton) are NOT exported from barrel files

### State Management
- Pinia stores use Composition API (setup) syntax in `src/main/webui/src/stores/`
- `useProfileStore` is the profile state singleton: profile, loaded, error flags; fetchProfile() is idempotent
- Stores expose `$reset()` for testing cleanup

### Services
- API service functions in `src/main/webui/src/services/` using plain `fetch()`
- `getCurrentProfile()` returns `null` on 404 (does NOT throw); throws on other errors
- `createProfile()` throws on non-ok responses
- `createPrompt()`, `getPromptBySlug()`, `updatePrompt()` throw `new Error('Failed to ... : {status}')` on non-ok responses
- `updatePrompt(slug, request)` sends PUT to `/api/content/prompts/{slug}`
- `getMyContent(page)`, `getProfileBySlug(slug)`, `getProfileContent(slug, page)` throw on non-ok
- 404 detection in views relies on `err.message.includes('404')` — consistent but fragile pattern
- `getPromptBySlug()` and `updatePrompt()` use `encodeURIComponent()` on the slug — good practice
- **INCONSISTENCY:** `getProfileBySlug()` and `getProfileContent()` do NOT use `encodeURIComponent()` — flagged in FEAT-008 review
- `PromptDetailResponse` includes `isOwner: boolean` for ownership checks

### Routing
- Router in `src/main/webui/src/router/index.ts` with HTML5 history mode
- Global `beforeEach` guard handles profile detection and redirect to `/welcome`
- `/welcome` route is outside DefaultLayout (no navigation bar for unonboarded users)
- Routes: home `/`, create-prompt `/content/prompts/new`, prompt-detail `/content/prompts/:slug`, edit-prompt `/content/prompts/:slug/edit`, my-profile `/profiles/me`, profile `/profiles/:slug`
- Static routes (e.g., `profiles/me`) must come before parameterized routes (e.g., `profiles/:slug`) to avoid capture

### Testing Conventions
- Vitest with jsdom environment
- `vi.mock()` at top level, then import mocked modules after
- `setActivePinia(createPinia())` in `beforeEach` for store tests
- Router guard tests use `vi.resetModules()` + dynamic `import()` to get fresh router instances
- WelcomeView tests use `defineExpose` to access form internals via `wrapper.vm`
- Service tests mock `globalThis.fetch` with `vi.spyOn`
- Test file locations: `__tests__/` sibling directories
- Component tests use `mountCard()`/`mountList()`-style factory functions with defaultProps pattern
- RouterLink stubbed as `<a :href="to"><slot /></a>` in component tests
- Tests use `data-slot` attributes from shadcn/vue for stable selectors (not CSS classes)
- View tests stub child components with declared props for `findComponent().props()` assertions
- Composable tests use `mountComposable()` pattern: mount a wrapper `defineComponent` that calls the composable in `setup()`

### Storybook Conventions
- Story titles follow domain slice prefix: `Content/ContentItemCard`, `Content/ContentItemList`, `Profiles/AuthorCard`
- Meta uses `satisfies Meta<typeof Component>` for type safety
- Always include `tags: ['autodocs']`
- Import from `@storybook/vue3-vite` (not `@storybook/vue3`)
- Stories co-located as `ComponentName.stories.ts` next to the component
- Use `argTypes` for props that benefit from controls (numbers with min, selects)
- Event handlers use `fn()` from `storybook/test` via `'onEvent-name': fn()` pattern

### Composables
- `useTagOverflow` in `src/main/webui/src/composables/useTagOverflow.ts` -- measures tag overflow via ResizeObserver
- `useMyContent` in `src/main/webui/src/composables/useMyContent.ts` -- fetches current user's content via `getMyContent()`
- `useProfileContent` in `src/main/webui/src/composables/useProfileContent.ts` -- fetches a profile's content by slug via `getProfileContent()`
- `useUnsavedChanges` in `src/main/webui/src/composables/useUnsavedChanges.ts` -- route leave guard + beforeunload for dirty forms; returns showDialog, confirmLeave, cancelLeave, bypass; used by CreatePromptView and EditPromptView
- Both content composables share identical item mapping logic (MyContentItemResponse -> ContentItemSummary)
- Uses `@vueuse/core` `useResizeObserver` for resize observation

### View Patterns
- Views extract route params once as `const slug = route.params.slug as string` -- does NOT react to param changes
- Views that fetch by slug use loading/error/notFound ref pattern with onMounted fetch
- Own-profile detection: `computed(() => profileStore.profile?.slug === slug)` in ProfileView
- Null-to-undefined coercion for optional props: `profile.jobTitle ?? undefined`

### Utilities
- `getInitials()` in `src/main/webui/src/lib/format.ts` -- extracts first+last word initials
- `formatMemberSince()` in `src/main/webui/src/lib/format.ts` -- formats ISO date as "Member since Mon YYYY"
- `cn()` in `src/main/webui/src/lib/utils.ts` (clsx + tailwind-merge)
- Content type config in `src/main/webui/src/lib/content-types.ts` -- maps ContentType union to icon, colors, label
- `ContentItemSummary` interface in `src/main/webui/src/lib/content-types.ts` -- shared data shape for list items
- Content URL pattern: `/content/${contentType}s/${slug}`

### Content Type System
- `ContentType` = `'prompt' | 'skill' | 'agent' | 'workflow'` (string literal union, not enum)
- `CONTENT_TYPE_CONFIG` maps each type to: label, icon (Lucide component), borderColor (Tailwind class), iconColor (Tailwind class)

### Pagination Pattern (FEAT-005)
- shadcn/vue Pagination wraps reka-ui PaginationRoot; uses `total` + `items-per-page` (not page count directly)
- Trick: pass `total = totalPages * 10` and `items-per-page = 10` to derive correct page count
- Component uses zero-based pageIndex in props/events, converts to one-based for shadcn/vue Pagination

### shadcn/vue Components NOT Installed
- Breadcrumb, Toast/Sonner, Tooltip, Dialog, Popover, Select, Tabs
- Hand-rolled breadcrumb `<nav aria-label="Breadcrumb"><ol>` used in PromptDetailView, MyProfileView, AND ProfileView (3 instances now)

### Known Issues
- `vue-tsc` reports pre-existing errors in WelcomeView.vue and profile.spec.ts
- Pre-existing lint errors in eslint.config.ts and vite.config.ts (unused imports)
- Views use a single `error` ref for both fetch and action errors — can cause invisible errors
- `GET /api/profiles/me` does NOT return content counts (promptCount etc.) -- MyProfileView and ProfileView hardcode all to 0
- `defineExpose` used in some views for test access (PromptDetailView, CreatePromptView, EditPromptView), not all (ProfileView, MyProfileView)
- Route param not reactive in views -- if component reused across navigations, stale data possible
- CreatePromptView and EditPromptView have ~95% duplicated form template — watch for a third usage to extract shared PromptForm component

See [patterns.md](./patterns.md) for detailed component and styling patterns.

### Comments Feature (FEAT-012)
- `CommentsSection` organism in `src/main/webui/src/components/content/CommentsSection.vue` -- fetches, displays, and submits comments
- `getComments(slug)` and `createComment(slug, request)` in `src/main/webui/src/services/comments.ts` -- follows existing service pattern with `encodeURIComponent`
- `formatRelativeTime(isoDate, now?)` in `src/main/webui/src/lib/format.ts` -- hand-rolled relative time with injectable `now` for testability
- Form uses vee-validate + zod schema (toTypedSchema) + shadcn/vue FormField/FormItem/FormControl/FormMessage pattern
- Comments prepended via `unshift()` after submit; form reset via `form.resetForm()`
- `defineExpose` used in CommentsSection for test access -- should be removed in favor of DOM interaction in tests
- CommentsSection Storybook story only has Default variant and makes real API calls -- needs MSW or presentational extraction
