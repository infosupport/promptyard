# Prompt Detail Page - Design Specification

## Overview

The Prompt Detail Page displays individual AI prompts with the full prompt text, usage context, and related metadata. Prompts are text-based instructions for AI tools that users can copy and adapt for their own workflows. This page emphasizes readability, easy copying, and contextual understanding of when and how to use the prompt.

---

## FigJam Diagrams

Interactive diagrams are available in FigJam:

| Diagram | Description | Link |
|---------|-------------|------|
| Component Structure | Page layout hierarchy and component organization | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/) |
| User Flow | All user interactions and navigation paths | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/) |
| Copy Interaction States | State machine for copy functionality | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/) |

---

## Page Information Architecture

```
Prompt Detail Page
├── Global Header (sticky)
├── Breadcrumb Navigation
├── Main Content Area
│   ├── Prompt Header Section
│   │   ├── Type Badge & Tool Badge
│   │   ├── Title
│   │   ├── Meta Row (views, saves, date)
│   │   └── Action Buttons (Bookmark, Share, Report)
│   ├── Documentation Section
│   │   └── Description Text
│   ├── Prompt Content Section
│   │   ├── Content Header with Copy Button
│   │   ├── Prompt Text Block (main content)
│   │   └── Variable Highlights (if applicable)
│   └── Related Content Section
│       └── Similar Prompts Grid
└── Sidebar
    ├── Author Profile Card
    ├── AI Tool Compatibility Card
    └── Engagement Card
```

---

## Design Tokens

### Color Palette (Prompt-specific)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-cyan` | `#22d3ee` | Primary prompt accent |
| `--accent-cyan-dim` | `rgba(34, 211, 238, 0.15)` | Prompt backgrounds |
| `--accent-cyan-glow` | `rgba(34, 211, 238, 0.08)` | Subtle glow effects |
| `--bg-prompt` | `#0c1929` | Prompt text block background |
| `--bg-primary` | `#0a0f1a` | Page background |
| `--bg-secondary` | `#111827` | Section backgrounds |
| `--bg-card` | `#1a2234` | Card backgrounds |
| `--bg-elevated` | `#232d42` | Elevated surfaces |

### Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page Title (H1) | Outfit | 32px | 700 | 1.3 |
| Section Title (H2) | Outfit | 18px | 600 | 1.4 |
| Subsection Title (H3) | Outfit | 16px | 600 | 1.4 |
| Prompt Text | DM Sans | 16px | 400 | 1.8 |
| Body Text | DM Sans | 15px | 400 | 1.7 |
| Meta Text | DM Sans | 14px | 400 | 1.5 |
| Caption | DM Sans | 13px | 400 | 1.5 |
| Badge | DM Sans | 12px | 600 | 1 |

### Spacing Scale

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 20px |
| `2xl` | 24px |
| `3xl` | 32px |
| `4xl` | 48px |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Tags, small buttons |
| `md` | 8px | Badges, inputs |
| `lg` | 10px | Buttons |
| `xl` | 12px | Small cards |
| `2xl` | 16px | Large cards, sections |

---

## Layout Specifications

### Page Grid

```
Desktop (≥1200px):
┌─────────────────────────────────────────────────────────┐
│                    Header (72px)                         │
├─────────────────────────────────────────────────────────┤
│                  Breadcrumb (48px)                       │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│         Main Content              │     Sidebar         │
│           (1fr)                   │     (360px)         │
│                                   │                     │
│         Gap: 32px                 │     Sticky          │
│                                   │     top: 104px      │
├───────────────────────────────────┴─────────────────────┤
│                      Footer                              │
└─────────────────────────────────────────────────────────┘

Max-width: 1280px
Horizontal padding: 24px
```

### Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| ≥1200px | 2-column layout (main + sidebar) |
| 768-1199px | Single column, sidebar becomes 2-column grid |
| <768px | Single column, stacked layout |

---

## Component Specifications

### 1. Prompt Header Section

#### Container
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Padding: 28px
- Top border accent: 3px solid `--accent-cyan`

#### Badges Row
- Display: flex
- Gap: 10px
- Margin-bottom: 16px

**Badge Variants:**

