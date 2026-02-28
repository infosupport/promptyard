# Feature Specification: Homepage

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
| Feature ID      | FEAT-009                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-27                                                         |
| Last updated    | 2026-02-27                                                         |
| Epic / Parent   | Content browsing and discovery                                     |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

The Promptyard homepage is currently a static placeholder with no useful content. Authenticated users land on a page that doesn't help them discover what others have shared or encourage them to contribute. There's no way to browse recently published content without knowing a direct URL.

### 1.2 Goal

The homepage serves as the primary entry point for authenticated users, providing two things: (1) a hero section that motivates users to share content via a "Create" dropdown menu (matching the navigation bar), and (2) a paginated list of recently published content items sorted by most recently active first, showing 12 items per page.

### 1.3 Non-Goals

- **Search or filtering** — the homepage shows a chronological feed only; search belongs to a future feature.
- **Personalized recommendations** — all users see the same content in the same order.
- **Content type tabs or category filtering** — all content types appear in a single mixed list.
- **New backend endpoints** — the existing `GET /api/content?page=N` endpoint is sufficient.
- **Unauthenticated landing page** — all access requires login.

## 2. User Stories

### US-001: See a motivational hero with a create action

**As an** authenticated user visiting the homepage,
**I want** to see a hero section that encourages me to share content and provides a "Create" dropdown menu,
**so that** I'm motivated to contribute and can immediately start creating content.

### US-002: Browse recently published content

**As an** authenticated user visiting the homepage,
**I want** to see a paginated list of recently published content items (most recently active first, 12 per page),
**so that** I can discover what others have shared without being overwhelmed.

### US-003: Navigate between pages of content

**As an** authenticated user browsing the homepage,
**I want** to page through the content list with the current page reflected in the URL,
**so that** I can see older content and share or bookmark a specific page.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                       | Priority | User Story |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The homepage shall display a hero section above the content list                                                                                                   | Must     | US-001     |
| FR-002 | The hero section shall display a heading and a motivational message. Sample copy: heading "Help your colleagues adopt AI", message "Share your prompts, skills, agents, and workflows with the rest of the organization." | Must     | US-001     |
| FR-003 | The hero section shall include a "Create" dropdown menu with the same content type options (Prompt, Skill, Agent, Workflow) as the navigation bar                   | Must     | US-001     |
| FR-004 | The homepage shall fetch content items from `GET /api/content?page=N` and display them using the `ContentItemList` component (FEAT-005)                             | Must     | US-002     |
| FR-005 | The content list shall display 12 items per page, sorted by `modifiedAt` then `createdAt` descending (as returned by the API)                                      | Must     | US-002     |
| FR-006 | When the user navigates to a different page via the pager, the homepage shall update the URL query parameter `page` (1-based) and fetch that page                   | Must     | US-003     |
| FR-007 | While content is loading, the homepage shall show the `ContentItemList` loading/skeleton state                                                                      | Must     | US-002     |
| FR-008 | When there are no content items at all, the homepage shall show the `ContentItemList` empty state                                                                   | Must     | US-002     |
| FR-009 | When the homepage loads with a `page` query parameter, the homepage shall fetch and display that page of content (default: page 1)                                  | Must     | US-003     |

## 4. Acceptance Scenarios

### SC-001: Hero section is displayed (FR-001, FR-002)

```gherkin
Given an authenticated user navigates to the homepage
When the page renders
Then a hero section is displayed above the content list
  And the hero heading reads "Help your colleagues adopt AI"
  And the hero message reads "Share your prompts, skills, agents, and workflows with the rest of the organization."
```

### SC-002: Hero create dropdown menu (FR-003)

```gherkin
Given an authenticated user is on the homepage
When the user clicks the "Create" button in the hero section
Then a dropdown menu appears with options: Prompt, Skill, Agent, Workflow
  And clicking "Prompt" navigates to /content/prompts/new
```

### SC-003: Recently published content loads on first visit (FR-004, FR-005, FR-009)

```gherkin
Given there are 25 content items in the system
When an authenticated user navigates to the homepage without a page query parameter
Then the ContentItemList displays the 12 most recently active content items
  And the pager shows page 1 as the current page
  And the URL does not contain a page query parameter
```

### SC-004: Loading state while fetching content (FR-007)

```gherkin
Given an authenticated user navigates to the homepage
When the content is being fetched from the API
Then the ContentItemList displays skeleton placeholders
  And the hero section is visible above the skeleton
```

### SC-005: Navigate to a specific page via pager (FR-006)

```gherkin
Given an authenticated user is on the homepage viewing page 1
When the user clicks page 2 in the pager
Then the URL updates to /?page=2
  And the ContentItemList displays the content items for page 2
```

### SC-006: Deep link to a specific page (FR-009)

```gherkin
Given there are 25 content items in the system
When an authenticated user navigates to /?page=2
Then the ContentItemList displays content items 13-24
  And the pager shows page 2 as the current page
```

### SC-007: Empty state when no content exists (FR-008)

```gherkin
Given there are no content items in the system
When an authenticated user navigates to the homepage
Then the hero section is displayed
  And the ContentItemList shows the empty state message
  And no pager is shown
```

### SC-008: Invalid page parameter defaults to page 1 (FR-009)

