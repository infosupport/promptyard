# RAISE Knowledge Platform - Profile Page Design Specification

## Overview

The profile page displays a user's AI skills profile, allowing them to:
1. Showcase their AI tool experience and learning ambitions
2. Set and track personal AI goals
3. View their contributions, badges, and bounties
4. Manage saved content bookmarks

---

## Layout Structure

```
+------------------------------------------------------------------+
|                           HEADER                                  |
+------------------------------------------------------------------+
|                       PROFILE HEADER                              |
|  +--------+  Name, Role, Unit, Member Since                       |
|  | Avatar |  Stats: Prompts | Skills | Videos                     |
|  +--------+  [Edit Profile] [Public Profile Badge]                |
+------------------------------------------------------------------+
|                                                    |              |
|                   MAIN CONTENT                     |   SIDEBAR    |
|                                                    |              |
|  +--------------------------------------------+   |  +---------+ |
|  |              MY AI GOAL CARD               |   |  | Contri- | |
|  +--------------------------------------------+   |  | butions | |
|                                                    |  +---------+ |
|  +--------------------------------------------+   |              |
|  |              AI TOOLS SECTION              |   |  +---------+ |
|  +--------------------------------------------+   |  | Badges  | |
|                                                    |  +---------+ |
|  +--------------------------------------------+   |              |
|  |              TRAINING SECTION              |   |  +---------+ |
|  +--------------------------------------------+   |  | Saved   | |
|                                                    |  | Content | |
|  +--------------------------------------------+   |  +---------+ |
|  |          CLIENT INITIATIVES SECTION        |   |              |
|  +--------------------------------------------+   |  +---------+ |
|                                                    |  | Bounties| |
|  +--------------------------------------------+   |  +---------+ |
|  |         PRACTICAL EXPERIENCE SECTION       |   |              |
|  +--------------------------------------------+   |              |
+------------------------------------------------------------------+
|                           FOOTER                                  |
+------------------------------------------------------------------+
```

**Grid:** Main content (1fr) + Sidebar (380px), 1280px max-width centered
**Breakpoints:** Desktop (1200px+), Tablet (768-1199px), Mobile (<768px)

---

## Components

### 1. Header

Shared component with homepage. See `homepage-design-spec.md` for details.

**Height:** 72px
**Background:** Semi-transparent with backdrop blur
**Position:** Sticky on scroll

---

### 2. Profile Header

**Height:** Auto (content-based)
**Background:** Secondary background with radial gradient accent
**Padding:** 48px vertical

#### Layout

```
+------------------------------------------------------------------+
|  +--------+   Name (36px, bold)                    [Edit Profile] |
|  |        |   [Role Icon] Role · [Building] Unit · [Date] Since   |
|  | Avatar |                                        [Public Badge] |
|  | (120px)|   +------+ +------+ +------+                          |
|  +--------+   |  12  | |   5  | |   3  |                          |
|               |Prompts| |Skills| |Videos|                          |
|               +------+ +------+ +------+                          |
+------------------------------------------------------------------+
```

#### Elements

| Element | Specification |
|---------|---------------|
| Avatar | 120x120px, rounded (20px radius), gradient background, initials |
| Name | Outfit font, 36px, weight 700 |
| Meta Items | 15px, secondary color, icon + text pairs |
| Stats | 3 centered boxes with large numbers (28px, colored) and labels |
| Edit Button | Secondary style with pencil icon |
| Visibility Badge | Green badge showing "Public profile" with eye icon |

#### Avatar Styling

- Background: Linear gradient (violet to rose)
- Box shadow: 0 8px 32px with accent color
- Font: Outfit, 42px, weight 800, white

#### Stats Colors

