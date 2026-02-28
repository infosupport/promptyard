# Implementation Planner - Agent Memory

## Project Structure

- **Backend package**: `com.infosupport.promptyard` (NOT `com.github.wmeints.promptyard` despite ADR007 mentioning the old path)
- **Modules**: `profiles/`, `content/` under `src/main/kotlin/com/infosupport/promptyard/`
- **Flyway migrations**: `V1` (user_profile), `V2` (content_item), `V3` (privacy_accepted_at) -- next is `V4`
- **Frontend**: `src/main/webui/src/` with pnpm

## Backend Patterns

- Entities: JPA `@Entity` with manual `@Id`/`@GeneratedValue(IDENTITY)`, no Panache active record
- Repos: `PanacheRepository<T>` with `@ApplicationScoped`
- Resources: `@Path("/api/...")`, `@Inject` for DI, `@Transactional` on mutating methods
- DTOs: `@Serializable` (kotlinx.serialization), data classes
- Security: `SecurityIdentity` injected, `identity.principal.name` for subject, `identity.attributes["name"]` and `identity.attributes["email"]` for claims
- No `@Authenticated` annotation on individual methods -- global auth policy in `application.properties`
- Slug generators: `@ApplicationScoped` beans injecting the repo

## Frontend Patterns

- shadcn/vue components in `src/components/ui/` -- currently has: button, input, avatar, dropdown-menu, separator, card, checkbox, form, label, badge, textarea, alert-dialog
- shadcn/vue style: "new-york", icon library: "lucide", base color: "slate"
- `components.json` aliases: `@/components`, `@/lib`, `@/composables`, `@/components/ui`
- Services layer in `src/services/` with plain fetch calls (no axios)
- Pinia 3 with composition API (`defineStore('name', () => {...})`)
- Router: Vue Router 5, HTML5 history, layout pattern via nested routes
- `DefaultLayout.vue` wraps routes with nav bar; routes outside it have no nav bar
- Domain component directories: `components/navigation/` (with barrel index.ts), `components/content/` (with barrel index.ts), `components/profiles/` (with barrel index.ts)
- `lib/utils.ts` has `cn()` (clsx + twMerge), `lib/format.ts` has `getInitials()` and `formatMemberSince()`
- `lib/content-types.ts` has `ContentType` union, `CONTENT_TYPES` array, `CONTENT_TYPE_CONFIG` map
- `composables/useTagOverflow.ts` for tag overflow measurement
- `@vueuse/core` is installed (available for composables)
- `lucide-vue-next` ^0.575.0 is installed
- `zod` and `@vee-validate/zod` are installed
- CSS: Tailwind 4 with `@theme inline`, oklch color tokens, tw-animate-css

## Test Patterns

- Backend: `@QuarkusTest`, `@TestSecurity(user=..., attributes=[...])`, REST Assured Kotlin extensions
- `TestObjectFactory`: CDI `@ApplicationScoped` bean in `content` package, `@Transactional` methods
- Cleanup: `@AfterEach @Transactional` deleting from repos
- Frontend: Vitest 4, `@vue/test-utils`, jsdom environment
- Frontend test patterns: `vi.mock('vue-router')` with RouterLink stub, `vi.mock('@/services/...')`, `createPinia`/`setActivePinia` in `beforeEach`
- Frontend test location: `__tests__/` co-located with source (e.g., `components/content/__tests__/`, `lib/__tests__/`, `stores/__tests__/`)
- Storybook 10 with `@storybook/vue3-vite`, stories co-located as `*.stories.ts`
- Story meta uses `satisfies Meta<typeof Component>`, stories export as `StoryObj<typeof meta>`
- Story title convention: `'Domain/ComponentName'` (e.g., `'Content/ContentItemCard'`)

## Key Files (see [details](codebase-details.md))

- `application.properties`: port 5000, Quinoa on 5173, global auth policy, OIDC web-app mode
- Plans go in `docs/plans/`, specs in `docs/specs/`
- Plan numbering: FEAT-001, FEAT-002, FEAT-003...

## Lessons Learned

