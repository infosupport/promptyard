# Feature Specification: Onboarding Workflow

## 1. Overview

| Field           | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Feature ID      | FEAT-001                                              |
| Status          | Draft                                                 |
| Author          | Willem Meints                                         |
| Created         | 2026-02-24                                            |
| Last updated    | 2026-02-24                                            |
| Epic / Parent   | User onboarding and profile management                |
| Arc42 reference | Section 8 (Authentication, Domain Model, Persistence) |

### 1.1 Problem Statement

When a new user authenticates via OIDC and enters the application, no user profile exists for them yet. The application has no mechanism to detect this condition and guide the user through initial setup. New users land on the home page without a profile, which will cause errors as features depend on an existing profile (e.g., content authoring, user menus).

### 1.2 Goal

After login, the application automatically detects whether the authenticated user has a profile. If not, it redirects them to a welcome/onboarding page where they can optionally provide their job title and business unit, accept the privacy statement, and create their profile. Once onboarded, they are redirected to their profile page. The privacy acceptance timestamp is stored on the profile for audit purposes.

### 1.3 Non-Goals

- Implementing the privacy statement page (`/privacy`) — that is a separate feature
- Profile editing after onboarding (already exists via `PUT /api/profiles/me`)
- Role-based onboarding flows or admin approval steps
- Email verification or additional identity checks beyond OIDC
- Custom onboarding flows per business unit or role

## 2. User Stories

### US-001: Automatic profile detection

**As a** newly authenticated user,
**I want** the application to detect that I don't have a profile yet,
**so that** I'm guided to set up my account instead of landing on a broken experience.

### US-002: Onboarding form

**As a** new user without a profile,
**I want** to provide my job title, business unit, and accept the privacy statement,
**so that** my profile is created and I can start using the application.

### US-003: Onboarding page for existing users

**As an** onboarded user who navigates to `/welcome`,
**I want** to see a meaningful page,
**so that** I'm not confused by a stale or broken form.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                            | Priority | User Story |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------- |
| FR-001 | The system shall call `GET /api/profiles/me` after authentication to check for an existing profile                                                     | Must     | US-001     |
| FR-002 | The system shall redirect the user to `/welcome` if `GET /api/profiles/me` returns 404                                                                 | Must     | US-001     |
| FR-003 | The system shall prevent access to all pages except `/welcome` until the user has a profile (via a route guard)                                        | Must     | US-001     |
| FR-004 | The onboarding form shall include an optional job title text field                                                                                     | Must     | US-002     |
| FR-005 | The onboarding form shall include an optional business unit text field                                                                                 | Must     | US-002     |
| FR-006 | The onboarding form shall include a mandatory privacy statement acceptance checkbox with a link to `/privacy`                                          | Must     | US-002     |
| FR-007 | The system shall submit a `POST /api/profiles` request with the form data (jobTitle, businessUnit, privacyAccepted) when the user completes onboarding | Must     | US-002     |
| FR-008 | The system shall redirect the user to their profile page after successful onboarding                                                                   | Must     | US-002     |
| FR-009 | The onboarding page shall display a friendly message to users who already have a profile, without showing the onboarding form                          | Should   | US-003     |

## 4. Acceptance Scenarios

### SC-001: New user is redirected to onboarding (FR-001, FR-002)

```gherkin
Given an authenticated user with no existing profile
When the user navigates to any page in the application
Then the application calls GET /api/profiles/me
  And receives a 404 response
  And redirects the user to /welcome
```

### SC-002: Existing user proceeds normally (FR-001)

```gherkin
Given an authenticated user with an existing profile
When the user navigates to any page in the application
Then the application calls GET /api/profiles/me
  And receives a 200 response with the profile data
  And the user sees the requested page
```

### SC-003: Route guard blocks unonboarded users (FR-003)

```gherkin
Given an authenticated user with no existing profile
When the user tries to navigate directly to a feature page (e.g., /)
Then the application redirects them to /welcome
```

### SC-004: Successful onboarding with all fields (FR-004, FR-005, FR-006, FR-007, FR-008)

```gherkin
Given a new user on the /welcome page
When the user enters a job title "Software Engineer"
  And enters a business unit "Engineering"
  And accepts the privacy statement
  And submits the form
Then the system sends POST /api/profiles with jobTitle, businessUnit, and privacyAccepted
  And the user is redirected to their profile page
```

### SC-005: Successful onboarding with only privacy acceptance (FR-004, FR-005, FR-006, FR-007, FR-008)

```gherkin
Given a new user on the /welcome page
When the user leaves job title and business unit empty
  And accepts the privacy statement
  And submits the form
Then the system sends POST /api/profiles with null jobTitle and businessUnit, and privacyAccepted true
  And the user is redirected to their profile page
```

### SC-006: Form submission blocked without privacy acceptance (FR-006)

```gherkin
Given a new user on the /welcome page
When the user fills in job title and business unit
  But does not accept the privacy statement
  And tries to submit the form
Then the form shows a validation error on the privacy acceptance checkbox
  And no request is sent to the API
```