| Type | Background | Color | Icon |
|------|------------|-------|------|
| Prompt | `--accent-cyan-dim` | `--accent-cyan` | Document/Text icon |
| AI Tool | `--bg-elevated` | `--text-secondary` | Tool-specific icon |
| Difficulty | `--bg-elevated` | `--text-secondary` | None |
| Workflow Task | `--accent-cyan-dim` | `--accent-cyan` | Task icon |

**Badge Styling:**
- Padding: 6px 14px
- Border-radius: 8px
- Font: 12px, weight 600
- Text-transform: uppercase
- Letter-spacing: 0.5px

#### Title
- Font: Outfit, 32px, weight 700
- Color: `--text-primary`
- Margin-bottom: 12px
- Max-width: 100%

#### Meta Row
- Display: flex
- Gap: 20px
- Font: 14px
- Color: `--text-muted`
- Icons: 16px, inline with text
- Margin-bottom: 20px

**Meta Items:**
- Views (eye icon)
- Saves/Bookmarks (bookmark icon)
- Publish date (calendar icon)
- Last updated (refresh icon)

#### Action Buttons Row
- Display: flex
- Gap: 10px
- Padding-top: 20px
- Border-top: 1px solid `--border-subtle`

**Action Button Styling:**

| Button | Background | Border | Color | Icon |
|--------|------------|--------|-------|------|
| Bookmark (default) | `--bg-elevated` | `--border-medium` | `--text-secondary` | Bookmark outline |
| Bookmark (saved) | `--accent-cyan-dim` | `--accent-cyan` | `--accent-cyan` | Bookmark filled |
| Share | `--bg-elevated` | `--border-medium` | `--text-secondary` | Share icon |
| Report | `--bg-elevated` | `--border-medium` | `--text-muted` | Flag icon |

---

### 2. Documentation Section

#### Container
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Margin-top: 24px
- Padding: 24px

#### Section Header
- Font: Outfit, 18px, weight 600
- Color: `--text-primary`
- Margin-bottom: 16px
- Display: flex
- Gap: 10px
- Align-items: center

#### Documentation Content
- Font: DM Sans, 15px
- Color: `--text-secondary`
- Line-height: 1.7

**Paragraphs:**
- Margin-bottom: 12px
- Last paragraph: margin-bottom: 0

---

### 3. Prompt Content Section

#### Container
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Margin-top: 24px
- Overflow: hidden

#### Content Header
- Background: `--bg-elevated`
- Padding: 16px 24px
- Border-bottom: 1px solid `--border-subtle`
- Display: flex
- Justify-content: space-between
- Align-items: center

**Section Label:**
- Font: Outfit, 14px, weight 600
- Color: `--text-secondary`
- Text-transform: uppercase
- Letter-spacing: 0.5px
- Display: flex
- Gap: 8px
- Align-items: center

**Copy Button (Primary):**
- Background: `--accent-cyan`
- Color: `--bg-primary`
- Padding: 10px 20px
- Border-radius: 10px
- Font: 14px, weight 600
- Display: flex
- Gap: 8px
- Align-items: center

**Copy Button States:**

| State | Background | Color | Text |
|-------|------------|-------|------|
| Default | `--accent-cyan` | `--bg-primary` | "Copy Prompt" |
| Hover | `#06b6d4` | `--bg-primary` | "Copy Prompt" |
| Copying | `--accent-cyan-dim` | `--accent-cyan` | "Copied!" |
| Copying duration | 2000ms then revert | | |

#### Prompt Text Block
- Background: `--bg-prompt` (#0c1929)
- Padding: 32px
- Min-height: 200px

**Prompt Text Styling:**
- Font: DM Sans, 16px, weight 400
- Color: `--text-primary`
- Line-height: 1.8
- White-space: pre-wrap
- Word-break: break-word

**Variable Highlight (placeholders like [CONTEXT]):**
- Background: `--accent-cyan-dim`
- Color: `--accent-cyan`
- Padding: 2px 8px
- Border-radius: 4px
- Font-weight: 500

**Selection Styling:**
- Background: `--accent-cyan-dim`
- Color: `--accent-cyan`

---

### 4. Related Content Section

#### Container
- Same card styling as other sections
- Margin-top: 24px

#### Related Content Grid
- Display: grid
- Grid-template-columns: repeat(2, 1fr)
- Gap: 16px
- Padding: 20px

#### Related Card
- Background: `--bg-elevated`
- Border: 1px solid `--border-subtle`
- Border-radius: 12px
- Padding: 16px
- Cursor: pointer
- Transition: all 0.2s ease

**Hover State:**
- Transform: translateY(-2px)
- Border-color: `--border-medium`
- Box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2)

