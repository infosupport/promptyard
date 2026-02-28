# Implementation Plan: Author Card

**Spec:** docs/specs/FEAT-003-author-card.md
**Created:** 2026-02-25
**Status:** Draft

## Summary

This feature adds a standalone `AuthorCard` Vue 3 component that displays an author's avatar (initials-based with gradient background), full name, optional job title, per-type content counts (prompts, skills, agents, workflows), and a "View Profile" navigation button. It also requires modifying the existing `getInitials` utility to use first-letter-of-first-word + first-letter-of-last-word logic (instead of the current first-two-words logic), and updating its existing tests accordingly. This is a frontend-only feature with no backend changes.

## Key Design Decisions

1. **Place the component in `src/main/webui/src/components/content/` with a barrel export update.** The AuthorCard appears on content detail pages and is a content-domain component, not a generic UI primitive. It joins `ContentItemCard` in the existing `content/` component directory, following the project's domain-specific component organization. The barrel export in `content/index.ts` will be updated to include it.

2. **Modify the existing `getInitials` utility rather than creating a new one.** The spec requires initials derived from the first and last word of the name (e.g., "Jan van der Berg" -> "JB"). The current implementation takes the first two words' initials (would produce "JV"). The function in `src/main/webui/src/lib/format.ts` must be updated, and its existing tests in `src/main/webui/src/lib/__tests__/format.spec.ts` updated to reflect the new behavior. The only consumer is `NavigationUserMenu.vue`, where the behavioral change is correct (users typically expect first+last initial, not first+second).

3. **Use shadcn/vue Card and Avatar components as specified in FR-009.** The card structure uses `Card`, `CardContent`, and `CardHeader` for layout. The avatar uses `Avatar` and `AvatarFallback` with custom gradient styling. Both components are already installed.

4. **Use `RouterLink` for the "View Profile" button.** The button receives a `profileUrl` prop and navigates using Vue Router's `RouterLink` rendered as a button via the shadcn/vue `Button` component's `as-child` pattern. This ensures SPA navigation, keyboard accessibility (NFR-002), and correct semantic behavior.

5. **Apply the gradient avatar background via Tailwind utility classes.** The spec requires a gradient background behind the initials in a rounded-square shape. Use `bg-gradient-to-br from-primary/80 to-primary` with `rounded-lg` on the Avatar (overriding its default `rounded-full`). This avoids introducing custom CSS while meeting FR-010.

6. **Use an `aria-label` on the avatar for accessibility.** Per NFR-001, the avatar element will carry `aria-label` set to the author's full name so screen readers convey who the avatar represents.

7. **Display all four content type counts unconditionally.** Per FR-007, zero counts are shown, not hidden. The counts are rendered as a simple grid of label-value pairs. No conditional logic needed.

8. **Conditionally render the job title section using `v-if`.** Per FR-005, when `jobTitle` is undefined/null/empty, the job title line is not rendered at all, keeping the layout visually balanced.

## Implementation Steps

### Phase 1: Update `getInitials` Utility

#### Step 1.1: Modify `src/main/webui/src/lib/format.ts`

Change the `getInitials` function from "first two initials" to "first initial + last initial":

```typescript
export function getInitials(name: string): string {
  const parts = name.split(' ').filter((part) => part.length > 0)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}
```

This handles:
- Empty string: returns `''`
- Single word ("Madonna"): returns `"M"`
- Two words ("Michael Sander"): returns `"MS"`
- Multi-word ("Jan van der Berg"): returns `"JB"` (first + last)
- Extra whitespace ("  Michael  Sander  "): handled by `filter`

#### Step 1.2: Update tests in `src/main/webui/src/lib/__tests__/format.spec.ts`

Update the test that currently expects "John Michael Doe" to produce "JM" (first two). The new behavior produces "JD" (first + last). Add additional test cases from the spec:

- `"John Michael Doe"` -> `"JD"` (changed from "JM")
- `"Jan van der Berg"` -> `"JB"` (new test)
- `"Ana María García López"` -> `"AL"` (new test)
- Existing tests for `"John Doe"` -> `"JD"`, `"John"` -> `"J"`, `""` -> `""`, and whitespace handling remain valid.

