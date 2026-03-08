# Feature Specification: Upload Skill

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

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Feature ID      | FEAT-016                                   |
| Status          | Draft                                      |
| Author          |                                            |
| Created         | 2026-03-08                                 |
| Last updated    | 2026-03-08                                 |
| Epic / Parent   | Content types expansion                    |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

Users can create prompts in Promptyard, but there's no way to share reusable **skills** — collections of files (with SKILL.md as the entry point) that document how to apply a skill or pattern. Users need a dedicated channel to upload, discover, and download skills as self-contained zip packages.

### 1.2 Goal

Authenticated users can upload a skill by providing a name, optional description, one or more tags, and a zip file containing SKILL.md at the root. The system validates the file size and structure, stores the zip, and displays the skill alongside prompts and other content types. Users can browse skills, preview their contents as text, and download the original zip.

### 1.3 Non-Goals

- **Parsing SKILL.md structure** — the file is treated as a generic text file; no special handling of its content format beyond requiring its presence
- **Skill execution or validation** — no checks for valid skill structure beyond file size limits and SKILL.md presence
- **Skill versioning** — each upload creates a new skill, no version history
- **Skill templates** — no pre-built templates or AI-assisted skill creation
- **Inline zip extraction in browser** — the preview shows file contents but doesn't provide a file explorer UI
- **Individual file downloads** — only the complete zip archive can be downloaded

## 2. User Stories

### US-001: Upload a new skill

**As a** user,
**I want** to fill in a form with name, optional description, tags, and a zip file containing SKILL.md, and submit it,
**so that** my skill is saved and available in Promptyard.

### US-002: Browse skills alongside prompts

**As a** user,
**I want** to see skills displayed with other content items in lists and search results,
**so that** I can discover skills alongside prompts and other content types.

### US-003: View skill details and preview files

**As a** user,
**I want** to view a skill's details page that shows the name, description, tags, and a preview of all files in the zip (especially SKILL.md),
**so that** I can understand what the skill contains before downloading.

### US-004: Download the original zip file

**As a** user,
**I want** to download the original zip file for a skill,
**so that** I can install it in my own project.

### US-005: Filter skills by tag

