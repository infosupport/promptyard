# Feature Specification: Create Prompt Page

## 1. Overview

| Field           | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Feature ID      | FEAT-004                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-25                                                         |
| Last updated    | 2026-02-25                                                         |
| Epic / Parent   | Content authoring                                                  |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

Promptyard has a backend API for creating prompts (`POST /api/content/prompts`), but no frontend UI for it. Users currently have no way to author and submit new prompts through the application.

### 1.2 Goal

A dedicated "Create Prompt" page at `/content/prompts/new` with a form that allows authenticated users to author a new prompt — including title, description, content (with a Monaco editor providing line numbers and Markdown syntax highlighting), and tags (with an inline tag editor displaying chips) — and submit it to the backend.

### 1.3 Non-Goals

- **Editing existing prompts** — this page covers creation only, not update.
- **Prompt templates or AI-assisted writing** — plain authoring only.
- **Draft/auto-save** — the prompt is submitted in a single action; no interim persistence.
- **File attachments or image embedding** — text content only.
- **Prompt detail/view page** — that is a separate feature (but is a dependency for post-creation redirect).

## 2. User Stories

### US-001: Create a new prompt

**As a** user,
**I want** to fill in a form with a title, description, content, and tags and submit it,
**so that** my prompt is saved and available in Promptyard.

### US-002: Write prompt content with syntax highlighting

**As a** user,
**I want** to write my prompt content in an editor with line numbers and Markdown syntax highlighting,
**so that** I can author well-formatted content with a comfortable editing experience.

### US-003: Manage tags inline

**As a** user,
**I want** to add and remove tags using an inline tag editor that displays tags as chips,
**so that** I can quickly categorize my prompt without leaving the form.

### US-004: Prevent accidental data loss

**As a** user,
**I want** to be warned if I try to navigate away from the form with unsaved changes,
**so that** I don't accidentally lose my work.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                       | Priority | User Story |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The system shall display a form with fields for title, description, content, and tags at the route `/content/prompts/new`                                         | Must     | US-001     |
| FR-002 | The title field shall be a text input and is required                                                                                                             | Must     | US-001     |
| FR-003 | The description field shall be a textarea and is optional                                                                                                         | Must     | US-001     |
| FR-004 | The content field shall use the Monaco editor with Markdown language mode and visible line numbers                                                                | Must     | US-002     |
| FR-005 | The content field is required                                                                                                                                     | Must     | US-001     |
| FR-006 | The tags field shall be an inline tag editor that displays entered tags as removable chips                                                                        | Must     | US-003     |
| FR-007 | The tags field is required (at least one tag)                                                                                                                     | Must     | US-001     |
| FR-008 | The system shall submit the form data as a POST request to `/api/content/prompts` with the `SubmitPromptRequest` schema (`{ title, description, content, tags }`) | Must     | US-001     |
| FR-009 | On successful submission, the system shall navigate to `/content/prompts/{slug}` using the slug from the API response                                              | Must     | US-001     |
| FR-010 | On submission failure, the system shall display an error message to the user                                                                                      | Must     | US-001     |
| FR-011 | The form shall display a submit button labeled "Save" and a cancel button                                                                                         | Must     | US-001     |
| FR-012 | The cancel button shall navigate to the previous page (or home if no history)                                                                                     | Must     | US-001     |
| FR-013 | If the form has unsaved changes and the user attempts to navigate away (cancel, browser back, or route change), the system shall display a confirmation dialog    | Must     | US-004     |
| FR-014 | The submit button shall be disabled while the form is submitting                                                                                                  | Should   | US-001     |

## 4. Acceptance Scenarios

### SC-001: Successful prompt creation (FR-001, FR-002, FR-005, FR-007, FR-008, FR-009)

