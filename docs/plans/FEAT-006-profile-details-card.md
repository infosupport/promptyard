# Implementation Plan: Profile Details Card

**Spec:** docs/specs/FEAT-006-profile-details-card.md
**Created:** 2026-02-26
**Status:** Draft

## Summary

This feature adds a `ProfileDetailsCard` Vue 3 component that displays a user's full profile summary: large avatar with initials, full name, optional job title (with briefcase icon), optional business unit (with building icon), membership date (with calendar icon, formatted as "Member since Mon YYYY"), per-type content counts with distinct colors, and an optional "Edit Profile" button. The component lives in `components/profiles/` alongside `AuthorCard`, receives all data as props, and reuses the existing `getInitials` utility and `CONTENT_TYPE_CONFIG` color mappings. A new `formatMemberSince` utility function is added to `lib/format.ts` for date formatting.

## Key Design Decisions

1. **Place the component in `src/main/webui/src/components/profiles/`.** The `AuthorCard` already lives here as a profiles-domain component. `ProfileDetailsCard` is a more detailed variant of the same domain concept -- both display user profile information. The barrel export in `profiles/index.ts` will be updated to include it.

2. **Reuse `CONTENT_TYPE_CONFIG` icon colors for the distinct stat colors.** The spec requires "each count uses a distinct color." The existing `content-types.ts` already defines per-type colors: blue-500 (prompts), amber-500 (skills), violet-500 (agents), emerald-500 (workflows). Reusing these colors ensures visual consistency across the application and avoids inventing a parallel color scheme.

3. **Add a `formatMemberSince` function to `lib/format.ts`.** The date formatting logic ("Member since Mon YYYY") is a pure utility with no component dependency. Placing it alongside `getInitials` in the shared format library makes it testable in isolation and available for reuse elsewhere. The function will use `Intl.DateTimeFormat` for locale-aware month abbreviation.

4. **Use Lucide icons directly, with `aria-hidden="true"` per NFR-003.** The spec names three icons: `Briefcase` for job title, `Building2` for business unit, and `CalendarDays` for membership date. These are rendered inline alongside their text labels, with `aria-hidden="true"` so screen readers rely on the text for meaning.

5. **Use a horizontal flex layout with three sections.** Per FR-011, the card layout is: avatar (left) | profile info + stats (center) | edit button (right). This is a single-row `flex items-center` with the center section taking `flex-1`. The edit button area collapses gracefully when `showEditButton` is false.

6. **Render the edit button as a `RouterLink` wrapped in `Button` using `as-child`.** This follows the established pattern from `AuthorCard`'s "View Profile" button and ensures SPA navigation with proper keyboard accessibility (NFR-002). The `Pencil` icon from Lucide is placed inside the button.

7. **Defensively guard against `showEditButton=true` with empty `editUrl` (EC-4).** Rather than crashing or rendering a broken link, the edit button is only rendered when `showEditButton && editUrl` both evaluate to truthy. This matches the spec's defensive behavior requirement.

8. **Do not wrap the card in a shadcn/vue `Card` component.** The AuthorCard uses `Card` because it has a bordered, elevated appearance. The ProfileDetailsCard per the spec is a wider, horizontal layout element meant to sit at the top of a profile page. Using a plain `div` with padding and optional border gives more layout flexibility. However, since the spec references shadcn/vue Card in section 9.1, use `Card` + `CardContent` for consistency, applying horizontal flex layout inside `CardContent`.

## Implementation Steps

### Phase 1: Date Formatting Utility

#### Step 1.1: Add `formatMemberSince` to `src/main/webui/src/lib/format.ts`

Add a new exported function:

```typescript
export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear()
  return `Member since ${month} ${year}`
}
```

Use `en-US` locale explicitly for consistent "Jan", "Feb", etc. abbreviations rather than depending on browser locale. This matches the spec's acceptance scenarios exactly ("Member since Jan 2024", "Member since Dec 2025").

#### Step 1.2: Add tests to `src/main/webui/src/lib/__tests__/format.spec.ts`

Add a new `describe('formatMemberSince')` block with test cases:

- `"2024-01-15T10:30:00Z"` produces `"Member since Jan 2024"` (SC-009)
- `"2025-12-01T00:00:00Z"` produces `"Member since Dec 2025"` (SC-009)
- `"2026-06-15T00:00:00Z"` produces `"Member since Jun 2026"` (future date, EC-5)