### Phase 2: AuthorCard Component

#### Step 2.1: Create `src/main/webui/src/components/content/AuthorCard.vue`

The component accepts props matching the `AuthorCardProps` contract from the spec:

```
Props:
  fullName: string       (required)
  jobTitle?: string      (optional)
  promptCount: number    (required)
  skillCount: number     (required)
  agentCount: number     (required)
  workflowCount: number  (required)
  profileUrl: string     (required)
```

Component structure:
- **Card** wrapper with fixed width (`w-72`) suitable for sidebar context (NFR-003)
- **CardHeader**: Avatar (rounded-lg, gradient background, initials via `getInitials`) + full name + optional job title
- **CardContent**: 2x2 grid of content type counts (Prompts, Skills, Agents, Workflows) with labels
- **CardContent**: "View Profile" button using `RouterLink` with `Button` component

Avatar implementation:
- Override the default `Avatar` class from `rounded-full` to `rounded-lg` for the rounded-square shape (FR-010)
- Apply `bg-gradient-to-br from-primary/80 to-primary text-primary-foreground` for the gradient background
- Set `size-12` for a larger avatar appropriate for the card context
- Add `aria-label` bound to `fullName` on the avatar root (NFR-001)

Name display:
- Full name in a `<p>` with `font-semibold text-sm truncate` (EC-1: long names truncate with ellipsis)
- Job title in a `<p>` with `text-xs text-muted-foreground truncate`, wrapped in `v-if="jobTitle"` (FR-005)

Content counts grid:
- Use `grid grid-cols-2 gap-3` for the 2x2 layout
- Each cell: count value in `font-semibold text-lg` + label in `text-xs text-muted-foreground`
- All four types always rendered, even when zero (FR-007)

View Profile button:
- Full-width `Button` component with `variant="outline"` wrapping a `RouterLink`
- Use `Button` with `as-child` and nest `RouterLink` inside, or use `RouterLink` styled as a button
- The button is keyboard-focusable by default (NFR-002)

#### Step 2.2: Update `src/main/webui/src/components/content/index.ts`

Add the AuthorCard export to the barrel file:

```typescript
export { default as ContentItemCard } from './ContentItemCard.vue'
export { default as AuthorCard } from './AuthorCard.vue'
```

### Phase 3: Tests

#### Step 3.1: Create `src/main/webui/src/components/content/__tests__/AuthorCard.spec.ts`

Test cases mapped to acceptance scenarios:

**SC-001: Card displays author summary (FR-001, FR-003, FR-004)**
- Mount with `fullName: "Michael Sander"` and `jobTitle: "Senior Software Engineer"`
- Assert avatar text contains "MS"
- Assert card text contains "Michael Sander"
- Assert card text contains "Senior Software Engineer"

**SC-002: Initials derived from single-word name (FR-001, FR-002)**
- Mount with `fullName: "Madonna"`
- Assert avatar text contains "M"

**SC-003: Initials derived from multi-part name (FR-001, FR-002)**
- Mount with `fullName: "Jan van der Berg"`
- Assert avatar text contains "JB"

**SC-004: Job title hidden when not set (FR-005)**
- Mount with `fullName: "Michael Sander"` and no `jobTitle` prop
- Assert card text contains "Michael Sander"
- Assert card text does NOT contain a job title element (query by test selector or class)

**SC-005: Content counts displayed for all types (FR-006, FR-007)**
- Mount with `promptCount: 24, skillCount: 8, agentCount: 0, workflowCount: 0`
- Assert card text contains "24", "8", "0" (twice), "Prompts", "Skills", "Agents", "Workflows"

**SC-006: All content counts are zero (FR-006, FR-007)**
- Mount with all counts at 0
- Assert all four "0" values and labels are present

**SC-007: View Profile navigates to author profile (FR-008)**
- Mount with `profileUrl: "/profiles/michael-sander"`
- Find the link/anchor element with text "View Profile"
- Assert its `href` or `to` attribute is "/profiles/michael-sander"

