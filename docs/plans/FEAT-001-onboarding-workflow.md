# Implementation Plan: Onboarding Workflow

**Spec:** docs/specs/FEAT-001-onboarding-workflow.md
**Created:** 2026-02-24
**Status:** Draft

## Summary

This feature adds automatic profile detection and an onboarding flow for new users. After OIDC authentication, the frontend checks whether a profile exists via `GET /api/profiles/me`. If not, a Vue Router navigation guard redirects the user to `/welcome`, where they complete a form (optional job title and business unit, mandatory privacy acceptance). The backend `POST /api/profiles` endpoint is extended to require and record privacy acceptance. A Pinia profile store caches the profile check result to avoid redundant API calls.

## Key Design Decisions

1. **Profile state lives in a Pinia store, consumed directly by components that need it.** The current `DefaultLayout.vue` calls `getCurrentProfile()` in `onMounted` and passes user data as props through `NavigationBar` down to `NavigationUserMenu`. This prop-drilling chain is replaced with a `useProfileStore` Pinia store that is the single source of truth for the current user's profile. The store is initialized once (in the router guard) and consumed directly by any component that needs profile data — including `NavigationBar` and `NavigationUserMenu`, which read from the store instead of receiving props. This satisfies NFR-003 (caching), eliminates prop drilling, and avoids duplicating the API call.

2. **Route guard on the router instance, not per-route meta.** A global `beforeEach` guard on the Vue Router checks the profile store. If the profile is not loaded, it fetches it. If the fetch returns null (404), it redirects to `/welcome`. This is simpler and more maintainable than adding `meta.requiresProfile` to every route, and it matches FR-003 (block all pages except `/welcome`).

3. **The `/welcome` route uses a separate blank layout (no navigation bar).** New users do not have a profile yet, so the navigation bar (which displays user name and email from the profile) would show empty data. The welcome page uses a minimal layout without the navigation bar. This is implemented by placing the `/welcome` route outside the `DefaultLayout` route group.

4. **Extend the existing `POST /api/profiles` endpoint rather than creating a new one.** The spec explicitly requires backward compatibility of this endpoint. The `OnboardUserRequest` DTO gains a `privacyAccepted: Boolean` field with a default of `false`. The resource method validates this field and sets `privacyAcceptedAt` on the entity when true.

5. **`privacyAcceptedAt` is a non-nullable `Instant` on the entity, but nullable in the database column.** Existing profiles (created before this migration) will have `NULL` for `privacy_accepted_at`. The entity field is typed as `Instant?` (nullable) to accommodate this. New profiles always have it set. The `UserProfileResponse` DTO exposes `privacyAcceptedAt` as an optional string.

6. **The `TestObjectFactory.createUserProfile` method gains an optional `privacyAcceptedAt` parameter.** This keeps existing tests working without modification while allowing new tests to set the privacy timestamp.

7. **shadcn/vue Form, Checkbox, Card, and Label components must be added.** The project currently has Button, Input, Avatar, DropdownMenu, and Separator. The onboarding page needs Form (vee-validate integration), Checkbox, Card (for the form container), and Label. These are added via the `npx shadcn-vue@latest add` CLI. The `zod` and `@vee-validate/zod` packages must also be installed.

## Implementation Steps

### Phase 1: Database & Backend Model

#### Step 1.1: Add Flyway migration for `privacy_accepted_at` column

Create `src/main/resources/db/migration/V3__AddPrivacyAcceptedAtToUserProfile.sql`:

```sql
ALTER TABLE user_profile
    ADD COLUMN privacy_accepted_at TIMESTAMP WITHOUT TIME ZONE;
```

The column is nullable because existing profiles do not have a privacy acceptance timestamp.

#### Step 1.2: Add `privacyAcceptedAt` field to `UserProfile` entity

In `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfile.kt`, add:

```kotlin
@Column(name = "privacy_accepted_at", nullable = true, columnDefinition = "timestamp")
var privacyAcceptedAt: Instant? = null
```

#### Step 1.3: Add `privacyAccepted` field to `OnboardUserRequest` DTO

In `src/main/kotlin/com/infosupport/promptyard/profiles/OnboardUserRequest.kt`, add the boolean field:

```kotlin
@Serializable
data class OnboardUserRequest(
    val jobTitle: String? = null,
    val businessUnit: String? = null,
    val privacyAccepted: Boolean = false
)
```

The default value of `false` ensures backward compatibility -- existing callers that omit the field will get a 400 response from the validation in the resource.

#### Step 1.4: Add `privacyAcceptedAt` to `UserProfileResponse` DTO

In `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfileResponse.kt`, add the field:

```kotlin
val privacyAcceptedAt: String? = null
```

### Phase 2: API Layer

#### Step 2.1: Update `UserProfilesResource.onboardUser` to validate and record privacy acceptance

In `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfilesResource.kt`, modify the `onboardUser` method:

- Before creating a new profile, check that `request.privacyAccepted` is `true`. If not, return `400 Bad Request` with an error message body.
- When creating the profile entity, set `privacyAcceptedAt = Instant.now()`.

The idempotent behavior for existing profiles (returning 200) remains unchanged -- that path does not re-validate privacy acceptance.

```kotlin
if (!request.privacyAccepted) {
    return Response.status(Response.Status.BAD_REQUEST)
        .entity(mapOf("error" to "Privacy statement must be accepted"))
        .build()
}

val profile = UserProfile().apply {
    // ...existing fields...
    this.privacyAcceptedAt = Instant.now()
}
```

#### Step 2.2: Update `UserProfilesResource.getCurrentUserProfile` to include `privacyAcceptedAt`

In the `getCurrentUserProfile` and `getUserProfile` methods, include `privacyAcceptedAt` in the `UserProfileResponse`:

```kotlin
privacyAcceptedAt = profile.privacyAcceptedAt?.toString()
```

#### Step 2.3: Ensure `updateCurrentUserProfile` does NOT modify `privacyAcceptedAt`

Verify that the `PUT /me` method does not touch the `privacyAcceptedAt` field. The current implementation only updates `fullName`, `emailAddress`, `jobTitle`, and `businessUnit`, so no change is needed -- but this invariant should be covered by a test (see Phase 4).

### Phase 3: Frontend

#### Step 3.1: Install required shadcn/vue components and dependencies

Run from `src/main/webui/`:

```bash
pnpm add zod @vee-validate/zod
npx shadcn-vue@latest add form checkbox card label
```

This adds the Form, Checkbox, Card, and Label components to `src/main/webui/src/components/ui/` and installs `zod` and `@vee-validate/zod` as dependencies.

#### Step 3.2: Create `useProfileStore` Pinia store

Create `src/main/webui/src/stores/profile.ts`:

```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentProfile, type UserProfile } from '@/services/profiles'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null)
  const loaded = ref(false)
  const error = ref(false)

  async function fetchProfile() {
    if (loaded.value) return
    try {
      profile.value = await getCurrentProfile()
      error.value = false
    } catch {
      error.value = true
    } finally {
      loaded.value = true
    }
  }

  function setProfile(p: UserProfile) {
    profile.value = p
    loaded.value = true
    error.value = false
  }

  function $reset() {
    profile.value = null
    loaded.value = false
    error.value = false
  }

  return { profile, loaded, error, fetchProfile, setProfile, $reset }
})
```

Key behavior:
- `fetchProfile()` is idempotent: it only calls the API if `loaded` is `false`.
- `error` tracks whether the API call failed (network error or 5xx), which is distinct from a 404 (profile is `null` but `error` is `false`).
- `setProfile()` is called after successful onboarding to update the store without an extra API call.

#### Step 3.3: Add `createProfile` function to the profiles service

In `src/main/webui/src/services/profiles.ts`, add:

```typescript
export interface CreateProfileRequest {
  jobTitle?: string | null
  businessUnit?: string | null
  privacyAccepted: boolean
}

export interface CreateProfileResponse {
  slug: string
}

export async function createProfile(request: CreateProfileRequest): Promise<CreateProfileResponse> {
  const response = await fetch('/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to create profile: ${response.status}`)
  }
  return response.json()
}
```

#### Step 3.4: Create the `WelcomeView.vue` page

Create `src/main/webui/src/views/WelcomeView.vue`.

This view contains:
- A centered card layout with a welcome heading.
- Conditional rendering: if the profile store has a profile, show an "already onboarded" message with a link to the home page. If not, show the onboarding form.
- The form uses shadcn/vue Form with zod validation schema:
  - `jobTitle`: optional string
  - `businessUnit`: optional string
  - `privacyAccepted`: boolean, must be `true` (use `z.literal(true)` with a custom error message)
- On submit, call `createProfile()`, then `getCurrentProfile()` to populate the store with the full profile, then redirect to `/` (or the profile page at `/profiles/{slug}` using the slug from the response).
- On API error, show an inline error message and keep the user on the page.
- The privacy checkbox label includes a `<RouterLink>` to `/privacy`.

#### Step 3.5: Add the `/welcome` route

In `src/main/webui/src/router/index.ts`, add the `/welcome` route **outside** the `DefaultLayout` group:

```typescript
{
  path: '/welcome',
  name: 'welcome',
  component: () => import('@/views/WelcomeView.vue'),
}
```

This ensures the welcome page renders without the navigation bar.

#### Step 3.6: Add a global navigation guard for profile detection

In `src/main/webui/src/router/index.ts`, add a `router.beforeEach` guard:

```typescript
router.beforeEach(async (to) => {
  if (to.name === 'welcome') return true

  const profileStore = useProfileStore()
  await profileStore.fetchProfile()

  if (profileStore.error) return true // Don't trap users in redirect loop on API errors (EC-2)
  if (!profileStore.profile) return { name: 'welcome' }
  return true
})
```

The guard:
- Always allows navigation to `/welcome`.
- Fetches the profile if not yet loaded (idempotent).
- On API error, lets the user through (EC-2 -- avoid redirect loop).
- On missing profile (404), redirects to `/welcome`.
- On existing profile, proceeds normally.

#### Step 3.7: Refactor `DefaultLayout.vue` to remove profile fetching

Remove the `onMounted` + `getCurrentProfile` call and the `userName`/`userEmail` refs entirely. The `NavigationBar` no longer receives user data as props — it reads from the store directly (see Step 3.8).

```vue
<script setup lang="ts">
import { NavigationBar } from '@/components/navigation'
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavigationBar />
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <RouterView />
    </main>
  </div>
</template>
```

This eliminates the duplicate API call and removes prop drilling. The profile is already loaded by the navigation guard before `DefaultLayout` mounts.

#### Step 3.8: Refactor `NavigationBar.vue` and `NavigationUserMenu.vue` to use the profile store

**`NavigationBar.vue`**: Remove the `userName`, `userEmail`, and `avatarUrl` props. Import `useProfileStore` and pass computed values to `NavigationUserMenu`, or better yet, let `NavigationUserMenu` consume the store directly too.

```vue
<script setup lang="ts">
import NavigationSearch from './NavigationSearch.vue'
import NavigationCreateMenu from './NavigationCreateMenu.vue'
import NavigationUserMenu from './NavigationUserMenu.vue'
</script>
```

The `defineProps` block is removed entirely — `NavigationBar` no longer receives any props.

**`NavigationUserMenu.vue`**: Remove the `userName`, `userEmail`, and `avatarUrl` props. Import `useProfileStore` and derive the values from the store:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useProfileStore } from '@/stores/profile'
// ...other imports...

const profileStore = useProfileStore()
const userName = computed(() => profileStore.profile?.fullName ?? '')
const userEmail = computed(() => profileStore.profile?.emailAddress ?? '')
const initials = computed(() => getInitials(userName.value))
</script>
```

The template remains unchanged — it already references `userName`, `userEmail`, and `initials`, which are now computed from the store instead of props.

### Phase 4: Tests

#### Step 4.1: Backend -- Test privacy acceptance validation on `POST /api/profiles`

In `src/test/kotlin/com/infosupport/promptyard/profiles/UserProfilesResourceTest.kt`, add tests:

- **`returns 400 when privacyAccepted is false`**: POST with `{"privacyAccepted": false}`, expect 400.
- **`returns 400 when privacyAccepted is missing`**: POST with `{}`, expect 400 (default is `false`).
- **`returns 201 when privacyAccepted is true`**: POST with `{"privacyAccepted": true}`, expect 201.
- **`privacy_accepted_at is set on newly created profile`**: POST with `{"privacyAccepted": true}`, then GET `/api/profiles/me`, verify `privacyAcceptedAt` is not null.
- **`privacy_accepted_at is not modified by PUT /me`**: Create profile, PUT update, GET and verify `privacyAcceptedAt` unchanged.
- **`existing user POST returns 200 regardless of privacyAccepted value`**: Create profile, POST again with `{"privacyAccepted": false}`, expect 200 (idempotent).

