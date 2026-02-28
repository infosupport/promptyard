# Feature Specification: Edit Profile Page

## 1. Overview

| Field           | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Feature ID      | FEAT-011                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-28                                                         |
| Last updated    | 2026-02-28                                                         |
| Epic / Parent   | Profile management                                                 |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

Users can set their job title and business unit during onboarding, but there is
no way to update these fields afterward through the UI. The "Edit Profile"
button on the My Profile page has no destination. Users who change roles or move
between business units are stuck with stale profile information.

### 1.2 Goal

An Edit Profile page at `/profiles/me/edit` that allows the authenticated user
to update their job title and business unit. The page shows these fields in a
centered card layout with a form, and a breadcrumb trail reading Promptyard /
Profiles / Me / Edit Details. Fields derived from the IdP (name, email) are
displayed as read-only context but are not editable. The backend `PUT
/api/profiles/me` endpoint is simplified to accept only `jobTitle` and
`businessUnit`, removing the IdP-derived fields. On successful save, the user is
redirected back to `/profiles/me`.

### 1.3 Non-Goals

- **Editing name or email address** — these come from the identity provider and are not user-editable.
- **Uploading or changing an avatar** — avatar functionality is not part of this feature.
- **Changing the profile slug** — the slug is derived from the full name and remains stable.
- **Privacy statement re-acceptance** — the privacy acceptance timestamp is immutable after onboarding.
- **Inline editing on the My Profile page** — editing happens on a dedicated page, not inline.

## 2. User Stories

### US-001: Edit my profile details

**As a** logged-in user,
**I want** to update my job title and business unit on a dedicated edit page,
**so that** my profile reflects my current role and organizational placement.

### US-002: Navigate to the edit page

**As a** logged-in user on my profile page,
**I want** to click the "Edit Profile" button,
**so that** I'm taken to the edit form.

### US-003: See which fields I can and cannot edit

**As a** logged-in user on the edit page,
**I want** to see my name and email displayed as read-only context,
**so that** I understand what information comes from my organization's identity provider and can't be changed here.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                          | Priority | User Story |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------- |
| FR-001 | The system shall display an edit form at route `/profiles/me/edit`                                                                   | Must     | US-001     |
| FR-002 | The form shall include an editable job title text field, pre-populated with the current value                                        | Must     | US-001     |
| FR-003 | The form shall include an editable business unit text field, pre-populated with the current value                                    | Must     | US-001     |
| FR-004 | The form shall display the user's full name and email as read-only text (not form inputs)                                            | Must     | US-003     |
| FR-005 | The form shall be rendered inside a centered card layout                                                                             | Must     | US-001     |
| FR-006 | The page shall render a breadcrumb with segments: "Promptyard" (links to /) > "Profiles" (plain text) > "Me" (links to /profiles/me) > "Edit Details" (plain text, current page) | Must | US-001 |
| FR-007 | The system shall submit the form as `PUT /api/profiles/me` with body `{ jobTitle, businessUnit }`                                    | Must     | US-001     |
| FR-008 | The backend `UpdateProfileRequest` shall be modified to accept only `jobTitle` and `businessUnit`, removing `fullName` and `emailAddress` | Must | US-001     |
| FR-009 | The backend shall preserve `fullName` and `emailAddress` unchanged when processing the update                                        | Must     | US-001     |
| FR-010 | On successful submission, the system shall navigate to `/profiles/me`                                                                | Must     | US-001     |
| FR-011 | On submission failure, the system shall display an error message and preserve the form data for retry                                | Must     | US-001     |
| FR-012 | The form shall display a Save button and a Cancel button                                                                             | Must     | US-001     |
| FR-013 | The Cancel button shall navigate to `/profiles/me`                                                                                   | Must     | US-001     |
| FR-014 | The page shall require authentication (consistent with existing route guards and backend `@Authenticated` annotation)                | Must     | US-001     |
| FR-015 | The "Edit Profile" button on the My Profile page (FEAT-007) shall link to `/profiles/me/edit`                                        | Must     | US-002     |
| FR-016 | If the form has unsaved changes and the user attempts to navigate away (cancel, browser back, or route change), the system shall display a confirmation dialog | Must | US-001 |