**NFR-001: Avatar has aria-label**
- Mount with `fullName: "Michael Sander"`
- Find the avatar element and assert it has `aria-label="Michael Sander"`

**EC-1: Long name truncation**
- Mount with a 100+ character name
- Assert the name element has the `truncate` class (CSS handles visual truncation)
- Assert avatar still shows correct initials (first + last letter)

Test setup pattern (following ContentItemCard.spec.ts):
- Define `defaultProps` object with all required props
- Create a `mountCard(propsOverride)` helper function
- Stub `RouterLink` in `global.stubs` to render as `<a :href="to">`

### Phase 4: Storybook Stories

#### Step 4.1: Create `src/main/webui/src/components/content/AuthorCard.stories.ts`

Stories demonstrating component variants (following ContentItemCard.stories.ts pattern):

- **Default**: Full set of props with non-zero counts and a job title
- **NoJobTitle**: Same as Default but without `jobTitle` prop
- **AllZeroCounts**: All four content counts at zero
- **SingleWordName**: `fullName: "Madonna"`, showing single-initial avatar
- **MultiPartName**: `fullName: "Jan van der Berg"`, showing first+last initials
- **LongName**: A very long full name (100+ chars) to demonstrate truncation
- **HighCounts**: Large numbers (e.g., 1234) to verify layout with multi-digit counts

Story meta configuration:
```typescript
const meta = {
  title: 'Content/AuthorCard',
  component: AuthorCard,
  tags: ['autodocs'],
} satisfies Meta<typeof AuthorCard>
```

## File Inventory

### New Files

- `src/main/webui/src/components/content/AuthorCard.vue` -- The AuthorCard component
- `src/main/webui/src/components/content/__tests__/AuthorCard.spec.ts` -- Component unit tests
- `src/main/webui/src/components/content/AuthorCard.stories.ts` -- Storybook stories

### Modified Files

- `src/main/webui/src/lib/format.ts` -- Change `getInitials` to use first+last word initials instead of first two
- `src/main/webui/src/lib/__tests__/format.spec.ts` -- Update existing test for multi-word names, add new test cases
- `src/main/webui/src/components/content/index.ts` -- Add `AuthorCard` export

## Testing Strategy

### Unit Tests (Vitest + @vue/test-utils)

**`getInitials` utility** (`format.spec.ts`):
- Verify two-word name produces first+last initials ("John Doe" -> "JD")
- Verify single-word name produces single initial ("Madonna" -> "M")
- Verify multi-word name uses first+last, skipping middle parts ("Jan van der Berg" -> "JB")
- Verify four-word name uses first+last ("Ana María García López" -> "AL")
- Verify empty string returns empty string
- Verify extra whitespace is handled correctly

**AuthorCard component** (`AuthorCard.spec.ts`):
- Mount with complete props, assert all visible elements (avatar initials, name, job title, counts, button)
- Mount without job title, assert job title element is absent
- Mount with various name formats, verify correct initials in avatar
- Mount with mixed zero/non-zero counts, verify all four are displayed
- Mount with all-zero counts, verify all four show "0"
- Verify "View Profile" link targets the correct URL
- Verify avatar has `aria-label` for accessibility
- Verify name element has truncation class for long name handling

### Visual Verification (Storybook)

After implementation, verify in Storybook:
- Default story renders the complete card with avatar, name, title, counts, and button
- NoJobTitle story shows no extra whitespace where the title would be
- Avatar gradient background is visible in all stories
- Avatar shape is rounded-square (not fully round)
- Long name truncates with ellipsis
- All count variants display correctly
- "View Profile" button is visible and keyboard-focusable

## Migration Notes

- No database migrations required.
- No new shadcn/vue components needed -- Card, Avatar, and Button are already installed.
- The `getInitials` behavioral change (first+last instead of first+second) affects `NavigationUserMenu.vue`. For typical two-word names ("John Doe"), behavior is unchanged. For names with 3+ words, the initials will now use the last word instead of the second, which is the expected behavior (e.g., "John Michael Doe" shows "JD" instead of "JM"). This is the correct behavior for a user avatar.
- No backwards compatibility concerns -- AuthorCard is a new component with no existing consumers.
