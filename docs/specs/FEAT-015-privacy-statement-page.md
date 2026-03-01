# Feature Specification: Privacy Statement Page

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

| Field           | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Feature ID      | FEAT-015                                                 |
| Status          | Draft                                                    |
| Author          | Claude Code                                              |
| Created         | 2026-03-01                                               |
| Last updated    | 2026-03-01                                               |
| Epic / Parent   | —                                                        |
| Arc42 reference | 5. Building Block View (frontend), 8. Crosscutting (auth)|

### 1.1 Problem Statement

Promptyard collects and processes personal data from Info Support employees. Under the AVG (GDPR), users must be able to review how their data is handled. Currently, no privacy statement page exists within the platform, so users have no in-app way to understand their data rights or how the platform processes their information.

### 1.2 Goal

Users can read the full privacy statement at `/privacy` within the application. The page is linked from a site footer (visible on all default-layout pages) and from the onboarding form, making it discoverable at the moments when users are most likely to want to review it.

### 1.3 Non-Goals

- Cookie consent banner or consent management — the platform only uses functional cookies
- Backend API for serving the privacy statement — this is a static frontend page
- Multi-language support — the privacy statement is in Dutch (the company language for legal documents)
- Editing the privacy statement through the UI — content updates happen via code changes to `docs/legal/privacy-statement.md`
- Version tracking or "I agree" checkboxes — not required for this iteration

## 2. User Stories

### US-001: Read the privacy statement

**As a** platform user,
**I want** to read the privacy statement,
**so that** I understand how my personal data is processed and what my rights are.

### US-002: Find the privacy statement from any page

**As a** platform user,
**I want** to find a link to the privacy statement in the site footer,
**so that** I can access it at any time while using the platform.

### US-003: Review privacy before onboarding

**As a** new user going through onboarding,
**I want** to see a link to the privacy statement on the onboarding form,
**so that** I can review how my data will be used before completing my profile.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                     | Priority | User Story |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The system shall display the privacy statement content at the `/privacy` route, rendered as formatted HTML from the markdown source | Must     | US-001     |
| FR-002 | The system shall preserve all markdown formatting — headings, tables, lists, bold, italic, links — when rendering the privacy statement | Must     | US-001     |
| FR-003 | The system shall display a link to `/privacy` in a site footer on all pages that use the default layout                          | Must     | US-002     |
| FR-004 | The system shall display a link to `/privacy` on the onboarding/welcome page                                                     | Must     | US-003     |
| FR-005 | The system shall use the default layout (with navigation) for the privacy page                                                   | Must     | US-001     |

**Note:** FR-004 is already implemented — the welcome page (`WelcomeView.vue`) already contains a link to `/privacy` in the privacy acceptance checkbox label. No additional work is needed for this requirement.

## 4. Acceptance Scenarios

### SC-001: View the privacy statement (FR-001, FR-002)

```gherkin
Given the user is logged in
When the user navigates to /privacy
Then the privacy statement is displayed with the full content from the source document
  And headings, tables, lists, bold text, and links are rendered correctly
```

### SC-002: Privacy link in footer (FR-003)

```gherkin
Given the user is logged in and on any page with the default layout
When the user looks at the page footer
Then a link to the privacy statement is visible
  And clicking the link navigates to /privacy
```

### SC-003: Privacy link on welcome page (FR-004)

```gherkin
Given the user is on the onboarding/welcome page
When the user views the onboarding form
Then a link to the privacy statement is visible
  And clicking the link navigates to /privacy
```

### SC-004: Privacy page uses default layout (FR-005)

```gherkin
Given the user is logged in
When the user navigates to /privacy
Then the page is displayed within the default layout with standard navigation
```

### SC-005: Unauthenticated user cannot access privacy page (FR-001)

```gherkin
Given the user is not logged in
When the user attempts to navigate to /privacy
Then the user is redirected to the login flow
```

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                              |
| ------- | ------------- | ---------------------------------------------------------------------------------------- |
| NFR-001 | Accessibility | Tables and headings in the rendered privacy statement must use semantic HTML elements     |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                              | Expected Behavior                                                       |
| ---- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| EC-1 | Privacy statement markdown contains malformed markup  | The page renders gracefully with best-effort formatting                 |

## 8. Success Criteria

| ID     | Criterion                                                                                   |
| ------ | ------------------------------------------------------------------------------------------- |
| SC-001 | The privacy statement is fully readable at `/privacy` with correct formatting               |
| SC-002 | A footer link to the privacy page is visible on all default-layout pages                    |
| SC-003 | The onboarding form links to the privacy page (already implemented)                         |
| SC-004 | All acceptance scenarios pass                                                               |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- The privacy statement content in `docs/legal/privacy-statement.md` must exist and be valid markdown
- A markdown-to-HTML rendering solution is needed at build time or runtime (implementation detail for the plan phase)

### 9.2 Constraints

- The privacy statement is written in Dutch — this is intentional and must not be translated
- The content source file lives outside `apps/server/src/main/webui/` — the build pipeline must account for this

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                          |
| -------------------------------- | ------------------------------------------------------------------ |
| 5. Building Block View           | New view component, new footer component, router update            |
| 8. Crosscutting Concepts         | Authentication — page requires login via existing router guard     |
| 9. Architecture Decisions (ADRs) | ADR008 — shadcn/vue component library and Tailwind styling         |

## 10. Open Questions

_No open questions._

---

<!--
  CHECKLIST — Complete before moving to the Plan phase
  ====================================================
  - [x] Problem statement is clear and concise
  - [x] All user stories have acceptance scenarios
  - [x] Each functional requirement traces to a user story
  - [x] Domain model covers all entities mentioned in the requirements (N/A — no entities)
  - [x] Domain rules and invariants are listed (N/A — no domain rules)
  - [x] Edge cases cover failure modes, not just happy paths
  - [x] Non-functional requirements are specific and measurable
  - [x] Arc42 references point to the right sections
  - [x] No more than 3 [NEEDS CLARIFICATION] markers remain (zero)
  - [x] Open questions are assigned and have a resolution path (none)
-->
