# Feature Specification: Edit Prompt Page

## 1. Overview

| Field           | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Feature ID      | FEAT-010                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-27                                                         |
| Last updated    | 2026-02-27                                                         |
| Epic / Parent   | Content authoring                                                  |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

Users can create prompts through the Create Prompt page (FEAT-004), but once a
prompt is published there is no way to update its title, description, content,
or tags through the UI. Mistakes, improvements, and evolving content require the
ability to edit after creation.

### 1.2 Goal

An Edit Prompt page at `/content/prompts/:slug/edit` that pre-populates a form 
with the existing prompt data and allows the author to update the title, 
description, content, and tags. The slug remains unchanged. On successful 
update, the user is redirected back to the prompt detail page. The prompt
detail page gains an edit action (visible only to the prompt's author) that
links to this page.

### 1.3 Non-Goals

- **Slug changes** — the slug remains stable after creation; it is not editable.
- **Editing prompts owned by other users** — only the author can edit their own prompt.
- **Draft/auto-save** — the prompt is updated in a single submit action; no interim persistence.
- **Inline editing on the detail page** — editing happens on a dedicated page, not inline.
- **Changing content type** — a prompt remains a prompt.
- **Version history or revision tracking** — only the current version exists.

## 2. User Stories

### US-001: Edit a prompt

**As a** prompt author,
**I want** to update my prompt's title, description, content, and tags on a dedicated edit page,
**so that** I can correct mistakes or improve the prompt after creation.

### US-002: Navigate to the edit page

**As a** prompt author,
**I want** an edit action on the prompt detail page,
**so that** I can easily access the edit form for my prompt.

### US-003: Prevent editing by non-authors

**As a** user,
**I expect** that only the author of a prompt can edit it,
**so that** my content is protected from unauthorized changes.

### US-004: Prevent accidental data loss

**As a** user editing a prompt,
**I want** to be warned if I navigate away with unsaved changes,
**so that** I don't accidentally lose my edits.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                          | Priority | User Story |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The system shall display an edit form pre-populated with the prompt's current title, description, content, and tags at the route `/content/prompts/:slug/edit`       | Must     | US-001     |
| FR-002 | The title field shall be a text input and is required                                                                                                                | Must     | US-001     |
| FR-003 | The description field shall be a textarea and is optional                                                                                                            | Must     | US-001     |
| FR-004 | The content field shall use the Monaco editor with Markdown language mode and visible line numbers                                                                   | Must     | US-001     |
| FR-005 | The content field is required                                                                                                                                        | Must     | US-001     |
| FR-006 | The tags field shall be an inline tag editor displaying entered tags as removable chips                                                                              | Must     | US-001     |
| FR-007 | The tags field is required (at least one tag)                                                                                                                        | Must     | US-001     |
| FR-008 | The system shall submit the form as a PUT request to `/api/content/prompts/{slug}` with the body `{ title, description, content, tags }`                             | Must     | US-001     |
| FR-009 | The slug shall not be modifiable — it is not part of the edit form                                                                                                   | Must     | US-001     |
| FR-010 | On successful submission, the system shall navigate to `/content/prompts/{slug}`                                                                                     | Must     | US-001     |
| FR-011 | On submission failure, the system shall display an error message and preserve the form data for retry                                                                | Must     | US-001     |
| FR-012 | The prompt detail page shall display an "Edit" action in the metadata card, visible only when the current user is the prompt's author                                | Must     | US-002     |
| FR-013 | The edit action shall navigate to `/content/prompts/:slug/edit`                                                                                                      | Must     | US-002     |
| FR-014 | The backend PUT endpoint shall verify that the authenticated user is the prompt's author and return 403 Forbidden if not                                             | Must     | US-003     |
| FR-015 | The backend PUT endpoint shall return 404 Not Found if the prompt does not exist                                                                                     | Must     | US-003     |
| FR-016 | The form shall display a Save button and a Cancel button                                                                                                             | Must     | US-001     |
| FR-017 | The Cancel button shall navigate back to the prompt detail page (`/content/prompts/{slug}`)                                                                          | Must     | US-001     |
| FR-018 | If the form has unsaved changes and the user attempts to navigate away (cancel, browser back, or route change), the system shall display a confirmation dialog       | Must     | US-004     |
| FR-019 | The Save button shall be disabled while the form is submitting                                                                                                       | Should   | US-001     |
| FR-020 | The `GET /api/content/prompts/{slug}` response shall include an `isOwner` boolean indicating whether the authenticated user is the prompt's author                   | Must     | US-002     |

## 4. Acceptance Scenarios

### SC-001: Edit page loads with pre-populated data (FR-001)

```gherkin
Given a prompt exists with slug "code-review-checklist", title "Code Review Checklist",
  description "A structured checklist", content "Review the following...", and tags ["review", "kotlin"]
  And the current user is the prompt's author
When the user navigates to /content/prompts/code-review-checklist/edit
Then the form is displayed with the title field containing "Code Review Checklist"
  And the description field containing "A structured checklist"
  And the content editor containing "Review the following..."
  And the tag editor displaying chips for "review" and "kotlin"
```

### SC-002: Successful prompt update (FR-008, FR-010)

```gherkin
Given the user is on the Edit Prompt page for slug "code-review-checklist"
  And the user has changed the title to "Updated Review Checklist"
  And the user has modified the content
When the user clicks the Save button
Then the form data is submitted as a PUT request to /api/content/prompts/code-review-checklist
  And the user is navigated to /content/prompts/code-review-checklist
```

### SC-003: Slug remains unchanged after edit (FR-009)

```gherkin
Given a prompt with slug "code-review-checklist" and title "Code Review Checklist"
When the author changes the title to "Completely Different Title" and saves
Then the prompt's slug remains "code-review-checklist"
  And the user is redirected to /content/prompts/code-review-checklist
```

### SC-004: Validation prevents empty required fields (FR-002, FR-005, FR-007)

```gherkin
Given the user is on the Edit Prompt page
  And the user has cleared the title field
When the user clicks the Save button
Then a validation error is shown on the title field
  And the form is not submitted
```

### SC-005: Edit action visible only to author (FR-012, FR-020)

```gherkin
Given a prompt authored by "alice@example.com"
  And the current user is "alice@example.com"
When the user views the prompt detail page
Then an "Edit" action is visible in the metadata card
```

### SC-006: Edit action hidden from non-authors (FR-012, FR-020)

```gherkin
Given a prompt authored by "alice@example.com"
  And the current user is "bob@example.com"
When the user views the prompt detail page
Then no "Edit" action is visible in the metadata card
```

### SC-007: Non-author cannot update via API (FR-014)

```gherkin
Given a prompt authored by "alice@example.com"
  And the current user is "bob@example.com"
When a PUT request is made to /api/content/prompts/{slug}
Then the API returns 403 Forbidden
  And the prompt is not modified
```

### SC-008: Update non-existent prompt returns 404 (FR-015)

```gherkin
Given no prompt exists with slug "nonexistent-prompt"
When a PUT request is made to /api/content/prompts/nonexistent-prompt
Then the API returns 404 Not Found
```

### SC-009: Submission failure shows error (FR-011)

```gherkin
Given the user is on the Edit Prompt page with modified fields
  And the API returns an error (e.g., 500 or network failure)
When the user clicks the Save button
Then an error message is displayed to the user
  And the form data is preserved so the user can retry
```

### SC-010: Save button disabled during submission (FR-019)

```gherkin
Given the user is on the Edit Prompt page with valid data
When the user clicks the Save button
Then the Save button becomes disabled
  And the button shows a loading indicator until the API responds
```

### SC-011: Unsaved changes warning on navigation (FR-018)

```gherkin
Given the user has modified any field on the Edit Prompt form
When the user clicks the Cancel button
Then a confirmation dialog is shown asking if they want to discard changes
  And if confirmed, the user is navigated to the prompt detail page
  And if cancelled, the user stays on the form
```

### SC-012: No warning when form matches original data (FR-018)

```gherkin
Given the user is on the Edit Prompt page
  And no fields have been modified from their original values
When the user clicks the Cancel button
Then the user is navigated to the prompt detail page immediately without a confirmation dialog
```

### SC-013: Edit action navigates to edit page (FR-013)

```gherkin
Given the current user is the author of a prompt with slug "code-review-checklist"
When the user clicks the "Edit" action on the prompt detail page
Then the user is navigated to /content/prompts/code-review-checklist/edit
```

### SC-014: Backend returns isOwner flag (FR-020)

```gherkin
Given a prompt with slug "code-review-checklist" authored by "alice@example.com"
  And the authenticated user is "alice@example.com"
When a GET request is made to /api/content/prompts/code-review-checklist
Then the response includes "isOwner": true

Given the authenticated user is "bob@example.com"
When a GET request is made to /api/content/prompts/code-review-checklist
Then the response includes "isOwner": false
```

## 5. Domain Model

### 5.1 Entities

#### EditPromptForm (frontend form model)

_The form data model for the Edit Prompt page. Same fields as CreatePromptForm._

| Attribute   | Type     | Constraints         | Description                     |
| ----------- | -------- | ------------------- | ------------------------------- |
| title       | string   | required, non-empty | The prompt's title              |
| description | string   | optional            | Short description of the prompt |
| content     | string   | required, non-empty | The prompt body (Markdown)      |
| tags        | string[] | required, min 1     | List of tag labels              |

#### UpdatePromptRequest (new backend DTO)

_The request body for `PUT /api/content/prompts/{slug}`. Same shape as `SubmitPromptRequest`._

| Attribute   | Type     | Constraints | Description                                        |
| ----------- | -------- | ----------- | -------------------------------------------------- |
| title       | string   | required    | New title for the prompt                           |
| description | string   | required    | New description (empty string if blank)            |
| content     | string   | required    | New prompt body content                            |
| tags        | string[] | required    | New list of tag labels                             |

#### UpdatePromptResponse (new backend DTO)

_The response body from `PUT /api/content/prompts/{slug}`._

| Attribute | Type   | Constraints | Description                               |
| --------- | ------ | ----------- | ----------------------------------------- |
| slug      | string | required    | The unchanged slug of the updated prompt  |

#### PromptDetailResponse (existing, modified)

_The `GET /api/content/prompts/{slug}` response gains one new field._

| Attribute | Type    | Constraints | Description                                              |
| --------- | ------- | ----------- | -------------------------------------------------------- |
| isOwner   | boolean | required    | True if the authenticated user is the prompt's author    |

### 5.2 Relationships

- The **EditPromptForm** is initialized from the **PromptDetailResponse** fetched via `GET /api/content/prompts/{slug}`.
- The **UpdatePromptRequest** maps 1:1 from the **EditPromptForm** at submission time.
- The **PromptDetailResponse** `isOwner` field determines whether the edit action is rendered on the prompt detail page.

### 5.4 Domain Rules and Invariants

- **Slug immutability**: The slug is never modified by the update operation. Even if the title changes, the slug remains the same as when the prompt was created.
- **Author-only editing**: Only the user who created the prompt (identified by `SecurityIdentity.principal.name`) can update it.
- **Required fields**: Title, content, and tags (at least one) must be non-empty. Description defaults to empty string if omitted.
- **Tag uniqueness**: Duplicate tags are silently ignored.
- **Tag trimming**: Tags are trimmed of leading/trailing whitespace.

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                                    |
| ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| NFR-001 | Performance   | The edit page shall load and display the pre-populated form within 1 second on standard broadband (excluding Monaco cold load) |
| NFR-002 | Performance   | The Monaco editor shall become interactive within 2 seconds of page load (consistent with FEAT-004)                            |
| NFR-003 | Accessibility | All form fields shall have visible labels and be keyboard-navigable                                                            |
| NFR-004 | Accessibility | The tag editor shall be operable with keyboard only (Enter to add, Backspace to remove last tag)                               |
| NFR-005 | Security      | Only authenticated users can access the edit page (enforced by router guard and backend `@Authenticated`)                      |
| NFR-006 | Security      | The backend shall enforce author-only access at the endpoint level, not relying on frontend-only checks                        |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                              | Expected Behavior                                                                   |
| ---- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| EC-1 | User clears all fields and submits                    | Validation errors shown on required fields (title, content, tags)                   |
| EC-2 | User enters a duplicate tag                           | The duplicate is silently ignored; no error shown                                   |
| EC-3 | User enters a tag with leading/trailing spaces        | The tag is trimmed before being added                                               |
| EC-4 | Non-author navigates directly to the edit URL         | The form loads but the PUT request returns 403; error message displayed             |
| EC-5 | Prompt is deleted while user is editing               | The PUT request returns 404; error message displayed                                |
| EC-6 | Network failure during submission                     | Error message shown; form data preserved for retry                                  |
| EC-7 | User refreshes the page with unsaved data             | Browser's native "unsaved changes" warning is triggered via `beforeunload` event    |
| EC-8 | User navigates to edit page for non-existent prompt   | The GET request returns 404; a "not found" message is displayed with a link to home |

## 8. Success Criteria

| ID     | Criterion                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in automated tests (backend: REST Assured, frontend: Vitest)               |
| SC-002 | The edit form correctly pre-populates with existing prompt data                                          |
| SC-003 | The PUT endpoint updates all four fields and preserves the slug                                          |
| SC-004 | The PUT endpoint returns 403 for non-author requests and 404 for missing prompts                         |
| SC-005 | The edit action on the prompt detail page appears only for the prompt's author                           |
| SC-006 | Unsaved changes warning triggers on navigation when the form has been modified                           |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-004 (Create Prompt Page)** — the edit form reuses the same form layout, Monaco editor integration, and tag editor component.
- **FEAT-005 (Prompt Detail Page)** — the edit action is added to this page; the `PromptDetailResponse` DTO is extended with `isOwner`.
- **Monaco Editor** — already installed as a dependency from FEAT-004.
- **shadcn/vue components** — Form, Input, Textarea, Button, Badge (already available).

### 9.2 Constraints

- The `PUT /api/content/prompts/{slug}` endpoint must be created as part of this feature.
- The `GET /api/content/prompts/{slug}` response must be extended with the `isOwner` field.
- The edit page must be registered under the `DefaultLayout` route group to inherit the navigation shell and profile check guard.
- The `UpdatePromptRequest` DTO can reuse the same shape as `SubmitPromptRequest`, or be a separate DTO — implementation decision.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| 5. Building Block View           | New backend endpoint in content module; new frontend EditPromptView page            |
| 8. Crosscutting Concepts         | Domain model (Prompt entity), authentication, authorization (owner check), slugs    |
| 9. Architecture Decisions (ADRs) | ADR007 — functional slice organization; ADR008 — shadcn/vue as UI framework         |

## 10. Open Questions

None — all decisions have been resolved.

