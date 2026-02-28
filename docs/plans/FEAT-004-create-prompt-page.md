# Implementation Plan: Create Prompt Page

**Spec:** docs/specs/FEAT-004-create-prompt-page.md
**Created:** 2026-02-25
**Status:** Draft

## Summary

This feature adds a "Create Prompt" page at `/content/prompts/new` with a form containing title, description, Monaco editor for content, and an inline tag editor with chips. The form validates required fields (title, content, at least one tag) using vee-validate + zod, submits to the existing `POST /api/content/prompts` endpoint, and redirects to `/prompts/{slug}` on success. It includes unsaved-changes guards (both Vue Router and `beforeunload`) and a confirmation dialog for navigation away from dirty forms. This is a frontend-only feature -- no backend changes are needed.

## Key Design Decisions

1. **Use `@guolao/vue-monaco-editor` for the Monaco editor integration.** This package loads Monaco from a CDN by default, avoiding the need for Vite worker configuration plugins and keeping the bundle small. It supports Vue 3, provides a clean `<VueMonacoEditor>` component with `v-model` support, and has stable maintenance (v1.6.0, published 4 months ago). The alternative `monaco-editor-vue3` bundles Monaco from `node_modules` which requires complex Vite worker configuration via `vite-plugin-monaco-editor` -- unnecessary complexity for a Markdown-only editor.

2. **Build a custom `TagInput` component rather than using a third-party library.** The spec requires a specific UX: Enter to add, click X to remove, Backspace on empty input to remove last, duplicate prevention, and trimming. This is straightforward to implement as a single component using the existing `Badge` and `Input` shadcn/vue components, avoiding an external dependency for a focused interaction pattern. The component lives in `components/content/` since it is purpose-built for content authoring forms (not a generic UI primitive).

3. **Place the view at `src/main/webui/src/views/CreatePromptView.vue` and add the route under the `DefaultLayout` children.** This follows the existing pattern where views live in `views/` and are lazy-loaded by the router. The route `/content/prompts/new` is registered as a child of the `DefaultLayout` route so it inherits the navigation bar and the profile-check guard.

4. **Create a `prompts` service module at `src/main/webui/src/services/prompts.ts`.** Following the established pattern in `services/profiles.ts`, this module defines the `SubmitPromptRequest` and `SubmitPromptResponse` TypeScript interfaces and a `createPrompt()` function using plain `fetch`. No Pinia store is needed for this feature -- the form is ephemeral and the API call is a one-shot action triggered by form submission.

5. **Use shadcn/vue `AlertDialog` for the unsaved-changes confirmation.** The spec requires a confirmation dialog when navigating away from a dirty form (FR-013). The `AlertDialog` component from shadcn/vue is the correct choice for disruptive confirmations. It must be added via `npx shadcn-vue@latest add alert-dialog`. A `Textarea` component is also needed for the description field and must be added via `npx shadcn-vue@latest add textarea`.

6. **Implement unsaved-changes detection via vee-validate's `meta.dirty` flag.** The `useForm` composable tracks whether any field has been modified from its initial value. This `meta.dirty` flag drives both the Vue Router `beforeRouteLeave` guard and the `window.beforeunload` event handler, extracted into a reusable `useUnsavedChanges` composable.

7. **Wire the NavigationCreateMenu "Prompt" item to navigate to `/content/prompts/new`.** The existing `NavigationCreateMenu.vue` dropdown has a "Prompt" menu item that currently does nothing. It needs a `RouterLink` (or `router.push`) to the new route.

8. **Wrap the Monaco editor in a `MonacoEditor` component in `components/content/`.** This thin wrapper standardizes props (language, line numbers, theme), handles the `v-model` binding for vee-validate integration, and applies consistent styling (border, min-height, rounded corners). Isolating Monaco in its own component makes testing simpler -- tests for `CreatePromptView` can stub it.

## Implementation Steps

### Phase 1: Dependencies and New shadcn/vue Components

#### Step 1.1: Install `@guolao/vue-monaco-editor`

```bash
cd src/main/webui && pnpm add @guolao/vue-monaco-editor
```

