# Feature Specification: Search Results Page

## 1. Overview

| Field           | Value                                              |
| --------------- | -------------------------------------------------- |
| Feature ID      | FEAT-014                                           |
| Status          | Draft                                              |
| Author          | Claude Code                                        |
| Created         | 2026-02-28                                         |
| Last updated    | 2026-02-28                                         |
| Epic / Parent   | Content browsing and discovery                     |
| Arc42 reference | 5. Building Block View, 6. Runtime View, 8. Crosscutting Concepts |

### 1.1 Problem Statement

Promptyard indexes all content items in OpenSearch (FEAT-013) but provides no way for users to search that index. The navigation bar contains a placeholder search input that does nothing. As the content library grows, users need a way to find content by keyword across titles, descriptions, tags, and body text.

### 1.2 Goal

Users can type a query into the navigation search bar (or directly on the search results page), navigate to `/search?q=<query>`, and see a paginated list of matching content items displayed as content item cards — reusing the same card and list components from the homepage.

### 1.3 Non-Goals

- **Filters** — no filtering by content type, tag, or author (future feature)
- **Autocomplete / search suggestions** — the search bar submits a plain text query
- **Fuzzy matching / typo tolerance** — use OpenSearch defaults; tuning is a separate concern
- **Search analytics** — no tracking of queries or click-through rates
- **Ranking tuning** — use OpenSearch default relevance scoring; no custom boosting
- **Backfill/reindex** — existing FEAT-013 limitation remains; not addressed here

## 2. User Stories

### US-001: Search for content via navigation bar

**As an** authenticated user,
**I want** to type a query into the navigation search bar and press Enter,
**so that** I'm taken to a search results page showing matching content items.

### US-002: View search results

**As an** authenticated user on the search results page,
**I want** to see matching content items displayed as content item cards in a paginated list,
**so that** I can browse results and find what I'm looking for.

### US-003: Refine search from results page

**As an** authenticated user viewing search results,
**I want** to edit the query in a search input on the results page and re-search,
**so that** I can refine my search without scrolling to the navigation bar.

### US-004: Page through search results

**As an** authenticated user viewing search results,
**I want** to navigate between pages of results with the current page reflected in the URL,
**so that** I can see more results and share/bookmark a specific results page.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                      | Priority | User Story |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The NavigationSearch component shall submit the query by navigating to `/search?q={query}` when the user presses Enter                                           | Must     | US-001     |
| FR-002 | The system shall provide a `GET /api/search?q={query}&page={pageIndex}` endpoint that queries the OpenSearch `content_items` index and returns paginated results  | Must     | US-002     |
| FR-003 | The search endpoint shall return results in the same `ContentItemPageResponse` format used by `GET /api/content` (items, pageIndex, totalPages)                   | Must     | US-002     |
| FR-004 | The search results page shall display a search input pre-filled with the current query from the URL                                                               | Must     | US-003     |
| FR-005 | When the user submits a new query from the search results page, the URL shall update to `/search?q={newQuery}` (resetting to page 1) and results shall refresh    | Must     | US-003     |
| FR-006 | The search results page shall display results using the `ContentItemList` component with 12 items per page                                                        | Must     | US-002     |
| FR-007 | When the user navigates to a different page via the pager, the URL shall update to `/search?q={query}&page={page}` and results shall refresh                      | Must     | US-004     |
| FR-008 | When the search results page loads with `q` and optional `page` query parameters, it shall fetch and display that page of results                                 | Must     | US-004     |
| FR-009 | When the query is empty or missing, the search results page shall show an empty state message prompting the user to enter a search term                            | Must     | US-002     |
| FR-010 | When the query returns no matches, the search results page shall show a "no results found" message                                                                | Must     | US-002     |
| FR-011 | The search endpoint shall perform a full-text search across the `title`, `content`, `description`, `tags`, and `authorFullName` fields in the OpenSearch index     | Must     | US-002     |
| FR-012 | The system shall extend the OpenSearch `content_items` index to include `title` (text), `createdAt` (date), `modifiedAt` (date), and `authorSlug` (keyword) fields | Must     | US-002     |
| FR-013 | The indexing pipeline shall include `title`, `createdAt`, `modifiedAt`, and `authorSlug` in the `ContentItemEvent` and `ContentItemSearchDocument`                 | Must     | US-002     |
| FR-014 | The search endpoint shall return results sorted by OpenSearch relevance score (default `_score` descending)                                                        | Must     | US-002     |
| FR-015 | The search endpoint shall require authentication consistent with other API endpoints                                                                               | Must     | US-002     |

## 4. Acceptance Scenarios

### SC-001: Navigation search bar submits query (FR-001)

```gherkin
Given an authenticated user is on any page with the navigation bar visible
When the user types "kotlin" into the navigation search bar and presses Enter
Then the browser navigates to /search?q=kotlin
```

### SC-002: Search results displayed for a matching query (FR-002, FR-003, FR-006, FR-011)

