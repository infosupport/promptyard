# RAISE Knowledge Platform - Search Results Page Design Specification

## Overview

The search results page displays filtered and ranked content matching user search queries, allowing users to:
1. View search results with highlighted matching terms
2. Filter results by content type, task, and AI tool
3. Sort results by relevance, recency, or popularity
4. Navigate through paginated results
5. Bookmark content for later reference

---

## Layout Structure

```
+------------------------------------------------------------------+
|                           HEADER                                  |
+------------------------------------------------------------------+
|                    SEARCH RESULTS HEADER                          |
|  Search results for "query"                         24 results    |
|  [Type Filters] [Task Dropdown] [Tool Dropdown] [Clear Filters]   |
+------------------------------------------------------------------+
|              |                                                    |
|   SIDEBAR    |                 RESULTS LIST                       |
|   FILTERS    |                                                    |
|              |  Showing 1-10 of 24              Sort: [Dropdown]  |
|  +---------+ |                                                    |
|  | Content | |  +----------------------------------------------+  |
|  |  Type   | |  | Result Card 1                                |  |
|  +---------+ |  +----------------------------------------------+  |
|              |                                                    |
|  +---------+ |  +----------------------------------------------+  |
|  |  Task   | |  | Result Card 2                                |  |
|  +---------+ |  +----------------------------------------------+  |
|              |                                                    |
|  +---------+ |  +----------------------------------------------+  |
|  | AI Tool | |  | Result Card 3                                |  |
|  +---------+ |  +----------------------------------------------+  |
|              |                                                    |
|              |  [< 1 2 3 ... >] Pagination                        |
+------------------------------------------------------------------+
|                           FOOTER                                  |
+------------------------------------------------------------------+
```

**Grid:** Sidebar (260px) + Main content (1fr), 1280px max-width centered
**Breakpoints:** Desktop (1024px+), Tablet (768-1023px), Mobile (<768px)

---

## Components

### 1. Header

Shared component with homepage. See `homepage-design-spec.md` for details.

**Search Input Modifications:**
- Pre-filled with search query
- Clear button (X) visible when input has value
- No keyboard shortcut hint when focused

---

### 2. Search Results Header

**Background:** Secondary background color
**Padding:** 32px vertical

#### Query Information

```
+------------------------------------------------------------------+
| Search results for                                                |
| "code review"                                       24 results    |
+------------------------------------------------------------------+
```

| Element | Specification |
|---------|---------------|
| Label | 14px, muted color |
| Query | Outfit font, 32px, weight 700, query text in cyan |
| Results Count | 16px, secondary color, weight 400 |

#### Filters Bar

Horizontal bar with quick filter chips and dropdowns.

```
Type: [All] [Prompts] [Skills] [Videos]  |  Task: [Dropdown]  Tool: [Dropdown]  [Clear filters]
```

**Filter Chips:**
- Padding: 8px 14px
- Border-radius: 20px (pill)
- Default: Card background, medium border
- Active: Type-specific dim background and border color
- Font: 13px

**Filter Chip Colors (when active):**

| Type | Background | Border | Text |
|------|------------|--------|------|
| Prompt | cyan-dim | cyan | cyan |
| Skill | emerald-dim | emerald | emerald |
| Video | violet-dim | violet | violet |

**Dropdown Buttons:**
- Padding: 8px 14px
- Border-radius: 10px
- Chevron icon right-aligned
- Opens dropdown menu on click

**Clear Filters:**
- Ghost style, muted color
- X icon prefix
- Hover: rose color
- Only visible when filters are active

---

### 3. Sidebar Filters

**Width:** 260px (desktop)
**Position:** Sticky, top offset 104px
**Gap:** 24px between sections

#### Filter Section Structure

```
+---------------------------+
| Section Title      [Clear]|
+---------------------------+
| [ ] Option 1         (14) |
| [x] Option 2         (6)  |
| [ ] Option 3         (4)  |
+---------------------------+
```

**Section Card:**
- Background: Card color
- Border: 1px subtle
- Border-radius: 12px

**Section Header:**
- Padding: 14px 16px
- Title: Outfit font, 14px, weight 600
- Clear button: 12px, muted, hover cyan