**Card Type Badge:**
- Font: 11px, weight 600, uppercase
- Margin-bottom: 10px

**Card Title:**
- Font: Outfit, 14px, weight 600
- Color: `--text-primary`
- Margin-bottom: 8px
- Max 2 lines, ellipsis

**Card Meta:**
- Font: 12px
- Color: `--text-muted`

---

### 5. Sidebar Components

#### Author Profile Card

**Container:**
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Text-align: center
- Padding: 24px

**Avatar:**
- Size: 80px x 80px
- Border-radius: 16px
- Background: Gradient `--accent-cyan` to `--accent-violet`
- Font: Outfit, 28px, weight 700
- Color: white
- Margin: 0 auto 16px

**Name:**
- Font: Outfit, 18px, weight 600
- Color: `--text-primary`
- Margin-bottom: 4px

**Role/Title:**
- Font: DM Sans, 14px
- Color: `--text-muted`
- Margin-bottom: 16px

**Stats Row:**
- Display: flex
- Justify-content: center
- Gap: 32px
- Padding: 16px 0
- Border-top: 1px solid `--border-subtle`
- Border-bottom: 1px solid `--border-subtle`

**Stat Item:**
- Text-align: center

**Stat Value:**
- Font: Outfit, 20px, weight 700
- Color: `--text-primary`

**Stat Label:**
- Font: 12px
- Color: `--text-muted`

**View Profile Button:**
- Width: 100%
- Margin-top: 16px
- Padding: 12px
- Background: `--accent-cyan-dim`
- Color: `--accent-cyan`
- Border: none
- Border-radius: 10px
- Font: 14px, weight 600
- Cursor: pointer

---

#### AI Tool Compatibility Card

**Container:**
- Same card styling
- Margin-top: 20px

**Tool Item:**
- Display: flex
- Align-items: center
- Gap: 12px
- Padding: 12px 16px
- Background: `--bg-elevated`
- Border-radius: 10px
- Margin-bottom: 10px

**Tool Icon:**
- Size: 24px
- Border-radius: 6px

**Tool Name:**
- Font: 14px, weight 500
- Color: `--text-primary`
- Flex: 1

**Compatibility Badge:**

| Status | Background | Color |
|--------|------------|-------|
| Optimized | `--accent-cyan-dim` | `--accent-cyan` |
| Compatible | `--accent-emerald-dim` | `--accent-emerald` |
| Limited | `--accent-amber-dim` | `--accent-amber` |

---

#### Engagement Card

**Container:**
- Same card styling
- Margin-top: 20px

**Rating Section:**
- Text-align: center
- Padding-bottom: 16px
- Border-bottom: 1px solid `--border-subtle`

**Rating Label:**
- Font: 14px
- Color: `--text-secondary`
- Margin-bottom: 12px

**Star Rating:**
- Display: flex
- Justify-content: center
- Gap: 8px

**Star:**
- Size: 28px
- Color: `--text-muted` (inactive)
- Color: `--accent-amber` (active/hover)
- Cursor: pointer
- Transition: transform 0.2s ease, color 0.2s ease

**Star Hover:**
- Transform: scale(1.15)

**Rating Count:**
- Font: 13px
- Color: `--text-muted`
- Margin-top: 8px

**Actions Section:**
- Padding-top: 16px
- Display: flex
- Flex-direction: column
- Gap: 10px

**Action Button:**
- Width: 100%
- Padding: 12px
- Background: `--bg-elevated`
- Border: 1px solid `--border-subtle`
- Border-radius: 10px
- Font: 14px, weight 500
- Color: `--text-secondary`
- Display: flex
- Align-items: center
- Justify-content: center
- Gap: 8px
- Cursor: pointer
- Transition: all 0.2s ease

