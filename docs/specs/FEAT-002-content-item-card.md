# Feature Specification: Content Item Card

## 1. Overview

| Field           | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Feature ID      | FEAT-002                                                 |
| Status          | Draft                                                    |
| Author          |                                                          |
| Created         | 2026-02-25                                               |
| Last updated    | 2026-02-25                                               |
| Epic / Parent   | Content browsing and discovery                           |
| Arc42 reference | Section 5 (Building Block View), Section 8 (Crosscutting Concepts) |

### 1.1 Problem Statement

Promptyard manages multiple types of content items (prompts, skills, agents, workflows) that need to be displayed across various pages — homepage, profile, search results. There is currently no reusable UI component for presenting a content item summary, which means each page would have to build its own card layout, leading to inconsistency and duplication.

### 1.2 Goal

A single, reusable `ContentItemCard` component that presents a content item's summary (title, description, tags, author, content type) in a consistent visual format. The card visually differentiates content types via an icon and colored top border, and provides a footer slot for consumer-defined actions.

### 1.3 Non-Goals

- **Backend API changes** — the `ContentItemResponse` will be extended with author data in a later feature; this spec assumes the data will be available as props.
- **The content list component** — the grid/list layout that arranges cards will be a separate feature.
- **Content type subclass entities** — skill, agent, and workflow entity types will be added separately; this spec only covers the card's visual treatment of those types.
- **Card interactivity beyond navigation** — inline editing, drag-and-drop, or selection checkboxes are not in scope.
- **Loading/skeleton state** — loading states are the responsibility of the parent list component, not the card.

## 2. User Stories

### US-001: Browse content items

**As a** user browsing content,
**I want** to see a summary card for each content item showing its title, description, tags, author, and type,
**so that** I can quickly scan and identify relevant content without opening each item.

### US-002: Navigate to content detail

**As a** user browsing content,
**I want** to click a content item card's title to navigate to that item's detail page,
**so that** I can view the full content.

### US-003: Distinguish content types

**As a** user browsing content,
**I want** each card to visually indicate its content type (prompt, skill, agent, workflow),
**so that** I can tell at a glance what kind of content it is.

### US-004: Perform actions on content

**As a** page developer,
**I want** to inject custom action buttons into a card's footer,
**so that** different pages can offer context-appropriate actions (e.g., edit, delete, share) without modifying the card component itself.

## 3. Functional Requirements

| ID     | Requirement                                                                                                                  | Priority | User Story |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| FR-001 | The component shall display the content item's title as the card heading                                                     | Must     | US-001     |
| FR-002 | The component shall display the content item's description, truncated to a maximum of 3 lines with ellipsis overflow         | Must     | US-001     |
| FR-003 | The component shall display the content item's tags as a list of badges                                                      | Must     | US-001     |
| FR-004 | The component shall display the author's full name                                                                           | Must     | US-001     |
| FR-005 | The component shall render a colored top border that corresponds to the content type, using an internal mapping              | Must     | US-003     |
| FR-006 | The component shall render a Lucide icon that corresponds to the content type (prompt, skill, agent, workflow), using an internal mapping | Must     | US-003     |
| FR-007 | The content item's title shall be a clickable link that navigates to the content item's detail URL                           | Must     | US-002     |
| FR-008 | The component shall provide a footer slot where consumers can inject action components                                       | Must     | US-004     |
| FR-009 | The card shall be built on the shadcn/vue Card component                                                                     | Must     | US-001     |
| FR-010 | When no actions are provided via the footer slot, the footer section shall not render                                        | Should   | US-004     |
| FR-011 | When tags overflow beyond a single line, the component shall cap the visible tags and display a "+N more" indicator showing the count of hidden tags | Must     | US-001     |

## 4. Acceptance Scenarios

### SC-001: Card displays content item summary (FR-001, FR-002, FR-003, FR-004)

```gherkin
Given a content item with title "My Prompt", description "A useful prompt for code reviews", tags ["kotlin", "review"], and author "Jane Doe"
When the ContentItemCard is rendered
Then the card displays "My Prompt" as the heading
  And the card displays "A useful prompt for code reviews" as the description
  And the card displays badges for "kotlin" and "review"
  And the card displays "Jane Doe" as the author name
```

### SC-002: Long description is truncated to 3 lines (FR-002)

```gherkin
Given a content item with a description longer than 3 lines of visible text
When the ContentItemCard is rendered
Then the description is truncated at 3 lines
  And the truncated text ends with an ellipsis
```

### SC-003: Content type shown with colored border and icon — prompt (FR-005, FR-006)

```gherkin
Given a content item with content type "prompt"
When the ContentItemCard is rendered
Then the card displays a top border in the color mapped to "prompt"
  And the card displays the Lucide icon mapped to "prompt"
```

### SC-004: Content type shown with colored border and icon — other types (FR-005, FR-006)

```gherkin
Given a content item with content type "<type>"
When the ContentItemCard is rendered
Then the card displays a top border in the color mapped to "<type>"
  And the card displays the Lucide icon mapped to "<type>"

Examples:
  | type     |
  | skill    |
  | agent    |
  | workflow |
```

### SC-005: Title navigates to content item detail (FR-007)

```gherkin
Given a content item with content type "prompt" and slug "my-prompt"
When the user clicks the card title
Then the browser navigates to the content item's detail URL
```

