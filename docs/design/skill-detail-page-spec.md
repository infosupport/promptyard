# Skill Detail Page - Design Specification

## Overview

The Skill Detail Page displays individual skill configurations (Claude Code skills, MCP configs) with code viewing, installation instructions, and usage examples. Skills are code-based resources that users can copy and integrate into their development workflow.

---

## FigJam Diagrams

Interactive diagrams are available in FigJam:

| Diagram | Description | Link |
|---------|-------------|------|
| Component Structure | Page layout hierarchy and component organization | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/c7008e87-b848-4f82-b101-c9ce092eafac) |
| User Flow | All user interactions and navigation paths | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/5e2fefce-a8cd-4be6-b83a-2c030b39f538) |
| Installation Sequence | Step-by-step installation process | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/97fc83ea-680d-41f5-b8a3-ec9bb8f261c5) |

---

## Page Information Architecture

```
Skill Detail Page
├── Global Header (sticky)
├── Breadcrumb Navigation
├── Main Content Area
│   ├── Skill Header Section
│   │   ├── Type Badges
│   │   ├── Title & Meta
│   │   └── Actions (Bookmark, Share)
│   ├── Code Viewer Section
│   │   ├── File Tabs
│   │   ├── Code Block (syntax highlighted)
│   │   └── Copy/Download Actions
│   ├── Installation Section
│   │   └── Numbered Steps with Commands
│   ├── Prerequisites Section
│   │   └── Requirement Items
│   ├── Usage Examples Section
│   │   └── Example Prompts
│   └── Related Content Section
└── Sidebar
    ├── Author Profile Card
    ├── Version History Card
    ├── Community/Engagement Card
    └── Compatibility Card
```

---

## Design Tokens

### Color Palette (Skill-specific)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-emerald` | `#34d399` | Primary skill accent |
| `--accent-emerald-dim` | `rgba(52, 211, 153, 0.15)` | Skill backgrounds |
| `--bg-code` | `#0d1117` | Code block background |

### Syntax Highlighting Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--syntax-keyword` | `#ff7b72` | Keywords (if, else, return) |
| `--syntax-string` | `#a5d6ff` | String literals |
| `--syntax-comment` | `#8b949e` | Comments |
| `--syntax-function` | `#d2a8ff` | Function names |
| `--syntax-variable` | `#ffa657` | Variables |
| `--syntax-property` | `#79c0ff` | Properties |

### Typography (Code-specific)

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Code Block | JetBrains Mono | 14px | 400 |
| Line Numbers | JetBrains Mono | 14px | 400 |
| Command Code | JetBrains Mono | 13px | 400 |
| Version Number | JetBrains Mono | 13px | 600 |

---

## Component Specifications

### 1. Skill Header Section

#### Container
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Padding: 24px
- Top border accent: 3px gradient `--accent-emerald` to `#10b981`

#### Badges

| Badge Type | Background | Color | Icon |
|------------|------------|-------|------|
| Skill | `--accent-emerald-dim` | `--accent-emerald` | Code icon |
| Tool (Claude Code, MCP) | `--bg-elevated` | `--text-secondary` | None |
| Difficulty | `--accent-cyan-dim` | `--accent-cyan` | None |
| Verified | `--accent-amber-dim` | `--accent-amber` | Checkmark |

#### Meta Items
- Installs count (download icon)
- Last updated (clock icon)
- Version number (tag icon)

---

### 2. Code Viewer Section

#### Container
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Overflow: hidden

#### Code Header
- Background: `--bg-elevated`
- Padding: 16px 24px
- Border-bottom: 1px solid `--border-subtle`

#### File Tabs
- Padding: 8px 16px
- Border-radius: 8px
- Font: 13px, weight 500
- Gap: 4px

| State | Background | Color |
|-------|------------|-------|
| Default | transparent | `--text-muted` |
| Hover | `--bg-card` | `--text-secondary` |
| Active | `--accent-emerald-dim` | `--accent-emerald` |