**Action Button Hover:**
- Background: `--bg-card`
- Border-color: `--border-medium`
- Color: `--text-primary`

---

## Interaction Specifications

### Copy Functionality

| Interaction | Behavior |
|-------------|----------|
| Click copy button | Copy prompt text to clipboard |
| Copy success | Button changes to "Copied!" state for 2s |
| Select text | Allow native text selection |
| Keyboard: Ctrl/Cmd+C | Copy selected text |
| Triple-click | Select entire prompt |

### Bookmarking

| Interaction | Behavior |
|-------------|----------|
| Click bookmark (unsaved) | Save prompt, animate icon fill |
| Click bookmark (saved) | Remove from saved, animate icon unfill |
| Success feedback | Brief toast notification |

### Rating

| Interaction | Behavior |
|-------------|----------|
| Hover star | Highlight stars up to hovered position |
| Click star | Submit rating, show confirmation |
| Mouse leave | Return to submitted rating state |

### Navigation

| Interaction | Behavior |
|-------------|----------|
| Click breadcrumb | Navigate to parent page |
| Click related content | Navigate to that prompt |
| Click author | Navigate to author profile |
| Click workflow tag | Navigate to filtered browse page |

---

## Accessibility Requirements

### Keyboard Navigation

- All interactive elements must be focusable
- Tab order follows visual flow: header → prompt content → context → examples → related → sidebar
- Copy button accessible via Enter/Space
- Escape key closes any open modals

### Screen Reader Support

- Prompt content has `role="article"` and descriptive `aria-label`
- Copy button announces success via `aria-live="polite"`
- Rating stars announce current rating and selection
- Variable placeholders have `role="mark"` for context

### Color Contrast

- All text meets WCAG 2.1 AA contrast requirements (4.5:1 minimum)
- Interactive states distinguishable without color alone
- Focus indicators visible at 3:1 contrast minimum
- Variable highlights maintain readable contrast

### Text Scaling

- Prompt text scales properly up to 200%
- No horizontal scroll at 320px viewport
- Touch targets minimum 44x44px on mobile

---

## State Variations

### Loading State

- Prompt header: Skeleton with pulsing animation
- Prompt content: Shimmer text lines
- Sidebar cards: Card skeletons

**Skeleton Colors:**
- Base: `--bg-elevated`
- Shimmer: `--bg-card`
- Animation: 1.5s ease infinite

### Error State

- Prompt unavailable: "This prompt could not be loaded" with retry button
- Network error: "Connection error. Please try again."

### Empty States

- No examples: Section hidden entirely
- No related content: "No related prompts yet"
- No rating: "Be the first to rate this prompt"

---

## Animation Specifications

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Card hover | transform, shadow | 200ms | ease |
| Button hover | background, color | 200ms | ease |
| Copy state change | background, content | 200ms | ease |
| Star rating | transform, color | 200ms | ease |
| Page sections load | fadeInUp | 400ms | ease-out |
| Variable highlight pulse | opacity | 2000ms | ease-in-out |

### Page Load Animation Sequence

1. Header section: 0ms delay
2. Prompt content: 100ms delay
3. Context section: 200ms delay
4. Examples section: 300ms delay
5. Related content: 400ms delay
6. Sidebar cards: Staggered 50ms each

---

## Responsive Behavior

### Desktop (≥1200px)

- 2-column layout (main content + 360px sidebar)
- Prompt text at full width
- Side-by-side input/output in examples

### Tablet (768-1199px)

- Single column layout
- Sidebar moves below main content as 2-column grid
- Prompt content full width
- Example input/output stack vertically

### Mobile (<768px)

- Single column, stacked layout
- Sticky copy button at bottom of viewport
- Collapsible context cards
- Touch-optimized buttons (min 48px height)
- Related content as horizontal scroll

---

## File References

- **HTML Prototype:** `docs/design/prompt-detail-page.html`
- **Homepage Reference:** `docs/design/homepage.html`
- **Skill Detail Page:** `docs/design/skill-detail-page.html`
- **Video Detail Page:** `docs/design/video-detail-page.html`
- **Design System Spec:** `docs/design/homepage-design-spec.md`

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-21 | 1.0 | Platform Team | Initial prompt detail page design specification |
