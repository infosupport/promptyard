# Feature Specification: Prompt Detail Page

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
| Feature ID      | FEAT-005                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-26                                                         |
| Last updated    | 2026-02-26                                                         |
| Epic / Parent   | Content detail pages                                               |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

After creating a prompt via the Create Prompt page (FEAT-004), users are redirected to `/content/prompts/{slug}` — but that page is an empty stub. Users cannot view the full content of a prompt, see who authored it, or copy the prompt text for use elsewhere.

### 1.2 Goal

A prompt detail page at `/content/prompts/:slug` that presents the full prompt in a two-column layout: an 80% main column showing the prompt metadata (title, description, tags) in one card and the prompt content in a readonly Monaco editor (Markdown highlighting, line numbers) with a copy-to-clipboard button in a second card, plus a 20% sidebar containing the AuthorCard. A breadcrumb at the top provides navigation context: Promptyard > Prompts > {Prompt title}.

### 1.3 Non-Goals

- **Editing or deleting a prompt** from this page — those are separate features.
- **Commenting, rating, or favoriting** — no social features on the detail page.
- **Version history or revision tracking** — single current version only.
- **Content sharing beyond copy-to-clipboard** — no share links, embeds, or exports.
- **Public (unauthenticated) access** — the page requires login, consistent with the rest of the app.

## 2. User Stories

### US-001: View prompt details

**As a** user,
**I want** to see a prompt's title, description, and tags,
**so that** I understand what the prompt is about.

### US-002: Read prompt content

**As a** user,
**I want** to see the full prompt content in a syntax-highlighted editor with line numbers,
**so that** I can read the prompt clearly.

### US-003: Copy prompt content

**As a** user,
**I want** to copy the prompt content to my clipboard with one click,
**so that** I can use the prompt in another tool.

### US-004: See the prompt author

**As a** user,
**I want** to see the author's profile summary in a sidebar,
**so that** I know who created the prompt and can navigate to their profile.

### US-005: Navigate via breadcrumb

**As a** user,
**I want** a breadcrumb trail showing Promptyard > Prompts > {title},
**so that** I can orient myself and navigate back.

### US-006: Handle missing prompts

**As a** user,
**I want** to see a friendly message if the prompt doesn't exist,
**so that** I'm not stuck on a broken page.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                  | Priority | User Story |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------- |
| FR-001 | The system shall fetch prompt data from `GET /api/content/prompts/{slug}` when the page loads                                                                | Must     | US-001     |
| FR-002 | The backend shall expose a `GET /api/content/prompts/{slug}` endpoint returning the prompt with embedded author profile data                                 | Must     | US-001     |
| FR-003 | The main column shall display a card showing the prompt's title, description, and tags (as badges)                                                           | Must     | US-001     |
| FR-004 | The main column shall display a second card containing the prompt content in a readonly Monaco editor with Markdown syntax highlighting and line numbers      | Must     | US-002     |
| FR-005 | The content card shall have a copy button in the top-right corner that copies the raw prompt content to the clipboard                                        | Must     | US-003     |
| FR-006 | On successful copy, the button shall show a brief "Copied!" feedback state before reverting to default                                                       | Should   | US-003     |
| FR-007 | The sidebar shall render the existing AuthorCard component populated with the prompt author's data                                                            | Must     | US-004     |
| FR-008 | The page shall render a breadcrumb with three segments: "Promptyard" (link to `/`), "Prompts" (plain text, not linked), and the prompt title (current page)  | Must     | US-005     |
| FR-009 | When the API returns 404, the page shall display an inline "not found" message with a link back to the home page                                             | Must     | US-006     |
| FR-010 | The page shall show a loading state while fetching prompt data                                                                                                | Should   | US-001     |
| FR-011 | The page layout shall use a two-column grid: 80% main column, 20% sidebar                                                                                    | Must     | US-001     |
| FR-012 | The page shall require authentication (consistent with existing route guards and backend `@Authenticated` annotation)                                        | Must     | US-001     |

## 4. Acceptance Scenarios

### SC-001: Prompt detail page displays metadata (FR-001, FR-003, FR-011)

