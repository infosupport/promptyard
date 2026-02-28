# Implementation Plan: Edit Profile Page

**Spec:** `docs/specs/FEAT-011-edit-profile-page.md`
**Created:** 2026-02-28
**Status:** Draft

## Summary

Add an Edit Profile page at `/profiles/me/edit` that lets the authenticated user update their job title and business unit. The backend `PUT /api/profiles/me` endpoint is simplified to accept only `jobTitle` and `businessUnit` (removing IdP-derived `fullName` and `emailAddress` fields). The frontend page follows the established EditPromptView pattern: vee-validate form inside a centered Card layout, with breadcrumb navigation, unsaved-changes guard, and error handling. The profile store is extended with a refresh capability so the saved data propagates immediately.

## Key Design Decisions

1. **Modify `UpdateProfileRequest` in place** rather than creating a new DTO. The spec explicitly requires removing `fullName` and `emailAddress` from the existing request. This is a breaking change to the backend contract, but the only consumer is the frontend which is updated simultaneously.

2. **No new backend endpoint or migration.** The `PUT /api/profiles/me` endpoint already exists. The change is purely to the request DTO shape and the handler logic (stop overwriting `fullName`/`emailAddress`). The `UserProfile` entity and database schema are unchanged.

3. **Reuse the `useUnsavedChanges` composable** for the unsaved-changes guard, exactly as EditPromptView does. This handles both route navigation (via `onBeforeRouteLeave`) and browser close/refresh (via `beforeunload`).

4. **Add `updateProfile` to the profiles service** as a new function alongside the existing `getCurrentProfile`. There is no existing `updateProfile` function in the frontend.

5. **Load profile data from the profile store** rather than making a separate API call. The `useProfileStore` already fetches and caches the profile via the router guard, so it is always populated when the edit page loads inside `DefaultLayout`. This avoids a redundant `GET /api/profiles/me` call.

6. **Add a `refreshProfile` method to the profile store** that forces a re-fetch (ignoring the `loaded` flag). After a successful save, the edit page calls `refreshProfile()` so the updated data is available on navigation back to `/profiles/me`.

7. **Use AppBreadcrumb** with the existing segment structure. The breadcrumb segments are: "Promptyard" (link to `/`), "Profiles" (plain text), "Me" (link to `/profiles/me`), "Edit Details" (current page). The existing `AppBreadcrumb` component already renders the first segment as "Promptyard" linking to `/` implicitly -- examining the component shows it just renders the `segments` array. The "Promptyard" root segment must be included explicitly.

8. **Register the route as a sibling of `profiles/me`** inside the `DefaultLayout` children, placed immediately after the `profiles/me` route (and before `profiles/:slug` to avoid parameter capture). The route name is `edit-profile`.

9. **Existing backend tests must be updated** to match the new DTO shape. Two existing tests (`returns 202 Accepted when profile update succeeds` and `profile fields are updated after PUT request`) send `fullName` and `emailAddress` in the request body. These must be changed to send only `jobTitle` and `businessUnit`, and the assertions must verify that `fullName` and `emailAddress` are preserved from the original profile.

10. **No Storybook story for the view.** Consistent with EditPromptView, which has no story. The view is tested via Vitest.

## Implementation Steps

### Phase 1: Backend Changes

#### Step 1.1: Simplify `UpdateProfileRequest`

**File:** `src/main/kotlin/com/infosupport/promptyard/profiles/UpdateProfileRequest.kt`

Remove `fullName` and `emailAddress` fields, keeping only `jobTitle` and `businessUnit`:

```kotlin
@Serializable
data class UpdateProfileRequest(
    val jobTitle: String? = null,
    val businessUnit: String? = null
)
```

#### Step 1.2: Update `UserProfilesResource.updateCurrentUserProfile`

**File:** `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfilesResource.kt`

Modify the `updateCurrentUserProfile` method to only update `jobTitle` and `businessUnit`, leaving `fullName` and `emailAddress` untouched:

```kotlin
@PUT
@Path("/me")
@Consumes(MediaType.APPLICATION_JSON)
@Transactional
fun updateCurrentUserProfile(request: UpdateProfileRequest): Response {
    val subjectName = identity.principal.name
    val profile = userProfileRepository.findBySubjectName(subjectName)
        ?: return Response.status(Response.Status.NOT_FOUND).build()

    profile.jobTitle = request.jobTitle
    profile.businessUnit = request.businessUnit
    profile.modifiedAt = Instant.now()

    return Response.accepted().build()
}
```