### Phase 2: ProfileDetailsCard Component

#### Step 2.1: Create `src/main/webui/src/components/profiles/ProfileDetailsCard.vue`

Props matching the spec's `ProfileDetailsCardProps` contract:

```
Props:
  fullName: string          (required)
  jobTitle?: string         (optional)
  businessUnit?: string     (optional)
  memberSince: string       (required, ISO 8601)
  promptCount: number       (required, >= 0)
  skillCount: number        (required, >= 0)
  agentCount: number        (required, >= 0)
  workflowCount: number     (required, >= 0)
  showEditButton: boolean   (required)
  editUrl?: string          (required when showEditButton is true)
```

**Imports:**
- `Card`, `CardContent` from `@/components/ui/card`
- `Avatar`, `AvatarFallback` from `@/components/ui/avatar`
- `Button` from `@/components/ui/button`
- `Separator` from `@/components/ui/separator`
- `getInitials`, `formatMemberSince` from `@/lib/format`
- `CONTENT_TYPE_CONFIG` from `@/lib/content-types`
- `Briefcase`, `Building2`, `CalendarDays`, `Pencil` from `lucide-vue-next`
- `RouterLink` from `vue-router`
- `computed` from `vue`

**Computed properties:**
- `initials`: `computed(() => getInitials(props.fullName))`
- `formattedMemberSince`: `computed(() => formatMemberSince(props.memberSince))`
- `stats`: Array of `{ label, count, colorClass }` using `CONTENT_TYPE_CONFIG` icon colors:
  ```typescript
  const stats = computed(() => [
    { label: 'Prompts', count: props.promptCount, colorClass: CONTENT_TYPE_CONFIG.prompt.iconColor },
    { label: 'Skills', count: props.skillCount, colorClass: CONTENT_TYPE_CONFIG.skill.iconColor },
    { label: 'Agents', count: props.agentCount, colorClass: CONTENT_TYPE_CONFIG.agent.iconColor },
    { label: 'Workflows', count: props.workflowCount, colorClass: CONTENT_TYPE_CONFIG.workflow.iconColor },
  ])
  ```
- `showEdit`: `computed(() => props.showEditButton && !!props.editUrl)` (EC-4 defensive check)

**Template structure (horizontal layout per FR-011):**

```html
<Card>
  <CardContent class="flex items-center gap-6 py-6">
    <!-- Left: Large Avatar -->
    <Avatar class="size-20 rounded-lg bg-gradient-to-br from-primary to-primary/60 shrink-0"
            :aria-label="fullName">
      <AvatarFallback class="rounded-lg bg-transparent text-2xl font-semibold text-primary-foreground">
        {{ initials }}
      </AvatarFallback>
    </Avatar>

    <!-- Center: Profile Info + Stats -->
    <div class="flex-1 min-w-0 space-y-3">
      <!-- Name -->
      <h2 class="text-lg font-semibold truncate" :title="fullName">
        {{ fullName }}
      </h2>

      <!-- Metadata row: job title, business unit, member since -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span v-if="jobTitle" class="flex items-center gap-1.5 truncate max-w-64">
          <Briefcase aria-hidden="true" class="size-4 shrink-0" />
          <span class="truncate" :title="jobTitle">{{ jobTitle }}</span>
        </span>
        <span v-if="businessUnit" class="flex items-center gap-1.5 truncate max-w-64">
          <Building2 aria-hidden="true" class="size-4 shrink-0" />
          <span class="truncate" :title="businessUnit">{{ businessUnit }}</span>
        </span>
        <span class="flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" class="size-4 shrink-0" />
          {{ formattedMemberSince }}
        </span>
      </div>

      <!-- Stats row -->
      <div class="flex items-center gap-6">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <p :class="['text-lg font-semibold', stat.colorClass]">{{ stat.count }}</p>
          <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Right: Edit Button (conditional) -->
    <Button v-if="showEdit" variant="outline" as-child class="shrink-0">
      <RouterLink :to="editUrl!">
        <Pencil class="size-4 mr-2" />
        Edit Profile
      </RouterLink>
    </Button>
  </CardContent>
</Card>
```

Key design notes:
- Avatar is `size-20` (5rem / 80px) -- larger than AuthorCard's `size-16` since this is a prominent profile display, not a sidebar card.
- The gradient and rounded-lg styling matches AuthorCard for visual consistency (FR-002).
- Metadata items use `flex-wrap` so they flow naturally on narrow viewports (NFR-004).
- `truncate` with `max-w-64` on job title and business unit handles EC-2 (long text).
- The `title` attribute on truncated elements shows the full text on hover.
- Stats use `text-center` for visual alignment, with the color class applied to the count number only.

