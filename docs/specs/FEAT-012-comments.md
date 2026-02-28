# Feature Specification: Comments on Content Items

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
| Feature ID      | FEAT-012                                                           |
| Status          | Draft                                                              |
| Author          |                                                                    |
| Created         | 2026-02-28                                                         |
| Last updated    | 2026-02-28                                                         |
| Epic / Parent   | Social features on content items                                   |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

Users can view prompts but have no way to give feedback, ask questions, or share context about a prompt. There is no communication channel between content consumers and content authors within the application.

### 1.2 Goal

Authenticated users can submit text comments on content items, displayed in reverse-chronological order (newest first) in a dedicated card on the prompt detail page, with a form for submitting new comments.

### 1.3 Non-Goals

- **Editing or deleting comments** — comments are immutable once posted.
- **Threaded or nested replies** — comments are a flat list.
- **Markdown formatting or rich text** — comments are plain text only.
- **Notifications** — no alerts when someone comments on your prompt.
- **Commenting on non-prompt content types** — the backend entity supports it, but API endpoints are prompt-scoped for this iteration.
- **Rate limiting or spam prevention** — no limits on comment frequency or count.
- **Pagination of comments** — all comments are returned in a single response.

## 2. User Stories

### US-001: Submit a comment

**As a** user,
**I want** to write and submit a comment on a prompt,
**so that** I can share feedback or ask questions about the prompt.

### US-002: View comments

**As a** user,
**I want** to see all comments on a prompt sorted from newest to oldest,
**so that** I can read recent feedback first.

### US-003: See who commented

**As a** user,
**I want** to see the commenter's name and when they posted,
**so that** I know who said what and when.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                    | Priority | User Story |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The system shall provide a `POST /api/content/prompts/{slug}/comments` endpoint that creates a comment on the specified prompt                 | Must     | US-001     |
| FR-002 | The system shall generate the `createdAt` timestamp server-side when a comment is inserted                                                     | Must     | US-001     |
| FR-003 | The system shall require the comment text to be non-blank                                                                                      | Must     | US-001     |
| FR-004 | The system shall associate each comment with the authenticated user who submitted it                                                           | Must     | US-001     |
| FR-005 | The system shall provide a `GET /api/content/prompts/{slug}/comments` endpoint returning all comments sorted by `createdAt` descending         | Must     | US-002     |
| FR-006 | The prompt detail page shall display a comments card below the existing content in the main column                                             | Must     | US-002     |
| FR-007 | Each comment in the list shall display the commenter's full name and a relative timestamp (e.g., "2 hours ago")                                | Must     | US-003     |
| FR-008 | The comments card shall include a form at the top with a text area and a submit button for posting a new comment                               | Must     | US-001     |
| FR-009 | After successful comment submission, the new comment shall appear at the top of the list without a full page reload                             | Should   | US-001     |
| FR-010 | The system shall return 404 if a comment is posted on a non-existent prompt                                                                   | Must     | US-001     |

## 4. Acceptance Scenarios

### SC-001: Submit a comment successfully (FR-001, FR-002, FR-003, FR-004)

```gherkin
Given a prompt with slug "code-review-checklist" exists
  And the user is authenticated as "jane.doe@example.com"
When the user submits a comment with text "Great prompt, very helpful!"
Then the system creates the comment associated with the user
  And the comment has a server-generated createdAt timestamp
  And the API returns the created comment with status 201
```

### SC-002: Reject blank comment (FR-003)

```gherkin
Given a prompt with slug "code-review-checklist" exists
  And the user is authenticated
When the user submits a comment with empty text
Then the API returns a 400 error
  And no comment is persisted
```

### SC-003: List comments newest first (FR-005)

```gherkin
Given a prompt with slug "code-review-checklist" has three comments
  And comment A was created at 10:00, comment B at 11:00, comment C at 12:00
When the user requests comments for "code-review-checklist"
Then the response contains three comments in order C, B, A
```

### SC-004: Comment on non-existent prompt (FR-010)

```gherkin
Given no prompt exists with slug "nonexistent-prompt"
When the user submits a comment to /api/content/prompts/nonexistent-prompt/comments
Then the API returns 404
```

### SC-005: Comments card displays on prompt detail page (FR-006, FR-007, FR-008)

```gherkin
Given a prompt with slug "code-review-checklist" has two comments
  And the first comment is by "Jane Doe" posted "2 hours ago" with text "Looks good"
  And the second comment is by "John Smith" posted "1 hour ago" with text "I agree"
When the user views the prompt detail page
Then a comments card appears below the prompt content in the main column
  And the card shows a comment form with a text area and submit button above the list
  And the list shows "John Smith" with "1 hour ago" and text "I agree" first
  And then "Jane Doe" with "2 hours ago" and text "Looks good"
```

### SC-006: New comment appears without page reload (FR-009)