```gherkin
Given the OpenSearch index contains 15 content items matching the term "kotlin"
When an authenticated user navigates to /search?q=kotlin
Then the search results page displays the first 12 matching content items as content item cards
  And each card shows the item's title, description, tags, author name, and content type
  And the pager indicates page 1 of 2
```

### SC-003: Search results sorted by relevance (FR-014)

```gherkin
Given a prompt with title "Kotlin Best Practices" and a prompt with "kotlin" only in its tags
When an authenticated user searches for "kotlin"
Then the results are ordered by OpenSearch relevance score descending
```

### SC-004: Search input on results page pre-filled with query (FR-004)

```gherkin
Given an authenticated user navigates to /search?q=kotlin
When the search results page renders
Then the search input on the results page contains "kotlin"
```

### SC-005: Refine search from results page (FR-005)

```gherkin
Given an authenticated user is on /search?q=kotlin viewing results
When the user changes the search input to "quarkus" and presses Enter
Then the URL updates to /search?q=quarkus
  And the results refresh to show content matching "quarkus"
  And the page resets to page 1
```

### SC-006: Page through search results (FR-007)

```gherkin
Given an authenticated user is on /search?q=kotlin viewing page 1 of 2
When the user clicks page 2 in the pager
Then the URL updates to /search?q=kotlin&page=2
  And the results display items 13-15
```

### SC-007: Deep link to specific search results page (FR-008)

```gherkin
Given the OpenSearch index contains 15 content items matching "kotlin"
When an authenticated user navigates to /search?q=kotlin&page=2
Then the search results page displays items 13-15
  And the search input contains "kotlin"
  And the pager shows page 2 as the current page
```

### SC-008: Empty query shows empty state (FR-009)

```gherkin
Given an authenticated user navigates to /search without a q parameter
When the search results page renders
Then the page displays a message prompting the user to enter a search term
  And no results are fetched from the API
```

### SC-009: Empty query string shows empty state (FR-009)

```gherkin
Given an authenticated user navigates to /search?q=
When the search results page renders
Then the page displays a message prompting the user to enter a search term
  And no results are fetched from the API
```

### SC-010: No matching results (FR-010)

```gherkin
Given no content items in the OpenSearch index match "xyznonexistent"
When an authenticated user navigates to /search?q=xyznonexistent
Then the search results page displays a "no results found" message
  And the search input contains "xyznonexistent"
```

### SC-011: Index includes title, createdAt, modifiedAt, authorSlug (FR-012, FR-013)

```gherkin
Given a content author creates a prompt with title "My Prompt" at 2026-02-28T10:00:00Z
When the system processes the content item created event
Then the OpenSearch document contains the title "My Prompt"
  And the document contains the createdAt timestamp
  And the document contains a null modifiedAt
  And the document contains the author's profile slug
```

### SC-012: Search matches on title (FR-011)

```gherkin
Given a prompt with title "Kubernetes Deployment Guide" and description "How to deploy apps"
When an authenticated user searches for "kubernetes"
Then the prompt appears in the search results
```

## 5. Domain Model

This feature does not introduce new database entities. It extends the existing search document and event model from FEAT-013 and adds a search API contract.

### 5.1 Entities

No new database entities. The feature operates on existing `ContentItem` and `UserProfile` entities.

#### ContentItemSearchDocument (extended from FEAT-013)

*Denormalized representation of a content item stored in the OpenSearch index. Extended with four new fields: title, createdAt, modifiedAt, and authorSlug.*

| Attribute      | Type           | Constraints                        | Description                                    |
| -------------- | -------------- | ---------------------------------- | ---------------------------------------------- |
| id             | long           | Document ID, from ContentItem.id   | OpenSearch document identifier                 |
| slug           | string         | required                           | URL-friendly identifier                        |
| title          | string         | required                           | Content item title (**new**)                   |
| contentType    | string         | required                           | Discriminator value (e.g., "prompt")           |
| content        | string         | optional                           | Body text of the content item                  |
| description    | string         | optional                           | Short description                              |
| tags           | list\<string\> | may be empty                       | Tags assigned to the content item              |
| authorFullName | string         | required                           | Full name of the author                        |
| authorSlug     | string         | required                           | Author's profile slug (**new**)                |
| createdAt      | datetime       | required                           | When the item was created (**new**)            |
| modifiedAt     | datetime       | optional                           | When the item was last modified (**new**)      |

#### SearchResultItem

*A single item in the search API response. Same shape as `ContentItemResponse` used by the content list API, enabling frontend component reuse.*

| Attribute   | Type           | Constraints | Description                          |
| ----------- | -------------- | ----------- | ------------------------------------ |
| slug        | string         | required    | URL-friendly identifier              |
| title       | string         | required    | Content item title                   |
| description | string         | required    | Short description                    |
| tags        | list\<string\> | may be empty | Tag labels                          |
| contentType | string         | required    | Discriminator value                  |
| author      | object         | required    | Author info (fullName, slug)         |
| createdAt   | string         | required    | ISO-8601 timestamp                   |
| modifiedAt  | string         | optional    | ISO-8601 timestamp                   |