```gherkin
Given a prompt exists with slug "code-review-checklist", title "Code Review Checklist",
  description "A structured checklist for thorough code reviews", and tags ["review", "kotlin"]
When the user navigates to /content/prompts/code-review-checklist
Then the page displays a two-column layout (80% main, 20% sidebar)
  And the main column shows a card with the title "Code Review Checklist"
  And the description "A structured checklist for thorough code reviews"
  And badges for "review" and "kotlin"
```

### SC-002: Prompt content displayed in readonly Monaco editor (FR-004)

```gherkin
Given a prompt with content "Review the following code for..."
When the prompt detail page is rendered
Then the main column displays a card containing a readonly Monaco editor
  And the editor uses Markdown syntax highlighting
  And the editor displays line numbers
  And the editor content matches the prompt's raw content
```

### SC-003: Copy button copies content to clipboard (FR-005, FR-006)

```gherkin
Given the prompt detail page is showing a prompt with content "Review the code..."
When the user clicks the copy button in the top-right of the content card
Then the raw prompt content is copied to the clipboard
  And the button shows a "Copied!" feedback state
  And the feedback reverts to the default state after a brief delay
```

### SC-004: Author card displayed in sidebar (FR-007)

```gherkin
Given a prompt authored by "Jane Doe" with job title "Senior Engineer"
  And the author has 12 prompts, 3 skills, 0 agents, and 1 workflow
When the prompt detail page is rendered
Then the sidebar displays the AuthorCard with full name "Jane Doe"
  And job title "Senior Engineer"
  And content counts 12, 3, 0, 1
  And a "View Profile" link to the author's profile page
```

### SC-005: Breadcrumb navigation (FR-008)

```gherkin
Given the user is viewing a prompt with title "Code Review Checklist"
When the prompt detail page is rendered
Then a breadcrumb is displayed with segments "Promptyard" > "Prompts" > "Code Review Checklist"
  And "Promptyard" links to the home page
  And "Prompts" is plain text (not linked)
  And "Code Review Checklist" is plain text (current page)
```

### SC-006: Prompt not found (FR-009)

```gherkin
Given no prompt exists with slug "nonexistent-prompt"
When the user navigates to /content/prompts/nonexistent-prompt
Then the page displays a "not found" message
  And a link to navigate back to the home page
  And no prompt content or author card is shown
```

### SC-007: Loading state while fetching (FR-010)

```gherkin
Given the user navigates to /content/prompts/code-review-checklist
When the API request is in progress
Then the page displays a loading indicator
  And once the data loads, the loading indicator is replaced with the prompt content
```

### SC-008: Backend returns prompt with embedded author (FR-002)

```gherkin
Given a prompt with slug "code-review-checklist" exists in the database
  And the prompt was authored by user "jane.doe@example.com"
When a GET request is made to /api/content/prompts/code-review-checklist
Then the response status is 200
  And the response body contains the prompt fields (title, slug, description, content, tags, createdAt, modifiedAt)
  And the response body contains the author's profile data (fullName, jobTitle, profileSlug, promptCount, skillCount, agentCount, workflowCount)
```

## 5. Domain Model

### 5.1 Entities

#### PromptDetailResponse (new backend DTO)

*The API response from `GET /api/content/prompts/{slug}`. Embeds author data.*

| Attribute   | Type          | Constraints     | Description                             |
| ----------- | ------------- | --------------- | --------------------------------------- |
| title       | string        | required        | The prompt's title                      |
| slug        | string        | required        | URL-friendly identifier                 |
| description | string        | required        | Short description (may be empty string) |
| content     | string        | required        | The full prompt body                    |
| tags        | string[]      | required        | List of tag labels                      |
| contentType | string        | always "prompt" | Content type discriminator              |
| createdAt   | datetime      | required        | When the prompt was created             |
| modifiedAt  | datetime      | required        | When the prompt was last modified       |
| author      | AuthorSummary | required        | Embedded author profile data            |

#### AuthorSummary (new embedded DTO)

*Author profile data embedded in the prompt detail response.*

