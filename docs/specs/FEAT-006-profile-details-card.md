# Feature Specification: Profile Details Card

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
| Feature ID      | FEAT-006                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-26                                                         |
| Last updated    | 2026-02-26                                                         |
| Epic / Parent   | Profile page                                                       |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

The application has an `AuthorCard` component for displaying author info in compact sidebar contexts, but there is no component for showing a comprehensive profile summary. Profile pages and other contexts that need to present the full picture of a user — avatar, name, job title, business unit, membership date, and content contribution stats — have no suitable component to use.

### 1.2 Goal

A reusable `ProfileDetailsCard` component that displays a user's avatar (initials-derived), full name, job title, business unit, membership date, per-type content counts (prompts, skills, agents, workflows), and an optional "Edit Profile" button. The component receives all data as props and works in any layout context.

### 1.3 Non-Goals

- **Avatar image upload** — the avatar uses initials only, consistent with `AuthorCard`.
- **Inline profile editing** — the "Edit Profile" button navigates away; no inline form.
- **Backend API changes** — the component is props-driven; any new API endpoints for profile data are a separate concern.
- **Profile page routing/layout** — this spec covers the card component, not the page it lives on.
- **Public/private profile toggle** — all profiles are public; no visibility controls.

## 2. User Stories

### US-001: View profile summary

**As a** user visiting a profile page,
**I want** to see the profile owner's avatar, name, job title, business unit, and membership date,
**so that** I understand who they are and their role in the organization.

### US-002: See contribution stats

**As a** user visiting a profile page,
**I want** to see how many prompts, skills, agents, and workflows the profile owner has published,
**so that** I can gauge their level of contribution.

### US-003: Edit my own profile

**As a** user viewing my own profile,
**I want** to see an "Edit Profile" button,
**so that** I can navigate to update my profile information.

## 3. Functional Requirements

| ID     | Requirement                                                                                                             | Priority | User Story |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The component shall display an avatar showing initials derived from the user's full name, using the existing `getInitials` utility | Must     | US-001     |
| FR-002 | The avatar shall use a gradient background in a rounded-square shape, consistent with `AuthorCard`                       | Must     | US-001     |
| FR-003 | The component shall display the user's full name prominently                                                             | Must     | US-001     |
| FR-004 | The component shall display the user's job title with a briefcase icon, or omit it if not set                            | Must     | US-001     |
| FR-005 | The component shall display the user's business unit with a building icon, or omit it if not set                         | Must     | US-001     |
| FR-006 | The component shall display the membership date formatted as "Member since Mon YYYY" with a calendar icon                | Must     | US-001     |
| FR-007 | The component shall display content counts for prompts, skills, agents, and workflows, each with a distinct color        | Must     | US-002     |
| FR-008 | Content counts of zero shall still be displayed (not hidden)                                                              | Must     | US-002     |
| FR-009 | The component shall accept a boolean prop controlling whether the "Edit Profile" button is shown                          | Must     | US-003     |
| FR-010 | When shown, the "Edit Profile" button shall include a pencil icon and navigate to the provided edit URL                   | Must     | US-003     |
| FR-011 | The component shall be laid out horizontally: avatar on the left, profile info and stats in the center, edit button on the right | Must     | US-001     |

## 4. Acceptance Scenarios

### SC-001: Full profile summary displayed (FR-001, FR-003, FR-004, FR-005, FR-006)

```gherkin
Given a user with full name "Willem Meints", job title "Machine Learning Engineer",
      business unit "Unit AI & Data", and member since "2024-01-15"
When the ProfileDetailsCard is rendered
Then the card displays an avatar with initials "WM"
  And the card displays "Willem Meints" as the name
  And the card displays "Machine Learning Engineer" with a briefcase icon
  And the card displays "Unit AI & Data" with a building icon
  And the card displays "Member since Jan 2024" with a calendar icon
```

### SC-002: Job title hidden when not set (FR-004)

```gherkin
Given a user with full name "Jane Doe" and no job title
When the ProfileDetailsCard is rendered
Then the name is displayed
  And no job title or briefcase icon is shown
  And the metadata row remains visually balanced
```

### SC-003: Business unit hidden when not set (FR-005)

```gherkin
Given a user with full name "Jane Doe" and no business unit
When the ProfileDetailsCard is rendered
Then the name is displayed
  And no business unit or building icon is shown
```

### SC-004: Both job title and business unit hidden (FR-004, FR-005)

```gherkin
Given a user with full name "Jane Doe", no job title, and no business unit
When the ProfileDetailsCard is rendered
Then only the membership date is shown in the metadata row
```

### SC-005: Content counts displayed (FR-007, FR-008)

```gherkin
Given a user with 12 prompts, 5 skills, 0 agents, and 3 workflows
When the ProfileDetailsCard is rendered
Then the card displays "12" with label "Prompts"
  And the card displays "5" with label "Skills"
  And the card displays "0" with label "Agents"
  And the card displays "3" with label "Workflows"
  And each count uses a distinct color
```

### SC-006: All counts are zero (FR-007, FR-008)

```gherkin
Given a user with 0 prompts, 0 skills, 0 agents, and 0 workflows
When the ProfileDetailsCard is rendered
Then all four content type counts display "0" with their respective labels
```

### SC-007: Edit button shown for own profile (FR-009, FR-010)

```gherkin
Given the showEditButton prop is true and editUrl is "/profiles/me/edit"
When the ProfileDetailsCard is rendered
Then an "Edit Profile" button is visible with a pencil icon
When the user clicks the "Edit Profile" button
Then the browser navigates to "/profiles/me/edit"
```

### SC-008: Edit button hidden for other profiles (FR-009)

