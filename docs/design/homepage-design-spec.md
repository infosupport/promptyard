# RAISE Knowledge Platform - Homepage Design Specification

## Overview

The homepage serves as the main entry point to the knowledge platform, enabling users to:
1. Browse content by top 5 workflow tasks
2. Search across all content types
3. Discover trending and curated content
4. Track personal AI goals and find relevant bounties

---

## Layout Structure

```
+------------------------------------------------------------------+
|                           HEADER                                  |
+------------------------------------------------------------------+
|                      TASK NAVIGATION                              |
+------------------------------------------------------------------+
|                                                    |              |
|                   MAIN CONTENT                     |   SIDEBAR    |
|                                                    |              |
|  +--------------------------------------------+   |  +---------+ |
|  |           CHAMPION PICKS (Featured)        |   |  | My Goal | |
|  +--------------------------------------------+   |  +---------+ |
|                                                    |              |
|  +--------------------------------------------+   |  +---------+ |
|  |           TRENDING THIS WEEK               |   |  | Bounties| |
|  +--------------------------------------------+   |  +---------+ |
|                                                    |              |
|  +--------------------------------------------+   |  +---------+ |
|  |           RECENTLY ADDED                   |   |  | Profile | |
|  +--------------------------------------------+   |  +---------+ |
|                                                    |              |
+------------------------------------------------------------------+
|                           FOOTER                                  |
+------------------------------------------------------------------+
```

**Grid:** 12-column grid, 1200px max-width centered
**Breakpoints:** Desktop (1200px+), Tablet (768-1199px), Mobile (<768px)

---

## Components

### 1. Header

**Height:** 64px
**Background:** White with subtle shadow
**Position:** Sticky on scroll

| Element    | Specification                                                                     |
| ---------- | --------------------------------------------------------------------------------- |
| Logo       | Left-aligned, "RAISE" wordmark + "Knowledge Platform" subtitle, links to homepage |
| Search Bar | Center, 480px width, placeholder: "Search prompts, skills, videos...", icon left  |
| Profile    | Right-aligned, avatar circle (32px) + dropdown on click                           |

**Search Bar States:**
- Default: Light gray border, search icon
- Focus: Blue border, expanded suggestions dropdown
- With results: Show 5 quick results below

**Profile Dropdown:**
- My Profile (AI Skills)
- My Contributions
- Bookmarks
- Settings
- Sign Out

---

### 2. Task Navigation Bar

