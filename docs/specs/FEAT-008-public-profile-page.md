# Feature Specification: Public Profile Page

<!--
  TEMPLATE INSTRUCTIONS
  =====================
  This template follows a spec-driven development approach for AI-assisted coding.
  Fill in each section focusing on WHAT the feature does and WHY — not HOW it should
  be implemented. Implementation details belong in the technical plan, not here.

  Usage:
  - One spec per feature or functional slice
  - Store in docs/specs/ and version-control alongside your code
  - Use [NEEDS CLARIFICATION: question] markers for unresolved decisions (max 3)
  - Remove optional sections that don't apply — don't leave them as N/A
  - Reference your arc42 architecture docs where relevant rather than duplicating them

  Workflow: Specify → Plan → Tasks → Implement
  This template covers the "Specify" phase.
-->

## 1. Overview

| Field           | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Feature ID      | FEAT-008                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-26                                                         |
| Last updated    | 2026-02-26                                                         |
| Epic / Parent   | Profile page                                                       |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

Users can view their own profile at `/profiles/me`, but there is no way to view another user's profile. When a user encounters content by someone else (e.g., via an `AuthorCard` on a prompt detail page), there is no profile page to navigate to. The backend can already look up a profile by slug (`GET /api/profiles/{slug}`), but there is no endpoint to retrieve that user's content items, and no frontend page to display it.

### 1.2 Goal

