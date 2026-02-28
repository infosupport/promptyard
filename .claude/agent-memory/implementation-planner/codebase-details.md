# Codebase Details - Implementation Planner

## Key Configuration Files

- `src/main/webui/components.json`: shadcn-vue config (style: new-york, icon: lucide, base: slate)
- `src/main/webui/vite.config.ts`: tailwindcss plugin + vue plugin, `@` alias to `./src`
- `src/main/webui/vitest.config.ts`: two projects -- jsdom for unit tests, playwright/chromium for storybook tests
- `application.properties`: port 5000, Quinoa dev server 5173, OIDC web-app mode

## Router Pattern

- `src/main/webui/src/router/index.ts`: Vue Router 5, HTML5 history
- DefaultLayout wraps authenticated routes as children
- `beforeEach` guard fetches profile; redirects to `/welcome` if no profile
- Static routes must come before parameterized routes (e.g., `/content/prompts/new` before `prompts/:slug`)

## Service Layer Pattern

- Plain `fetch` calls, no axios
- TypeScript interfaces for request/response DTOs
- Throw `new Error(...)` on non-ok responses
- Located in `src/main/webui/src/services/`

## Form Pattern (WelcomeView reference)

- `useForm` from vee-validate + `toTypedSchema` from `@vee-validate/zod`
- `submitting` ref + `apiError` ref pattern for async submission
- `form.handleSubmit(async (values) => { ... })` wraps the submission logic
- `defineExpose({ form, onSubmit })` enables test access to form internals
- FormField with `v-slot="{ componentField }"` for standard inputs
- FormField with `v-slot="{ value, handleChange }"` for custom components (checkboxes, etc.)

## Test Pattern (WelcomeView reference)

- `vi.mock('vue-router')` with `useRouter`, `RouterLink` stub
- `vi.mock('@/services/...')` for service mocking
- `createPinia`/`setActivePinia` in `beforeEach`
- Access form via `wrapper.vm` after `defineExpose`
- `flushPromises()` after async operations

## shadcn/vue Components Available

avatar, badge, button, card, checkbox, dropdown-menu, form, input, label, separator

## Navigation

- `NavigationBar.vue` in `components/navigation/` with Search, CreateMenu, UserMenu
- `NavigationCreateMenu.vue` has dropdown with Prompt/Skill/Agent/Workflow items (currently non-functional)
- DefaultLayout wraps `<NavigationBar />` + `<RouterView />`

## Backend API (Content)

- `POST /api/content/prompts` -- accepts `SubmitPromptRequest { title, description, content, tags }`, returns 201 with `SubmitPromptResponse { slug }`
- Returns 404 if user profile not found
- `DELETE /api/content/prompts/{slug}` -- deletes prompt (owner check, returns 403 if not owner)