#### Step 2.2: Update `src/main/webui/src/components/profiles/index.ts`

Add the ProfileDetailsCard export:

```typescript
export { default as AuthorCard } from './AuthorCard.vue'
export { default as ProfileDetailsCard } from './ProfileDetailsCard.vue'
```

### Phase 3: Tests

#### Step 3.1: Create `src/main/webui/src/components/profiles/__tests__/ProfileDetailsCard.spec.ts`

Test setup pattern (following AuthorCard.spec.ts):
- Define `defaultProps` object with all required props.
- Create a `mountCard(propsOverride)` helper function.
- Stub `RouterLink` in `global.stubs` to render as `<a :href="to"><slot /></a>`.

**Test cases mapped to acceptance scenarios:**

**SC-001: Full profile summary displayed (FR-001, FR-003, FR-004, FR-005, FR-006)**
- Mount with `fullName: "Willem Meints"`, `jobTitle: "Machine Learning Engineer"`, `businessUnit: "Unit AI & Data"`, `memberSince: "2024-01-15T10:30:00Z"`
- Assert avatar fallback text contains "WM"
- Assert card text contains "Willem Meints"
- Assert card text contains "Machine Learning Engineer"
- Assert card text contains "Unit AI & Data"
- Assert card text contains "Member since Jan 2024"

**SC-002: Job title hidden when not set (FR-004)**
- Mount without `jobTitle` prop
- Assert card text does NOT contain `Briefcase` icon's parent span (query for the metadata icon area)
- Assert other metadata items remain present

**SC-003: Business unit hidden when not set (FR-005)**
- Mount without `businessUnit` prop
- Assert no `Building2` icon parent span is present
- Assert name and member since are still shown

**SC-004: Both job title and business unit hidden (FR-004, FR-005)**
- Mount without `jobTitle` and without `businessUnit`
- Assert only the membership date metadata item is rendered in the metadata row

**SC-005: Content counts displayed (FR-007, FR-008)**
- Mount with `promptCount: 12, skillCount: 5, agentCount: 0, workflowCount: 3`
- Assert "12", "5", "0", "3" are present in the card text
- Assert "Prompts", "Skills", "Agents", "Workflows" labels are present
- Assert the count elements have distinct color classes from `CONTENT_TYPE_CONFIG`

**SC-006: All counts are zero (FR-007, FR-008)**
- Mount with all counts at 0
- Find all stat count elements and assert all show "0"
- Assert all four labels are present

**SC-007: Edit button shown (FR-009, FR-010)**
- Mount with `showEditButton: true` and `editUrl: "/profiles/me/edit"`
- Assert an anchor element with text "Edit Profile" and href "/profiles/me/edit" exists

**SC-008: Edit button hidden (FR-009)**
- Mount with `showEditButton: false`
- Assert no element with text "Edit Profile" exists

**SC-009: Membership date formatting (FR-006)**
- Mount with `memberSince: "2024-01-15T10:30:00Z"`
- Assert "Member since Jan 2024" is in the text
- Mount with `memberSince: "2025-12-01T00:00:00Z"`
- Assert "Member since Dec 2025" is in the text

**NFR-001: Avatar has aria-label**
- Mount with `fullName: "Willem Meints"`
- Find `[aria-label="Willem Meints"]` and assert it exists

**NFR-003: Metadata icons have aria-hidden**
- Mount with all metadata populated
- Find all Lucide icon SVG elements within the metadata row
- Assert each has `aria-hidden="true"`

**EC-1: Very long name truncation**
- Mount with a 100+ character name
- Assert the name heading element has the `truncate` class
- Assert avatar still shows correct initials

**EC-4: showEditButton true but editUrl empty**
- Mount with `showEditButton: true` and `editUrl: ""`
- Assert no edit button is rendered

**EC-6: Very large content counts**
- Mount with counts like 10000
- Assert the count text "10000" is present (no truncation)

### Phase 4: Storybook Stories

#### Step 4.1: Create `src/main/webui/src/components/profiles/ProfileDetailsCard.stories.ts`

Stories demonstrating component variants (following AuthorCard.stories.ts pattern):