- `getInitials` in `lib/format.ts` originally took first-two-word initials. FEAT-003 required changing to first+last. Always check utility function behavior against spec requirements before assuming reuse.
- The shadcn/vue Avatar component defaults to `rounded-full`. Override to `rounded-lg` for rounded-square shapes.
- ContentItemCard test uses `global.stubs` with inline RouterLink stub rather than `vi.mock('vue-router')`.
- shadcn/vue Pagination component uses one-based page numbering; convert to/from zero-based at component boundary when the spec uses zero-based indexing.
- shadcn/vue Pagination accepts `total` (item count) and `items-per-page` -- to use it with a known `totalPages`, pass `total = totalPages * N` and `items-per-page = N`.
- Content barrel (`components/content/index.ts`) exports: ContentItemCard, TagInput, MonacoEditor. Internal sub-components (like skeletons) should NOT be exported.
- For vee-validate custom components (non-standard inputs): use `v-slot="{ value, handleChange }"` instead of `v-slot="{ componentField }"`. This applies to TagInput, MonacoEditor, Checkbox, etc.
- `defineExpose({ form, onSubmit })` is the established pattern for testing views with forms -- enables `wrapper.vm` access to set field values and trigger submission programmatically.
- `NavigationCreateMenu.vue` menu items are currently non-functional. Wire them via `as-child` + `RouterLink` as create pages are built.
- For Monaco editor in Vue: prefer `@guolao/vue-monaco-editor` (CDN-loaded) over `monaco-editor-vue3` (bundled) to avoid Vite worker configuration complexity.
- `ContentItem` entity has a lazy `@ManyToOne` `author` relation to `UserProfile` — accessible in GET endpoints without extra joins.
- `PromptsResource` handles all prompt-specific endpoints (POST, DELETE, and now GET for detail).
- `ContentItemRepository.findBySlug` returns `ContentItem?` — must check `contentType` before casting to `Prompt`.
- `AuthorCard` component props: `fullName`, `jobTitle?`, `promptCount`, `skillCount`, `agentCount`, `workflowCount`, `profileUrl` — note `profileUrl` is a string path, not a route object.
- No shadcn/vue Breadcrumb installed — custom breadcrumb with `<nav aria-label="Breadcrumb"><ol>` was used for FEAT-005 to avoid overhead for simple usage.
- `CONTENT_TYPE_CONFIG` color classes (blue-500, amber-500, violet-500, emerald-500) can be reused outside ContentItemCard for consistent per-type coloring (e.g., stat counters in profile cards).
- `AuthorCard` lives in `components/profiles/`, not `components/content/` (corrected from FEAT-003 plan which originally placed it in content).
- `MyContentPageResponse`/`MyContentItemResponse` DTOs are generic enough to reuse for any user's content listing -- the "My" prefix is about response shape, not access semantics. Avoid creating duplicate DTOs.
- `ContentItemRepository.findPagedByAuthorId(authorId, pageIndex)` already sorts by `createdAt DESC` with page size 12 -- reusable for any profile's content endpoint.
- Composable pattern: `useMyContent` fetches on mount via `onMounted`, returns `{ items, pageIndex, totalPages, loading, error, fetchPage }`. New composables for similar data should follow this shape.
- Router route ordering matters: static routes (`profiles/me`) must precede parameterized routes (`profiles/:slug`) to avoid the static segment being captured as a param.
- View test pattern for data-fetching views: mock services + composables, use stub components with `data-testid`, verify prop passing via `findComponent({ name: '...' }).props('...')`.
- `useUnsavedChanges` composable handles both route-leave (`onBeforeRouteLeave`) and browser-close (`beforeunload`). Returns `{ showDialog, confirmLeave, cancelLeave, bypass }`. `bypass()` must be called before programmatic navigation on successful save.
- `AppBreadcrumb` renders segments with implicit "Promptyard" as first item linking to `/` -- no, it does NOT add Promptyard implicitly. Segments must include it explicitly: `[{ label: 'Promptyard', to: '/' }, ...]`.
- `useProfileStore.fetchProfile()` is cached (skips if `loaded` is true). For post-save refresh, a separate `refreshProfile()` method is needed that ignores the `loaded` flag.
- `TestObjectFactory.createUserProfile` accepts optional `jobTitle` parameter (added for business unit testing). No `businessUnit` param yet -- add if needed.
- kotlinx.serialization ignores unknown JSON keys by default, so removing fields from a request DTO is backwards-compatible with clients that still send those fields.