The key change: remove lines `profile.fullName = request.fullName` and `profile.emailAddress = request.emailAddress`.

#### Step 1.3: Update existing backend tests

**File:** `src/test/kotlin/com/infosupport/promptyard/profiles/UserProfilesResourceTest.kt`

Update the following tests:

- `returns 202 Accepted when profile update succeeds` -- change the request body to `{"jobTitle":"Engineer","businessUnit":"R&D"}` (remove `fullName` and `emailAddress`).
- `profile fields are updated after PUT request` -- change the request body to `{"jobTitle":"Lead","businessUnit":"Engineering"}`. Update the GET assertion to verify `fullName` and `emailAddress` remain at their original values ("Update Verify User" and "update.verify@example.com").
- `privacyAcceptedAt is not modified by PUT` -- change the request body to `{"jobTitle":"Architect","businessUnit":"IT"}`.
- `PUT profiles me redirects to login when no authentication is provided` -- change the request body to `{"jobTitle":"Ghost"}`.

#### Step 1.4: Add new backend test for IdP field preservation

**File:** `src/test/kotlin/com/infosupport/promptyard/profiles/UserProfilesResourceTest.kt`

Add a test that explicitly verifies IdP fields are preserved when only `jobTitle` and `businessUnit` are sent:

```kotlin
@Test
@TestSecurity(user = "sub-preserve-idp-user")
@OidcSecurity(claims = [
    Claim(key = "name", value = "Preserve IdP User"),
    Claim(key = "email", value = "preserve.idp@example.com")
])
fun `PUT preserves fullName and emailAddress from original profile`() {
    testObjectFactory.createUserProfile(
        "sub-preserve-idp-user",
        "Preserve IdP User",
        "preserve.idp@example.com"
    )

    Given {
        contentType(MediaType.APPLICATION_JSON)
        body("""{"jobTitle":"New Title","businessUnit":"New Unit"}""")
    } When {
        put("/api/profiles/me")
    } Then {
        statusCode(202)
    }

    When {
        get("/api/profiles/me")
    } Then {
        statusCode(200)
        body("fullName", equalTo("Preserve IdP User"))
        body("emailAddress", equalTo("preserve.idp@example.com"))
        body("jobTitle", equalTo("New Title"))
        body("businessUnit", equalTo("New Unit"))
    }
}
```

Add a test for submitting with null fields (clearing values):

```kotlin
@Test
@TestSecurity(user = "sub-clear-fields-user")
@OidcSecurity(claims = [
    Claim(key = "name", value = "Clear Fields User"),
    Claim(key = "email", value = "clear.fields@example.com")
])
fun `PUT with null fields clears jobTitle and businessUnit`() {
    testObjectFactory.createUserProfile(
        "sub-clear-fields-user",
        "Clear Fields User",
        "clear.fields@example.com",
        jobTitle = "Old Title"
    )

    Given {
        contentType(MediaType.APPLICATION_JSON)
        body("""{}""")
    } When {
        put("/api/profiles/me")
    } Then {
        statusCode(202)
    }

    When {
        get("/api/profiles/me")
    } Then {
        statusCode(200)
        body("jobTitle", nullValue())
        body("businessUnit", nullValue())
    }
}
```

### Phase 2: Frontend Service & Store

#### Step 2.1: Add `updateProfile` to profiles service

**File:** `src/main/webui/src/services/profiles.ts`

Add the interface and function:

```typescript
export interface UpdateProfileRequest {
  jobTitle: string | null
  businessUnit: string | null
}

export async function updateProfile(request: UpdateProfileRequest): Promise<void> {
  const response = await fetch('/api/profiles/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`)
  }
}
```

#### Step 2.2: Add `refreshProfile` to the profile store

**File:** `src/main/webui/src/stores/profile.ts`

Add a `refreshProfile` method that re-fetches regardless of `loaded` state:

```typescript
async function refreshProfile() {
  try {
    profile.value = await getCurrentProfile()
    error.value = false
  } catch {
    error.value = true
  } finally {
    loaded.value = true
  }
}
```

Return it from the store: `return { profile, loaded, error, fetchProfile, refreshProfile, setProfile, $reset }`.

### Phase 3: Frontend View & Routing

#### Step 3.1: Create `EditProfileView.vue`

**File:** `src/main/webui/src/views/EditProfileView.vue`

The view follows the EditPromptView pattern closely but is simpler (only two optional text fields, no validation schema needed beyond the form structure). Key elements:

- **Script setup**: Import `useProfileStore`, `useRouter`, `useForm` (vee-validate), `useUnsavedChanges`, `updateProfile` from services, `toTypedSchema`/`z` for schema.
- **Form schema**: `z.object({ jobTitle: z.string().optional().default(''), businessUnit: z.string().optional().default('') })`.
- **Initialization**: On mount, read from `profileStore.profile` and call `form.resetForm({ values: { jobTitle: ..., businessUnit: ... } })`.
- **Read-only context**: Display `profileStore.profile.fullName` and `profileStore.profile.emailAddress` as plain text above the form fields.
- **Submit handler**: Call `updateProfile({ jobTitle: values.jobTitle || null, businessUnit: values.businessUnit || null })`, then `profileStore.refreshProfile()`, then `bypass()` and navigate to `{ name: 'my-profile' }`.
- **Cancel handler**: Navigate to `{ name: 'my-profile' }`.
- **Error handling**: Display `apiError` message on failure, preserve form data.
- **Unsaved changes**: Use `useUnsavedChanges(isDirty)` with `AlertDialog` for the confirmation modal.
- **Layout**: Centered card (`max-w-lg mx-auto`) with `Card`/`CardHeader`/`CardContent` wrapping the form.
- **Breadcrumb**: `<AppBreadcrumb>` with segments for Promptyard > Profiles > Me > Edit Details.

Template structure:

```html
<div>
  <AppBreadcrumb :segments="breadcrumbSegments" />

  <Card class="max-w-lg mx-auto">
    <CardHeader>
      <CardTitle>Edit Profile</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Read-only context: fullName, emailAddress -->
      <div class="space-y-1 mb-6">
        <p class="text-sm text-muted-foreground">Name</p>
        <p class="text-sm font-medium">{{ profileStore.profile?.fullName }}</p>
        <p class="text-sm text-muted-foreground mt-3">Email</p>
        <p class="text-sm font-medium">{{ profileStore.profile?.emailAddress }}</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- jobTitle field -->
        <!-- businessUnit field -->
        <!-- apiError message -->
        <!-- Save + Cancel buttons -->
      </form>
    </CardContent>
  </Card>

  <!-- AlertDialog for unsaved changes -->