```gherkin
Given the user is on the Create Prompt page
  And the user has entered a title "My Code Review Prompt"
  And the user has entered content "Review the following code for..."
  And the user has added the tag "review"
When the user clicks the Save button
Then the form data is submitted to POST /api/content/prompts
  And the user is navigated to /content/prompts/{slug} where slug is from the response
```

### SC-002: Submission with optional description (FR-003, FR-008)

```gherkin
Given the user is on the Create Prompt page
  And the user has filled in the title, content, and tags
  And the user has entered a description "Helps with code reviews"
When the user clicks the Save button
Then the description is included in the submitted data
```

### SC-003: Submission without description (FR-003, FR-008)

```gherkin
Given the user is on the Create Prompt page
  And the user has filled in the title, content, and tags
  And the description field is empty
When the user clicks the Save button
Then the form submits successfully with an empty description
```

### SC-004: Validation prevents empty required fields (FR-002, FR-005, FR-007)

```gherkin
Given the user is on the Create Prompt page
  And one or more required fields (title, content, tags) are empty
When the user clicks the Save button
Then validation errors are shown next to the empty required fields
  And the form is not submitted
```

### SC-005: Monaco editor displays with Markdown highlighting (FR-004)

```gherkin
Given the user is on the Create Prompt page
When the content editor is rendered
Then the editor displays line numbers
  And the editor uses Markdown syntax highlighting
```

### SC-006: Adding tags inline (FR-006)

```gherkin
Given the user is on the Create Prompt page
When the user types "kotlin" in the tag input and presses Enter
Then a "kotlin" chip appears in the tag field
  And the tag input is cleared for the next entry
```

### SC-007: Removing a tag (FR-006)

```gherkin
Given the user has added tags "kotlin" and "review"
When the user clicks the remove button on the "kotlin" chip
Then the "kotlin" chip is removed from the tag field
  And the "review" chip remains
```

### SC-008: Submission failure shows error (FR-010)

```gherkin
Given the user is on the Create Prompt page with all required fields filled
  And the API returns an error (e.g., 500 or network failure)
When the user clicks the Save button
Then an error message is displayed to the user
  And the form data is preserved so the user can retry
```

### SC-009: Submit button disabled during submission (FR-014)

```gherkin
Given the user is on the Create Prompt page with all required fields filled
When the user clicks the Save button
Then the Save button becomes disabled
  And the button shows a loading indicator until the API responds
```

### SC-010: Unsaved changes warning on navigation (FR-013)

```gherkin
Given the user has modified any field on the Create Prompt form
When the user clicks the Cancel button
Then a confirmation dialog is shown asking if they want to discard changes
  And if confirmed, the user is navigated away
  And if cancelled, the user stays on the form
```

### SC-011: No warning when form is clean (FR-013)

```gherkin
Given the user is on the Create Prompt page
  And no fields have been modified
When the user clicks the Cancel button
Then the user is navigated away immediately without a confirmation dialog
```

### SC-012: Cancel navigates to previous page (FR-012)

```gherkin
Given the user navigated to the Create Prompt page from the home page
When the user clicks Cancel and confirms (if prompted)
Then the user is navigated back to the home page
```

## 5. Domain Model

This feature is primarily frontend — the backend entities and API already exist. The domain model describes the frontend data contracts.

### 5.1 Entities

#### CreatePromptForm

_The form data model for the Create Prompt page._

| Attribute   | Type     | Constraints         | Description                     |
| ----------- | -------- | ------------------- | ------------------------------- |
| title       | string   | required, non-empty | The prompt's title              |
| description | string   | optional            | Short description of the prompt |
| content     | string   | required, non-empty | The prompt body (Markdown)      |
| tags        | string[] | required, min 1     | List of tag labels              |

#### SubmitPromptRequest (existing backend DTO)

_Maps 1:1 from CreatePromptForm. Description defaults to empty string if not provided._