#### Step 4.2: Backend -- Update `TestObjectFactory.createUserProfile`

Add optional `privacyAcceptedAt` parameter to `createUserProfile`:

```kotlin
@Transactional
fun createUserProfile(
    subjectName: String,
    fullName: String,
    emailAddress: String,
    privacyAcceptedAt: Instant? = Instant.now()
): UserProfile {
    val profile = UserProfile().apply {
        this.subjectName = subjectName
        this.slug = fullName.lowercase().trim().replace(Regex("\\s+"), "-")
        this.fullName = fullName
        this.emailAddress = emailAddress
        this.privacyAcceptedAt = privacyAcceptedAt
        this.createdAt = Instant.now()
    }
    userProfileRepository.persist(profile)
    return profile
}
```

Default is `Instant.now()` so existing test callsites do not need updating.

#### Step 4.3: Frontend -- Test `createProfile` service function

Create `src/main/webui/src/services/__tests__/profiles.spec.ts` tests (extend existing file):

- **`createProfile sends POST with correct body`**: Mock fetch, call `createProfile`, verify request URL, method, and body.
- **`createProfile throws on non-ok response`**: Mock fetch with 400 status, verify error thrown.
- **`createProfile returns slug on success`**: Mock fetch with 201 and `{ slug: 'john-doe' }`, verify return value.

#### Step 4.4: Frontend -- Test `useProfileStore`

Create `src/main/webui/src/stores/__tests__/profile.spec.ts`:

- **`fetchProfile calls getCurrentProfile and sets profile`**: Mock the service, verify store state.
- **`fetchProfile sets error on network failure`**: Mock service to throw, verify `error` is true and `profile` is null.
- **`fetchProfile is idempotent when already loaded`**: Call twice, verify API called once.
- **`setProfile updates the store`**: Call `setProfile`, verify `profile` and `loaded`.

#### Step 4.5: Frontend -- Test `WelcomeView.vue`

Create `src/main/webui/src/views/__tests__/WelcomeView.spec.ts`:

- **`shows onboarding form when no profile exists`**: Mount with empty store, verify form elements are rendered.
- **`shows already-onboarded message when profile exists`**: Mount with profile in store, verify message shown and form hidden.
- **`disables submit when privacy not accepted`**: Mount, do not check privacy, verify submit button disabled or form validation prevents submission.
- **`submits form and redirects on success`**: Mock `createProfile` and router, fill form, submit, verify redirect.
- **`shows error message on API failure`**: Mock `createProfile` to throw, fill form, submit, verify error message displayed.

#### Step 4.6: Frontend -- Test the navigation guard

Create `src/main/webui/src/router/__tests__/guard.spec.ts`:

- **`redirects to /welcome when no profile`**: Set up router with guard, mock store with null profile, navigate to `/`, verify redirect to `/welcome`.
- **`allows navigation when profile exists`**: Mock store with profile, navigate to `/`, verify navigation succeeds.
- **`allows navigation to /welcome without profile check`**: Navigate to `/welcome`, verify no redirect.
- **`allows navigation on API error (does not redirect)`**: Mock store with error, navigate to `/`, verify navigation succeeds (not trapped).

## File Inventory

### New Files

- `src/main/resources/db/migration/V3__AddPrivacyAcceptedAtToUserProfile.sql` -- Flyway migration adding `privacy_accepted_at` column
- `src/main/webui/src/stores/profile.ts` -- Pinia store for current user profile state
- `src/main/webui/src/views/WelcomeView.vue` -- Onboarding/welcome page with form
- `src/main/webui/src/stores/__tests__/profile.spec.ts` -- Unit tests for profile store
- `src/main/webui/src/views/__tests__/WelcomeView.spec.ts` -- Unit tests for welcome view
- `src/main/webui/src/router/__tests__/guard.spec.ts` -- Unit tests for navigation guard
- `src/main/webui/src/components/ui/form/` -- shadcn/vue Form components (added via CLI)
- `src/main/webui/src/components/ui/checkbox/` -- shadcn/vue Checkbox component (added via CLI)
- `src/main/webui/src/components/ui/card/` -- shadcn/vue Card components (added via CLI)
- `src/main/webui/src/components/ui/label/` -- shadcn/vue Label component (added via CLI)