</div>
```

`defineExpose({ form, onSubmit })` for testability.

#### Step 3.2: Register the route

**File:** `src/main/webui/src/router/index.ts`

Add the route inside the `DefaultLayout` children, immediately after `profiles/me` and before `profiles/:slug`:

```typescript
{
  path: 'profiles/me/edit',
  name: 'edit-profile',
  component: () => import('@/views/EditProfileView.vue'),
},
```

Route ordering after this change:
1. `profiles/me` (static)
2. `profiles/me/edit` (static)
3. `profiles/:slug` (parameterized)

### Phase 4: Tests

#### Step 4.1: Add `updateProfile` tests to profiles service tests

**File:** `src/main/webui/src/services/__tests__/profiles.spec.ts`

Add a `describe('updateProfile', ...)` block with tests:

- Sends PUT to `/api/profiles/me` with correct body.
- Throws on non-ok response.
- Sends null fields when values are null.

#### Step 4.2: Update profile store tests

**File:** `src/main/webui/src/stores/__tests__/profile.spec.ts`

Add tests for `refreshProfile`:

- Calls `getCurrentProfile` and updates `profile.value` regardless of `loaded` state.
- Sets `error` to `true` on failure.

#### Step 4.3: Create `EditProfileView` tests

**File:** `src/main/webui/src/views/__tests__/EditProfileView.spec.ts`

Follow the EditPromptView test pattern. Mock `vue-router`, `@/services/profiles`, `@/composables/useUnsavedChanges`. Use `createPinia`/`setActivePinia`, set up the profile store with test data before mounting.

Test cases:

1. **Renders form with pre-populated data** -- verify job title and business unit input values match store data.
2. **Shows read-only name and email** -- verify fullName and emailAddress appear as text (not inputs).
3. **Renders breadcrumb** -- verify breadcrumb text contains the expected segments.
4. **Submits updated data and navigates to my-profile** -- use `form.setFieldValue` via `wrapper.vm`, call `onSubmit`, verify `updateProfile` called with correct body, verify `router.push` called with `{ name: 'my-profile' }`.
5. **Submits empty strings as null** -- clear fields, submit, verify `updateProfile` called with `{ jobTitle: null, businessUnit: null }`.
6. **Shows error on API failure** -- mock `updateProfile` to reject, verify error message displayed.
7. **Cancel navigates to my-profile** -- click Cancel, verify `router.push`.
8. **Shows saving state during submission** -- verify button text changes to "Saving..." and disabled attribute.

## File Inventory

### New Files

- `src/main/webui/src/views/EditProfileView.vue` -- Edit profile page with form, breadcrumb, unsaved changes guard
- `src/main/webui/src/views/__tests__/EditProfileView.spec.ts` -- Vitest tests for the edit profile view

### Modified Files

- `src/main/kotlin/com/infosupport/promptyard/profiles/UpdateProfileRequest.kt` -- Remove `fullName` and `emailAddress` fields
- `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfilesResource.kt` -- Stop overwriting `fullName`/`emailAddress` in PUT handler
- `src/test/kotlin/com/infosupport/promptyard/profiles/UserProfilesResourceTest.kt` -- Update existing PUT tests, add new tests for IdP preservation and null clearing
- `src/main/webui/src/services/profiles.ts` -- Add `UpdateProfileRequest` interface and `updateProfile` function
- `src/main/webui/src/services/__tests__/profiles.spec.ts` -- Add tests for `updateProfile`
- `src/main/webui/src/stores/profile.ts` -- Add `refreshProfile` method
- `src/main/webui/src/stores/__tests__/profile.spec.ts` -- Add tests for `refreshProfile`
- `src/main/webui/src/router/index.ts` -- Add `edit-profile` route

## Testing Strategy

### Backend (REST Assured + @QuarkusTest)

- **Update existing tests** that send the old 4-field request body to use the new 2-field shape.
- **Add IdP preservation test** verifying `fullName` and `emailAddress` are unchanged after PUT.
- **Add null-clearing test** verifying empty request body clears `jobTitle` and `businessUnit`.
- **Existing unauthenticated PUT test** updated to use new request body shape.
- Run: `./mvnw test -Dtest=UserProfilesResourceTest`

### Frontend Services (Vitest)

- Test `updateProfile` sends correct HTTP method, URL, headers, and body.
- Test error propagation for non-ok responses.
- Run: `pnpm test:unit -- src/services/__tests__/profiles.spec.ts`

### Frontend Store (Vitest)

- Test `refreshProfile` re-fetches even when `loaded` is `true`.
- Test error state handling.
- Run: `pnpm test:unit -- src/stores/__tests__/profile.spec.ts`

### Frontend View (Vitest)

- Mock router, services, composables.
- Use `wrapper.vm` pattern (`defineExpose`) to interact with form programmatically.
- Test all states: pre-populated form, read-only fields, submission, error, cancel, saving indicator.
- Run: `pnpm test:unit -- src/views/__tests__/EditProfileView.spec.ts`

### Manual Verification

- Navigate to `/profiles/me`, click "Edit Profile" button, verify form loads.
- Change job title and business unit, save, verify redirect and updated data.
- Test cancel without changes (no dialog) and with changes (confirmation dialog).
- Verify browser refresh warning when form is dirty.
- Verify breadcrumb links work correctly.

## Migration Notes

- **No database migration required.** The `UserProfile` entity and table schema are unchanged.
- **Backend API contract change:** The `PUT /api/profiles/me` request body drops `fullName` and `emailAddress`. This is a simplification (fewer required fields), so old clients sending extra fields would still work (kotlinx.serialization ignores unknown keys by default). However, old clients that relied on being able to update `fullName`/`emailAddress` via this endpoint will lose that capability. Since there are no external consumers (only the Promptyard frontend), this is safe.
- **No feature flag needed.** The change is additive on the frontend (new page) and simplifying on the backend (fewer accepted fields). The existing MyProfileView already has the "Edit Profile" button wired to `/profiles/me/edit`.
