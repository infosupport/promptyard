# Feature Specification: [Feature Name]

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
| Feature ID      | FEAT-NNN                                   |
| Status          | Draft / In Review / Approved / Implemented |
| Author          |                                            |
| Created         | YYYY-MM-DD                                 |
| Last updated    | YYYY-MM-DD                                 |
| Epic / Parent   | _Link to parent epic or initiative_        |
| Arc42 reference | _Section(s) of your arc42 docs affected_   |

### 1.1 Problem Statement

_What problem does this feature solve? Why does it matter to the user or the business?
Keep this to 2-3 sentences._

### 1.2 Goal

_What is the desired outcome? Describe the end state, not the journey._

### 1.3 Non-Goals

_What is explicitly out of scope? This prevents the AI agent from over-engineering._

- ...
- ...

## 2. User Stories

_Write user stories for each actor that interacts with this feature.
Keep them focused — one story per distinct need._

### US-001: [Short title]

**As a** [actor/role],
**I want** [goal],
**so that** [benefit/reason].

### US-002: [Short title]

**As a** [actor/role],
**I want** [goal],
**so that** [benefit/reason].

## 3. Functional Requirements

_List what the system must do. Each requirement should be independently testable.
Use reasonable defaults for unspecified details. Mark genuine ambiguities with
[NEEDS CLARIFICATION: question]._

| ID     | Requirement                                  | Priority       | User Story |
| ------ | -------------------------------------------- | -------------- | ---------- |
| FR-001 | _The system shall..._                        | Must / Should  | US-001     |
| FR-002 | _The system shall..._                        | Must / Should  | US-001     |
| FR-003 | _The system shall..._                        | Must / Should  | US-002     |

## 4. Acceptance Scenarios

_Define acceptance criteria using Given/When/Then. These scenarios serve as both
specification and the basis for automated acceptance tests. Write them at the
behavior level — describe observable outcomes, not internal mechanics._

### SC-001: [Scenario title] (FR-001)

```gherkin
Given [precondition / initial state]
  And [additional context if needed]
When [action or event]
Then [expected observable outcome]
  And [additional assertion if needed]
```

### SC-002: [Scenario title] (FR-002)

```gherkin
Given [precondition / initial state]
When [action or event]
Then [expected observable outcome]
```

## 5. Domain Model

_Define the key domain objects, their attributes, and relationships. Use ubiquitous
language from your domain. This section gives the AI agent the vocabulary and structure
it needs to generate correct data access code, validation logic, and API contracts._

### 5.1 Entities

#### [EntityName]

_Brief description of what this entity represents in the domain._

| Attribute    | Type         | Constraints                    | Description            |
| ------------ | ------------ | ------------------------------ | ---------------------- |
| id           | UUID         | PK, generated                  |                        |
| name         | string       | required, max 200 chars        |                        |
| status       | enum         | [active, archived, suspended]  |                        |
| createdAt    | datetime     | generated, immutable           |                        |

#### [AnotherEntity]

| Attribute    | Type         | Constraints                    | Description            |
| ------------ | ------------ | ------------------------------ | ---------------------- |
| ...          | ...          | ...                            | ...                    |

### 5.2 Relationships

_Describe how entities relate to each other. Use plain language — the agent can
derive the technical implementation from the architecture docs._

- A **[EntityA]** has many **[EntityB]** (one-to-many)
- A **[EntityB]** belongs to exactly one **[EntityA]**
- A **[EntityC]** relates to **[EntityD]** through **[JoinEntity]** (many-to-many)

### 5.3 Value Objects

_Small immutable objects that have no identity of their own but carry meaning.
Only include this section if the domain has them._

#### [ValueObjectName]

| Attribute | Type   | Constraints          |
| --------- | ------ | -------------------- |
| ...       | ...    | ...                  |

### 5.4 Domain Rules and Invariants

_Business rules that must always hold true. These are critical for the AI agent
to generate correct validation logic._

- **[Rule name]**: _Description of the invariant, e.g., "An order total must never
  be negative" or "A user cannot belong to more than 5 teams simultaneously."_
- **[Rule name]**: _..._

## 6. Non-Functional Requirements

_Include only the requirements that are specific to this feature. Project-wide NFRs
should live in your arc42 Section 10 (Quality Requirements) and be referenced,
not duplicated._

| ID      | Category     | Requirement                                          |
| ------- | ------------ | ---------------------------------------------------- |
| NFR-001 | Performance  | _e.g., Response time < 200ms at p95 for list view_   |
| NFR-002 | Security     | _e.g., Only users with role X may access this data_   |
| NFR-003 | Reliability  | _e.g., Must handle partial failures from service Y_   |

## 7. Edge Cases and Error Scenarios

_Boundary conditions and failure modes that the implementation must handle.
Writing these out prevents the AI from generating only the happy path._

| ID   | Scenario                             | Expected Behavior                           |
| ---- | ------------------------------------ | ------------------------------------------- |
| EC-1 | _e.g., User submits empty form_      | _Show validation errors, don't persist_     |
| EC-2 | _e.g., External API is unavailable_  | _Return cached result or degrade gracefully_|
| EC-3 | _e.g., Concurrent update conflict_   | _Last-write-wins / optimistic locking_      |

## 8. Success Criteria

_Measurable outcomes that determine whether this feature is complete and working.
These should be technology-agnostic._

| ID     | Criterion                                                          |
| ------ | ------------------------------------------------------------------ |
| SC-001 | _e.g., All acceptance scenarios pass in CI_                        |
| SC-002 | _e.g., Feature handles 100 concurrent users without degradation_   |
| SC-003 | _e.g., Zero critical/high severity bugs after 1 week in staging_   |

## 9. Dependencies and Constraints

### 9.1 Dependencies

_What this feature depends on — other features, services, teams, or decisions._

- ...

### 9.2 Constraints

_Hard boundaries: regulatory, contractual, organizational, or technical._

- ...

### 9.3 Architecture References

_Point to specific arc42 sections that constrain or inform this feature.
The AI agent should consult these during the Plan and Implement phases._

| Arc42 Section                      | Relevance to This Feature                    |
| ---------------------------------- | -------------------------------------------- |
| 3. Context & Scope                 | _System boundary, external interfaces_       |
| 5. Building Block View             | _Which components are affected_              |
| 6. Runtime View                    | _Interaction patterns to follow_             |
| 8. Crosscutting Concepts           | _Error handling, logging, auth patterns_     |
| 9. Architecture Decisions (ADRs)   | _Relevant decisions that constrain choices_  |
| 10. Quality Requirements           | _Quality scenarios that apply_               |

## 10. Open Questions

_Track unresolved decisions here. Resolve them before moving to the Plan phase.
Aim to have zero open questions before handing off to the AI agent._

| #   | Question                             | Owner | Status   | Resolution |
| --- | ------------------------------------ | ----- | -------- | ---------- |
| 1   |                                      |       | Open     |            |

---

<!--
  CHECKLIST — Complete before moving to the Plan phase
  ====================================================
  - [ ] Problem statement is clear and concise
  - [ ] All user stories have acceptance scenarios
  - [ ] Each functional requirement traces to a user story
  - [ ] Domain model covers all entities mentioned in the requirements
  - [ ] Domain rules and invariants are listed
  - [ ] Edge cases cover failure modes, not just happy paths
  - [ ] Non-functional requirements are specific and measurable
  - [ ] Arc42 references point to the right sections
  - [ ] No more than 3 [NEEDS CLARIFICATION] markers remain
  - [ ] Open questions are assigned and have a resolution path
-->