**As a** user,
**I want** to filter skills by one or more tags,
**so that** I can find skills relevant to my needs.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                                                       | Priority | User Story |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The system shall display an upload form at `/content/skills/new` with fields for name (required), description (optional), tags (required, at least one), and zip file (required) | Must | US-001 |
| FR-002 | The system shall validate that the zip file contains a file named `SKILL.md` at the root                                                                          | Must | US-001 |
| FR-003 | The system shall enforce a maximum zip file size of 10 MB                                                                                                         | Must | US-001 |
| FR-004 | On successful upload, the system shall store the zip file and associate it with the skill metadata                                                                | Must | US-001 |
| FR-005 | The system shall store metadata for each file in the zip (filename, size, whether it's a text file that can be previewed)                                        | Must | US-001 |
| FR-006 | The system shall extract and store preview content for text files (UTF-8 decodable) up to a reasonable limit (e.g., first 10,000 characters)                     | Should | US-003 |
| FR-007 | The system shall display skills alongside prompts in content lists                                                                                               | Must | US-002 |
| FR-008 | The system shall distinguish skills visually from other content types (icon and colored border)                                                                  | Must | US-002 |
| FR-009 | The system shall render a dedicated skill detail page at `/content/skills/{slug}`                                                                                | Must | US-003 |
| FR-010 | The skill detail page shall display the name, description, tags, and file list from the zip                                                                      | Must | US-003 |
| FR-011 | The system shall preview the contents of text files in the zip as scrollable text blocks                                                                         | Must | US-003 |
| FR-012 | The skill detail page shall include a download button to retrieve the original zip file                                                                          | Must | US-004 |
| FR-013 | The system shall support filtering skills by tag                                                                                                                 | Should | US-005 |
| FR-014 | The system shall treat a skill as a content item subtype (discriminator value `"skill"`)                                                                         | Must | US-001 |
| FR-015 | On submission failure, the system shall display an error message to the user                                                                                     | Must | US-001 |
| FR-016 | The form shall display a submit button labeled "Upload"                                                                                                          | Must | US-001 |

## 4. Acceptance Scenarios

### SC-001: Successful skill upload (FR-001, FR-002, FR-003, FR-004, FR-015)

```gherkin
Given the user is on the Upload Skill page
  And the user has entered a name "Kotlin Coroutines Pattern"
  And the user has entered a description "Best practices for coroutine usage"
  And the user has added the tag "kotlin"
  And the user has selected a zip file containing SKILL.md at the root
When the user clicks the Upload button
Then the form data is submitted to POST /api/content/skills
  And the zip file is stored with the skill
  And the user is navigated to /content/skills/{slug} where slug is from the response
```

### SC-002: Validation requires SKILL.md at root (FR-002)

```gherkin
Given the user is on the Upload Skill page
  And the user has filled in name, description, and tags
  And the user has selected a zip file that does NOT contain SKILL.md at the root
When the user clicks the Upload button
Then an error message is displayed: "The zip file must contain a SKILL.md file at its root"
  And the form is not submitted
```

### SC-003: Validation enforces 10 MB file size limit (FR-003)

```gherkin
Given the user is on the Upload Skill page
  And the user has filled in name, description, tags
  And the user has selected a zip file larger than 10 MB
When the user clicks the Upload button
Then an error message is displayed: "The zip file must be smaller than 10 MB"
  And the form is not submitted
```

### SC-004: Validation requires name and tags (FR-001)

```gherkin
Given the user is on the Upload Skill page
  And one or more required fields (name, tags, zip file) are empty
When the user clicks the Upload button
Then validation errors are shown next to the empty required fields
  And the form is not submitted
```

### SC-005: Skills display in content lists (FR-007, FR-008)

```gherkin
Given the user is viewing a page that lists content items (homepage, search results)
  And there are both prompts and skills available
When the content items are displayed
Then prompts and skills are shown together
  And each skill has a distinct icon (e.g., "briefcase") and colored top border
```

### SC-006: Skill detail page shows file list (FR-009, FR-010)

```gherkin
Given a skill with slug "kotlin-coroutines-pattern" exists
When the user navigates to /content/skills/kotlin-coroutines-pattern
Then the page displays the skill name
  And the page displays the description
  And the page displays the tags
  And the page displays a list of files in the zip (SKILL.md and any other files)
```

### SC-007: File preview renders text content (FR-011)

```gherkin
Given a skill zip contains SKILL.md with Markdown content and a README.txt
When the skill detail page is rendered
Then the content of SKILL.md is displayed as a scrollable text block
  And the content of README.txt is displayed as a scrollable text block
  And both files show a preview header indicating the filename
```

### SC-008: Download zip button works (FR-012)

```gherkin
Given the user is on a skill detail page
When the user clicks the Download button
Then the original zip file is downloaded with the correct filename
```

### SC-009: Upload shows loading state (FR-016)

```gherkin
Given the user is on the Upload Skill page with all fields filled
When the user clicks the Upload button
Then the Upload button becomes disabled
  And the button shows a loading indicator until the API responds
```

### SC-010: Submission failure shows error (FR-015)

```gherkin
Given the user is on the Upload Skill page with valid data
  And the API returns an error (e.g., 500 or network failure)
When the user clicks the Upload button
Then an error message is displayed to the user
  And the form data is preserved so the user can retry
```

### SC-011: Binary files marked as non-text (FR-005, FR-006)

```gherkin
Given a skill zip contains SKILL.md and a .png image file
When the skill detail page is rendered
Then SKILL.md is displayed as a scrollable text block
  And the .png file is listed but marked as "Binary file, cannot preview"
```

### SC-012: Non-UTF-8 files cannot be previewed (FR-006)

```gherkin
Given a skill zip contains SKILL.md and a file that cannot be decoded as UTF-8
When the skill detail page is rendered
Then SKILL.md is displayed as a scrollable text block
  And the non-UTF-8 file is listed but marked as "Cannot preview file"
```

### SC-013: Duplicate files - last wins (FR-005)

```gherkin
Given a skill zip contains two files named "README.md" (different content)
When the skill is uploaded
Then the second README.md overwrites the first in storage
  And the preview shows the content of the second file
```

## 5. Domain Model

### 5.1 Entities

#### Skill

_A skill is a content item that encapsulates a zip file containing SKILL.md and related files._

| Attribute    | Type         | Constraints                    | Description                            |
| ------------ | ------------ | ------------------------------ | -------------------------------------- |
| id           | Long         | PK, generated                  |                                        |
| title        | string       | required, max 1000 chars       | User-provided name for the skill       |
| slug         | string       | required, unique               | URL-friendly identifier                |
| description  | string       | optional                       | User-provided description              |
| tags         | string[]     | required, min 1                | List of tag labels                     |
| authorId     | Long         | required                       | FK to user profile                     |
| author       | UserProfile  | required, lazy-loaded          | Author's profile (joined)              |
| createdAt    | Instant      | generated, immutable           |                                        |
| modifiedAt   | Instant      | optional                       |                                        |
| contentType  | string       | discriminator = "skill"        |                                        |
| fileCount    | Int          | required                       | Number of files in the uploaded zip    |
| fileSize     | Long         | required, max 10485760 (10MB)  | Total size of the zip file in bytes    |

#### SkillFile

_A file contained within a skill's zip archive. Stored as an element collection for read access._

| Attribute    | Type         | Constraints                    | Description                            |
| ------------ | ------------ | ------------------------------ | -------------------------------------- |
| fileName     | string       | required                       | Path/name of the file within the zip   |
| fileSize     | Long         | required                       | Size of the file in bytes              |
| isTextFile   | boolean      | required                       | Whether the file can be previewed as text |
| content      | String       | optional                       | Preview content if it's a text file    |

### 5.2 Relationships

- A **Skill** has many **SkillFile** entries (one-to-many element collection)
- A **Skill** belongs to exactly one **UserProfile** (author)
- A **Skill** is a specialized **ContentItem** (single-table inheritance with discriminator "skill")

### 5.3 Value Objects

#### SkillFilePreview

_A read-only view of a file's preview data for display._

| Attribute   | Type    | Constraints           |
| ----------- | ------- | --------------------- |
| fileName    | string  | required              |
| fileSize    | long    | required              |
| isTextFile  | boolean | required              |
| preview     | string  | optional, truncated   |

### 5.4 Domain Rules and Invariants

- **SKILL.md required**: A valid zip must contain a file named `SKILL.md` at the root
- **File size limit**: The zip file must not exceed 10 MB (10,485,760 bytes)
- **Content type**: The `contentType` discriminator must be `"skill"` for all skill records
- **Tag requirement**: At least one tag must be provided
- **Text file preview**: Files that cannot be decoded as UTF-8 are marked as non-text and cannot be previewed
- **Duplicate handling**: If the zip contains files with the same name, the last file wins
- **Preview truncation**: Text file preview content is truncated to the first 10,000 characters

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                                 |
| ------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Performance   | Zip file upload and storage shall complete within 5 seconds for a 10 MB file on standard broadband                          |
| NFR-002 | Performance   | Skill detail page with file previews shall render within 2 seconds                                                        |
| NFR-003 | Security      | Only authenticated users may upload skills (enforced by `@Authenticated` annotation)                                        |
| NFR-004 | Security      | Users may only view skills they uploaded, or skills that are publicly accessible (if public viewing is enabled)           |
| NFR-005 | Reliability   | If zip file storage fails, the skill record shall not be persisted and an error shall be returned to the user             |
| NFR-006 | Reliability   | If text file preview extraction fails, the skill shall still be saved but the preview content shall be marked as unavailable |
| NFR-007 | Accessibility | All form fields shall have visible labels and be keyboard-navigable                                                        |
| NFR-008 | Accessibility | File previews shall use monospace fonts for code-like content and support scroll overflow                                   |
| NFR-009 | Scalability   | The system shall support at least 100 skills per user without performance degradation                                       |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                       | Expected Behavior                                                                |
| ---- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| EC-1 | User submits zip without SKILL.md              | Error: "The zip file must contain a SKILL.md file at its root"                  |
| EC-2 | User submits zip larger than 10 MB             | Error: "The zip file must be smaller than 10 MB"                                |
| EC-3 | User submits empty zip file                    | Error: "The zip file must contain a SKILL.md file at its root"                  |
| EC-4 | User submits zip with binary file (e.g., .exe) | File is stored but marked as non-text; preview shows "Binary file, cannot preview" |
| EC-5 | Zip contains SKILL.md in subdirectory instead of root | Error: "The zip file must contain a SKILL.md file at its root"          |
| EC-6 | Zip contains files with same name (duplicate)  | Last file wins; no error shown                                                  |
| EC-7 | Network failure during upload                  | Error message shown; form data preserved for retry                              |
| EC-8 | Text file cannot be decoded as UTF-8           | File marked as non-text; no preview content stored                             |
| EC-9 | Zip contains very large text file (>100KB)     | Preview truncated to first 10,000 characters; file still downloadable          |

## 8. Success Criteria

| ID     | Criterion                                                                          |
| ------ | ---------------------------------------------------------------------------------- |
| SC-001 | All acceptance scenarios pass in Vitest unit tests                                 |
| SC-002 | The upload form accepts valid skills and rejects invalid ones                      |
| SC-003 | Skill detail page renders file list and text previews correctly                   |
| SC-004 | Download button retrieves the original zip file                                   |
| SC-005 | Skills appear alongside prompts in content lists with visual distinction          |
| SC-006 | Error handling provides clear feedback for invalid uploads                        |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- **Content item base entity** — the existing `ContentItem` entity with single-table inheritance support
- **Zip file storage** — file storage infrastructure (e.g., filesystem, S3, database BLOB)
- **Frontend form components** — shadcn/vue Form, Input, Textarea, Button (already available)
- **File upload handling** — Quinoa/Multipart support for file uploads
- **Skill detail page** — route and Vue component for `/content/skills/{slug}`

### 9.2 Constraints

- The `POST /api/content/skills` endpoint must be added to the existing `ContentItemsResource` or a new `SkillsResource`
- The skill entity must extend `ContentItem` with discriminator value `"skill"`
- File preview content shall be stored in the database alongside the skill (not as separate file references)
- The frontend form shall validate zip file extension and size before submission where possible

### 9.3 Architecture References

| Arc42 Section                      | Relevance to This Feature                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| 5. Building Block View             | New skill entity, repository, resource in the content module                |
| 8. Crosscutting Concepts           | Authentication, file storage, single-table inheritance pattern              |
| 9. Architecture Decisions (ADRs)   | ADR007 — functional slice organization; ADR003 — PostgreSQL for persistence |

## 10. Open Questions

| #   | Question                                                                                               | Owner | Status | Resolution |
| --- | ------------------------------------------------------------------------------------------------------ | ----- | ------ | ---------- |
| 1   | Should skills be publicly viewable or only visible to their authors?                                   |       | Open   |            |
| 2   | What is the storage backend for zip files? (Database BLOB vs filesystem vs cloud storage)             |       | Open   |            |
| 3   | Should there be a file type whitelist for files inside the zip (e.g., only .md, .txt, .json, .yml)?   |       | Open   |            |

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