No Vite plugin is needed -- the package loads Monaco from jsDelivr CDN by default. No changes to `vite.config.ts`.

#### Step 1.2: Add shadcn/vue `Textarea` component

```bash
cd src/main/webui && npx shadcn-vue@latest add textarea
```

This generates `src/main/webui/src/components/ui/textarea/Textarea.vue` and `index.ts`.

#### Step 1.3: Add shadcn/vue `AlertDialog` component

```bash
cd src/main/webui && npx shadcn-vue@latest add alert-dialog
```

This generates the AlertDialog component files in `src/main/webui/src/components/ui/alert-dialog/`.

### Phase 2: Service Layer

#### Step 2.1: Create `src/main/webui/src/services/prompts.ts`

Define the TypeScript interfaces matching the backend DTOs and the API call function:

```typescript
export interface SubmitPromptRequest {
  title: string
  description: string
  content: string
  tags: string[]
}

export interface SubmitPromptResponse {
  slug: string
}

export async function createPrompt(request: SubmitPromptRequest): Promise<SubmitPromptResponse> {
  const response = await fetch('/api/content/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to create prompt: ${response.status}`)
  }
  return response.json()
}
```

Note: The backend returns HTTP 201 Created with the `SubmitPromptResponse` body. It returns 404 when the user profile is not found. The service function throws on any non-ok response, and the view handles the error display.

### Phase 3: Reusable Components

#### Step 3.1: Create `src/main/webui/src/components/content/TagInput.vue`

Props and emits:

```
Props:
  modelValue: string[]    (required, v-model binding)
  placeholder?: string    (default: "Add a tag and press Enter")
  disabled?: boolean      (default: false)

Emits:
  update:modelValue(tags: string[])
```

Behavior:
- Renders a container styled like an input field (border, rounded, padding) containing Badge chips for each tag and an embedded text `<input>`.
- On Enter (or comma) keydown in the text input: trim the input value, check for duplicates (case-insensitive), and if valid, emit a new array with the tag appended. Clear the text input.
- Each Badge chip has an X button (using the `X` icon from lucide-vue-next). Clicking it emits a new array with that tag removed.
- On Backspace keydown when the text input is empty: remove the last tag from the array.
- The text input gets focus when clicking anywhere in the container.
- When `disabled` is true, the input and remove buttons are disabled.
- Tags are converted to lowercase before adding (consistent with how tags are typically used).

Accessibility (NFR-002, NFR-003):
- The container has `role="group"` and an `aria-label="Tags"`.
- The text input has an `aria-label` matching the placeholder.
- Each remove button has `aria-label="Remove tag {name}"`.
- Full keyboard operability: Tab into the input, Enter to add, Backspace to remove last.

#### Step 3.2: Create `src/main/webui/src/components/content/MonacoEditor.vue`

A thin wrapper around `@guolao/vue-monaco-editor`:

```
Props:
  modelValue: string      (required, v-model binding)
  language?: string       (default: "markdown")
  disabled?: boolean      (default: false)

Emits:
  update:modelValue(value: string)