## 4. Acceptance Scenarios

### SC-001: Edit page loads with pre-populated data (FR-001, FR-002, FR-003, FR-004)

```gherkin
Given a logged-in user with full name "Willem Meints", email "willem@example.com",
      job title "Machine Learning Engineer", and business unit "Unit AI & Data"
When the user navigates to /profiles/me/edit
Then the page displays a card with the form
  And the full name "Willem Meints" and email "willem@example.com" are shown as read-only text
  And the job title field contains "Machine Learning Engineer"
  And the business unit field contains "Unit AI & Data"
```

### SC-002: Edit page loads with empty optional fields (FR-002, FR-003)

```gherkin
Given a logged-in user with no job title and no business unit set
When the user navigates to /profiles/me/edit
Then the job title field is empty
  And the business unit field is empty
```

### SC-003: Successful profile update (FR-007, FR-008, FR-010)

```gherkin
Given the user is on the Edit Profile page
  And the user changes the job title to "Senior Engineer"
  And the user changes the business unit to "Platform"
When the user clicks the Save button
Then the form is submitted as PUT /api/profiles/me with { jobTitle: "Senior Engineer", businessUnit: "Platform" }
  And the user is navigated to /profiles/me
```

### SC-004: Save with empty optional fields (FR-007, FR-008)

```gherkin
Given the user is on the Edit Profile page with job title "Engineer"
  And the user clears the job title field
When the user clicks the Save button
Then the form is submitted with { jobTitle: null, businessUnit: null }
  And the update succeeds
```

### SC-005: Breadcrumb displayed (FR-006)

```gherkin
Given the user is on the /profiles/me/edit page
When the page is rendered
Then a breadcrumb is displayed with segments "Promptyard" > "Profiles" > "Me" > "Edit Details"
  And "Promptyard" links to /
  And "Profiles" is plain text (not linked)
  And "Me" links to /profiles/me
  And "Edit Details" is plain text (current page)
```

### SC-006: Cancel without changes (FR-013)

```gherkin
Given the user is on the Edit Profile page
  And no fields have been modified
When the user clicks the Cancel button
Then the user is navigated to /profiles/me without a confirmation dialog
```

### SC-007: Cancel with unsaved changes (FR-016)

```gherkin
Given the user has modified the job title field
When the user clicks the Cancel button
Then a confirmation dialog is shown asking if they want to discard changes
  And if confirmed, the user is navigated to /profiles/me
  And if cancelled, the user stays on the form
```

### SC-008: Submission failure (FR-011)

```gherkin
Given the user is on the Edit Profile page with modified fields
  And the API returns a server error
When the user clicks the Save button
Then an error message is displayed
  And the form data is preserved for retry
```

### SC-009: Unauthenticated access rejected (FR-014)

```gherkin
Given no user is authenticated
When a request is made to /profiles/me/edit or PUT /api/profiles/me
Then the system redirects to the login page (HTTP 302)
```

### SC-010: Backend preserves IdP fields (FR-009)

```gherkin
Given a user with full name "Willem Meints" and email "willem@example.com"
When a PUT request is made to /api/profiles/me with { jobTitle: "New Title", businessUnit: "New Unit" }
Then the profile's fullName remains "Willem Meints"
  And the profile's emailAddress remains "willem@example.com"
  And the jobTitle is updated to "New Title"
  And the businessUnit is updated to "New Unit"
```

## 5. Domain Model

### 5.1 Entities

#### UpdateProfileRequest (existing, modified)

*The request body for `PUT /api/profiles/me`. Reduced from four fields to two — `fullName` and `emailAddress` are removed since they are derived from the IdP token.*

| Attribute    | Type   | Constraints | Description              |
| ------------ | ------ | ----------- | ------------------------ |
| jobTitle     | string | optional    | User's current job title |
| businessUnit | string | optional    | User's business unit     |

#### EditProfileForm (frontend form model)