### Modified Files

- `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfile.kt` -- Add `privacyAcceptedAt` field
- `src/main/kotlin/com/infosupport/promptyard/profiles/OnboardUserRequest.kt` -- Add `privacyAccepted` boolean field
- `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfileResponse.kt` -- Add `privacyAcceptedAt` field
- `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfilesResource.kt` -- Add privacy validation in `onboardUser`, include `privacyAcceptedAt` in responses
- `src/test/kotlin/com/infosupport/promptyard/profiles/UserProfilesResourceTest.kt` -- Add privacy-related test cases
- `src/test/kotlin/com/infosupport/promptyard/content/TestObjectFactory.kt` -- Add `privacyAcceptedAt` parameter to `createUserProfile`
- `src/main/webui/src/services/profiles.ts` -- Add `createProfile` function and `CreateProfileRequest`/`CreateProfileResponse` types
- `src/main/webui/src/services/__tests__/profiles.spec.ts` -- Add tests for `createProfile`
- `src/main/webui/src/router/index.ts` -- Add `/welcome` route and global `beforeEach` navigation guard
- `src/main/webui/src/layouts/DefaultLayout.vue` -- Remove profile fetching and prop passing
- `src/main/webui/src/components/navigation/NavigationBar.vue` -- Remove user data props, NavigationBar is now prop-free
- `src/main/webui/src/components/navigation/NavigationUserMenu.vue` -- Replace props with `useProfileStore` for user data
- `src/main/webui/package.json` -- Add `zod` and `@vee-validate/zod` dependencies
- `docs/architecture/08-crosscutting-concepts.md` -- Update `UserProfile` domain model diagram to include `privacyAcceptedAt`

## Testing Strategy

### Backend Integration Tests

All backend tests use the existing `@QuarkusTest` + `@TestSecurity` + REST Assured pattern. Tests are added to the existing `UserProfilesResourceTest` class rather than creating a new file, because they test the same resource.

Key scenarios to cover:
- Privacy validation (400 on missing/false, 201 on true)
- `privacyAcceptedAt` persistence (set on create, returned in GET, not modified by PUT)
- Idempotent onboarding (existing user returns 200 regardless of `privacyAccepted` value)

The `TestObjectFactory.createUserProfile` gains a `privacyAcceptedAt` parameter with default `Instant.now()`, so all existing tests continue to work without modification.

### Frontend Unit Tests

All frontend tests use Vitest with `@vue/test-utils`. The profiles service tests follow the existing pattern in `src/main/webui/src/services/__tests__/profiles.spec.ts` (mock `globalThis.fetch`).

Key scenarios to cover:
- Store behavior (fetch, cache, error handling, setProfile)
- Navigation guard (redirect on missing profile, pass-through on existing profile, no redirect on error)
- Welcome page form (validation, submission, error display, already-onboarded state)

### Edge Cases Explicitly Tested

| Edge Case | Where Tested |
|-----------|-------------|
| EC-1: 409/200 on duplicate onboard | Backend: existing user POST test |
| EC-2: API error does not redirect to onboarding | Frontend: navigation guard error test |
| EC-3: Concurrent tab submissions | Backend: idempotent POST test |
| EC-5: `privacyAccepted: false` via API | Backend: 400 validation test |

## Migration Notes

- **Backward compatibility**: The `privacy_accepted_at` column is nullable, so existing profiles are unaffected by the schema change. No data backfill is needed.
- **API compatibility**: The `POST /api/profiles` endpoint now rejects requests without `privacyAccepted: true`. This is a breaking change for callers that send `{}`. Since the only consumer is the frontend (which does not yet call this endpoint in production), this is acceptable. The spec explicitly states that the existing endpoint must remain backward-compatible in terms of URL and response shape, which it does -- only the request validation is stricter.
- **No feature flag needed**: The onboarding flow is additive. Users who already have profiles are unaffected. The route guard checks the profile store and only redirects users without profiles.