### SC-006: Footer actions rendered via slot (FR-008)

```gherkin
Given a ContentItemCard with action components provided in the footer slot
When the card is rendered
Then the footer section is visible
  And the provided action components are rendered inside the footer
```

### SC-007: Footer hidden when no actions provided (FR-010)

```gherkin
Given a ContentItemCard with no components provided in the footer slot
When the card is rendered
Then the footer section is not present in the DOM
```

### SC-008: Tags overflow shows "+N more" indicator (FR-011)

```gherkin
Given a content item with more tags than can fit on a single line
When the ContentItemCard is rendered
Then the visible tags are capped to fit within one line
  And a "+N more" indicator is displayed where N is the count of hidden tags
```

### SC-009: All tags fit on one line (FR-011)

```gherkin
Given a content item with few enough tags to fit on a single line
When the ContentItemCard is rendered
Then all tags are displayed as badges
  And no "+N more" indicator is shown
```

## 5. Domain Model

This feature is a pure frontend component — it does not introduce new entities or persistence. The domain model describes the component's data contract.

### 5.1 Entities

#### ContentItemCardProps

*The data contract for the ContentItemCard component.*

| Attribute   | Type     | Constraints                                       | Description                                        |
| ----------- | -------- | ------------------------------------------------- | -------------------------------------------------- |
| title       | string   | required, non-empty                               | The content item's title, displayed as heading     |
| description | string   | required                                          | Short description, visually truncated to 3 lines   |
| tags        | string[] | required, may be empty                            | List of tag labels displayed as badges             |
| contentType | enum     | required, one of [prompt, skill, agent, workflow] | Determines the icon and top border color           |
| authorName  | string   | required, non-empty                               | Author's full name                                 |
| url         | string   | required, valid route path                        | Navigation target for the title link               |

### 5.2 Relationships

- A **ContentItemCard** renders data from one **ContentItem** and its associated **UserProfile** (author). The parent component is responsible for mapping API responses to the props shape above.

### 5.3 Value Objects

#### ContentTypeConfig

*Internal mapping of content type to visual treatment. Not exposed as props.*

| Attribute | Type   | Constraints                        |
| --------- | ------ | ---------------------------------- |
| type      | enum   | prompt, skill, agent, workflow     |
| color     | string | Tailwind border color class        |
| icon      | string | Lucide icon component identifier   |

### 5.4 Domain Rules and Invariants

- **Valid content type**: The `contentType` prop must be one of the four recognized values (prompt, skill, agent, workflow).
- **Description truncation is visual only**: The full description text is passed in; truncation is a CSS concern, not data manipulation.
- **Tag overflow is dynamic**: The "+N more" count depends on the rendered width, not a fixed tag count. The component must measure available space at render time.

## 6. Non-Functional Requirements

| ID      | Category      | Requirement                                                                                                          |
| ------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Performance   | The tag overflow measurement shall not cause visible layout shift — the "+N more" indicator must resolve within the first render frame |
| NFR-002 | Accessibility | The title link shall be keyboard-focusable and have an accessible name derived from the content item title           |
| NFR-003 | Accessibility | Content type icons shall have appropriate aria-labels (e.g., "Prompt", "Skill") so screen readers convey the type    |
| NFR-004 | Responsiveness | The card shall adapt to its container width without a fixed width — layout is the parent's responsibility            |

## 7. Edge Cases and Error Scenarios

| ID   | Scenario                                        | Expected Behavior                                                        |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| EC-1 | Content item has an empty tags list              | The tags section is not rendered; no empty space or "+0 more" indicator   |
| EC-2 | Content item has a very long title (200+ chars)  | Title truncates with ellipsis after 2 lines                              |
| EC-3 | Content item has a single-word very long tag     | The tag badge truncates with ellipsis rather than breaking the layout    |
| EC-4 | Content item has an empty description            | The description area is not rendered; card remains visually balanced     |
| EC-5 | Footer slot contains multiple action buttons     | Actions render horizontally in the footer and wrap if they overflow      |

## 8. Success Criteria

| ID     | Criterion                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------- |
| SC-001 | The ContentItemCard renders correctly for all four content types with distinct border colors and icons |
| SC-002 | Description truncation and tag overflow behave correctly across varying container widths            |
| SC-003 | Footer slot renders consumer-provided actions and hides when empty                                 |
| SC-004 | Title link navigates to the correct content item URL                                               |
| SC-005 | Component has Vitest unit tests covering all acceptance scenarios                                   |

## 9. Dependencies and Constraints

### 9.1 Dependencies

- shadcn/vue Card components (already installed)
- Lucide icons via `lucide-vue-next` (shadcn/vue's default icon library)

### 9.2 Constraints

- The component receives all data as props — it does not fetch data from the API itself.
- The URL format for content item detail pages is not yet established. The component accepts a `url` prop and does not construct routes internally.

### 9.3 Architecture References

| Arc42 Section                    | Relevance to This Feature                                      |
| -------------------------------- | -------------------------------------------------------------- |
| 5. Building Block View           | New component in the frontend content module                   |
| 8. Crosscutting Concepts         | UI component patterns, shadcn/vue usage                        |
| 9. Architecture Decisions (ADRs) | ADR008 — shadcn/vue as UI framework, ADR007 — functional slice organization |

---