### 5.2 Relationships

- A **ContentItemSearchDocument** is a denormalized projection of a **ContentItem** and its **UserProfile** author — linked by the shared database ID.
- The **search API response** reuses the same `ContentItemPageResponse` shape as `GET /api/content`, so the frontend can treat search results identically to the content list.

### 5.3 Value Objects

#### ContentItemEvent (extended from FEAT-013)

*Extended to carry four new fields for CREATED and UPDATED events.*

New fields added to CREATED/UPDATED events:

| Attribute  | Type     | Constraints | Description                           |
| ---------- | -------- | ----------- | ------------------------------------- |
| title      | string   | required    | Content item title                    |
| authorSlug | string   | required    | Author's profile slug                 |
| createdAt  | datetime | required    | Creation timestamp                    |
| modifiedAt | datetime | optional    | Last modification timestamp           |

DELETED events remain unchanged (contentItemId, eventType, contentType only).

### 5.4 Domain Rules and Invariants

- **Index schema extension**: The four new fields (title, createdAt, modifiedAt, authorSlug) are additive — existing documents without these fields remain valid in OpenSearch.
- **Response format parity**: Search results use the same DTO shape as the content list API, so frontend components work interchangeably.
- **Relevance ordering**: Search results are ordered by OpenSearch `_score` descending, not by recency. This differs from the homepage which orders by `modifiedAt` descending.
- **Search is read-only**: The search API does not modify the index or database.

## 6. Non-Functional Requirements

| ID      | Category       | Requirement                                                                                                          |
| ------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Performance    | The search API shall respond in < 500ms at p95 for queries against an index with up to 10,000 documents              |
| NFR-002 | Security       | The search endpoint shall require authentication (`@Authenticated`) consistent with other API endpoints              |
| NFR-003 | Reliability    | If OpenSearch is unavailable, the search endpoint shall return HTTP 503 with a clear error message                   |
| NFR-004 | Accessibility  | The search input on the results page shall be keyboard-focusable and have an accessible label                        |
| NFR-005 | Responsiveness | The search results page shall be usable on viewports from 375px (mobile) to 1440px+ (desktop)                       |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                                       | Expected Behavior                                                              |
| ---- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| EC-1 | Query is whitespace only (e.g., `?q=%20%20`)                   | Treat as empty query — show empty state, don't call the API                    |
| EC-2 | Query contains special characters (`?q=foo+bar&baz`)           | URL-encode the query; OpenSearch handles the text as-is                        |
| EC-3 | OpenSearch is unavailable                                       | Backend returns HTTP 503; frontend shows an error message                      |
| EC-4 | Page parameter exceeds actual result pages                      | Display empty results list, search input and query preserved                   |
| EC-5 | Page parameter is invalid (negative, non-numeric, zero)         | Treat as page 1                                                                |
| EC-6 | User submits new query while previous search is in-flight       | Cancel the in-flight request and fetch with the new query                      |
| EC-7 | OpenSearch index is empty (no documents at all)                 | Return zero results; frontend shows "no results found" message                 |
| EC-8 | Very long query string (1000+ characters)                       | The backend shall accept queries up to 1000 characters; longer queries are truncated or rejected with HTTP 400 |

## 8. Success Criteria

| ID     | Criterion                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in CI with OpenSearch dev services                                         |
| SC-002 | Navigation search bar navigates to `/search?q=...` and results display correctly                        |
| SC-003 | Search results page search input allows query refinement with URL updates                               |
| SC-004 | Pagination works with `page` query parameter kept in sync with the URL                                  |
| SC-005 | Empty query, no results, and error states are handled gracefully                                        |
| SC-006 | Deep linking to `/search?q=foo&page=2` loads the correct results                                        |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-013 (Content Search Indexing)** — provides the OpenSearch index and event-driven indexing pipeline that this feature extends and queries
- **FEAT-002 (ContentItemCard)** — reused to display individual search result items
- **FEAT-005 (ContentItemList)** — reused to display the paginated results list
- **NavigationSearch component** — existing placeholder that will be wired up to submit queries

### 9.2 Constraints

- The search endpoint reads exclusively from the OpenSearch index — no database queries for result data (except author slug enrichment is avoided by storing `authorSlug` in the index).
- The indexing pipeline extension (FR-012, FR-013) must be deployed before the search endpoint is useful, since existing index documents will lack the new fields until re-indexed.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| 5. Building Block View           | New search resource in the `search` package; new frontend search view and composable   |
| 6. Runtime View                  | Request flow: Frontend → Search API → OpenSearch → Response                            |
| 8. Crosscutting Concepts         | Error handling (503 on OpenSearch failure), authentication patterns, UI component reuse |
| 9. Architecture Decisions (ADRs) | ADR007 (functional slicing), ADR008 (shadcn/vue UI framework)                          |

## 10. Open Questions

No open questions remain.

