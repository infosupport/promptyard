# Feature Specification: Author Card

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

| Field           | Value                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| Feature ID      | FEAT-003                                                                      |
| Status          | Draft                                                                         |
| Author          |                                                                               |
| Created         | 2026-02-25                                                                    |
| Last updated    | 2026-02-25                                                                    |
| Epic / Parent   | Content detail pages                                                          |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts)            |

### 1.1 Problem Statement

Content detail pages need to show who authored a piece of content. There is currently no component that presents author information — name, role, content contribution stats, and a link to their profile. Without this, users have no way to discover who created the content they're viewing or navigate to that author's profile.

### 1.2 Goal

A standalone `AuthorCard` component that displays an author's avatar (initials-derived), full name, job title, content counts broken down by type (prompts, skills, agents, workflows), and a "View Profile" link. The card is used on content detail pages and receives all data as props.

### 1.3 Non-Goals

- **Avatar image upload or storage** — the avatar uses initials derived from the author's name; no image field is added to the profile model.
- **Backend API changes** — the component receives data as props; any API enrichment to provide author data on content detail pages is a separate concern.
- **Profile page itself** — the "View Profile" button links to a profile page, but building that page is out of scope.
- **Content count aggregation endpoint** — how the parent page obtains per-type content counts is not part of this spec.
- **Interactive features** — no follow button, messaging, or inline editing.

## 2. User Stories

### US-001: See who authored a content item

**As a** user viewing a content detail page,
**I want** to see the author's name, job title, and avatar,
**so that** I know who created the content and what their role is.

### US-002: Understand an author's contributions

**As a** user viewing a content detail page,
**I want** to see how many prompts, skills, agents, and workflows the author has published,
**so that** I can gauge the breadth of their contributions.

### US-003: Navigate to the author's profile

**As a** user viewing a content detail page,
**I want** to click "View Profile" to navigate to the author's profile page,
**so that** I can learn more about them and see all their content.

## 3. Functional Requirements

| ID     | Requirement                                                                                                              | Priority | User Story |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | -------- | ---------- |
| FR-001 | The component shall display an avatar showing the author's initials derived from their full name                         | Must     | US-001     |
| FR-002 | The component shall derive initials using a shared utility function (`getInitials`) that extracts the first letter of the first and last name, uppercased | Must     | US-001     |
| FR-003 | The component shall display the author's full name                                                                        | Must     | US-001     |
| FR-004 | The component shall display the author's job title                                                                        | Must     | US-001     |
| FR-005 | When the author has no job title, the job title area shall not render                                                     | Should   | US-001     |
| FR-006 | The component shall display content counts for all four content types: prompts, skills, agents, and workflows             | Must     | US-002     |
| FR-007 | Content type counts that are zero shall still be displayed (not hidden)                                                   | Must     | US-002     |
| FR-008 | The component shall render a "View Profile" button that navigates to the author's profile page URL                        | Must     | US-003     |
| FR-009 | The component shall be built on shadcn/vue Card and Avatar components                                                     | Must     | US-001     |
| FR-010 | The avatar shall use a gradient background behind the initials, rendered in a rounded-square shape                         | Must     | US-001     |

## 4. Acceptance Scenarios

### SC-001: Card displays author summary (FR-001, FR-003, FR-004)

```gherkin
Given an author with full name "Michael Sander" and job title "Senior Software Engineer"
When the AuthorCard is rendered
Then the card displays an avatar with initials "MS"
  And the card displays "Michael Sander" as the author name
  And the card displays "Senior Software Engineer" as the job title
```

### SC-002: Initials derived from single-word name (FR-001, FR-002)

```gherkin
Given an author with full name "Madonna"
When the AuthorCard is rendered
Then the avatar displays the initial "M"
```

### SC-003: Initials derived from multi-part name (FR-001, FR-002)

```gherkin
Given an author with full name "Jan van der Berg"
When the AuthorCard is rendered
Then the avatar displays the initials "JB"
```

### SC-004: Job title hidden when not set (FR-005)

```gherkin
Given an author with full name "Michael Sander" and no job title
When the AuthorCard is rendered
Then the author name is displayed
  And no job title is shown
  And the card remains visually balanced without extra whitespace
```

### SC-005: Content counts displayed for all types (FR-006, FR-007)

```gherkin
Given an author with 24 prompts, 8 skills, 0 agents, and 0 workflows
When the AuthorCard is rendered
Then the card displays "24" with label "Prompts"
  And the card displays "8" with label "Skills"
  And the card displays "0" with label "Agents"
  And the card displays "0" with label "Workflows"
```

### SC-006: All content counts are zero (FR-006, FR-007)

```gherkin
Given an author with 0 prompts, 0 skills, 0 agents, and 0 workflows
When the AuthorCard is rendered
Then all four content type counts display "0" with their respective labels
```

### SC-007: View Profile navigates to author profile (FR-008)

