# Feature Specification: Content Item List

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

| Field           | Value                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| Feature ID      | FEAT-005                                                                 |
| Status          | Draft                                                                    |
| Author          |                                                                          |
| Created         | 2026-02-26                                                               |
| Last updated    | 2026-02-26                                                               |
| Epic / Parent   | Content browsing and discovery                                           |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts)       |

### 1.1 Problem Statement

Promptyard displays lists of content items in multiple contexts — homepage, user profile, search results — each with paginated data. Without a shared list component, each page would implement its own list layout and pagination controls, leading to inconsistent behavior and duplicated logic.

### 1.2 Goal

A reusable `ContentItemList` component that renders a vertical list of `ContentItemCard` components (one per row) with a page navigation bar. The component receives paged content data as props and emits page-change events, making it agnostic to the data source.

### 1.3 Non-Goals

- **Data fetching** — the component does not call any API; parents provide data via props.
- **Extending the backend API** — adding `authorName` to `ContentItemResponse` is a separate feature.
- **Sorting and filtering controls** — these belong to the parent page, not the list component.
- **Grid/multi-column layouts** — the list renders one card per row only.
- **Infinite scroll or virtual scrolling** — pagination is button-based.
- **Showing total item count** — the pager shows page numbers and arrows only.

## 2. User Stories

### US-001: Browse a paged list of content items

**As a** user browsing content,
**I want** to see content items displayed as a vertical list of cards with page navigation,
**so that** I can scan through content without being overwhelmed by a single long list.

### US-002: Navigate between pages

**As a** user browsing content,
**I want** to click page numbers or prev/next arrows to move between pages,
**so that** I can access content on other pages.

### US-003: See feedback while content loads

**As a** user browsing content,
**I want** to see a skeleton placeholder while the page data is loading,
**so that** I know content is being fetched and the page doesn't feel broken.

### US-004: Understand when there's no content

**As a** user browsing content,
**I want** to see a clear message when there are no content items,
**so that** I know the list is intentionally empty rather than broken.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                        | Priority | User Story |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The component shall render a vertical list of `ContentItemCard` components, one card per row                                                       | Must     | US-001     |
| FR-002 | The component shall accept the list of content items and pagination metadata (current page index, total pages) as props                             | Must     | US-001     |
| FR-003 | The component shall render a pager bar below the list showing numbered page buttons and prev/next arrow buttons                                    | Must     | US-002     |
| FR-004 | The pager shall highlight the current page number                                                                                                  | Must     | US-002     |
| FR-005 | The prev arrow button shall be disabled when on the first page                                                                                     | Must     | US-002     |
| FR-006 | The next arrow button shall be disabled when on the last page                                                                                      | Must     | US-002     |
| FR-007 | When a user clicks a page number or arrow button, the component shall emit a page-change event with the target page index                          | Must     | US-002     |
| FR-008 | The component shall not display the total number of items                                                                                          | Must     | US-001     |
| FR-009 | When a `loading` prop is true, the component shall display a skeleton layout with 3 placeholder card shapes instead of content                     | Must     | US-003     |
| FR-010 | When the items list is empty and loading is false, the component shall display a "No content items found" message                                  | Must     | US-004     |
| FR-011 | When the total number of pages exceeds the visible page button limit, the pager shall truncate with ellipsis (e.g., 1 2 3 ... 18 19 20)           | Must     | US-002     |

## 4. Acceptance Scenarios

### SC-001: List renders content item cards (FR-001, FR-002)

```gherkin
Given a list of 5 content items and pagination metadata (page 0, total pages 3)
When the ContentItemList is rendered
Then 5 ContentItemCard components are displayed in a vertical layout, one per row
  And each card receives the corresponding item's title, description, tags, contentType, authorName, and url
```

### SC-002: Pager displays page numbers and arrows (FR-003, FR-004)

```gherkin
Given a list of content items with pagination metadata (page 1, total pages 5)
When the ContentItemList is rendered
Then a pager bar is displayed below the list
  And the pager shows numbered page buttons
  And the pager shows a previous arrow button and a next arrow button
  And the current page button (page 2) is visually highlighted
```

### SC-003: Prev arrow disabled on first page (FR-005)

```gherkin
Given pagination metadata with page index 0
When the ContentItemList is rendered
Then the previous arrow button is disabled
  And the next arrow button is enabled
```

### SC-004: Next arrow disabled on last page (FR-006)

```gherkin
Given pagination metadata with page index 4 and total pages 5
When the ContentItemList is rendered
Then the next arrow button is disabled
  And the previous arrow button is enabled
```

### SC-005: Clicking a page number emits page-change event (FR-007)

```gherkin
Given a ContentItemList showing page 0 of 5
When the user clicks page number 3
Then the component emits a page-change event with target page index 2
```

### SC-006: Clicking the next arrow emits page-change event (FR-007)

```gherkin
Given a ContentItemList showing page 0 of 5
When the user clicks the next arrow button
Then the component emits a page-change event with target page index 1
```

### SC-007: Clicking the prev arrow emits page-change event (FR-007)

```gherkin
Given a ContentItemList showing page 2 of 5
When the user clicks the previous arrow button
Then the component emits a page-change event with target page index 1
```

### SC-008: Total item count is not displayed (FR-008)

```gherkin
Given a list of content items with pagination metadata
When the ContentItemList is rendered
Then no total item count is displayed anywhere in the component
```

### SC-009: Loading state shows skeleton cards (FR-009)

```gherkin
Given the loading prop is set to true
When the ContentItemList is rendered
Then 3 skeleton card placeholders are displayed
  And no content item cards are shown
  And no pager is shown
```

### SC-010: Empty state shows message (FR-010)