**Height:** 56px
**Background:** Light gray (#F5F7FA)
**Layout:** Horizontal tabs, evenly spaced

| Tab | Label                     | Icon (optional) |
| --- | ------------------------- | --------------- |
| 1   | User Story Implementation | code-bracket    |
| 2   | Debugging & Bug Fixing    | bug             |
| 3   | Code Reviews              | eye             |
| 4   | Writing Tests             | check-circle    |
| 5   | Writing User Stories      | document-text   |

**Tab States:**
- Default: Gray text, no background
- Hover: Darker text, light blue background
- Active: Blue text, blue underline (2px)

**Behavior:** Clicking a tab navigates to filtered content page for that task

---

### 3. Champion Picks Section

**Purpose:** Showcase curated content selected by AI Champions
**Layout:** Horizontal scroll or 3-column grid

**Section Header:**
- Title: "Champion Picks" with star icon
- Subtitle: "Hand-picked by our AI Champions"
- Link: "View all" right-aligned

**Content Cards (3 visible):**

```
+------------------------+
|  [Content Type Badge]  |
|                        |
|  Title of Content      |
|  (max 2 lines)         |
|                        |
|  Brief description...  |
|  (max 3 lines)         |
|                        |
|  +----+  Author Name   |
|  |img |  Task Tag      |
|  +----+  12 likes      |
+------------------------+
```

**Card Dimensions:** 360px width, ~240px height
**Content Type Badge:** Color-coded (Prompt=Blue, Skill=Green, Video=Purple)

---

### 4. Trending This Week Section

**Purpose:** Surface popular content based on engagement
**Layout:** 4-column grid of smaller cards

**Section Header:**
- Title: "Trending This Week" with fire icon
- Subtitle: "Most viewed and liked content"
- Link: "View all" right-aligned

**Compact Cards (4 visible):**

```
+------------------+
| [Type] [AI Tool] |
|                  |
| Title (2 lines)  |
|                  |
| 234 views · 45   |
+------------------+
```

**Card Dimensions:** 280px width, ~160px height

---

### 5. Recently Added Section

**Purpose:** Highlight fresh contributions
**Layout:** List view with larger items

**Section Header:**
- Title: "Recently Added" with clock icon
- Subtitle: "Latest contributions from the community"
- Filter: Dropdown for content type (All, Prompts, Skills, Videos)

**List Items:**

```
+------------------------------------------------------------------+
| [Type]  Title of the content item                      2 hrs ago |
|         Brief description of what this content does...           |
|         [Task Tag] [AI Tool Tag]    Author Name    12 likes      |
+------------------------------------------------------------------+
```

**Show:** 5 items with "Load more" button

---

### 6. Sidebar

**Width:** 300px (desktop), collapses on tablet/mobile
**Position:** Sticky, scrolls with content until footer

#### 6a. My AI Goal Card

**Purpose:** Show user's personal goal from AI Skills Profile
**Visibility:** Only when logged in

```
+---------------------------+
|  My AI Goal 2026          |
+---------------------------+
|                           |
|  "Learn to use Claude     |
|   Code for debugging"     |
|                           |
|  [Edit Goal]              |
+---------------------------+
```

**Empty State:** "Set your AI goal for 2026" with button to profile

#### 6b. Open Bounties Card

**Purpose:** Show bounties matching user's ambitions
**Count:** 3 bounties max

```
+---------------------------+
|  Open Bounties        (5) |
+---------------------------+
|                           |
|  MCP config for Azure     |
|  Debugging · 50 pts       |
|                           |
|  Claude Code skill for    |
|  test generation          |
|  Writing Tests · 75 pts   |
|                           |
|  [View All Bounties]      |
+---------------------------+
```

**Personalization:** Highlight bounties matching user's stated ambitions (orange items from profile)

#### 6c. Quick Stats Card

**Purpose:** Platform activity overview

```
+---------------------------+
|  Platform Activity        |
+---------------------------+
|                           |
|  1,234  Prompts           |
|    456  Skills            |
|     89  Videos            |
|                           |
|  312 contributors         |
+---------------------------+
```

---

### 7. Footer

**Height:** Auto (content-based)
**Background:** Dark gray (#1F2937)
**Text:** White/light gray

**Columns:**

| Column 1     | Column 2       | Column 3      | Column 4        |
| ------------ | -------------- | ------------- | --------------- |
| **Platform** | **Content**    | **Community** | **Help**        |
| About        | Browse Prompts | Contributors  | Getting Started |
| How It Works | Browse Skills  | Leaderboard   | FAQ             |
| AI Policy    | Browse Videos  | Events        | Contact         |

**Bottom Bar:**
- Left: "RAISE Knowledge Platform - Info Support"
- Right: "Powered by the AISE team"

---

## Interactive States

### Content Cards

| State   | Visual Change                        |
| ------- | ------------------------------------ |
| Default | White background, subtle shadow      |
| Hover   | Elevated shadow, slight scale (1.02) |
| Focus   | Blue outline (accessibility)         |
| Click   | Navigate to content detail           |

### Buttons

| Type      | Style                                  |
| --------- | -------------------------------------- |
| Primary   | Blue background (#3B82F6), white text  |
| Secondary | White background, blue border and text |
| Ghost     | No background, blue text               |

### Tags

| Tag Type     | Color                      |
| ------------ | -------------------------- |
| Task Tag     | Gray background, dark text |
| AI Tool      | Light blue background      |
| Content Type | Colored badge (see above)  |

---

## Responsive Behavior

### Tablet (768-1199px)

- Sidebar moves below main content
- Task navigation becomes scrollable horizontally
- Cards reduce to 2 columns
- Search bar width reduces to 360px

### Mobile (<768px)

- Header: Logo + hamburger menu, search becomes icon that expands
- Task navigation: Horizontal scroll with visible overflow hint
- Cards: Single column, full width
- Sidebar cards: Stack vertically at bottom
- Champion Picks: Horizontal carousel

---

## Empty States

### Not Logged In

- Sidebar shows: "Sign in to set your AI goals and track progress"
- CTA button to sign in via SSO

### No Bounties Match

- Bounty card shows: "Complete your AI Skills Profile to see relevant bounties"

### New User

- Show onboarding banner above Champion Picks:
  "Welcome to RAISE Knowledge Platform! Start by exploring content for your workflow."
  [Browse by Task] [Complete Your Profile]

---

## Color Palette

| Name          | Hex     | Usage                         |
| ------------- | ------- | ----------------------------- |
| Primary Blue  | #3B82F6 | Links, buttons, active states |
| Success Green | #10B981 | Skills badge, success states  |
| Purple        | #8B5CF6 | Video badge                   |
| Orange        | #F59E0B | Bounties, ambition indicators |
| Gray 50       | #F9FAFB | Page background               |
| Gray 100      | #F3F4F6 | Card backgrounds              |
| Gray 900      | #111827 | Primary text                  |
| Gray 500      | #6B7280 | Secondary text                |

---

## Typography

| Element            | Font  | Size | Weight |
| ------------------ | ----- | ---- | ------ |
| H1 (Page title)    | Inter | 32px | 700    |
| H2 (Section title) | Inter | 24px | 600    |
| H3 (Card title)    | Inter | 18px | 600    |
| Body               | Inter | 16px | 400    |
| Small              | Inter | 14px | 400    |
| Caption            | Inter | 12px | 400    |

---

## Accessibility

- All interactive elements keyboard accessible
- Focus states visible (blue outline)
- Color contrast minimum 4.5:1 for text
- Alt text for all images
- ARIA labels for icon-only buttons
- Skip to main content link

---

## Document History

| Date       | Version | Author        | Changes                               |
| ---------- | ------- | ------------- | ------------------------------------- |
| 2026-01-19 | 1.0     | Platform Team | Initial homepage design specification |