```gherkin
Given the user is viewing the prompt detail page for "code-review-checklist"
  And the comments list shows 2 existing comments
When the user types "Nice work!" in the comment form and clicks submit
Then the comment form is cleared
  And the new comment appears at the top of the list
  And the list now shows 3 comments
```

### SC-007: Unauthenticated user cannot post comment (FR-004)

```gherkin
Given a prompt with slug "code-review-checklist" exists
When an unauthenticated user sends POST /api/content/prompts/code-review-checklist/comments
Then the API returns 302 (redirect to login)
```

## 5. Domain Model

### 5.1 Entities

#### Comment

*A user's feedback on a content item.*

| Attribute     | Type     | Constraints                      | Description                            |
| ------------- | -------- | -------------------------------- | -------------------------------------- |
| id            | long     | PK, generated                    | Database identifier                    |
| text          | string   | required, non-blank              | The comment body                       |
| createdAt     | datetime | generated, immutable             | When the comment was created           |
| authorId      | long     | FK to UserProfile, required      | The user who wrote the comment         |
| contentItemId | long     | FK to ContentItem, required      | The content item being commented on    |

#### CommentResponse (API DTO)

*Returned by the comments API endpoint.*

| Attribute      | Type     | Constraints | Description                      |
| -------------- | -------- | ----------- | -------------------------------- |
| id             | long     | required    | Comment identifier               |
| text           | string   | required    | The comment body                 |
| createdAt      | datetime | required    | When the comment was posted      |
| authorFullName | string   | required    | Display name of the commenter    |

#### CreateCommentRequest (API DTO)

*Submitted when posting a new comment.*

| Attribute | Type   | Constraints        | Description      |
| --------- | ------ | ------------------ | ---------------- |
| text      | string | required, non-blank | The comment body |

### 5.2 Relationships

- A **ContentItem** has many **Comments** (one-to-many)
- A **Comment** belongs to exactly one **ContentItem**
- A **Comment** belongs to exactly one **UserProfile** (author)
- A **UserProfile** has many **Comments** (one-to-many)

### 5.4 Domain Rules and Invariants

- **Comment text must be non-blank**: A comment with only whitespace is rejected.
- **createdAt is server-generated**: Clients cannot set or override the creation timestamp.
- **Comment is immutable once created**: No updates or modifications are supported.
- **Author always exists**: Comments can only be created by authenticated users with an existing profile.
- **Content item must exist**: A comment cannot reference a non-existent content item.
- **Any user can comment**: There is no restriction on commenting on your own prompt or commenting multiple times.

## 6. Non-Functional Requirements

| ID      | Category    | Requirement                                                                                       |
| ------- | ----------- | ------------------------------------------------------------------------------------------------- |
| NFR-001 | Security    | Only authenticated users with a profile can create comments                                       |
| NFR-002 | Security    | The comments API endpoints require authentication (consistent with `@Authenticated` pattern)      |
| NFR-003 | Performance | The comments list endpoint shall respond within 500ms for up to 500 comments on a single prompt   |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                                  | Expected Behavior                                                                    |
| ---- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| EC-1 | User submits a comment with only whitespace               | API returns 400, comment is not persisted                                            |
| EC-2 | Prompt has no comments                                    | Comments card shows the form and a "No comments yet" message instead of an empty list |
| EC-3 | User submits a very long comment (10,000+ characters)     | Comment is accepted — no length limit per requirements                               |
| EC-4 | Network error when submitting comment                     | Form shows an error message, comment text is preserved so the user can retry          |
| EC-5 | Network error when loading comments                       | Comments section shows an error state with retry option                               |
| EC-6 | User's profile doesn't exist (hasn't completed onboarding)| Handled by existing profile guard — user is redirected to onboarding                  |

## 8. Success Criteria

| ID     | Criterion                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in automated tests (backend: REST Assured, frontend: Vitest)         |
| SC-002 | Users can submit comments and see them appear in the list without page reload                       |
| SC-003 | Comments are displayed in reverse-chronological order with author name and relative timestamp       |
| SC-004 | Blank or whitespace-only comments are rejected with appropriate error feedback                      |
| SC-005 | The comments API returns 404 for non-existent prompts                                              |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **FEAT-005 (Prompt Detail Page)** — the comments card is added to the existing prompt detail page layout.
- **Backend `ContentItem` entity and `Prompt` subclass** — comments reference the `content_item` table via FK.
- **`UserProfile` entity** — comments reference the `user_profile` table for author data.

### 9.2 Constraints

- A new Flyway migration is required to create the `comment` table.
- The comments endpoints must sit under `/api/content/prompts/{slug}/comments` to maintain the resource hierarchy.
- The comment entity FK references `content_item` (not `prompt` specifically) to allow future extension.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| 5. Building Block View           | New Comment entity, repository, and resource in the content module                      |
| 8. Crosscutting Concepts         | Domain model extension (Comment entity), authentication pattern, persistence/Flyway     |
| 9. Architecture Decisions (ADRs) | ADR007 — functional slice organization (comments belong in content module)               |

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
