# Frontend Developer Memory

## Project Structure
- Content components: `src/main/webui/src/components/content/`
- Profile components: `src/main/webui/src/components/profiles/`
- Barrel exports: each component directory has an `index.ts` re-exporting components
- AuthorCard is in `profiles/`, not `content/` (despite plan references)

## Component Patterns
- Props use `defineProps<{...}>()` with `withDefaults()` for defaults
- Emits use `defineEmits<{...}>()` with tuple syntax: `'update:modelValue': [value: string]`
- Stories follow pattern: `Meta<typeof Component>` with `satisfies`, `tags: ['autodocs']`
- Story titles use domain prefix: `Content/ComponentName`, `Profiles/ComponentName`

## @guolao/vue-monaco-editor API
- Uses `value` / `update:value` (NOT `modelValue` / `update:modelValue`)
- `@change` event fires with `(value: string | undefined, event)`
- Default slot is used for loading placeholder; `failure` slot for load failure
- No Vite plugin needed -- loads Monaco from CDN

## Pre-existing Issues
- Type errors in `WelcomeView.vue` (boolean vs true) and `profile.spec.ts` (missing `privacyAcceptedAt`) -- not related to content components

## Testing Patterns
- View tests: mock `vue-router` (useRouter, useRoute, onBeforeRouteLeave, RouterLink stub), mock services
- Access form via `defineExpose({ form, onSubmit })` then `wrapper.vm` cast to typed interface
- Use `form.setFieldValue()` + `flushPromises()` to set values, then call `onSubmit()` directly
- For testing intermediate "submitting" state: use a deferred promise in mock, wait for mock to be called, then `nextTick()` to let Vue re-render before checking DOM
- Stub MonacoEditor as a simple `<textarea>` in view tests to avoid loading real Monaco
- Run all tests: `pnpm test:unit` (includes Storybook tests via vitest addon)
- Run specific test: `pnpm vitest run src/path/to/file.spec.ts`
- No `--project unit` filter needed; use default `pnpm test:unit`

## Router
- Routes are children of DefaultLayout at `/`
- Static routes (e.g., `content/prompts/new`) must be placed BEFORE parameterized routes (e.g., `prompts/:slug`)
- Route names: kebab-case (e.g., `create-prompt`, `prompt-detail`)
- Navigation menu wiring: use `as-child` pattern on DropdownMenuItem with RouterLink inside

## Tooling
- Lint: `pnpm lint` runs oxlint then eslint (both with --fix)
- Type check: `pnpm run type-check` (vue-tsc --build)
- Package manager: pnpm