```gherkin
Given the showEditButton prop is false
When the ProfileDetailsCard is rendered
Then no "Edit Profile" button is visible
```

### SC-009: Membership date formatting (FR-006)

```gherkin
Given a user with createdAt "2024-01-15T10:30:00Z"
When the ProfileDetailsCard is rendered
Then the membership date displays "Member since Jan 2024"

Given a user with createdAt "2025-12-01T00:00:00Z"
When the ProfileDetailsCard is rendered
Then the membership date displays "Member since Dec 2025"
```

## 5. Domain Model

This feature is a pure frontend component — it does not introduce new entities or persistence. The domain model describes the component's data contract.

### 5.1 Entities

#### ProfileDetailsCardProps

*The data contract for the ProfileDetailsCard component.*

| Attribute      | Type    | Constraints                             | Description                                                   |
| -------------- | ------- | --------------------------------------- | ------------------------------------------------------------- |
| fullName       | string  | required, non-empty                     | User's display name, also used to derive initials             |
| jobTitle       | string  | optional                                | User's job title; hidden when absent                          |
| businessUnit   | string  | optional                                | User's organizational unit; hidden when absent                |
| memberSince    | string  | required, ISO 8601 datetime             | Date the user joined; displayed as "Member since Mon YYYY"    |
| promptCount    | number  | required, >= 0                          | Number of prompts published                                   |
| skillCount     | number  | required, >= 0                          | Number of skills published                                    |
| agentCount     | number  | required, >= 0                          | Number of agents published                                    |
| workflowCount  | number  | required, >= 0                          | Number of workflows published                                 |
| showEditButton | boolean | required                                | Whether to show the "Edit Profile" button                     |
| editUrl        | string  | required when showEditButton is true    | Navigation target for the edit button                         |

### 5.2 Relationships

- A **ProfileDetailsCard** renders data from one **UserProfile** and aggregated **ContentItem** counts. The parent page maps API responses to the props shape.
- Shares the `getInitials` utility with **AuthorCard** — no duplication.

### 5.3 Value Objects

#### Initials

*Derived from the user's full name via the existing `getInitials` utility. Not a prop — computed internally.*

| Attribute | Type   | Constraints                        |
| --------- | ------ | ---------------------------------- |
| value     | string | 1–2 uppercase letters, never empty |

#### FormattedMemberDate

*Derived from `memberSince` prop. Displayed as "Member since Mon YYYY".*

| Attribute | Type   | Constraints                    |
| --------- | ------ | ------------------------------ |
| value     | string | Format: "Member since Mon YYYY" |

### 5.4 Domain Rules and Invariants

- **Initials derivation**: Reuses the existing `getInitials` utility from `AuthorCard`.
- **Counts are non-negative**: All content type counts must be zero or greater.
- **Optional metadata is display-optional**: When `jobTitle` or `businessUnit` is null/undefined, that metadata item is omitted entirely — no placeholder.
- **Edit button requires URL**: When `showEditButton` is true, `editUrl` must be provided.
- **Date formatting**: `memberSince` is formatted to "Mon YYYY" using the browser's locale-aware date formatting.

## 6. Non-Functional Requirements

| ID      | Category       | Requirement                                                                                                             |
| ------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Accessibility  | The avatar initials shall have an `aria-label` with the user's full name                                                |
| NFR-002 | Accessibility  | The "Edit Profile" button shall be keyboard-focusable and have an accessible name                                       |
| NFR-003 | Accessibility  | Metadata icons (briefcase, building, calendar) shall have `aria-hidden="true"` with the associated text providing meaning |
| NFR-004 | Responsiveness | The card shall work full-width in its container and adapt gracefully to narrow viewports (metadata items may wrap)       |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                              | Expected Behavior                                                      |
| ---- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| EC-1 | User has a very long name (100+ chars)                | Name truncates with ellipsis; avatar still shows correct initials      |
| EC-2 | User has a very long job title or business unit       | Text truncates with ellipsis                                           |
| EC-3 | Both job title and business unit are absent            | Only the membership date is shown in the metadata row                  |
| EC-4 | `showEditButton` is true but `editUrl` is empty       | Edit button is not rendered (defensive)                                |
| EC-5 | `memberSince` is a future date                        | Displayed as-is — no special handling (data correctness is the backend's responsibility) |
| EC-6 | Content counts are very large (10,000+)               | Numbers display without truncation; layout accommodates wider numbers  |

## 8. Success Criteria

| ID     | Criterion                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------- |
| SC-001 | ProfileDetailsCard renders correctly with all props populated, matching the reference design       |
| SC-002 | ProfileDetailsCard hides job title and/or business unit when not provided                         |
| SC-003 | Edit button shows/hides based on the `showEditButton` prop                                       |
| SC-004 | Membership date formats correctly as "Member since Mon YYYY"                                      |
| SC-005 | Component has Vitest unit tests covering all acceptance scenarios                                  |
| SC-006 | Component has a Storybook story demonstrating its variants                                        |
| SC-007 | Reuses `getInitials` utility — no duplication of logic                                            |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- shadcn/vue Card and Avatar components (already installed)
- Vue Router for navigation (already installed)
- Lucide icons for metadata icons (already available via shadcn/vue)
- Existing `getInitials` utility from `AuthorCard` implementation

### 9.2 Constraints

- The component receives all data as props — it does not fetch data from the API itself.
- Content count aggregation is the responsibility of the parent page, not this component.
- The `getInitials` utility must remain shared — if it currently lives inside `AuthorCard`, it should be extracted to a shared location.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- |
| 5. Building Block View           | New component in the frontend profiles module                                 |
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