| Attribute     | Type    | Constraints    | Description                          |
| ------------- | ------- | -------------- | ------------------------------------ |
| fullName      | string  | required       | Author's display name                |
| jobTitle      | string  | optional       | Author's job title (null if not set) |
| profileSlug   | string  | required       | Slug for constructing profile URL    |
| promptCount   | integer | required, >= 0 | Number of prompts by this author     |
| skillCount    | integer | required, >= 0 | Number of skills by this author      |
| agentCount    | integer | required, >= 0 | Number of agents by this author      |
| workflowCount | integer | required, >= 0 | Number of workflows by this author   |

### 5.2 Relationships

- A **PromptDetailResponse** embeds one **AuthorSummary** derived from the prompt's author (UserProfile) and their content counts.
- The frontend **PromptDetailView** maps `AuthorSummary` fields to the existing **AuthorCard** component props.

### 5.4 Domain Rules and Invariants

- **Slug uniqueness**: Each prompt has a unique slug. The GET endpoint returns exactly one prompt or 404.
- **Author always exists**: A prompt always has an author — the `@Authenticated` constraint on creation guarantees this.
- **Content counts are non-negative**: All count fields must be zero or greater.
- **Profile URL construction**: The frontend constructs the profile URL as `/profiles/{profileSlug}` from the `profileSlug` field.

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                               |
| ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Performance   | The page shall load and display prompt content within 1 second on standard broadband (excluding Monaco cold load)         |
| NFR-002 | Performance   | The Monaco editor shall become interactive within 2 seconds of page load (consistent with FEAT-004)                       |
| NFR-003 | Accessibility | The copy button shall have an accessible label (e.g., "Copy prompt content to clipboard")                                 |
| NFR-004 | Accessibility | The breadcrumb shall use semantic `<nav>` with `aria-label="Breadcrumb"` and `<ol>` markup                                |
| NFR-005 | Security      | Only authenticated users can access the page and the API endpoint                                                         |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                             | Expected Behavior                                                         |
| ---- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| EC-1 | Prompt has no description (empty string)             | Description area is not rendered; card shows title and tags only          |
| EC-2 | Prompt has no tags (empty list)                      | Tags section is not rendered; card shows title and description only       |
| EC-3 | Prompt has very long content (1000+ lines)           | Monaco editor renders with scroll; page layout is not broken              |
| EC-4 | Clipboard API is not available (older browser / HTTP)| Copy button shows a graceful error or fallback message                    |
| EC-5 | Network error while fetching prompt                  | Inline error message displayed with a retry option                        |
| EC-6 | Author has no job title                              | AuthorCard hides the job title section (existing component behavior)      |

## 8. Success Criteria

| ID     | Criterion                                                                                     |
| ------ | --------------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in automated tests (backend: REST Assured, frontend: Vitest)     |
| SC-002 | The page correctly fetches and renders prompt data from the backend API                        |
| SC-003 | The Monaco editor displays prompt content in readonly mode with Markdown highlighting          |
| SC-004 | The copy button successfully copies content to the clipboard with visual feedback              |
| SC-005 | The AuthorCard renders correctly with embedded author data from the API response               |
| SC-006 | The breadcrumb renders with correct segments and link behavior                                 |
| SC-007 | The 404 state displays a friendly inline message when the prompt doesn't exist                 |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-004 (Create Prompt Page)** — provides the stub route at `/content/prompts/:slug` and the `PromptDetailView` component shell.
- **FEAT-003 (AuthorCard)** — the AuthorCard component is reused in the sidebar.
- **Monaco Editor** — already installed as a dependency from FEAT-004.
- **shadcn/vue Breadcrumb** — may need to be added if not already installed.
- **Backend `Prompt` entity and repository** — already exist with `findBySlug()`.

### 9.2 Constraints

- The `GET /api/content/prompts/{slug}` endpoint must be created as part of this feature.
- The page must be registered under the `DefaultLayout` route group to inherit the navigation shell and profile check guard.
- Content counts for the author require counting all content items by author — this may need a repository method.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| 5. Building Block View           | New backend endpoint in content module; updated frontend PromptDetailView           |
| 8. Crosscutting Concepts         | Domain model (Prompt, UserProfile), authentication, slug-based routing              |
| 9. Architecture Decisions (ADRs) | ADR007 — functional slice organization; ADR008 — shadcn/vue as UI framework         |

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
  - [x] Open questions are assigned and have a resolution path
-->