```typescript
const meta = {
  title: 'Profiles/ProfileDetailsCard',
  component: ProfileDetailsCard,
  tags: ['autodocs'],
  argTypes: {
    promptCount: { control: { type: 'number', min: 0 } },
    skillCount: { control: { type: 'number', min: 0 } },
    agentCount: { control: { type: 'number', min: 0 } },
    workflowCount: { control: { type: 'number', min: 0 } },
    showEditButton: { control: 'boolean' },
  },
} satisfies Meta<typeof ProfileDetailsCard>
```

**Stories:**

- **Default**: All props populated, `showEditButton: true`, non-zero counts. `fullName: "Willem Meints"`, `jobTitle: "Machine Learning Engineer"`, `businessUnit: "Unit AI & Data"`, `memberSince: "2024-01-15T10:30:00Z"`, counts: 12/5/3/2.
- **WithoutEditButton**: Same as Default but `showEditButton: false`. Demonstrates the card without the edit action.
- **NoJobTitle**: `jobTitle` omitted. Shows metadata row without briefcase item.
- **NoBusinessUnit**: `businessUnit` omitted. Shows metadata row without building item.
- **MinimalMetadata**: Both `jobTitle` and `businessUnit` omitted. Only membership date shown.
- **AllZeroCounts**: All four content counts at zero, showing they remain visible.
- **HighCounts**: Large numbers (e.g., 10432, 5891, 2310, 789) to verify layout stability with wide numbers.
- **LongName**: A very long full name plus long job title and business unit, to demonstrate truncation behavior.
- **SingleWordName**: `fullName: "Madonna"`, single-initial avatar.

## File Inventory

### New Files

- `src/main/webui/src/components/profiles/ProfileDetailsCard.vue` -- The ProfileDetailsCard component
- `src/main/webui/src/components/profiles/__tests__/ProfileDetailsCard.spec.ts` -- Component unit tests
- `src/main/webui/src/components/profiles/ProfileDetailsCard.stories.ts` -- Storybook stories

### Modified Files

- `src/main/webui/src/lib/format.ts` -- Add `formatMemberSince` function
- `src/main/webui/src/lib/__tests__/format.spec.ts` -- Add tests for `formatMemberSince`
- `src/main/webui/src/components/profiles/index.ts` -- Add `ProfileDetailsCard` export

## Testing Strategy

### Unit Tests (Vitest + @vue/test-utils)

**`formatMemberSince` utility** (`format.spec.ts`):
- Verify ISO datetime strings produce correct "Member since Mon YYYY" output
- Cover January and December to verify month abbreviation edge cases
- Cover a future date to verify no special handling (EC-5)

**ProfileDetailsCard component** (`ProfileDetailsCard.spec.ts`):
- Mount with complete props, assert all visible elements (avatar initials, name, job title, business unit, membership date, counts, edit button)
- Mount without optional props (`jobTitle`, `businessUnit`), assert those sections are absent while others remain
- Mount with `showEditButton: false`, assert edit button is absent
- Mount with `showEditButton: true` and empty `editUrl`, assert edit button is defensively hidden
- Verify each content count uses the correct color class from `CONTENT_TYPE_CONFIG`
- Verify avatar has `aria-label`, metadata icons have `aria-hidden="true"`
- Verify name and metadata text elements have truncation classes for long text
- Verify membership date formatting for multiple date values

### Visual Verification (Storybook)

After implementation, verify in Storybook:
- Default story renders the full horizontal layout with avatar, metadata, stats, and edit button
- WithoutEditButton story shows the card without the edit action, center section expanding
- Metadata items wrap gracefully on narrow viewports
- Avatar gradient background and rounded-square shape match AuthorCard
- Long text truncates with ellipsis (visible via title tooltip on hover)
- All stat colors are distinct and match their ContentItemCard counterparts
- "Edit Profile" button is keyboard-focusable and has a pencil icon

## Migration Notes

- No database migrations required.
- No new npm dependencies required -- all icons (`Briefcase`, `Building2`, `CalendarDays`, `Pencil`) are available from the already-installed `lucide-vue-next` package.
- No new shadcn/vue components needed -- Card, Avatar, Button, and Separator are already installed.
- The `getInitials` function is reused without modification. The first+last word logic already works correctly (updated in FEAT-003).
- The new `formatMemberSince` function is additive -- no existing code is changed.
- No backwards compatibility concerns -- ProfileDetailsCard is a new component with no existing consumers.