### SC-007: Existing user visits /welcome (FR-009)

```gherkin
Given an authenticated user who already has a profile
When the user navigates to /welcome
Then the page displays a message indicating they are already onboarded
  And does not show the onboarding form
```

### SC-008: API error during onboarding (FR-007)

```gherkin
Given a new user on the /welcome page who has filled in the form correctly
When the user submits the form
  And the POST /api/profiles request fails with a server error
Then the user sees an error message indicating onboarding failed
  And the user remains on the /welcome page
```

## 5. Domain Model

### 5.1 Entities

#### UserProfile (existing — modified)

The existing `UserProfile` entity gains one new attribute to support privacy acceptance tracking.

| Attribute         | Type     | Constraints                      | Source / Description                                          |
| ----------------- | -------- | -------------------------------- | ------------------------------------------------------------- |
| id                | Long     | PK, generated                    | Auto                                                          |
| subjectName       | string   | required, unique                 | OIDC token (principal name)                                   |
| slug              | string   | required, unique, generated      | Derived from fullName via slug generator                      |
| fullName          | string   | required                         | OIDC token (name claim)                                       |
| emailAddress      | string   | required                         | OIDC token (email claim)                                      |
| jobTitle          | string   | optional                         | Onboarding form input                                         |
| businessUnit      | string   | optional                         | Onboarding form input                                         |
| privacyAcceptedAt | datetime | required (set during onboarding) | **New.** System timestamp when user accepts privacy statement |
| createdAt         | datetime | required, generated, immutable   | System                                                        |
| modifiedAt        | datetime | optional                         | System                                                        |

No new entities or relationships are introduced.

### 5.2 Domain Rules and Invariants

- **One profile per identity**: A user cannot create a second profile. The `POST /api/profiles` endpoint is idempotent — it returns the existing profile if one already exists for the subject name.
- **Privacy acceptance required for onboarding**: The backend shall reject onboarding requests where `privacyAccepted` is not `true` with a 400 Bad Request response.
- **Privacy acceptance timestamp is immutable**: Once set during onboarding, `privacyAcceptedAt` is not modified by subsequent profile updates.

## 6. Non-Functional Requirements

| ID      | Category    | Requirement                                                                                                         |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Performance | The profile check (`GET /api/profiles/me`) shall complete in < 100ms at p95, as it runs on every app load           |
| NFR-002 | Security    | All onboarding endpoints remain behind OIDC authentication (existing behavior)                                      |
| NFR-003 | UX          | The profile check result shall be cached in the frontend session to avoid redundant API calls on every route change |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                                                                 | Expected Behavior                                                                        |
| ---- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| EC-1 | User submits the onboarding form but the API returns 409 or 200 (profile already exists) | Frontend treats this as success and redirects to the profile page                        |
| EC-2 | `GET /api/profiles/me` call fails with a network error or 500                            | Show an error message; do not redirect to onboarding (to avoid trapping users in a loop) |
| EC-3 | User opens `/welcome` in two tabs and submits both                                       | First submission creates the profile; second returns the existing profile (idempotent)   |
| EC-4 | User refreshes the `/welcome` page mid-onboarding                                        | Form resets; user can fill it in and submit again                                        |
| EC-5 | User submits with `privacyAccepted: false` via direct API call                           | Backend returns 400 Bad Request                                                          |

## 8. Success Criteria

| ID     | Criterion                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass via automated tests (frontend unit tests + backend integration tests) |
| SC-002 | New users are reliably redirected to onboarding and can complete the flow end-to-end                |
| SC-003 | Privacy acceptance timestamp is stored on every new profile                                         |
| SC-004 | Existing users are not disrupted by the onboarding flow                                             |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **Privacy page (`/privacy`)**: The onboarding form links to this page, but it does not need to exist for this feature to work. The link can point to a placeholder or "coming soon" page.
- **Profile page**: After onboarding, the user is redirected to their profile page. This page must exist or be created as part of this feature.
- **Flyway migration**: A new migration is needed to add the `privacy_accepted_at` column to the `user_profile` table.

### 9.2 Constraints

- The backend onboarding endpoint (`POST /api/profiles`) already exists and must remain backward-compatible. The `privacyAccepted` field is added to the `OnboardUserRequest` DTO.
- The frontend uses shadcn/vue components and vee-validate for form handling (ADR-008).

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 3. Context & Scope               | OIDC authentication flow — user identity is established before onboarding begins                                        |
| 5. Building Block View           | `profiles/` module is the primary building block affected                                                               |
| 8. Crosscutting Concepts         | Authentication (OIDC token claims), Domain Model (UserProfile entity), Persistence (Flyway migrations), Slug Generation |
| 9. Architecture Decisions (ADRs) | ADR-007 (functional slicing), ADR-008 (shadcn/vue + vee-validate for forms)                                             |

## 10. Open Questions

_No open questions._

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
  - [x] No more than 3 [NEEDS CLARIFICATION] markers remain (0 remain)
  - [x] Open questions are assigned and have a resolution path (0 open)
-->