**Filter Options:**
- Padding: 10px 12px
- Border-radius: 8px
- Hover: Elevated background
- Checkbox: 18x18px, 2px border, 4px radius
- Selected: Cyan background and border, white checkmark
- Label: 14px, secondary color (primary when selected)
- Count: 12px, muted, elevated background pill

#### Filter Sections

1. **Content Type**
   - Prompts (with cyan dot)
   - Skills (with emerald dot)
   - Videos (with violet dot)

2. **Task**
   - Code Reviews
   - User Story Implementation
   - Writing Tests
   - Debugging & Bug Fixing
   - Writing User Stories

3. **AI Tool**
   - Claude Code
   - GitHub Copilot
   - Claude
   - ChatGPT
   - Cursor
   - (etc.)

---

### 4. Results List

#### Results Toolbar

```
Showing 1-10 of 24 results                    Sort by: [Most Relevant v]
```

**Info Text:** 14px, muted color, bold for numbers
**Sort Dropdown:**
- Custom select styling
- Options: Most Relevant, Most Recent, Most Popular, Most Liked
- Background: Card color
- Border-radius: 8px

#### Result Card

All result cards (Prompts, Skills, Videos) use the same uniform layout:

```
+------------------------------------------------------------------+
| +--------+                                                        |
| | [Icon] |  Title with <mark>highlighted</mark> terms       [B]  |
| | TYPE   |                                                        |
| +--------+  Description with <mark>matching</mark> text...        |
|                                                                   |
|             [Task Tag] [Tool Tag]    Author    Views  Likes       |
+------------------------------------------------------------------+
```

**Card Dimensions:**
- Padding: 24px
- Gap: 20px between badge and content
- Border-radius: 16px
- Background: Card color
- Border: 1px subtle

**Left Accent Bar (on hover):**
- Width: 4px
- Full height
- Color by type (cyan/emerald/violet)
- Opacity: 0 default, 1 on hover

**Type Badge:**
- Min-width: 80px
- Padding: 12px
- Background: Elevated color
- Border-radius: 12px
- Icon: 32x32px, type color
- Label: 11px, uppercase, weight 600, type color

**Type Icons:**

| Type | Icon |
|------|------|
| Prompt | Terminal/command icon |
| Skill | Computer/monitor icon |
| Video | Play circle icon |

**Title:**
- Outfit font, 18px, weight 600
- Highlighted terms: cyan-dim background, cyan text

**Description:**
- 14px, secondary color
- Max 2 lines with ellipsis
- Highlighted terms: cyan-dim background, cyan text

**Meta Row:**
- Flex with 16px gap, wrap
- Tags: 12px, 4px 10px padding, 6px radius
- Task tag: amber-dim background, amber text
- Tool tag: elevated background, muted text
- Author: 13px, muted, 24px avatar
- Stats: 13px, muted, icon + value pairs

**Bookmark Button:**
- Position: top-right of content
- Default: outline icon, muted color
- Saved: filled icon, amber color
- Hover: amber color

---

### 5. Pagination

**Layout:** Centered, horizontal
**Gap:** 8px between buttons

```
[<] [1] [2] [3] [...] [>]
```

**Button Styling:**
- Size: 40x40px
- Border-radius: 10px
- Background: Card color
- Border: 1px subtle
- Font: Outfit, 14px, weight 500

**Button States:**

| State | Background | Border | Text |
|-------|------------|--------|------|
| Default | Card | Subtle | Secondary |
| Hover | Elevated | Medium | Secondary |
| Active | Cyan | Cyan | Primary (dark) |
| Disabled | Card | Subtle | Muted (0.5 opacity) |

**Ellipsis:** Text only, muted color, 8px horizontal padding

---

### 6. No Results State

Displayed when search returns zero results.

```
+------------------------------------------------------------------+
|                         [Search Icon]                             |
|                                                                   |
|                 No results found for "query"                      |
|                                                                   |
|     Try adjusting your filters or search for something else       |
|                                                                   |
|                    Browse all prompts                             |
|                    Browse all skills                              |
|                    Browse all videos                              |
+------------------------------------------------------------------+
```