*The form data model for the Edit Profile page.*

| Attribute    | Type   | Constraints | Description              |
| ------------ | ------ | ----------- | ------------------------ |
| jobTitle     | string | optional    | User's current job title |
| businessUnit | string | optional    | User's business unit     |

### 5.2 Relationships

- The **EditProfileForm** is initialized from the **UserProfileResponse** fetched via `GET /api/profiles/me`.
- The **EditProfileForm** maps 1:1 to the **UpdateProfileRequest** at submission time.
- The read-only display fields (fullName, emailAddress) come from the same **UserProfileResponse** but are not part of the form model.

### 5.3 Domain Rules and Invariants

- **IdP fields are immutable via this endpoint**: The `PUT /api/profiles/me` endpoint no longer accepts `fullName` or `emailAddress`. These are only set during onboarding from the OIDC token.
- **Both fields are optional**: Submitting `null` for either field is valid — it clears the value.
- **No length constraints**: Job title and business unit are free-form text with no maximum length.

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                |
| ------- | ------------- | ------------------------------------------------------------------------------------------ |
| NFR-001 | Security      | Only authenticated users can access the edit page and the PUT endpoint                     |
| NFR-002 | Accessibility | All form fields shall have visible labels and be keyboard-navigable                        |
| NFR-003 | Accessibility | The breadcrumb shall use semantic `<nav>` with `aria-label="Breadcrumb"` and `<ol>` markup |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                                     | Expected Behavior                                                     |
| ---- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| EC-1 | User submits without changing anything                       | The PUT request is sent with the original values; succeeds normally   |
| EC-2 | User has no profile (hasn't onboarded)                       | Page redirects to onboarding — handled by existing route guard        |
| EC-3 | Network error while loading profile data                     | Error state shown on the page; form is not rendered                   |
| EC-4 | User refreshes the page with unsaved data                    | Browser's native "unsaved changes" warning via `beforeunload` event   |
| EC-5 | API returns 404 (profile deleted between load and save)      | Error message displayed; user stays on the form                       |

## 8. Success Criteria

| ID     | Criterion                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| SC-001 | All acceptance scenarios pass in automated tests (backend: REST Assured, frontend: Vitest)       |
| SC-002 | The edit form correctly pre-populates with existing profile data                                 |
| SC-003 | The PUT endpoint accepts only jobTitle and businessUnit and preserves IdP-derived fields          |
| SC-004 | The breadcrumb renders with correct segments and links                                           |
| SC-005 | Unsaved changes warning triggers on navigation when the form has been modified                   |
| SC-006 | The "Edit Profile" button on My Profile page navigates to the edit page                          |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-007 (My Profile Page)** — the "Edit Profile" button on this page links to the edit page.
- **FEAT-006 (ProfileDetailsCard)** — the existing profile card component that contains the "Edit Profile" button.
- **FEAT-001 (Onboarding Workflow)** — the route guard that redirects unonboarded users; the edit page relies on this guard.
- **Existing `GET /api/profiles/me`** — provides the current user's profile data to pre-populate the form.
- **Existing `PUT /api/profiles/me`** — the endpoint being modified to accept only jobTitle and businessUnit.
- **shadcn/vue components** — Card, Form, Input, Button, Breadcrumb (already available or easily added).

### 9.2 Constraints

- The `UpdateProfileRequest` DTO must be modified as part of this feature, removing `fullName` and `emailAddress`.
- The backend `PUT /api/profiles/me` handler must be updated to stop reading fullName and emailAddress from the request.
- The edit page must be registered under the `DefaultLayout` route group to inherit the navigation shell and profile check guard.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| 5. Building Block View           | Modified backend endpoint in profiles module; new frontend EditProfileView page    |
| 8. Crosscutting Concepts         | Authentication (OIDC), domain model (UserProfile entity), form handling patterns   |
| 9. Architecture Decisions (ADRs) | ADR007 — functional slice organization; ADR008 — shadcn/vue as UI framework        |

## 10. Open Questions

None — all decisions have been resolved.

