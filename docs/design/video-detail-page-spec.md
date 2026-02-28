# Tip Video Detail Page - Design Specification

## Overview

The Tip Video Detail Page displays individual video content with full playback capabilities, searchable transcripts, and related content discovery. This page is optimized for short-form "Quick Tip" videos (1-5 minutes) that provide focused AI workflow guidance.

---

## FigJam Diagrams

Interactive diagrams are available in FigJam:

| Diagram | Description | Link |
|---------|-------------|------|
| Component Structure | Page layout hierarchy and component organization | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/4ee950bf-e2ac-4be4-9f94-0028e562c5f6) |
| User Flow | All user interactions and navigation paths | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/62f8482f-2ba4-4596-afe4-22174662303b) |
| Video Player States | State machine for video player component | [Open in FigJam](https://www.figma.com/online-whiteboard/create-diagram/2cd860f7-0f80-42c9-91bb-63767ee39ed3) |

---

## Page Information Architecture

```
Video Detail Page
├── Global Header (sticky)
├── Breadcrumb Navigation
├── Main Content Area
│   ├── Video Player Section
│   │   ├── Video Player (16:9)
│   │   ├── Playback Controls
│   │   └── Video Metadata
│   ├── Transcript Section (collapsible)
│   └── Related Content Section
└── Sidebar
    ├── Author Profile Card
    ├── Up Next Queue
    └── Engagement Card
```

---

## Design Tokens

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0f1a` | Page background |
| `--bg-secondary` | `#111827` | Section backgrounds |
| `--bg-card` | `#1a2234` | Card backgrounds |
| `--bg-elevated` | `#232d42` | Elevated surfaces |
| `--text-primary` | `#f1f5f9` | Headings, important text |
| `--text-secondary` | `#94a3b8` | Body text |
| `--text-muted` | `#64748b` | Captions, metadata |
| `--accent-violet` | `#a78bfa` | Video content type (primary) |
| `--accent-violet-dim` | `rgba(167, 139, 250, 0.15)` | Violet backgrounds |
| `--accent-cyan` | `#22d3ee` | Links, prompts |
| `--accent-emerald` | `#34d399` | Skills, success states |
| `--accent-amber` | `#fbbf24` | Ratings, tips, bookmarks |
| `--border-subtle` | `rgba(148, 163, 184, 0.1)` | Subtle dividers |
| `--border-medium` | `rgba(148, 163, 184, 0.2)` | Visible borders |

### Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page Title (H1) | Outfit | 28px | 700 | 1.3 |
| Section Title (H2) | Outfit | 16px | 600 | 1.4 |
| Card Title | Outfit | 14px | 600 | 1.4 |
| Body Text | DM Sans | 15px | 400 | 1.7 |
| Meta Text | DM Sans | 14px | 400 | 1.5 |
| Caption | DM Sans | 13px | 400 | 1.5 |
| Badge | DM Sans | 12px | 600 | 1 |
| Timestamp | Outfit (mono) | 13px | 400 | 1 |

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
| 768-1199px | Single column, sidebar becomes 3-column grid |
| <768px | Single column, stacked layout |

---

## Component Specifications

### 1. Video Player Section

#### Container
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Overflow: hidden

#### Video Player Area
- Aspect ratio: 16:9
- Background: Gradient from `--bg-elevated` to `--bg-card`
- Overlay: Radial gradient glow (violet tint)

#### Play Button (Center)
- Size: 80px × 80px
- Border-radius: 50%
- Background: Gradient `--accent-violet` to `#8b5cf6`
- Box-shadow: `0 8px 32px rgba(167, 139, 250, 0.4)`
- Icon: Play triangle, 32px, white
- Hover: scale(1.1), enhanced shadow

#### Playback Controls Bar
- Height: 68px
- Background: `--bg-elevated`
- Border-top: 1px solid `--border-subtle`
- Padding: 16px 20px

**Progress Bar:**
- Height: 6px
- Background: `--bg-card`
- Fill: Gradient `--accent-violet` to `#8b5cf6`
- Border-radius: 3px
- Cursor: pointer

**Time Display:**
- Font: Outfit monospace, 13px
- Color: `--text-secondary`
- Format: `M:SS`

**Control Buttons:**
- Size: 36px × 36px
- Border-radius: 8px
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Icon: 18px
- Gap between buttons: 8px

**Control Button States:**
| State | Background | Border | Color |
|-------|------------|--------|-------|
| Default | `--bg-card` | `--border-subtle` | `--text-secondary` |
| Hover | `--bg-elevated` | `--border-medium` | `--text-primary` |
| Active | `--accent-violet-dim` | `--accent-violet` | `--accent-violet` |

**Speed Control Button:**
- Width: auto (padding 6px 12px)
- Font: 13px, weight 600
- Cycles: 0.5x → 0.75x → 1x → 1.25x → 1.5x → 2x

---

### 2. Video Info Section

#### Container
- Padding: 24px
- No top border (part of video player card)

#### Badges Row
- Display: flex
- Gap: 8px
- Margin-bottom: 12px

**Badge Variants:**

| Type | Background | Color | Icon |
|------|------------|-------|------|
| Video | `--accent-violet-dim` | `--accent-violet` | Film icon |
| Quick Tip | `--accent-amber-dim` | `--accent-amber` | Lightbulb icon |
| Beginner | `--accent-emerald-dim` | `--accent-emerald` | None |
| Intermediate | `--accent-cyan-dim` | `--accent-cyan` | None |
| Advanced | `--accent-rose-dim` | `--accent-rose` | None |

**Badge Styling:**
- Padding: 6px 12px
- Border-radius: 8px
- Font: 12px, weight 600
- Text-transform: uppercase
- Letter-spacing: 0.5px

#### Title
- Font: Outfit, 28px, weight 700
- Color: `--text-primary`
- Margin-bottom: 8px

#### Meta Row
- Display: flex
- Gap: 16px
- Font: 14px
- Color: `--text-muted`
- Icons: 16px, inline with text

**Meta Items:**
- Views (eye icon)
- Duration (clock icon)
- Publish date (calendar icon)

#### Action Buttons
- Display: flex
- Gap: 8px
- Float right on desktop

**Primary Action (Bookmark):**
| State | Background | Border | Color |
|-------|------------|--------|-------|
| Default | `--bg-card` | `--border-medium` | `--text-secondary` |
| Saved | `--accent-amber-dim` | `--accent-amber` | `--accent-amber` |

**Secondary Action (Share):**
- Same as default state
- Icon: share-network icon

#### Description
- Font: DM Sans, 15px
- Color: `--text-secondary`
- Line-height: 1.7
- Margin-bottom: 20px

#### Tags
- Display: flex, wrap
- Gap: 8px

**Tag Styling:**
- Padding: 6px 12px
- Border-radius: 8px
- Background: `--bg-elevated`
- Font: 13px
- Cursor: pointer
- Hover: `--bg-card`, `--text-primary`

**Workflow Tag:**
- Background: `--accent-cyan-dim`
- Color: `--accent-cyan`

---

### 3. Transcript Section

#### Container
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Margin-top: 32px

#### Header
- Padding: 16px 24px
- Background: `--bg-elevated`
- Border-bottom: 1px solid `--border-subtle`
- Display: flex, space-between

**Title:**
- Font: Outfit, 16px, weight 600
- Icon: document icon, 18px

**Search Input:**
- Width: 180px
- Padding: 6px 12px
- Background: `--bg-card`
- Border: 1px solid `--border-subtle`
- Border-radius: 8px
- Font: 13px

#### Transcript Body
- Padding: 24px
- Max-height: 400px
- Overflow-y: auto

**Transcript Line:**
- Display: flex
- Gap: 16px
- Padding: 12px 16px
- Border-radius: 8px
- Cursor: pointer
- Transition: 0.2s ease

**Timestamp:**
- Font: Outfit monospace, 13px
- Color: `--accent-violet`
- Width: 48px (fixed)

**Text:**
- Font: DM Sans, 14px
- Color: `--text-secondary`
- Line-height: 1.6

**Line States:**
| State | Background | Text Color |
|-------|------------|------------|
| Default | transparent | `--text-secondary` |
| Hover | `--bg-elevated` | `--text-secondary` |
| Active | `--accent-violet-dim` | `--text-primary` |

**Search Highlight:**
- Background: `--accent-amber-dim`
- Color: `--accent-amber`
- Padding: 0 2px
- Border-radius: 2px

---

### 4. Related Content Section

#### Container
- Same card styling as transcript
- Margin-top: 32px

#### Header with Tabs
- Padding: 16px 24px
- Display: flex, space-between

**Tabs:**
- Gap: 4px

**Tab Button:**
- Padding: 8px 16px
- Border-radius: 8px
- Font: 13px, weight 500
- Background: none
- Border: none

| State | Background | Color |
|-------|------------|-------|
| Default | transparent | `--text-muted` |
| Hover | `--bg-elevated` | `--text-secondary` |
| Active | `--accent-violet-dim` | `--accent-violet` |

#### Content Grid
- Padding: 20px
- Grid: 2 columns
- Gap: 16px

#### Related Card
- Background: `--bg-elevated`
- Border: 1px solid `--border-subtle`
- Border-radius: 12px
- Padding: 16px
- Hover: translateY(-2px), border `--border-medium`

**Card Header:**
- Display: flex
- Gap: 8px
- Margin-bottom: 10px

**Type Badge (small):**
- Padding: 4px 8px
- Border-radius: 6px
- Font: 11px, weight 600, uppercase

**Timestamp Reference:**
- Font: Outfit monospace, 11px
- Color: `--text-muted`
- Format: `@ M:SS`

**Card Title:**
- Font: Outfit, 14px, weight 600
- Color: `--text-primary`
- Max 2 lines, ellipsis

---

### 5. Sidebar Components

#### Author Profile Card

**Avatar:**
- Size: 72px × 72px
- Border-radius: 16px
- Background: Gradient (author-specific)
- Font: Outfit, 24px, weight 700
- Centered initials

**Name:**
- Font: Outfit, 18px, weight 600
- Margin-bottom: 4px

**Role:**
- Font: DM Sans, 14px
- Color: `--text-muted`

**Stats Row:**
- Display: flex, justify-center
- Gap: 24px
- Padding: 16px 0
- Borders: top and bottom

**Stat Item:**
- Value: Outfit, 20px, weight 700
- Label: DM Sans, 12px, `--text-muted`

**View Profile Button:**
- Width: 100%
- Padding: 12px
- Background: `--accent-violet-dim`
- Color: `--accent-violet`
- Border-radius: 10px
- Font: 14px, weight 600
- Hover: rgba(167, 139, 250, 0.25)

---

#### Up Next Card

**Video Item:**
- Display: flex
- Gap: 12px
- Padding: 12px
- Background: `--bg-elevated`
- Border-radius: 10px

**Thumbnail:**
- Size: 80px × 45px
- Border-radius: 6px
- Background: gradient
- Center: play icon, 20px, `--accent-violet`

**Info:**
- Title: 13px, weight 600, max 2 lines
- Meta: 12px, `--text-muted`, format: `Duration · Author`

---

#### Engagement Card

**Rating Section:**
- Text-align: center
- Label: 14px, `--text-secondary`

**Star Rating:**
- Size: 32px each
- Gap: 8px
- Default: `--text-muted`
- Active/Hover: `--accent-amber`, scale(1.1)

**Rating Count:**
- Font: 13px
- Color: `--text-muted`
- Format: `X.X average from N ratings`

**Share Section:**
- Border-top: 1px solid `--border-subtle`
- Padding-top: 16px

**Share Buttons:**
- Display: flex
- Gap: 8px
- Each button: flex: 1

**Share Button:**
- Padding: 10px
- Background: `--bg-elevated`
- Border: 1px solid `--border-subtle`
- Border-radius: 8px
- Font: 13px, weight 500
- Icon + text centered

---

## Interaction Specifications

### Video Player

| Interaction | Behavior |
|-------------|----------|
| Click play button | Start video playback, hide button |
| Click progress bar | Seek to position |
| Drag progress bar | Scrub through video |
| Click speed button | Cycle through speeds |
| Click transcript button | Toggle transcript visibility |
| Keyboard: Space | Play/pause |
| Keyboard: Arrow left/right | Seek ±10 seconds |
| Keyboard: F | Toggle fullscreen |

### Transcript

| Interaction | Behavior |
|-------------|----------|
| Click line | Jump video to timestamp, highlight line |
| Type in search | Filter and highlight matching text |
| Video plays | Auto-scroll to current line |
| Click copy button | Copy full transcript to clipboard |

### Rating

| Interaction | Behavior |
|-------------|----------|
| Hover star | Highlight stars up to hovered position |
| Click star | Submit rating, show confirmation |
| Mouse leave | Return to submitted rating state |

### Bookmarking

| Interaction | Behavior |
|-------------|----------|
| Click bookmark (unsaved) | Save video, change to filled icon |
| Click bookmark (saved) | Remove from saved, change to outline icon |

---

## Accessibility Requirements

### Keyboard Navigation

- All interactive elements must be focusable
- Tab order follows visual flow: player → info → transcript → related → sidebar
- Video controls accessible via keyboard shortcuts
- Escape key closes any open modals

### Screen Reader Support

- Video player announces: title, duration, playback state
- Progress bar announces current time on change
- Transcript lines include timestamp in accessible name
- Rating stars announce current rating and selection

### Color Contrast

- All text meets WCAG 2.1 AA contrast requirements
- Interactive states distinguishable without color alone
- Focus indicators visible at 3:1 contrast minimum

### Motion

- Respect `prefers-reduced-motion` for animations
- No auto-playing video
- Pause button always accessible

---

## State Variations

### Loading State

- Video player: Skeleton with pulsing animation
- Transcript: Shimmer lines
- Related content: Card skeletons

### Error State

- Video unavailable: Error message with retry button
- Transcript failed: "Transcript unavailable" message

### Empty States

- No related content: "No related content yet" message
- No transcript: "Transcript processing..." or "No transcript available"

---

## Animation Specifications

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Card hover | transform, shadow | 200ms | ease |
| Button hover | background, color | 200ms | ease |
| Progress bar fill | width | 100ms | linear |
| Transcript scroll | scroll-top | 300ms | ease-out |
| Play button hover | transform | 300ms | ease |
| Star rating | transform, color | 200ms | ease |
| Page sections | fadeInUp | 500ms | ease |

---

## File References

- **HTML Prototype:** `docs/design/video-detail-page.html`
- **Homepage Reference:** `docs/design/homepage.html`
- **Profile Page Reference:** `docs/design/profile-page.html`
- **Design System Spec:** `docs/design/homepage-design-spec.md`