```

Implementation:
- Import `VueMonacoEditor` from `@guolao/vue-monaco-editor` (the component is registered directly, no global plugin install needed).
- Pass through the `modelValue` / `update:modelValue` to the editor's `value` / `@change` (or its `v-model` equivalent).
- Configure editor options: `{ lineNumbers: 'on', minimap: { enabled: false }, wordWrap: 'on', scrollBeyondLastLine: false, automaticLayout: true, fontSize: 14 }`.
- Apply a fixed `min-h-[300px]` and `border rounded-md overflow-hidden` to the wrapper div for consistent styling with the rest of the form.
- Set `readOnly` option when `disabled` is true.

Note: The `@guolao/vue-monaco-editor` package loads Monaco from CDN. No worker configuration or Vite plugin is required. The editor initializes asynchronously; the component should show a minimal loading placeholder (e.g., a div with `bg-muted` and "Loading editor..." text) while Monaco loads, using the `loading` slot provided by the package.

#### Step 3.3: Update `src/main/webui/src/components/content/index.ts`

Add exports for the new components:

```typescript
export { default as ContentItemCard } from './ContentItemCard.vue'
export { default as AuthorCard } from './AuthorCard.vue'
export { default as TagInput } from './TagInput.vue'
export { default as MonacoEditor } from './MonacoEditor.vue'
```

### Phase 4: Unsaved Changes Composable

#### Step 4.1: Create `src/main/webui/src/composables/useUnsavedChanges.ts`

A composable that takes a `isDirty: Ref<boolean>` or `ComputedRef<boolean>` and:

1. Registers a Vue Router `onBeforeRouteLeave` guard that, when `isDirty` is true, sets a reactive `showDialog` ref to `true` and returns `false` to block navigation. When `isDirty` is false, allows navigation immediately.
2. Registers a `window.beforeunload` event listener (via `onMounted`/`onUnmounted` or `@vueuse/core`'s `useEventListener`) that calls `event.preventDefault()` when `isDirty` is true (EC-6: browser's native warning).
3. Exposes `{ showDialog, confirmLeave, cancelLeave }`:
   - `showDialog`: boolean ref controlling AlertDialog visibility.
   - `confirmLeave`: function that sets `showDialog` to false and programmatically navigates to the stored pending route.
   - `cancelLeave`: function that sets `showDialog` to false (user stays on the form).

The pending route is stored in a ref when the `onBeforeRouteLeave` guard fires. On `confirmLeave`, the composable calls `router.push(pendingRoute)`.

### Phase 5: Create Prompt View

#### Step 5.1: Create `src/main/webui/src/views/CreatePromptView.vue`

Structure: `<script setup lang="ts">` + `<template>`.

**Script setup:**
- Import and use `useForm` from vee-validate with a zod schema:
  ```
  z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().default(''),
    content: z.string().min(1, 'Content is required'),
    tags: z.array(z.string()).min(1, 'At least one tag is required'),
  })
  ```
- Initial values: `{ title: '', description: '', content: '', tags: [] }`.
- `submitting` ref (boolean) for submit button disabled state (FR-014).
- `apiError` ref (string) for error display (FR-010).
- Import `createPrompt` from `@/services/prompts`.
- Import `useRouter` and `useRoute` for navigation.
- Import `useUnsavedChanges` composable, pass `form.meta.value.dirty` (wrapped in computed).
- On submit (`form.handleSubmit`):
  1. Set `submitting` to true, clear `apiError`.
  2. Call `createPrompt({ title, description: description || '', content, tags })`.
  3. On success: `router.push({ name: 'prompt-detail', params: { slug: response.slug } })`.
  4. On error: If the response status was 404, set `apiError` to the profile-not-found message (EC-4). Otherwise, set a generic error message.
  5. Set `submitting` to false in `finally`.
- `onCancel` function: if `form.meta.value.dirty`, trigger the unsaved changes dialog; otherwise, `router.back()` (or `router.push('/')` if no history).
- `defineExpose({ form, onSubmit })` for testing access.

**Template:**

```html
<div class="mx-auto max-w-3xl">
  <div class="mb-6">
    <h1 class="text-2xl font-bold tracking-tight">Create Prompt</h1>
    <p class="text-muted-foreground mt-1">Write and publish a new prompt.</p>
  </div>

  <form @submit="onSubmit" class="space-y-6">
    <!-- Title (FR-002) -->
    <FormField v-slot="{ componentField }" name="title">
      <FormItem>
        <FormLabel>Title</FormLabel>
        <FormControl>
          <Input type="text" placeholder="e.g. Code Review Checklist" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Description (FR-003) -->
    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>Description</FormLabel>
        <FormControl>
          <Textarea placeholder="A short description of what this prompt does" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Content - Monaco Editor (FR-004, FR-005) -->
    <FormField v-slot="{ value, handleChange }" name="content">
      <FormItem>
        <FormLabel>Content</FormLabel>
        <FormControl>
          <MonacoEditor :model-value="value" @update:model-value="handleChange" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Tags (FR-006, FR-007) -->
    <FormField v-slot="{ value, handleChange }" name="tags">
      <FormItem>
        <FormLabel>Tags</FormLabel>
        <FormControl>
          <TagInput :model-value="value" @update:model-value="handleChange" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Error message (FR-010) -->
    <p v-if="apiError" class="text-sm text-destructive" role="alert">{{ apiError }}</p>

    <!-- Buttons (FR-011, FR-014) -->
    <div class="flex items-center gap-3">
      <Button type="submit" :disabled="submitting">
        {{ submitting ? 'Saving...' : 'Save' }}
      </Button>
      <Button type="button" variant="outline" @click="onCancel" :disabled="submitting">
        Cancel
      </Button>
    </div>
  </form>

  <!-- Unsaved changes dialog (FR-013) -->
  <AlertDialog :open="showDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
        <AlertDialogDescription>
          You have unsaved changes. Are you sure you want to leave this page?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelLeave">Stay</AlertDialogCancel>
        <AlertDialogAction @click="confirmLeave">Discard</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
