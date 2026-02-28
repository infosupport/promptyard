# Feature Specification: My Profile Page

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
| Feature ID      | FEAT-007                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-26                                                         |
| Last updated    | 2026-02-26                                                         |
| Epic / Parent   | Profile page                                                       |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

The application has no dedicated page where a user can see their own profile and browse their published content. The `ProfileDetailsCard` (FEAT-006) and `ContentItemList` (FEAT-005) components exist but have no page to live on. Additionally, there is no backend endpoint to retrieve content items filtered by the current user — only `GET /api/content?page=N` which returns all content globally.

### 1.2 Goal

A profile page at `/profiles/me` that shows the current user's `ProfileDetailsCard` at the top and a paginated list of their content items sorted newest to oldest below it. A new backend endpoint at `GET /api/profiles/me/content?page=N` serves the user's content items with pagination. A breadcrumb at the top provides navigation context: Profiles / Me.

### 1.3 Non-Goals

- **Viewing other users' profiles** — this page is exclusively for the current (authenticated) user. Public profile pages at `/profiles/{slug}` are a separate feature.
- **Editing the profile inline** — the "Edit Profile" button navigates away; no inline editing on this page.
- **Filtering or searching content** — the list shows all content types by the current user, no filter controls.
- **Content creation from this page** — no "New Prompt" button or similar.
- **Sorting controls** — the sort order (newest first) is fixed.

## 2. User Stories

### US-001: View my profile summary

**As a** logged-in user,
**I want** to see my profile details (avatar, name, job title, business unit, membership date, and content counts) at the top of the page,
**so that** I can verify my profile information at a glance.

### US-002: Browse my content items

**As a** logged-in user,
**I want** to see a paginated list of content items I have published, sorted from newest to oldest,
**so that** I can review and find my own contributions.

### US-003: Navigate between pages of my content

**As a** logged-in user,
**I want** to click page numbers or prev/next arrows to move between pages of my content,
**so that** I can access older content items.

### US-004: Navigate via breadcrumb

**As a** logged-in user,
**I want** a breadcrumb trail showing Profiles / Me,
**so that** I can orient myself and navigate back.

### US-005: Edit my profile

**As a** logged-in user viewing my profile page,
**I want** an "Edit Profile" button on the profile card,
**so that** I can navigate to update my profile information.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                    | Priority | User Story     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------- |
| FR-001 | The system shall expose a page at route `/profiles/me`                                                                                                         | Must     | US-001         |
| FR-002 | The page shall fetch the current user's profile from `GET /api/profiles/me`                                                                                    | Must     | US-001         |
| FR-003 | The page shall display the `ProfileDetailsCard` with the current user's data and `showEditButton` set to true                                                  | Must     | US-001, US-005 |
| FR-004 | The system shall expose a `GET /api/profiles/me/content?page={pageIndex}` endpoint returning the current user's content items, paginated and sorted by creation date descending (newest first) | Must     | US-002         |
| FR-005 | The API endpoint shall return content items with page size 12 (consistent with `GET /api/content`) and include `authorName` in each item's response alongside slug, title, description, tags, contentType, createdAt, and modifiedAt | Must     | US-002         |
| FR-006 | The page shall display the content items using the `ContentItemList` component                                                                                  | Must     | US-002         |
| FR-007 | When the user navigates between pages, the page shall fetch the corresponding page of content from the API                                                      | Must     | US-003         |
| FR-008 | The page shall render a breadcrumb with two segments: "Profiles" (plain text, not linked) and "Me" (current page, plain text)                                   | Must     | US-004         |
| FR-009 | The page shall show loading states while fetching profile and content data                                                                                       | Should   | US-001, US-002 |
| FR-010 | The page shall require authentication (consistent with existing route guards and backend `@Authenticated` annotation)                                            | Must     | US-001         |
| FR-011 | The API endpoint shall only return content items authored by the authenticated user                                                                              | Must     | US-002         |

## 4. Acceptance Scenarios

### SC-001: Profile details displayed (FR-002, FR-003)

```gherkin
Given a logged-in user with full name "Willem Meints", job title "Machine Learning Engineer",
      business unit "Unit AI & Data", member since "2024-01-15",
      12 prompts, 0 skills, 0 agents, and 0 workflows
When the user navigates to /profiles/me
Then the ProfileDetailsCard displays the user's avatar, name, job title, business unit,
      membership date, and content counts
  And an "Edit Profile" button is visible
```

### SC-002: Content items listed with pagination (FR-004, FR-005, FR-006)

```gherkin
Given the current user has 25 published content items
When the user navigates to /profiles/me
Then the page displays the first page of content items (up to 12 items)
  And the content items are sorted from newest to oldest
  And a pager bar is displayed below the list
```

### SC-003: Navigate to next page of content (FR-007)

```gherkin
Given the current user has 25 content items and is viewing page 1
When the user clicks page number 2 in the pager
Then the page fetches and displays the second page of content items
  And the pager highlights page 2 as the current page
```

### SC-004: Breadcrumb displayed (FR-008)

```gherkin
Given the user is on the /profiles/me page
When the page is rendered
Then a breadcrumb is displayed with segments "Profiles" > "Me"
  And "Profiles" is plain text (not linked)
  And "Me" is plain text (current page)
```

### SC-005: Empty content state (FR-006)

```gherkin
Given the current user has no published content items
When the user navigates to /profiles/me
Then the ProfileDetailsCard is displayed with all counts at 0
  And the content list shows "No content items found"
  And no pager is shown
```

