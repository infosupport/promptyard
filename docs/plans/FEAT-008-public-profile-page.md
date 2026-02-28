# Implementation Plan: Public Profile Page

**Spec:** docs/specs/FEAT-008-public-profile-page.md
**Created:** 2026-02-26
**Status:** Draft

## Summary

This feature adds a public profile page at `/profiles/{slug}` that displays another user's profile details and their paginated content items. The backend requires a single new endpoint (`GET /api/profiles/{slug}/content?page=N`) added to the existing `UserProfilesResource`. The frontend requires a new `ProfileView.vue` page, a new `useProfileContent` composable, a new `getProfileContent` service function, and a route registration. The page reuses `ProfileDetailsCard` and `ContentItemList` directly -- its structure mirrors `MyProfileView` almost exactly, with the key difference being that profile data is fetched by slug (not from the Pinia store) and the edit button only appears when the current user's slug matches the route slug.

## Key Design Decisions

1. **Add the new endpoint to the existing `UserProfilesResource` rather than creating a new resource class.** The endpoint operates on profiles (scoped under `/api/profiles/{slug}/content`), and `UserProfilesResource` already has the `getMyContent` method that this mirrors. It also already injects `ContentItemRepository`. Adding the method here avoids a new class and keeps profile-related endpoints co-located per ADR007.

2. **Reuse `MyContentPageResponse` and `MyContentItemResponse` as the response DTOs.** The spec explicitly states the response shape is identical to the `/me/content` endpoint. Creating separate `ProfileContentPageResponse`/`ProfileContentItemResponse` classes (as the spec domain model suggests) would be pure duplication. The existing DTOs are named with a `My` prefix, but that refers to response shape, not access semantics. Renaming them would cascade across existing code for no benefit. Reuse them as-is.

3. **Reuse `ContentItemRepository.findPagedByAuthorId` for the query.** This method already filters by `authorId`, sorts by `createdAt` descending, and paginates with page size 12 -- exactly what the new endpoint needs. No new repository method is required.

4. **Create a `useProfileContent` composable that takes a `slug` parameter.** This follows the established pattern from `useMyContent`, but calls `getProfileContent(slug, page)` instead of `getMyContent(page)`. The composable manages loading/error/data state and provides the same reactive interface (`items`, `pageIndex`, `totalPages`, `loading`, `error`, `fetchPage`). This keeps data-fetching logic testable outside the component.

5. **Create `ProfileView.vue` as a new view rather than making `MyProfileView` handle both modes.** The two views have different data sources (`MyProfileView` uses the Pinia store profile + `useMyContent`; `ProfileView` fetches profile by slug + uses `useProfileContent`), different breadcrumb text, and different edit button logic. Merging them would add conditional branching for every aspect. Separate views are simpler, and the shared components (`ProfileDetailsCard`, `ContentItemList`) already prevent layout duplication.

6. **Detect own-profile on the frontend by comparing the route slug to `profileStore.profile.slug`.** The Pinia profile store is always populated by the router `beforeEach` guard before any DefaultLayout child renders. Comparing `route.params.slug` to `profileStore.profile.slug` is reliable and does not require a backend change. When they match, `showEditButton` is set to true and `editUrl` points to `/profiles/me/edit`.

7. **Fetch profile data via the existing `GET /api/profiles/{slug}` endpoint.** A new `getProfileBySlug(slug)` service function calls this endpoint and returns the `UserProfile` interface. The profile store's `getCurrentProfile` only fetches `/api/profiles/me` and caches the result, so a separate function is needed for arbitrary slugs.

8. **Register the route with path `profiles/:slug` after the static `profiles/me` route.** Vue Router matches routes in order. The existing `profiles/me` route must remain before the parameterized `profiles/:slug` to prevent `me` from being captured as a slug parameter.

## Implementation Steps

### Phase 1: Backend — New Endpoint

#### Step 1.1: Add `getProfileContent` method to `UserProfilesResource`

Add a new `GET` endpoint at `/{slug}/content` to `UserProfilesResource.kt`. The method:

- Accepts `@PathParam("slug") slug: String` and `@QueryParam("page") @DefaultValue("0") page: Int`
- Looks up the `UserProfile` by slug via `userProfileRepository.findBySlug(slug)`
- Returns 404 if the profile does not exist
- Queries content via `contentItemRepository.findPagedByAuthorId(profile.id!!, page)`
- Maps results to `MyContentItemResponse` (reusing the existing DTO)
- Wraps in `MyContentPageResponse` and returns 200

This is a read-only endpoint, so no `@Transactional` annotation is needed (matching `getMyContent`).

**File:** `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfilesResource.kt`

### Phase 2: Backend Tests

#### Step 2.1: Create `ProfileContentResourceTest.kt`

Create a new test class for the `GET /api/profiles/{slug}/content` endpoint. Test cases:

1. **Returns 200 with empty list** when the user has no content items (SC-005)
2. **Returns only the requested user's content** when multiple users exist (SC-008)
3. **Returns items sorted by createdAt descending** (SC-009)
4. **Paginates correctly** — first page of 12 when 13 exist, second page with 1 item (SC-002, SC-003)
5. **Defaults to page 0** when no page parameter is provided (EC-7)
6. **Each item includes authorName** (SC-010)
7. **Returns 404** when slug does not match any user (EC-1)
8. **Redirects to login** when unauthenticated (SC-012)

Follow the patterns established in `MyContentResourceTest.kt`: inject `TestObjectFactory`, `ContentItemRepository`, and `UserProfileRepository`; use `@AfterEach @Transactional` cleanup; use `@TestSecurity(user = "...")` for authentication.

**File:** `src/test/kotlin/com/infosupport/promptyard/profiles/ProfileContentResourceTest.kt`

### Phase 3: Frontend — Service Layer

#### Step 3.1: Add `getProfileBySlug` and `getProfileContent` to the profiles service

Add two new functions to the existing profiles service file:

- `getProfileBySlug(slug: string): Promise<UserProfile>` — calls `GET /api/profiles/{slug}`. Throws on non-ok response. Returns 404 error for not-found slugs (the view handles this).
- `getProfileContent(slug: string, page: number): Promise<MyContentPageResponse>` — calls `GET /api/profiles/{slug}/content?page={page}`. Throws on non-ok. Reuses the existing `MyContentPageResponse` interface since the shape is identical.

**File:** `src/main/webui/src/services/profiles.ts`

#### Step 3.2: Add service tests for the new functions

Add test cases for `getProfileBySlug` and `getProfileContent` following the existing patterns in `profiles.spec.ts`:

- `getProfileBySlug`: returns profile on success, throws on 404, throws on server error
- `getProfileContent`: returns page on success, throws on error, passes slug and page correctly in URL

**File:** `src/main/webui/src/services/__tests__/profiles.spec.ts`

### Phase 4: Frontend — Composable

#### Step 4.1: Create `useProfileContent` composable

Create a new composable that mirrors `useMyContent` but parameterized by slug:

```typescript
export function useProfileContent(slug: string) {
  // Same reactive refs: data, loading, error
  // Same computed: items (mapping to ContentItemSummary), pageIndex, totalPages
  // fetchPage calls getProfileContent(slug, page) instead of getMyContent(page)
  // Calls fetchPage() on mount via onMounted
  return { items, pageIndex, totalPages, loading, error, fetchPage }
}
```

The item-to-`ContentItemSummary` mapping is identical to `useMyContent` (constructing the URL as `/content/${contentType}s/${slug}`). This duplication is acceptable -- extracting a shared mapper would add abstraction for two call sites, and the mapping is a single `map()` call.

**File:** `src/main/webui/src/composables/useProfileContent.ts`

#### Step 4.2: Add composable tests

Create tests following the `useMyContent.spec.ts` pattern:

- Fetches content on mount with page 0 for the given slug
- Sets loading state correctly
- Maps response items to `ContentItemSummary`
- Exposes `pageIndex` and `totalPages`
- Sets error on fetch failure
- Fetches specific page when `fetchPage` is called
- Constructs correct URLs for different content types
- Clears error on successful retry

**File:** `src/main/webui/src/composables/__tests__/useProfileContent.spec.ts`

### Phase 5: Frontend — View and Route

#### Step 5.1: Create `ProfileView.vue`

Create the new view component. Structure:

```
<script setup>
  - Extract slug from route params via useRoute()
  - Use useProfileContent(slug) for content data
  - Use useProfileStore() for own-profile detection
  - Fetch profile by slug via getProfileBySlug(slug) on mount
  - Track profile, loading, error, notFound state refs
  - Compute isOwnProfile = profileStore.profile?.slug === slug
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading">Loading...</div>

  <!-- Not found state (FR-012) -->
  <div v-else-if="notFound">
    Profile not found message with Back to home button
  </div>

  <!-- Error state (EC-5) -->
  <div v-else-if="error && !profile">
    Error message with Retry button
  </div>

  <!-- Main content (when profile loaded) -->
  <template v-else-if="profile">
    <!-- Breadcrumb: Profiles / {fullName} (FR-008) -->
    <nav aria-label="Breadcrumb">
      <ol>
        <li>Profiles</li>
        <li>/</li>
        <li>{profile.fullName}</li>
      </ol>
    </nav>

    <!-- ProfileDetailsCard (FR-003, FR-009) -->
    <ProfileDetailsCard
      :full-name="profile.fullName"
      :job-title="profile.jobTitle"
      :business-unit="profile.businessUnit"
      :member-since="profile.createdAt"
      :prompt-count="0"
      :skill-count="0"
      :agent-count="0"
      :workflow-count="0"
      :show-edit-button="isOwnProfile"
      :edit-url="isOwnProfile ? '/profiles/me/edit' : undefined"
    />

    <!-- Content heading + ContentItemList (FR-006) -->
    <h2>Content</h2>
    <ContentItemList
      :items="contentItems"
      :page-index="contentPageIndex"
      :total-pages="contentTotalPages"
      :loading="contentLoading"
      @page-change="fetchContentPage"
    />
  </template>
</template>
```