```gherkin
Given an AuthorCard for an author with profile URL "/profiles/michael-sander"
When the user clicks the "View Profile" button
Then the browser navigates to "/profiles/michael-sander"
```

### SC-008: Utility function generates correct initials (FR-002)

```gherkin
Given the getInitials utility function
When called with "Michael Sander"
Then it returns "MS"
When called with "Madonna"
Then it returns "M"
When called with "Jan van der Berg"
Then it returns "JB"
When called with "Ana María García López"
Then it returns "AL"
```

## 5. Domain Model

This feature is a pure frontend component — it does not introduce new entities or persistence. The domain model describes the component's data contract.

### 5.1 Entities

#### AuthorCardProps

*The data contract for the AuthorCard component.*

| Attribute     | Type   | Constraints                | Description                                                      |
| ------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| fullName      | string | required, non-empty        | Author's display name, also used to derive initials              |
| jobTitle      | string | optional                   | Author's job title; section hidden when absent                   |
| promptCount   | number | required, >= 0             | Number of prompts the author has published                       |
| skillCount    | number | required, >= 0             | Number of skills the author has published                        |
| agentCount    | number | required, >= 0             | Number of agents the author has published                        |
| workflowCount | number | required, >= 0             | Number of workflows the author has published                     |
| profileUrl    | string | required, valid route path | Navigation target for the "View Profile" button                  |

### 5.2 Relationships

- An **AuthorCard** renders data from one **UserProfile** and aggregated **ContentItem** counts. The parent page is responsible for mapping API responses to the props shape above.

### 5.3 Value Objects

#### Initials

*Derived from the author's full name. Not a prop — computed internally using the `getInitials` utility.*

| Attribute | Type   | Constraints                        |
| --------- | ------ | ---------------------------------- |
| value     | string | 1–2 uppercase letters, never empty |

### 5.4 Domain Rules and Invariants

- **Initials derivation**: First letter of the first word + first letter of the last word, uppercased. Single-word names produce a single letter.
- **Counts are non-negative**: All content type counts must be zero or greater.
- **Job title is display-optional**: When `jobTitle` is null/undefined, the job title section is omitted entirely — no placeholder text.
- **Avatar is always initials-based**: No image URL is accepted; the avatar always renders initials over a gradient background.

## 6. Non-Functional Requirements

| ID      | Category       | Requirement                                                                                              |
| ------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| NFR-001 | Accessibility  | The avatar initials shall have an `aria-label` with the author's full name so screen readers convey who the avatar represents |
| NFR-002 | Accessibility  | The "View Profile" button shall be keyboard-focusable and have an accessible name                        |
| NFR-003 | Responsiveness | The card shall have a fixed width appropriate for a sidebar/aside context but not break when placed in a narrower container |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                                                          | Expected Behavior                                                |
| ---- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| EC-1 | Author has a very long name (100+ chars)                                          | Name truncates with ellipsis; avatar still shows correct initials |
| EC-2 | Author has no job title                                                           | Job title area is not rendered; no extra whitespace               |
| EC-3 | All four content counts are zero                                                  | All four stats display "0" with their labels — nothing is hidden  |
| EC-4 | `getInitials` receives a string with extra whitespace (e.g., "  Michael  Sander  ") | Whitespace is trimmed; initials return "MS"                      |
| EC-5 | `getInitials` receives an empty string                                            | Returns an empty string; the component should not be rendered with empty name, but the utility handles it gracefully |

## 8. Success Criteria

| ID     | Criterion                                                                                     |
| ------ | --------------------------------------------------------------------------------------------- |
| SC-001 | AuthorCard renders correctly with all props populated, matching the reference design           |
| SC-002 | AuthorCard hides the job title section when jobTitle is not provided                           |
| SC-003 | The `getInitials` utility correctly handles single-word, two-word, and multi-word names        |
| SC-004 | "View Profile" button navigates to the provided profile URL                                   |
| SC-005 | Component has Vitest unit tests covering all acceptance scenarios                              |
| SC-006 | The `getInitials` utility has its own unit tests                                              |
| SC-007 | Component has a Storybook story demonstrating its variants                                    |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- shadcn/vue Card and Avatar components (already installed)
- Vue Router for navigation (already installed)

### 9.2 Constraints

- The component receives all data as props — it does not fetch data from the API itself.
- The profile page URL format uses the profile slug (e.g., `/profiles/michael-sander`). The component does not construct this URL — it receives it as a prop.
- Content count aggregation is the responsibility of the parent page, not this component.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- |
| 5. Building Block View           | New component in the frontend content/profiles module                         |
| 8. Crosscutting Concepts         | UI component patterns, shadcn/vue usage, utility function conventions         |
| 9. Architecture Decisions (ADRs) | ADR008 — shadcn/vue as UI framework, ADR007 — functional slice organization   |

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
  - [x] No more than 3 [NEEDS CLARIFICATION] markers remain
  - [x] Open questions are assigned and have a resolution path
-->