A public profile page at `/profiles/{slug}` that displays the same layout as the My Profile page — `ProfileDetailsCard` at the top and a paginated `ContentItemList` below — but read-only (no "Edit Profile" button) when viewing another user's profile. A new backend endpoint at `GET /api/profiles/{slug}/content?page=N` serves the user's content items. When the authenticated user visits their own profile via slug, the Edit Profile button is shown. The breadcrumb shows: Profiles / {user's full name}.

### 1.3 Non-Goals

- **Editing someone else's profile** — this is a read-only view for other users' profiles.
- **Follow/unfollow or social features** — no interaction beyond viewing.
- **Content filtering or searching** — the list shows all content types, no filter controls.
- **Sorting controls** — the sort order (newest first) is fixed.
- **Private profiles** — all profiles are publicly viewable by any authenticated user.
- **Content creation from this page** — no "New Prompt" button or similar.

## 2. User Stories

### US-001: View another user's profile

**As a** logged-in user,
**I want** to visit `/profiles/{slug}` and see that user's avatar, name, job title, business unit, membership date, and content counts,
**so that** I can learn about other contributors.

### US-002: Browse another user's content

**As a** logged-in user viewing a profile page,
**I want** to see a paginated list of that user's published content items sorted newest first,
**so that** I can discover their contributions.

### US-003: Navigate between pages of a user's content

**As a** logged-in user,
**I want** to page through a user's content items,
**so that** I can access older items.

### US-004: Navigate via breadcrumb

**As a** logged-in user,
**I want** a breadcrumb showing Profiles / {user's name},
**so that** I can orient myself.

### US-005: View my own profile via slug with edit capability

**As a** logged-in user who navigates to my own profile via `/profiles/{my-slug}`,
**I want** to see the Edit Profile button,
**so that** I have the same editing access as on `/profiles/me`.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                                    | Priority | User Story     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------- |
| FR-001 | The system shall expose a page at route `/profiles/{slug}`                                                                                                                     | Must     | US-001         |
| FR-002 | The page shall fetch the user's profile from `GET /api/profiles/{slug}`                                                                                                        | Must     | US-001         |
| FR-003 | The page shall display the `ProfileDetailsCard` with `showEditButton` set to false by default                                                                                  | Must     | US-001         |
| FR-004 | The system shall expose a `GET /api/profiles/{slug}/content?page={pageIndex}` endpoint returning that user's content items, paginated and sorted by creation date descending    | Must     | US-002         |
| FR-005 | The API endpoint shall return the same response shape as `GET /api/profiles/me/content` (items with slug, title, description, tags, contentType, authorName, createdAt, modifiedAt; page size 12) | Must     | US-002         |
| FR-006 | The page shall display content items using the `ContentItemList` component                                                                                                     | Must     | US-002         |
| FR-007 | When the user navigates between pages, the page shall fetch the corresponding page of content from the API                                                                     | Must     | US-003         |
| FR-008 | The page shall render a breadcrumb with two segments: "Profiles" (plain text, not linked) and the user's full name (current page, plain text)                                  | Must     | US-004         |
| FR-009 | When the authenticated user's slug (from Pinia store) matches the profile slug in the route, the page shall set `showEditButton` to true on the `ProfileDetailsCard`            | Must     | US-005         |
| FR-010 | The page shall show loading states while fetching profile and content data                                                                                                      | Should   | US-001, US-002 |
| FR-011 | The page shall require authentication (consistent with existing route guards and backend `@Authenticated` annotation)                                                           | Must     | US-001         |
| FR-012 | When the profile slug does not match any user, the page shall display a "Profile not found" message                                                                            | Must     | US-001         |

## 4. Acceptance Scenarios

### SC-001: Profile details displayed (FR-002, FR-003)

```gherkin
Given a user "Willem Meints" with slug "willem-meints", job title "Machine Learning Engineer",
      business unit "Unit AI & Data", member since "2024-01-15",
      12 prompts, 0 skills, 0 agents, and 0 workflows
When another logged-in user navigates to /profiles/willem-meints
Then the ProfileDetailsCard displays the user's avatar, name, job title, business unit,
      membership date, and content counts
  And no "Edit Profile" button is visible
```

### SC-002: Content items listed with pagination (FR-004, FR-005, FR-006)

```gherkin
Given user "willem-meints" has 25 published content items
When a logged-in user navigates to /profiles/willem-meints
Then the page displays the first page of content items (up to 12 items)
  And the content items are sorted from newest to oldest
  And a pager bar is displayed below the list
```

### SC-003: Navigate to next page of content (FR-007)

```gherkin
Given user "willem-meints" has 25 content items and the viewer is on page 1
When the viewer clicks page number 2 in the pager
Then the page fetches and displays the second page of content items
  And the pager highlights page 2 as the current page
```

### SC-004: Breadcrumb displayed (FR-008)

```gherkin
Given the viewer is on /profiles/willem-meints and the profile name is "Willem Meints"
When the page is rendered
Then a breadcrumb is displayed with segments "Profiles" > "Willem Meints"
  And "Profiles" is plain text (not linked)
  And "Willem Meints" is plain text (current page)
```

### SC-005: Empty content state (FR-006)

```gherkin
Given user "jane-doe" has no published content items
When a logged-in user navigates to /profiles/jane-doe
Then the ProfileDetailsCard is displayed with all counts at 0
  And the content list shows "No content items found"
  And no pager is shown
```

### SC-006: Loading state (FR-010)

```gherkin
Given the user navigates to /profiles/willem-meints
When the profile and content API requests are in progress
Then the page displays loading indicators for both the profile card and the content list
  And once data loads, the loading indicators are replaced with actual content
```

### SC-007: Own profile shows edit button (FR-009)

```gherkin
Given the current user has slug "willem-meints" stored in the Pinia store
When they navigate to /profiles/willem-meints
Then the ProfileDetailsCard displays with the "Edit Profile" button visible
```

### SC-008: API returns only the requested user's content (FR-004, FR-005)

```gherkin
Given user "alice" with slug "alice" has 3 prompts
  And user "bob" with slug "bob" has 5 prompts
When a GET request is made to /api/profiles/alice/content?page=0
Then the response contains only alice's 3 content items
  And none of bob's content items are included
```

### SC-009: API content sorted newest first (FR-004)

```gherkin
Given user "alice" has content items created at different times
When a GET request is made to /api/profiles/alice/content?page=0
Then the items are sorted by creation date descending (newest first)
```

### SC-010: API response includes author name (FR-005)

```gherkin
Given user "Willem Meints" with slug "willem-meints" has published content items
When a GET request is made to /api/profiles/willem-meints/content?page=0
Then each content item in the response includes authorName "Willem Meints"
```

### SC-011: Profile not found (FR-012)

```gherkin
Given no user exists with slug "nonexistent-user"
When a logged-in user navigates to /profiles/nonexistent-user
Then the page displays a "Profile not found" message
  And no content list or pager is shown
```

### SC-012: Unauthenticated access rejected (FR-011)

```gherkin
Given no user is authenticated
When a request is made to /profiles/willem-meints or /api/profiles/willem-meints/content
Then the system redirects to the login page (HTTP 302)
```

## 5. Domain Model

### 5.1 Entities

#### ProfileContentPageResponse (new backend DTO)

*The API response from `GET /api/profiles/{slug}/content?page={pageIndex}`. Wraps a page of the requested user's content items. Uses the same shape as `MyContentPageResponse`.*

| Attribute  | Type                          | Constraints    | Description                              |
| ---------- | ----------------------------- | -------------- | ---------------------------------------- |
| items      | ProfileContentItemResponse[]  | required       | Content items for the current page       |
| pageIndex  | integer                       | required, >= 0 | Zero-based index of the current page     |
| totalPages | integer                       | required, >= 1 | Total number of pages available          |

#### ProfileContentItemResponse (new backend DTO)

*A single content item in the paged response. Same shape as `MyContentItemResponse`.*

| Attribute   | Type     | Constraints                                      | Description                     |
| ----------- | -------- | ------------------------------------------------ | ------------------------------- |
| slug        | string   | required                                         | URL-friendly identifier         |
| title       | string   | required                                         | Content item title              |
| description | string   | required                                         | Short description               |
| tags        | string[] | required, may be empty                           | Tag labels                      |
| contentType | string   | required, one of [prompt, skill, agent, workflow] | Content type discriminator      |
| authorName  | string   | required                                         | Author's display name           |
| createdAt   | datetime | required                                         | When the item was created       |
| modifiedAt  | datetime | required                                         | When the item was last modified |

### 5.2 Relationships

- The `GET /api/profiles/{slug}/content` endpoint looks up a **UserProfile** by slug, then queries **ContentItem** entities filtered by that profile's `authorId`.
- The response maps directly to the **ContentItemList** component's props shape (`items`, `pageIndex`, `totalPages`).
- The page combines data from `GET /api/profiles/{slug}` (for **ProfileDetailsCard**) and `GET /api/profiles/{slug}/content` (for **ContentItemList**).

### 5.3 Domain Rules and Invariants

- **Slug lookup**: The profile slug must match an existing user profile. A non-existent slug results in a 404 response from the API.
- **Author filtering**: The endpoint returns only content items where `authorId` matches the looked-up profile's ID.
- **Page size**: Consistent with existing content listing — 12 items per page.
- **Sort order**: Newest first by `createdAt` descending.
- **Page bounds**: `pageIndex` must be >= 0. Requesting beyond the last page returns an empty items list with the correct `totalPages`.
- **Own-profile detection**: The frontend compares the route slug against the current user's slug from the Pinia store to determine whether to show the edit button. This is a UI-only concern — the API does not distinguish between own and other profiles.

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                     |
| ------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Security      | The `/api/profiles/{slug}/content` endpoint shall only be accessible to authenticated users                     |
| NFR-002 | Performance   | The endpoint shall respond in < 500ms at p95 for users with up to 500 content items                            |
| NFR-003 | Accessibility | The breadcrumb shall use semantic `<nav>` with `aria-label="Breadcrumb"` and `<ol>` markup                      |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                              | Expected Behavior                                                                    |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| EC-1 | Profile slug does not match any user                  | API returns 404; frontend shows "Profile not found" message                          |
| EC-2 | User has no published content items                   | Content list shows "No content items found", profile card shows 0 counts             |
| EC-3 | User has exactly 12 items (one full page)             | All items shown, no pager displayed (totalPages = 1)                                 |
| EC-4 | User has 13 items (just over one page)                | First page shows 12 items, pager shows 2 pages                                      |
| EC-5 | Network error while fetching profile                  | Page shows an error state                                                            |
| EC-6 | Network error while fetching content                  | Content list shows an error state; profile card may still display if already loaded   |
| EC-7 | Page query parameter is negative or non-numeric       | API treats it as page 0 (defaults to first page)                                     |
| EC-8 | Current user navigates to their own slug              | Edit button is shown (same experience as /profiles/me)                               |

## 8. Success Criteria

| ID     | Criterion                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in automated tests (backend: REST Assured, frontend: Vitest)         |
| SC-002 | The page displays the requested user's profile details and their content items                     |
| SC-003 | Pagination works correctly — navigating pages fetches and displays the correct content             |
| SC-004 | The API endpoint returns only the requested user's content, sorted newest first                    |
| SC-005 | The breadcrumb renders with the user's name                                                       |
| SC-006 | The Edit Profile button appears only when the current user views their own profile via slug        |
| SC-007 | A non-existent slug shows a 404 state                                                             |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-006 (ProfileDetailsCard)** — the profile card component used at the top of the page.
- **FEAT-005 (ContentItemList)** — the paginated list component used for the content section.
- **FEAT-002 (ContentItemCard)** — rendered by ContentItemList for each content item.
- **FEAT-007 (My Profile Page)** — this page mirrors its layout; the My Profile page already establishes the pattern.
- **Existing `GET /api/profiles/{slug}`** — provides the user's profile data by slug.
- **Existing `ContentItem` entity and `ContentItemRepository`** — queried for the new endpoint.

### 9.2 Constraints

- The `GET /api/profiles/{slug}/content` endpoint must be created as part of this feature.
- The page must be registered under the `DefaultLayout` route group to inherit the navigation shell and profile check guard.
- Page size (12 items) must match the existing content listings for consistency.
- The response shape should reuse or mirror the existing `MyContentPageResponse` / `MyContentItemResponse` DTOs to keep the frontend integration simple.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 5. Building Block View           | New backend endpoint in profiles module; new frontend ProfileView page               |
| 8. Crosscutting Concepts         | Authentication, slug-based routing, pagination patterns                               |
| 9. Architecture Decisions (ADRs) | ADR007 — functional slice organization; ADR008 — shadcn/vue as UI framework          |

## 10. Open Questions

None — all decisions have been resolved.

---

<!--
  CHECKLIST — Complete before moving to the Plan phase
  ====================================================
  - [x] Problem statement is clear and concise
  - [x] All user stories have acceptance scenarios
  - [x] Each functional requirement traces to a user story
  - [x] Domain model covers all entities mentioned in the requirements
  - [x] Domain rules and invariants are listed
  - [x] Edge cases cover failure modes, not just happy paths
  - [x] Non-functional requirements are specific and measurable
  - [x] Arc42 references point to the right sections
  - [x] No more than 3 [NEEDS CLARIFICATION] markers remain (0 present)
  - [x] Open questions are assigned and have a resolution path (none remaining)
-->