Note: content counts are hardcoded to 0, matching `MyProfileView`. The `/api/profiles/{slug}` endpoint does not return counts. This is an existing limitation that applies to both views.

**File:** `src/main/webui/src/views/ProfileView.vue`

#### Step 5.2: Register the route

Add the `profiles/:slug` route as a child of the `DefaultLayout` route, after the existing `profiles/me` route:

```typescript
{
  path: 'profiles/:slug',
  name: 'profile',
  component: () => import('@/views/ProfileView.vue'),
}
```

This must come after `profiles/me` so that `/profiles/me` still matches the static route first.

**File:** `src/main/webui/src/router/index.ts`

### Phase 6: Frontend Tests — View

#### Step 6.1: Create `ProfileView.spec.ts`

Test the view following the patterns established in `MyProfileView.spec.ts`:

1. **Renders breadcrumb** with "Profiles / {fullName}" (SC-004)
2. **Passes correct props to ProfileDetailsCard** from fetched profile data (SC-001)
3. **Sets `showEditButton` to false** when the slug does not match the current user (SC-001)
4. **Sets `showEditButton` to true** when the slug matches the current user's slug (SC-007)
5. **Passes content items to ContentItemList** (SC-002)
6. **Shows loading state** while profile is being fetched (SC-006)
7. **Shows not-found state** when profile fetch returns 404 (SC-011)
8. **Shows error state** on network error (EC-5)
9. **Calls fetchPage on page-change event** from ContentItemList (SC-003)

Mock `vue-router` with `useRoute` returning `{ params: { slug: 'test-user' } }`. Mock the service functions (`getProfileBySlug`). Mock the `useProfileContent` composable. Use stub components for `ProfileDetailsCard` and `ContentItemList`.

**File:** `src/main/webui/src/views/__tests__/ProfileView.spec.ts`

## File Inventory

### New Files

- `src/test/kotlin/com/infosupport/promptyard/profiles/ProfileContentResourceTest.kt` — Backend integration tests for `GET /api/profiles/{slug}/content`
- `src/main/webui/src/composables/useProfileContent.ts` — Composable for fetching a user's content by slug
- `src/main/webui/src/composables/__tests__/useProfileContent.spec.ts` — Tests for the composable
- `src/main/webui/src/views/ProfileView.vue` — Public profile page view
- `src/main/webui/src/views/__tests__/ProfileView.spec.ts` — Tests for the view

### Modified Files

- `src/main/kotlin/com/infosupport/promptyard/profiles/UserProfilesResource.kt` — Add `getProfileContent` endpoint method
- `src/main/webui/src/services/profiles.ts` — Add `getProfileBySlug` and `getProfileContent` functions
- `src/main/webui/src/services/__tests__/profiles.spec.ts` — Add tests for the new service functions
- `src/main/webui/src/router/index.ts` — Add `profiles/:slug` route

## Testing Strategy

### Backend

- **Integration tests** in `ProfileContentResourceTest.kt` using `@QuarkusTest` + REST Assured
- Use `TestObjectFactory` to create test profiles and prompts with controlled data
- Each test uses a unique `@TestSecurity(user = "sub-...")` subject to avoid cross-test interference
- `@AfterEach @Transactional` cleanup deletes all content items and user profiles
- Cover: empty list, filtered results, sort order, pagination (page boundaries), default page, author name in response, 404 for missing slug, 302 for unauthenticated

### Frontend

- **Service tests** (`profiles.spec.ts`): mock `globalThis.fetch` to verify correct URLs, HTTP methods, and error handling for `getProfileBySlug` and `getProfileContent`
- **Composable tests** (`useProfileContent.spec.ts`): mount in a wrapper component (same pattern as `useMyContent.spec.ts`), mock the service, verify reactive state transitions (loading, data, error, pagination)
- **View tests** (`ProfileView.spec.ts`): mount with stubs for `ProfileDetailsCard` and `ContentItemList`, mock `vue-router` and services, verify props passing, breadcrumb content, own-profile edit button logic, loading/error/not-found states

### Edge Cases to Cover

- Profile slug does not exist (backend 404, frontend not-found state)
- User has zero content items (empty state in list, profile card with 0 counts)
- Exactly 12 items (one full page, no pager)
- 13 items (two pages, pager visible)
- Current user visits their own slug (edit button appears)
- Current user visits another user's slug (no edit button)

## Migration Notes

- **No database migration required.** The new endpoint queries existing tables (`user_profile`, `content_item`) using existing repository methods. No schema changes are needed.
- **Backwards compatible.** This feature only adds a new endpoint and a new frontend route. No existing endpoints or pages are modified in behavior.
- **No feature flags needed.** The feature is purely additive -- the new route and endpoint do not affect existing functionality.