```gherkin
Given there are 25 content items in the system
When an authenticated user navigates to /?page=-1
Then the homepage displays page 1 of content
```

### SC-009: Page parameter beyond last page (FR-009)

```gherkin
Given there are 25 content items (3 pages)
When an authenticated user navigates to /?page=99
Then the homepage displays an empty content list
  And the hero section is still visible
```

## 5. Domain Model

This feature is primarily a frontend page composition — it does not introduce new entities or persistence. The domain model describes the data contracts and component structure.

### 5.1 Entities

#### HeroSection

*The static hero banner displayed at the top of the homepage.*

| Attribute | Type   | Constraints    | Description                                                                                       |
| --------- | ------ | -------------- | ------------------------------------------------------------------------------------------------- |
| heading   | string | static content | "Help your colleagues adopt AI"                                                                   |
| message   | string | static content | "Share your prompts, skills, agents, and workflows with the rest of the organization."             |
| actions   | —      | Create dropdown | Reuses the same content type dropdown menu as the navigation bar (Prompt, Skill, Agent, Workflow) |

#### HomepageState

*The runtime state managed by the homepage view.*

| Attribute  | Type                | Constraints                        | Description                               |
| ---------- | ------------------- | ---------------------------------- | ----------------------------------------- |
| items      | ContentItemSummary[] | from API response                 | Content items for the current page        |
| pageIndex  | integer             | >= 0, derived from URL `page` - 1 | Zero-based page index sent to the API     |
| totalPages | integer             | >= 0, from API response            | Total number of pages                     |
| loading    | boolean             | defaults true on fetch             | Whether content is currently being fetched |

### 5.2 Relationships

- The **homepage view** renders one **HeroSection** (static) and one **ContentItemList** (FEAT-005).
- The **ContentItemList** receives `items`, `pageIndex`, `totalPages`, and `loading` from **HomepageState**.
- The **HeroSection** reuses the **NavigationCreateMenu** component for its dropdown action.
- The homepage reads the `page` query parameter from the URL and converts it (1-based to 0-based) to call `GET /api/content?page=N`.

### 5.3 Domain Rules and Invariants

- **Page parameter conversion**: The URL uses 1-based pages; the API uses 0-based. `pageIndex = max(0, urlPage - 1)`.
- **Default page**: When no `page` query parameter is present, default to page 1 (pageIndex 0).
- **Invalid page handling**: Non-numeric, zero, or negative `page` values resolve to page 1.
- **Hero always visible**: The hero section is displayed regardless of loading state, empty state, or page number.

## 6. Non-Functional Requirements

| ID      | Category       | Requirement                                                                                                       |
| ------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Performance    | The homepage shall display content (or skeleton state) within 200ms of the API response arriving                   |
| NFR-002 | Accessibility  | The hero section heading shall use an appropriate heading level (h1) for page structure                            |
| NFR-003 | Accessibility  | The hero Create dropdown shall be keyboard-navigable, consistent with the navigation bar's Create dropdown         |
| NFR-004 | Responsiveness | The hero section and content list shall be usable on viewports from 375px (mobile) to 1440px+ (desktop)            |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                                       | Expected Behavior                                                    |
| ---- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| EC-1 | No `page` query parameter in URL                               | Default to page 1 (pageIndex 0)                                      |
| EC-2 | `page` query parameter is non-numeric (e.g. `?page=abc`)       | Treat as page 1                                                      |
| EC-3 | `page` query parameter is negative (e.g. `?page=-3`)           | Treat as page 1                                                      |
| EC-4 | `page` query parameter is 0                                     | Treat as page 1                                                      |
| EC-5 | `page` exceeds total pages (e.g. `?page=99` with 3 pages)      | Display empty content list, hero remains visible                      |
| EC-6 | API request fails (network error, 5xx)                          | Show a static error message in the content area, hero remains visible |
| EC-7 | User navigates to a new page while previous fetch is in-flight  | Cancel the in-flight request and fetch the new page                   |
| EC-8 | Only 1 page of content exists                                   | Content displays normally, no pager shown (handled by ContentItemList)|

## 8. Success Criteria

| ID     | Criterion                                                                                |
| ------ | ---------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass as Vitest unit tests                                        |
| SC-002 | Homepage displays hero section with Create dropdown matching navigation bar behavior      |
| SC-003 | Paged content loads from API and URL `page` parameter is kept in sync                     |
| SC-004 | Hard refresh on `/?page=2` loads the correct page of content                              |
| SC-005 | Homepage handles empty, loading, and error states gracefully                              |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-005 (ContentItemList)** — renders the paged content list
- **FEAT-002 (ContentItemCard)** — rendered by ContentItemList for each item
- **NavigationCreateMenu component** — reused in the hero section for the Create dropdown
- **`GET /api/content?page=N`** — existing backend endpoint, no changes needed

### 9.2 Constraints

- No backend changes required — the existing API already returns the correct sort order and page size (12).
- The hero copy is initial and may be refined later, but the structure (heading + message + Create dropdown) is fixed.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 5. Building Block View           | Homepage view composes existing frontend components                                  |
| 8. Crosscutting Concepts         | UI component patterns, shadcn/vue usage, frontend integration via Quinoa             |
| 9. Architecture Decisions (ADRs) | ADR008 — shadcn/vue as UI framework, ADR007 — functional slice organization          |

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