| Attribute   | Type     | Constraints | Description                                        |
| ----------- | -------- | ----------- | -------------------------------------------------- |
| title       | string   | required    | Maps from form title                               |
| description | string   | required    | Maps from form description (empty string if blank) |
| content     | string   | required    | Maps from form content                             |
| tags        | string[] | required    | Maps from form tags                                |

#### SubmitPromptResponse (existing backend DTO)

| Attribute | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| slug      | string | The generated slug for the created prompt |

### 5.4 Domain Rules and Invariants

- **Required fields**: Title, content, and tags (at least one) must be non-empty before submission.
- **Description default**: If description is left empty, it is submitted as an empty string (the backend accepts it).
- **Tag uniqueness**: Duplicate tags are silently ignored — if the user enters a tag that already exists, it is not added again.
- **Tag trimming**: Tags are trimmed of leading/trailing whitespace before being added.

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                                 |
| ------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Performance   | The Monaco editor shall load and be interactive within 2 seconds on a standard broadband connection                         |
| NFR-002 | Accessibility | All form fields shall have visible labels and be keyboard-navigable                                                         |
| NFR-003 | Accessibility | The tag editor shall be operable with keyboard only (Enter to add, Backspace to remove last tag)                            |
| NFR-004 | Security      | Only authenticated users can access the Create Prompt page (enforced by existing router guard and backend `@Authenticated`) |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                       | Expected Behavior                                                                |
| ---- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| EC-1 | User submits an empty form                     | Validation errors shown on title, content, and tags fields                       |
| EC-2 | User enters a duplicate tag                    | The duplicate is silently ignored; no error shown                                |
| EC-3 | User enters a tag with leading/trailing spaces | The tag is trimmed before being added                                            |
| EC-4 | API returns 404 (user profile not found)       | Error message: "Your profile was not found. Please complete onboarding first."   |
| EC-5 | Network failure during submission              | Error message shown; form data preserved for retry                               |
| EC-6 | User refreshes the page with unsaved data      | Browser's native "unsaved changes" warning is triggered via `beforeunload` event |

## 8. Success Criteria

| ID     | Criterion                                                                          |
| ------ | ---------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in Vitest unit tests                                 |
| SC-002 | The form submits correctly to `POST /api/content/prompts` and redirects on success |
| SC-003 | Monaco editor loads with Markdown syntax highlighting and line numbers             |
| SC-004 | Tag editor supports adding, removing, and displays chips inline                    |
| SC-005 | Unsaved changes warning triggers on navigation when the form is dirty              |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **Monaco Editor** — `@monaco-editor/vue` or equivalent Vue 3 wrapper must be added as a frontend dependency.
- **Prompt detail page** — FR-009 navigates to `/content/prompts/{slug}` after creation. This page does not exist yet and must be created as a separate feature (or a stub route must be registered).
- **shadcn/vue components** — Form, Input, Textarea, Button, Badge (already available in the project).

### 9.2 Constraints

- The `POST /api/content/prompts` endpoint already exists and accepts the `SubmitPromptRequest` schema. No backend changes are needed for this feature.
- The page must be registered under the `DefaultLayout` route group to inherit the navigation shell and profile check guard.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| 5. Building Block View           | New page and components in the frontend content module                             |
| 8. Crosscutting Concepts         | Domain model (Prompt entity, SubmitPromptRequest), authentication, slug generation |
| 9. Architecture Decisions (ADRs) | ADR007 — functional slice organization; ADR008 — shadcn/vue as UI framework        |

## 10. Open Questions

| #   | Question                                                                                               | Owner | Status | Resolution |
| --- | ------------------------------------------------------------------------------------------------------ | ----- | ------ | ---------- |
| 1   | Should the prompt detail page (`/content/prompts/{slug}`) be a stub route or a full feature before this ships? |       | Resolved | Stub route added at `/content/prompts/:slug` with an empty `PromptDetailView`. Full page is a separate feature. |

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
  - [ ] Open questions are assigned and have a resolution path
-->