```gherkin
Given an empty items list and loading is false
When the ContentItemList is rendered
Then the text "No content items found" is displayed
  And no pager is shown
```

### SC-011: Pager truncates with ellipsis for many pages (FR-011)

```gherkin
Given pagination metadata with page index 0 and total pages 20
When the ContentItemList is rendered
Then the pager shows page numbers with ellipsis truncation (e.g., 1 2 3 ... 19 20)
  And not all 20 page numbers are displayed simultaneously
```

### SC-012: Pager hidden when only one page (FR-003)

```gherkin
Given a list of content items with pagination metadata (page 0, total pages 1)
When the ContentItemList is rendered
Then the content item cards are displayed
  And no pager bar is shown
```

## 5. Domain Model

This feature is a pure frontend component — it does not introduce new entities or persistence. The domain model describes the component's data contract.

### 5.1 Entities

#### ContentItemListProps

*The data contract for the ContentItemList component.*

| Attribute  | Type                  | Constraints              | Description                                              |
| ---------- | --------------------- | ------------------------ | -------------------------------------------------------- |
| items      | ContentItemSummary[]  | required, may be empty   | The content items to display on the current page         |
| pageIndex  | integer               | required, >= 0           | Zero-based index of the current page                     |
| totalPages | integer               | required, >= 1           | Total number of pages available                          |
| loading    | boolean               | optional, defaults false | When true, shows skeleton state instead of content       |

#### ContentItemSummary

*The data shape for a single content item passed into the list. Maps to what `ContentItemCard` needs.*

| Attribute   | Type     | Constraints                                       | Description                              |
| ----------- | -------- | ------------------------------------------------- | ---------------------------------------- |
| title       | string   | required, non-empty                               | Content item title                       |
| description | string   | required                                          | Short description                        |
| tags        | string[] | required, may be empty                            | Tag labels                               |
| contentType | enum     | required, one of [prompt, skill, agent, workflow] | Determines card icon and border color    |
| authorName  | string   | required, non-empty                               | Author's display name                    |
| url         | string   | required, valid route path                        | Navigation target for the card title link |

### 5.2 Relationships

- A **ContentItemList** renders zero or more **ContentItemSummary** items, each passed to a **ContentItemCard** (FEAT-002).
- The parent page is responsible for mapping API responses (e.g., `ContentItemPageResponse`) to the `ContentItemListProps` shape, including resolving `authorName` and `url` which are not directly in the API response today.

### 5.3 Events

*The component emits events rather than managing navigation state internally.*

| Event       | Payload                              | Description                                                    |
| ----------- | ------------------------------------ | -------------------------------------------------------------- |
| page-change | integer (target page index, zero-based) | Emitted when the user clicks a page number or arrow button |

### 5.4 Domain Rules and Invariants

- **Page index bounds**: `pageIndex` must be >= 0 and < `totalPages`.
- **Loading overrides content**: When `loading` is true, the skeleton is shown regardless of whether `items` contains data.
- **Empty state requires not loading**: The "No content items found" message only appears when `items` is empty *and* `loading` is false.
- **Pager visibility**: The pager is only shown when `totalPages` > 1 and `loading` is false.

## 6. Non-Functional Requirements

| ID      | Category       | Requirement                                                                                                              |
| ------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| NFR-001 | Accessibility  | The pager buttons shall be keyboard-navigable and have appropriate aria-labels (e.g., "Go to page 3", "Go to previous page", "Go to next page") |
| NFR-002 | Accessibility  | Disabled arrow buttons shall use `aria-disabled` and not receive focus via tab navigation                                |
| NFR-003 | Accessibility  | The empty state message shall use an appropriate ARIA role so screen readers announce it                                 |
| NFR-004 | Responsiveness | The component shall fill its container width — layout is the parent's responsibility                                     |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                           | Expected Behavior                                                  |
| ---- | -------------------------------------------------- | ------------------------------------------------------------------ |
| EC-1 | Items list is empty and loading is false           | Display "No content items found" message, no pager                 |
| EC-2 | Total pages is 1                                   | Display content items, no pager                                    |
| EC-3 | Loading is true while items array has stale data   | Skeleton is shown, stale items are ignored                         |
| EC-4 | User clicks the already-active page number         | No page-change event is emitted                                    |
| EC-5 | Total pages is very large (100+)                   | Pager truncates with ellipsis, does not render 100 buttons         |
| EC-6 | Loading transitions from true to false with empty items | Skeleton disappears, empty state message appears              |

## 8. Success Criteria

| ID     | Criterion                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| SC-001 | All acceptance scenarios pass as Vitest unit tests                                                                  |
| SC-002 | The component renders correctly with 0, 1, and 12 items                                                            |
| SC-003 | Pager navigation emits correct page-change events for all button types (numbers, prev, next)                       |
| SC-004 | Skeleton loading state displays 3 placeholder cards and hides pager                                                |
| SC-005 | Component has a Storybook story demonstrating all states (populated, empty, loading, single page, many pages)      |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-002 (ContentItemCard)** — this component renders `ContentItemCard` for each item
- **shadcn/vue Pagination component** — used for the pager bar with ellipsis truncation
- **shadcn/vue Skeleton component** — used for the loading state placeholders

### 9.2 Constraints

- The component does not fetch data — all data comes via props.
- The `authorName` field is not yet in the backend `ContentItemResponse`; parent pages must resolve it until the API is extended.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| 5. Building Block View           | New component in the frontend content module                                          |
| 8. Crosscutting Concepts         | UI component patterns, shadcn/vue usage                                               |
| 9. Architecture Decisions (ADRs) | ADR008 — shadcn/vue as UI framework, ADR007 — functional slice organization           |

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