### SC-006: Loading state (FR-009)

```gherkin
Given the user navigates to /profiles/me
When the profile and content API requests are in progress
Then the page displays loading indicators for both the profile card and the content list
  And once data loads, the loading indicators are replaced with actual content
```

### SC-007: API returns current user's content only (FR-004, FR-011)

```gherkin
Given user "alice" has 3 prompts and user "bob" has 5 prompts
  And user "alice" is authenticated
When a GET request is made to /api/profiles/me/content?page=0
Then the response contains only alice's 3 content items
  And none of bob's content items are included
```

### SC-008: API content sorted newest first (FR-004)

```gherkin
Given the current user has content items created at different times
When a GET request is made to /api/profiles/me/content?page=0
Then the items are sorted by creation date descending (newest first)
```

### SC-009: API response includes author name (FR-005)

```gherkin
Given the current user "Willem Meints" has published content items
When a GET request is made to /api/profiles/me/content?page=0
Then each content item in the response includes authorName "Willem Meints"
```

### SC-010: Unauthenticated access rejected (FR-010)

```gherkin
Given no user is authenticated
When a request is made to /profiles/me or /api/profiles/me/content
Then the system redirects to the login page (HTTP 302)
```

## 5. Domain Model

### 5.1 Entities

#### MyContentPageResponse (new backend DTO)

*The API response from `GET /api/profiles/me/content?page={pageIndex}`. Wraps a page of the current user's content items.*

| Attribute  | Type                    | Constraints    | Description                              |
| ---------- | ----------------------- | -------------- | ---------------------------------------- |
| items      | MyContentItemResponse[] | required       | Content items for the current page       |
| pageIndex  | integer                 | required, >= 0 | Zero-based index of the current page     |
| totalPages | integer                 | required, >= 1 | Total number of pages available          |

#### MyContentItemResponse (new backend DTO)

*A single content item in the paged response. Extends the existing `ContentItemResponse` shape with `authorName`.*

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

- The `GET /api/profiles/me/content` endpoint queries **ContentItem** entities filtered by the authenticated user's **UserProfile** (via `authorId`).
- The **MyContentPageResponse** maps directly to the **ContentItemList** component's props shape (`items`, `pageIndex`, `totalPages`).
- The page combines data from `GET /api/profiles/me` (for **ProfileDetailsCard**) and `GET /api/profiles/me/content` (for **ContentItemList**).

### 5.3 Domain Rules and Invariants

- **Author filtering**: The endpoint returns only content items where `authorId` matches the authenticated user's profile ID. This is enforced server-side via `SecurityIdentity`.
- **Page size**: Consistent with the existing content listing — 12 items per page.
- **Sort order**: Newest first by `createdAt` descending (different from the global listing which uses `modifiedAt` descending).
- **Page bounds**: `pageIndex` must be >= 0. Requesting beyond the last page returns an empty items list with the correct `totalPages`.
- **Content counts consistency**: The counts shown in the `ProfileDetailsCard` should be consistent with what the content list shows (both derive from the same underlying data).

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| NFR-001 | Security      | The `/api/profiles/me/content` endpoint shall only be accessible to authenticated users                    |
| NFR-002 | Security      | The endpoint shall only return content belonging to the authenticated user — no access to other users' data |
| NFR-003 | Performance   | The endpoint shall respond in < 500ms at p95 for users with up to 500 content items                       |
| NFR-004 | Accessibility | The breadcrumb shall use semantic `<nav>` with `aria-label="Breadcrumb"` and `<ol>` markup                 |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                              | Expected Behavior                                                           |
| ---- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| EC-1 | User has no published content items                   | Content list shows "No content items found", profile card shows 0 counts    |
| EC-2 | User has exactly 12 items (one full page)             | All items shown, no pager displayed (totalPages = 1)                        |
| EC-3 | User has 13 items (just over one page)                | First page shows 12 items, pager shows 2 pages                              |
| EC-4 | User has no profile yet (hasn't completed onboarding) | Page redirects to onboarding — handled by existing route guard              |
| EC-5 | Network error while fetching content                  | Content list shows an error state; profile card may still display if loaded  |
| EC-6 | Page query parameter is negative or non-numeric       | API treats it as page 0 (defaults to first page)                            |

## 8. Success Criteria

| ID     | Criterion                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in automated tests (backend: REST Assured, frontend: Vitest)          |
| SC-002 | The page displays the current user's profile details and their content items                        |
| SC-003 | Pagination works correctly — navigating pages fetches and displays the correct content              |
| SC-004 | The API endpoint returns only the authenticated user's content, sorted newest first                 |
| SC-005 | The breadcrumb renders with correct segments                                                       |
| SC-006 | Empty and loading states display correctly                                                          |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-006 (ProfileDetailsCard)** — the profile card component used at the top of the page.
- **FEAT-005 (ContentItemList)** — the paginated list component used for the content section.
- **FEAT-002 (ContentItemCard)** — rendered by ContentItemList for each content item.
- **Existing `GET /api/profiles/me`** — provides the current user's profile data.
- **Existing `ContentItem` entity and `ContentItemRepository`** — queried for the new endpoint.

### 9.2 Constraints

- The `GET /api/profiles/me/content` endpoint must be created as part of this feature.
- The page must be registered under the `DefaultLayout` route group to inherit the navigation shell and profile check guard.
- Page size (12 items) must match the existing global content listing for consistency.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 5. Building Block View           | New backend endpoint in profiles module; new frontend MyProfileView page             |
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