**Container:**
- Padding: 64px 32px
- Background: Card color
- Border-radius: 16px
- Text-align: center

**Icon:** 64x64px, muted color, 0.5 opacity
**Title:** Outfit font, 20px, weight 600
**Description:** 14px, muted, max-width 400px
**Suggestions:** Cyan links, vertical stack

---

### 7. Footer

Shared component with homepage. See `homepage-design-spec.md` for details.

**Structure:**
- Brand section with logo and description
- Four link columns: Platform, Content, Community, Help
- Bottom bar with copyright and credits

**Responsive:**
- Tablet: 2-column grid, brand spans full width
- Mobile: Single column stack, centered bottom text

---

## Interactive States

### Filter Chips

| State | Visual Change |
|-------|---------------|
| Default | Card background, medium border |
| Hover | Elevated background, muted border |
| Active | Type-colored dim background and border |

### Filter Options (Sidebar)

| State | Visual Change |
|-------|---------------|
| Default | No background |
| Hover | Elevated background |
| Selected | Cyan checkbox, primary text color |

### Result Cards

| State | Visual Change |
|-------|---------------|
| Default | Card background, subtle border |
| Hover | Medium border, shadow, left accent bar appears |
| Focus | Cyan outline (accessibility) |

### Bookmark Button

| State | Visual Change |
|-------|---------------|
| Default | Outline icon, muted color |
| Hover | Amber color |
| Saved | Filled icon, amber color |

---

## Search Highlighting

Search terms in titles and descriptions are highlighted using `<mark>` tags.

**Highlight Styling:**
- Background: cyan-dim (rgba(34, 211, 238, 0.15))
- Color: cyan (#22d3ee)
- Padding: 0 2px
- Border-radius: 2px

**Matching Rules:**
- Case-insensitive matching
- Partial word matching supported
- Multiple terms highlighted independently

---

## Sorting Options

| Option | Description |
|--------|-------------|
| Most Relevant | Default, based on search score |
| Most Recent | Newest first by creation date |
| Most Popular | By view count |
| Most Liked | By like count |

---

## URL Structure

Search results page should support URL parameters for sharing:

```
/search?q=code+review&type=prompt,skill&task=code-reviews&tool=claude-code&sort=recent&page=2
```

| Parameter | Values |
|-----------|--------|
| q | Search query string |
| type | prompt, skill, video (comma-separated) |
| task | task slug (comma-separated) |
| tool | tool slug (comma-separated) |
| sort | relevance, recent, popular, likes |
| page | Page number (1-indexed) |

---

## Responsive Behavior

### Tablet (768-1023px)

- Sidebar moves above results as horizontal filter sections (3-column grid)
- Sidebar becomes non-sticky
- Results toolbar wraps if needed

### Mobile (<768px)

- Header search becomes full-width
- Query text reduces to 24px
- Filters bar becomes horizontally scrollable
- Sidebar filters stack in single column (collapsible accordion)
- Result cards stack vertically
- Type badge becomes horizontal row
- Pagination buttons reduce size

---

## Empty & Loading States

### Loading State

- Skeleton cards with pulsing animation
- 5 placeholder cards matching result card layout
- Filter counts show loading indicator

### No Results

- Centered message with search icon
- Suggestions to modify search or browse categories
- Quick links to browse all content types

### Error State

- Error message with retry button
- Contact support link for persistent issues

---

## Accessibility

- All filters keyboard navigable
- Clear focus indicators on all interactive elements
- Filter changes announced to screen readers
- Result count updates announced
- Pagination includes aria-labels
- Bookmark button includes aria-pressed state
- Search highlights preserve text readability (4.5:1 contrast)

---

## Performance Considerations

- Results load in batches of 10
- Filters update results without full page reload
- Debounce search input (300ms)
- Cache filter counts to avoid repeated API calls

---

## File References

- **HTML Prototype:** `docs/design/search-results-page.html`
- **Homepage Reference:** `docs/design/homepage.html`
- **Design System Spec:** `docs/design/homepage-design-spec.md`

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-21 | 1.0 | Platform Team | Initial search results page design specification |