| Stat | Color |
|------|-------|
| Prompts | Cyan (#22d3ee) |
| Skills | Emerald (#34d399) |
| Videos | Violet (#a78bfa) |

---

### 3. AI Goal Card

**Purpose:** Display and manage the user's annual AI learning goal
**Background:** Card with gradient header

#### Header

```
+------------------------------------------------------------------+
| [Lightning Icon] My AI Goal                              2026    |
+------------------------------------------------------------------+
```

- Background: Linear gradient (cyan-dim to violet-dim)
- Year badge: Elevated background, rounded pill

#### Body

```
+------------------------------------------------------------------+
| "Master Claude Code for implementing complete user stories with   |
|  tests, and share my learnings through at least 5 video          |
|  tutorials."                                                      |
|                                                                   |
| Goal progress                                          40% complete|
| [========================================----------------]        |
|                                                                   |
| [Edit goal]  [Update progress]                                   |
+------------------------------------------------------------------+
```

| Element | Specification |
|---------|---------------|
| Quote | 20px, italic, left border (3px cyan) |
| Progress Label | 14px, secondary text |
| Progress Value | 14px, cyan, weight 600 |
| Progress Bar | 8px height, gradient fill (cyan to violet) |
| Action Buttons | Ghost style with icons |

---

### 4. AI Skills Sections

Four sections with identical structure but different content types:

| Section | Icon Color | Content Type |
|---------|------------|--------------|
| AI Tools | Cyan | Tag-based skills |
| Training | Violet | Text entries |
| Client Initiatives | Amber | Text entries |
| Practical Experience | Emerald | Text entries |

#### Section Structure

```
+------------------------------------------------------------------+
| [Icon] Section Title                                      [+ Add] |
+------------------------------------------------------------------+
|                                                                   |
|  [Legend: Experience vs Ambition]                                 |
|                                                                   |
|  [Content specific to section type]                               |
|                                                                   |
+------------------------------------------------------------------+
```

#### Section Header

- Icon: 36x36px container with dim background, colored icon
- Title: Outfit font, 18px, weight 600
- Add button: Ghost style

#### Legend (AI Tools section only)

```
+------------------------------------------------------------------+
| [Green dot] Experience - tools I've worked with                   |
| [Orange dot] Ambition - tools I want to learn                     |
+------------------------------------------------------------------+
```

- Background: Elevated color
- Padding: 12px 16px
- Dots: 12x12px, 3px border-radius

#### Skill Tags (AI Tools section)

Two visual styles for experience vs ambition:

**Experience Tag:**
- Background: rgba(52, 211, 153, 0.1)
- Border: 1px solid rgba(52, 211, 153, 0.3)
- Color: #34d399
- Check icon prefix

**Ambition Tag:**
- Background: rgba(251, 191, 36, 0.1)
- Border: 1px dashed rgba(251, 191, 36, 0.3)
- Color: #fbbf24
- No icon

**Tag Dimensions:** 10px 16px padding, 10px border-radius

#### Skill Groups (AI Tools section)

```
CHATGPT / CLAUDE / GEMINI
[Claude (Sonnet)] [ChatGPT-4] [Claude (Opus)] [Gemini Pro]

GITHUB COPILOT / CURSOR
[GitHub Copilot] [Copilot Chat] [Cursor]

AI AGENTS (CLAUDE CODE, ETC.)
[Claude Code] [Custom MCP Servers] [Agentic Workflows]
```

- Group title: 14px, uppercase, weight 600, 0.5px letter-spacing
- Items: Flex wrap with 10px gap

#### Text Entries (Training, Client Initiatives, Practical Experience)

```
+------------------------------------------------------------------+
| COMPLETED TRAININGS                                               |
| Anthropic Prompt Engineering Course, Info Support AI Foundations  |
| Workshop, GitHub Copilot Certification                            |
+------------------------------------------------------------------+
```

**Experience Entry:**
- Background: rgba(52, 211, 153, 0.1)
- Left border: 3px solid #34d399
- Label color: #34d399

**Ambition Entry:**
- Background: rgba(251, 191, 36, 0.1)
- Left border: 3px solid #fbbf24
- Label color: #fbbf24

**Entry Dimensions:** 16px padding, 10px border-radius

---

### 5. Sidebar Cards

**Width:** 380px (desktop)
**Gap:** 24px between cards

#### 5a. My Contributions Card

```
+---------------------------+
| [Cloud Icon] My Contributions |
+---------------------------+
| [Cyan dot]   Vertical Slice Implementation Prompt    |
|              2 days ago                      [47]    |
+-----------------------------------------------------+
| [Green dot]  .NET Test Generator Skill              |
|              1 week ago                      [38]    |
+-----------------------------------------------------+
| [Violet dot] Claude Code Deep Dive                  |
|              2 weeks ago                     [52]    |
+-----------------------------------------------------+
| View all 20 contributions                           |
+-----------------------------------------------------+
```

| Element | Specification |
|---------|---------------|
| Type Dot | 8x8px, 2px border-radius, color by type |
| Title | 14px, weight 500, truncate with ellipsis |
| Meta | 12px, muted color |
| Stats | Thumbs up icon + count, muted color |

**Type Colors:**
- Prompt: Cyan
- Skill: Emerald
- Video: Violet

#### 5b. Badges Card

```
+---------------------------+
| [Star Icon] Badges        |
+---------------------------+
| +-------+ +-------+ +-------+ |
| |  Top  | | First | | Prompt| |
| | Contr | | Prompt| |  Guru | |
| |Jan 26 | |Mar 24 | |Nov 25 | |
| +-------+ +-------+ +-------+ |
| +-------+ +-------+ +-------+ |
| | Video | |Bounty | |Helpful| |
| | Star  | |Hunter | |       | |
| |Dec 25 | |Oct 25 | |Sep 25 | |
| +-------+ +-------+ +-------+ |
+-------------------------------+
```

**Grid:** 3 columns, 12px gap

**Badge Item:**
- Padding: 16px 8px
- Background: Elevated color
- Border-radius: 12px
- Hover: translateY(-2px)

**Badge Icon:**
- Size: 48x48px
- Border-radius: 12px
- Gradient backgrounds by tier (gold, silver, bronze, cyan, violet, emerald)
- Emoji icon centered

#### 5c. Saved Content Card

```
+---------------------------+
| [Bookmark Icon] Saved Content |
+---------------------------+
| [PROMPT] Code Review Checklist Generator    [x] |
| [SKILL]  Azure DevOps MCP Config            [x] |
| [VIDEO]  Debugging with AI Assistance       [x] |
+--------------------------------------------------+
| View all 8 bookmarks                             |
+--------------------------------------------------+
```

**Bookmark Item:**
- Padding: 12px
- Background: Elevated color
- Border-radius: 10px
- Hover: Secondary background

**Type Badge:**
- Font: 10px, weight 600, uppercase
- Padding: 4px 8px
- Border-radius: 4px
- Colors: Cyan (Prompt), Emerald (Skill), Violet (Video)

**Remove Button:**
- Hidden by default, visible on hover
- X icon, hover shows rose background

#### 5d. My Bounties Card

```
+---------------------------+
| [Coin Icon] My Bounties   |
+---------------------------+
| [CLAIMED]           75 pts |
| Angular test generation skill |
| Writing Tests              |
+----------------------------+
| [COMPLETED]         50 pts |
| Entity Framework migration prompt |
| User Story Implementation  |
+----------------------------+
| View all bounties          |
+----------------------------+
```

**Bounty Item:**
- Padding: 16px
- Background: Elevated color
- Border-radius: 10px

**Status Badge:**
- Claimed: Amber background/text
- Completed: Emerald background/text
- Font: 11px, weight 600, uppercase
- Padding: 4px 10px
- Border-radius: 20px (pill)

**Points:**
- Star icon + value
- Color: Amber
- Font: 14px, weight 600

---

### 6. Footer

Shared component with homepage. See `homepage-design-spec.md` for details.

---

## Interactive States

### Profile Header

| Element | State | Visual Change |
|---------|-------|---------------|
| Edit Button | Hover | Elevated background, cyan border |
| Avatar | - | Static (no interaction on own profile) |

### Skills Sections

| Element | State | Visual Change |
|---------|-------|---------------|
| Skill Tag | Hover | Slight brightness increase |
| Add Button | Hover | Cyan background dim |
| Section Card | Load | fadeInUp animation with stagger |

### Sidebar Cards

| Element | State | Visual Change |
|---------|-------|---------------|
| Contribution Item | Hover | - |
| Badge Item | Hover | translateY(-2px) lift |
| Bookmark Item | Hover | Background change, remove button visible |
| Bounty Item | Hover | - |
| View All Link | Hover | Cyan background dim |

### Goal Card

| Element | State | Visual Change |
|---------|-------|---------------|
| Progress Bar | Animated | Width transition 0.5s ease |
| Action Buttons | Hover | Cyan background with border-radius |

---

## Responsive Behavior

### Tablet (768-1199px)

- Profile layout becomes single column
- Sidebar moves below main content
- Sidebar cards display in 2-column grid
- Profile header content centers
- Meta items wrap

### Mobile (<768px)

- Header collapses (search becomes icon)
- Profile header stacks vertically, centered
- Avatar remains same size
- Stats remain horizontal
- Sidebar cards stack in single column
- Badges grid becomes 2 columns
- Skills legend stacks vertically

---

## Empty States

### No AI Goal Set

```
+------------------------------------------------------------------+
| [Lightning Icon] My AI Goal                              2026    |
+------------------------------------------------------------------+
| Set your AI learning goal for this year                          |
|                                                                   |
| [Set My Goal]                                                    |
+------------------------------------------------------------------+
```

### No Skills in Section

```
+------------------------------------------------------------------+
| [Icon with 0.5 opacity]                                           |
| No [section type] added yet                                       |
|                                                                   |
| [+ Add your first item]                                          |
+------------------------------------------------------------------+
```

- Icon: 48x48px, 0.5 opacity
- Button: Dashed border, secondary color, hover cyan

### No Contributions

- Card shows: "You haven't contributed any content yet"
- CTA: "Share your first prompt or skill"

### No Badges

- Card shows: "Start contributing to earn badges"
- Show locked/grayed badge placeholders

### No Bookmarks

- Card shows: "Save content you want to revisit later"
- CTA: "Browse content"

### No Bounties

- Card shows: "Claim a bounty to help grow the platform"
- CTA: "View open bounties"

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Background Primary | #0a0f1a | Page background |
| Background Secondary | #111827 | Profile header, footer |
| Background Card | #1a2234 | Card backgrounds |
| Background Elevated | #232d42 | Nested elements, badges |
| Text Primary | #f1f5f9 | Headings, primary text |
| Text Secondary | #94a3b8 | Descriptions, meta |
| Text Muted | #64748b | Timestamps, labels |
| Accent Cyan | #22d3ee | Prompts, primary actions |
| Accent Emerald | #34d399 | Skills, experience |
| Accent Violet | #a78bfa | Videos, training |
| Accent Amber | #fbbf24 | Ambitions, bounties |
| Accent Rose | #fb7185 | Destructive actions |
| Border Subtle | rgba(148, 163, 184, 0.1) | Card borders |
| Border Medium | rgba(148, 163, 184, 0.2) | Input borders |

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Profile Name | Outfit | 36px | 700 |
| Section Title | Outfit | 18px | 600 |
| Card Title | Outfit | 15px | 600 |
| Goal Text | DM Sans | 20px | 400 (italic) |
| Body | DM Sans | 14-15px | 400-500 |
| Meta/Labels | DM Sans | 12-13px | 400-600 |
| Stats Value | Outfit | 28px | 700 |

---

## Animations

### Card Load Animation

```css
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

- Duration: 0.5s
- Timing: ease
- Stagger: 0.1s per section

### Progress Bar

- Property: width
- Duration: 0.5s
- Timing: ease

### Hover Transitions

- Duration: 0.2s
- Timing: ease
- Properties: background, border-color, transform, box-shadow

---

## Accessibility

- All interactive elements keyboard accessible
- Focus states visible (cyan outline with offset)
- Color contrast minimum 4.5:1 for text
- Experience/Ambition distinguished by more than color (solid vs dashed borders, icons)
- ARIA labels for icon-only buttons
- Screen reader text for stats and progress
- Skip to main content link

---

## File References

- **HTML Prototype:** `docs/design/profile-page.html`
- **Homepage Reference:** `docs/design/homepage.html`
- **Design System Spec:** `docs/design/homepage-design-spec.md`

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-21 | 1.0 | Platform Team | Initial profile page design specification |