#### Code Block Area
- Background: `--bg-code` (#0d1117)
- Padding: 24px
- Font: JetBrains Mono, 14px
- Line-height: 1.6
- Overflow-x: auto

#### Line Numbers
- Width: 40px
- Color: `--text-muted`
- Text-align: right
- Padding-right: 16px
- Border-right: 1px solid `--border-subtle`
- User-select: none

#### Action Buttons
- Gap: 8px

**Copy Button (Primary):**
- Background: `--accent-emerald`
- Color: `--bg-primary`
- Border: `--accent-emerald`

**Copy Button (Copied State):**
- Background: `--accent-emerald-dim`
- Color: `--accent-emerald`
- Text: "Copied!"
- Duration: 2000ms then revert

---

### 3. Installation Section

#### Step Item Layout
- Display: flex
- Gap: 16px

#### Step Number
- Size: 32px × 32px
- Border-radius: 50%
- Background: `--accent-emerald-dim`
- Color: `--accent-emerald`
- Font: Outfit, 14px, weight 700

#### Step Content
- Title: Outfit, 15px, weight 600
- Description: DM Sans, 14px, `--text-secondary`

#### Command Block
- Background: `--bg-code`
- Padding: 12px 16px
- Border-radius: 8px
- Font: JetBrains Mono, 13px
- Display: flex, space-between
- Copy button inline

---

### 4. Prerequisites Section

#### Prerequisite Item
- Display: flex
- Gap: 12px
- Padding: 16px
- Background: `--bg-elevated`
- Border-radius: 10px

#### Prerequisite Icon
- Size: 24px
- Color: `--accent-emerald`
- Checkmark circle icon

#### Prerequisite Content
- Name: 14px, weight 600
- Detail: 13px, `--text-muted`
- Links: `--accent-cyan`, underline on hover

---

### 5. Usage Examples Section

#### Example Card
- Background: `--bg-elevated`
- Border-radius: 10px
- Overflow: hidden

#### Example Header
- Padding: 12px 16px
- Border-bottom: 1px solid `--border-subtle`
- Title: 14px, weight 600

#### Example Code
- Background: `--bg-code`
- Padding: 16px
- Font: JetBrains Mono, 13px
- Overflow-x: auto

---

### 6. Sidebar Components

#### Version History Card

**Version Item:**
- Display: flex
- Gap: 12px
- Padding: 12px
- Background: `--bg-elevated`
- Border-radius: 10px

**Current Version (highlighted):**
- Border: 1px solid `--accent-emerald`
- Background: `--accent-emerald-dim`

**Version Number:**
- Font: JetBrains Mono, 13px, weight 600
- Color: `--accent-emerald`

**Version Badge (Latest):**
- Font: 10px, weight 600, uppercase
- Background: `--accent-emerald`
- Color: `--bg-primary`
- Padding: 2px 6px
- Border-radius: 4px

---

#### Compatibility Card

**Compatibility Item:**
- Display: flex, space-between
- Padding: 10px 12px
- Background: `--bg-elevated`
- Border-radius: 8px

**Status Badges:**

| Status | Background | Color |
|--------|------------|-------|
| Compatible | `--accent-emerald-dim` | `--accent-emerald` |
| Partial | `--accent-amber-dim` | `--accent-amber` |
| Not Supported | `rgba(251, 113, 133, 0.15)` | `--accent-rose` |

---

#### Community/Engagement Card

**Usage Stats Grid:**
- Grid: 2 columns
- Gap: 12px
- Padding-top: 16px
- Border-top: 1px solid `--border-subtle`

**Stat Item:**
- Padding: 12px
- Background: `--bg-elevated`
- Border-radius: 8px
- Text-align: center

---

## Interaction Specifications

### Code Viewer

| Interaction | Behavior |
|-------------|----------|
| Click file tab | Switch displayed file content |
| Click copy button | Copy code to clipboard, show "Copied!" state |
| Click download button | Download file with original filename |
| Horizontal scroll | Pan through long code lines |
| Select code text | Standard text selection for manual copy |

### Installation Steps

| Interaction | Behavior |
|-------------|----------|
| Click step copy button | Copy command to clipboard |
| Click prerequisite link | Open in new tab |

### Version History

| Interaction | Behavior |
|-------------|----------|
| Click version item | View that version's code (future feature) |

### Bookmark

| Interaction | Behavior |
|-------------|----------|
| Click bookmark (unsaved) | Save skill, show filled icon |
| Click bookmark (saved) | Remove from saved, show outline icon |

---

## State Variations

### Loading State
- Code block: Shimmer animation
- Metadata: Skeleton lines

### Error State
- Code unavailable: "Unable to load skill configuration"
- Version history failed: "Version history unavailable"

### Empty States
- No prerequisites: Section hidden
- No related content: "No related content yet"

---

## Responsive Behavior

### Desktop (≥1200px)
- 2-column layout (main content + 360px sidebar)
- Code block full width with horizontal scroll

### Tablet (768-1199px)
- Single column layout
- Sidebar becomes 2-column grid below main content

### Mobile (<768px)
- Single column, stacked layout
- Code block with horizontal scroll
- Sticky header actions

---

## Accessibility Requirements

### Code Viewer
- Code block has `role="code"` and `aria-label`
- Line numbers are decorative (`aria-hidden="true"`)
- Copy button announces success via `aria-live`

### Installation Steps
- Ordered list semantics (`<ol>`)
- Command blocks are focusable for keyboard users

### Compatibility Status
- Status badges have appropriate ARIA labels
- Color is not the only indicator (text labels included)

---

## Animation Specifications

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Tab switch | background, color | 200ms | ease |
| Copy button state | background, content | 200ms | ease |
| Card hover | transform, shadow | 200ms | ease |
| Code scroll | scroll-left | - | native |

---

## File References

- **HTML Prototype:** `docs/design/skill-detail-page.html`
- **Video Detail Page:** `docs/design/video-detail-page.html`
- **Homepage Reference:** `docs/design/homepage.html`
- **Design System Spec:** `docs/design/homepage-design-spec.md`