```

### Phase 6: Routing and Navigation

#### Step 6.1: Add route in `src/main/webui/src/router/index.ts`

Add a new child route under the `DefaultLayout` route, before the `prompts/:slug` route (so the static path `/content/prompts/new` takes precedence over any potential catch-all):

```typescript
{
  path: 'content/prompts/new',
  name: 'create-prompt',
  component: () => import('@/views/CreatePromptView.vue'),
},
```

The route is inside the DefaultLayout children array, so it inherits the navigation bar and the profile-check `beforeEach` guard.

#### Step 6.2: Update `src/main/webui/src/components/navigation/NavigationCreateMenu.vue`

Wire the "Prompt" dropdown item to navigate to the create prompt route. Change the Prompt `DropdownMenuItem` to include a `RouterLink`:

```html
<DropdownMenuItem as-child>
  <RouterLink to="/content/prompts/new">
    <FileText class="mr-2 h-4 w-4" />
    Prompt
  </RouterLink>
</DropdownMenuItem>
```

Only the Prompt item gets a link for now; the other content types (Skill, Agent, Workflow) remain non-functional placeholders.

### Phase 7: Tests

#### Step 7.1: Create `src/main/webui/src/services/__tests__/prompts.spec.ts`

Test the `createPrompt` service function:

- **Success case**: Mock `fetch` to return a 201 response with `{ slug: 'my-prompt' }`. Assert the function returns the slug and that `fetch` was called with the correct URL, method, headers, and body.
- **Failure case**: Mock `fetch` to return a 500 response. Assert the function throws an error.
- **404 case**: Mock `fetch` to return a 404 response. Assert the function throws (the view distinguishes error types).

Use `vi.stubGlobal('fetch', vi.fn())` for mocking.

#### Step 7.2: Create `src/main/webui/src/components/content/__tests__/TagInput.spec.ts`

Test cases:

- **SC-006: Adding a tag**: Mount with empty `modelValue`. Simulate typing "kotlin" and pressing Enter. Assert `update:modelValue` emitted with `['kotlin']`.
- **SC-007: Removing a tag**: Mount with `modelValue: ['kotlin', 'review']`. Click the remove button on "kotlin". Assert emitted value is `['review']`.
- **Duplicate prevention (EC-2)**: Mount with `modelValue: ['kotlin']`. Type "kotlin" and press Enter. Assert no emit (or emitted with same array).
- **Trimming (EC-3)**: Type "  kotlin  " and press Enter. Assert emitted tag is `'kotlin'` (trimmed).
- **Backspace removes last (NFR-003)**: Mount with `modelValue: ['kotlin', 'review']`. Press Backspace on empty input. Assert emitted value is `['kotlin']`.
- **Empty input Enter does nothing**: Press Enter with empty input. Assert no emit.
- **Renders chips for each tag**: Mount with `modelValue: ['a', 'b', 'c']`. Assert three Badge elements rendered with correct text.
- **Disabled state**: Mount with `disabled: true`. Assert input is disabled and remove buttons are not rendered (or disabled).

#### Step 7.3: Create `src/main/webui/src/composables/__tests__/useUnsavedChanges.spec.ts`

Test the composable in isolation:

- **Clean form allows navigation**: Call with `isDirty = ref(false)`. Simulate `onBeforeRouteLeave`. Assert navigation is not blocked.
- **Dirty form blocks navigation and shows dialog**: Call with `isDirty = ref(true)`. Simulate `onBeforeRouteLeave`. Assert `showDialog` is true.
- **confirmLeave navigates away**: After blocking, call `confirmLeave()`. Assert `router.push` was called with the pending route.
- **cancelLeave closes dialog**: After blocking, call `cancelLeave()`. Assert `showDialog` is false.
- **beforeunload fires when dirty**: Call with `isDirty = ref(true)`. Simulate `beforeunload` event. Assert `event.preventDefault()` was called.

Note: Testing `onBeforeRouteLeave` in isolation requires either mocking `vue-router` or using a test helper. Given the project's test patterns, mock `vue-router` as done in WelcomeView.spec.ts and use `vi.mock` for `onBeforeRouteLeave`.

#### Step 7.4: Create `src/main/webui/src/views/__tests__/CreatePromptView.spec.ts`

Test the view (following the WelcomeView.spec.ts pattern):

Setup:
- `vi.mock('vue-router')` providing `useRouter` (with `mockPush`, `mockBack`), `useRoute`, `onBeforeRouteLeave`, and `RouterLink` stub.
- `vi.mock('@/services/prompts')` providing `createPrompt`.
- Stub `MonacoEditor` as a `<textarea>` to avoid loading the real Monaco in tests.
- `createPinia`/`setActivePinia` in `beforeEach`.

Test cases:

- **SC-001: Successful prompt creation**: Set form values (title, content, tags via exposed `form.setFieldValue`), call `onSubmit`, assert `createPrompt` was called with correct payload, assert `router.push` was called with `{ name: 'prompt-detail', params: { slug } }`.
- **SC-002: Submission with description**: Set all fields including description. Submit. Assert description is included in the request body.
- **SC-003: Submission without description**: Set title, content, tags but leave description empty. Submit. Assert description is `''` in the request body.
- **SC-004: Validation prevents empty required fields**: Submit without setting any fields. Assert `createPrompt` was NOT called. Assert validation errors are shown.
- **SC-008: Submission failure shows error**: Mock `createPrompt` to reject. Submit. Assert error message is displayed and `router.push` was NOT called.
- **SC-009: Submit button disabled during submission**: Assert the submit button has `:disabled` while submitting (can check button text changes to "Saving...").
- **Renders form fields**: Assert the form contains title input, description textarea, Monaco editor (stubbed), tag input, Save button, and Cancel button.

### Phase 8: Storybook Stories

#### Step 8.1: Create `src/main/webui/src/components/content/TagInput.stories.ts`

Stories:
- **Empty**: No tags, showing placeholder text.
- **WithTags**: Pre-populated with 3-4 tags.
- **ManyTags**: 10+ tags to demonstrate wrapping behavior.
- **Disabled**: Tags present but interaction disabled.

Meta:
```typescript
const meta = {
  title: 'Content/TagInput',
  component: TagInput,
  tags: ['autodocs'],
} satisfies Meta<typeof TagInput>
```

#### Step 8.2: Create `src/main/webui/src/components/content/MonacoEditor.stories.ts`

Stories:
- **Default**: Empty editor with Markdown language.
- **WithContent**: Pre-filled with sample Markdown content.
- **Disabled**: Read-only editor with content.

Meta:
```typescript
const meta = {
  title: 'Content/MonacoEditor',
  component: MonacoEditor,
  tags: ['autodocs'],
} satisfies Meta<typeof MonacoEditor>
```

## File Inventory

### New Files

- `src/main/webui/src/services/prompts.ts` -- API service for prompt creation
- `src/main/webui/src/components/content/TagInput.vue` -- Inline tag editor component with chips
- `src/main/webui/src/components/content/MonacoEditor.vue` -- Thin wrapper around Vue Monaco editor
- `src/main/webui/src/composables/useUnsavedChanges.ts` -- Composable for dirty-form navigation guards
- `src/main/webui/src/views/CreatePromptView.vue` -- The Create Prompt page view
- `src/main/webui/src/services/__tests__/prompts.spec.ts` -- Service unit tests
- `src/main/webui/src/components/content/__tests__/TagInput.spec.ts` -- TagInput component tests
- `src/main/webui/src/composables/__tests__/useUnsavedChanges.spec.ts` -- Composable tests
- `src/main/webui/src/views/__tests__/CreatePromptView.spec.ts` -- View integration tests
- `src/main/webui/src/components/content/TagInput.stories.ts` -- Storybook stories for TagInput
- `src/main/webui/src/components/content/MonacoEditor.stories.ts` -- Storybook stories for MonacoEditor

### Generated Files (via shadcn/vue CLI)

- `src/main/webui/src/components/ui/textarea/Textarea.vue` -- shadcn/vue Textarea component
- `src/main/webui/src/components/ui/textarea/index.ts` -- Textarea barrel export
- `src/main/webui/src/components/ui/alert-dialog/AlertDialog.vue` -- shadcn/vue AlertDialog (and related sub-components)
- `src/main/webui/src/components/ui/alert-dialog/index.ts` -- AlertDialog barrel export

### Modified Files

- `src/main/webui/src/components/content/index.ts` -- Add TagInput and MonacoEditor exports
- `src/main/webui/src/router/index.ts` -- Add `/content/prompts/new` route
- `src/main/webui/src/components/navigation/NavigationCreateMenu.vue` -- Wire Prompt menu item to route
- `src/main/webui/package.json` -- New dependency `@guolao/vue-monaco-editor`

## Testing Strategy

### Service Layer (`prompts.spec.ts`)
- Mock `fetch` globally with `vi.stubGlobal`.
- Test success (201), not-found (404), and server error (500) responses.
- Verify request shape matches `SubmitPromptRequest` contract.

### TagInput Component (`TagInput.spec.ts`)
- Mount with `@vue/test-utils`, pass `modelValue` as prop.
- Use `trigger('keydown', { key: 'Enter' })` for adding tags.
- Use `trigger('keydown', { key: 'Backspace' })` for removing last.
- Assert emitted events via `wrapper.emitted('update:modelValue')`.
- No router or service mocks needed -- pure presentational component.

### MonacoEditor Component
- Tested visually via Storybook only. Unit testing Monaco in jsdom is unreliable because Monaco requires a real DOM with layout capabilities. The MonacoEditor wrapper is thin enough that visual verification is sufficient.

### Unsaved Changes Composable (`useUnsavedChanges.spec.ts`)
- Mock `vue-router`'s `onBeforeRouteLeave` and `useRouter`.
- Test the guard callback logic in isolation.
- Use `vi.spyOn(window, 'addEventListener')` for `beforeunload` testing.

### CreatePromptView (`CreatePromptView.spec.ts`)
- Follow the WelcomeView.spec.ts pattern: mock router, mock service, stub heavy components (MonacoEditor).
- Access form programmatically via `defineExpose` / `wrapper.vm` for setting field values.
- Test form submission, validation, error display, and button states.

### Storybook Visual Tests
- TagInput and MonacoEditor stories provide visual regression coverage.
- The Storybook vitest project (already configured in `vitest.config.ts`) will run interaction tests if defined.

## Migration Notes

- No database migrations required.
- No backend changes required. The `POST /api/content/prompts` endpoint already exists and accepts the exact payload this form sends.
- New npm dependency: `@guolao/vue-monaco-editor`. This package loads Monaco editor from jsDelivr CDN at runtime. In environments without internet access (air-gapped), a self-hosted CDN configuration would be needed via the package's `cdnBase` option -- but this is not a concern for the current deployment.
- New shadcn/vue components (Textarea, AlertDialog) are generated into the project source and have no external runtime dependencies beyond the existing `reka-ui` and `class-variance-authority`.
- The stub `PromptDetailView` at `/prompts/:slug` already exists in the router. The post-creation redirect (FR-009) navigates there. The full prompt detail page is a separate feature.
- The `NavigationCreateMenu` "Prompt" item becomes functional. The other content type items (Skill, Agent, Workflow) remain non-functional placeholders until their create pages are built.
- No feature flags needed. The page is only accessible via direct URL or the navigation menu, both of which require authentication (enforced by the existing router guard and backend `@Authenticated` policy).
