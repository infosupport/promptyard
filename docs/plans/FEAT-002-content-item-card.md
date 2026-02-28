# Implementation Plan: Content Item Card

**Spec:** docs/specs/FEAT-002-content-item-card.md
**Created:** 2026-02-25
**Status:** Draft

## Summary

This feature adds a reusable `ContentItemCard` Vue 3 component that displays a content item summary (title, description, tags, author, content type) with type-specific visual styling. The component is built on the existing shadcn/vue Card primitives, uses Lucide icons for content type indicators, and requires adding the shadcn/vue Badge component. It is a frontend-only feature with no backend changes.

## Key Design Decisions

1. **Place the component in `src/main/webui/src/components/content/` with a barrel export.** The spec describes a content-domain component, not a generic UI primitive. Following the project's convention of domain-specific component directories (e.g., `components/navigation/`), the card lives in a `content/` directory alongside its future siblings (content list, content detail). This mirrors the backend's functional slicing (ADR007) applied to the frontend.

2. **Extract content type configuration into a dedicated TypeScript module `src/main/webui/src/lib/content-types.ts`.** The mapping from content type to icon component, border color class, and label is a pure data concern that multiple components will eventually consume (the card, list filters, detail page headers). Placing it in `lib/` keeps the card component focused on rendering and makes the mapping testable and reusable independently.

3. **Use the shadcn/vue Badge component for tags.** The spec requires tags displayed as badges. shadcn/vue provides a Badge component that must be added via `npx shadcn-vue@latest add badge`. This is consistent with the project's established pattern of adding shadcn/vue components on demand (ADR008).

4. **Implement tag overflow with a `useTagOverflow` composable using ResizeObserver.** The spec requires dynamic tag overflow based on rendered width (not a fixed count), resolving within the first render frame (NFR-001). A composable that measures the tags container after mount and on resize, then computes a visible count and hidden remainder, is the cleanest approach. Using `@vueuse/core`'s `useResizeObserver` (already a dependency) avoids writing raw ResizeObserver boilerplate.

5. **Implement description truncation with CSS `line-clamp-3`.** Tailwind's `line-clamp-3` utility provides exactly the 3-line truncation with ellipsis the spec requires. This is a purely visual concern -- no JavaScript measurement needed.

6. **Use `RouterLink` for the title navigation.** The spec requires the title to be a clickable link navigating to a URL prop. Using Vue Router's `RouterLink` component provides keyboard accessibility (NFR-002), proper SPA navigation, and correct semantic HTML (`<a>` tag).

7. **Conditionally render the footer using Vue's `$slots` check.** The spec requires the footer section to not render when no slot content is provided (FR-010). Using `$slots.actions` in a `v-if` directive is the standard Vue 3 pattern for conditional slot rendering.

8. **Define a `ContentType` union type rather than a TypeScript enum.** String literal unions (`'prompt' | 'skill' | 'agent' | 'workflow'`) are idiomatic TypeScript in Vue projects, play better with template type-checking, and avoid the runtime overhead of enums. The values array is exported separately for iteration when needed.

## Implementation Steps

### Phase 1: Add Missing shadcn/vue Component

#### Step 1.1: Add the Badge component via shadcn-vue CLI

Run from `src/main/webui/`:

```bash
npx shadcn-vue@latest add badge
```

This generates `src/main/webui/src/components/ui/badge/Badge.vue` and `src/main/webui/src/components/ui/badge/index.ts`. The Badge component is required for displaying tags.

### Phase 2: Content Type Configuration Module

#### Step 2.1: Create `src/main/webui/src/lib/content-types.ts`

Define the content type union, the configuration map, and a lookup helper:

```typescript
import {
  MessageSquareText,
  Sparkles,
  Bot,
  Workflow,
} from 'lucide-vue-next'
import type { Component } from 'vue'

export type ContentType = 'prompt' | 'skill' | 'agent' | 'workflow'

export const CONTENT_TYPES: ContentType[] = ['prompt', 'skill', 'agent', 'workflow']

export interface ContentTypeConfig {
  label: string
  icon: Component
  borderColor: string
  iconColor: string
}

export const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  prompt: {
    label: 'Prompt',
    icon: MessageSquareText,
    borderColor: 'border-t-blue-500',
    iconColor: 'text-blue-500',
  },
  skill: {
    label: 'Skill',
    icon: Sparkles,
    borderColor: 'border-t-amber-500',
    iconColor: 'text-amber-500',
  },
  agent: {
    label: 'Agent',
    icon: Bot,
    borderColor: 'border-t-violet-500',
    iconColor: 'text-violet-500',
  },
  workflow: {
    label: 'Workflow',
    icon: Workflow,
    borderColor: 'border-t-emerald-500',
    iconColor: 'text-emerald-500',
  },
}
```

Icon choices:
- `MessageSquareText` for prompts (text/conversation metaphor)
- `Sparkles` for skills (capability/magic metaphor)
- `Bot` for agents (AI agent metaphor)
- `Workflow` for workflows (process/flow metaphor)

Color choices use Tailwind's standard palette at the 500 weight, providing strong visual differentiation: blue (prompt), amber (skill), violet (agent), emerald (workflow).

### Phase 3: Tag Overflow Composable

#### Step 3.1: Create `src/main/webui/src/composables/useTagOverflow.ts`

This composable accepts a template ref for the tags container element and the total tag count. It uses `useResizeObserver` from `@vueuse/core` to measure child elements and determine how many tags fit in a single row. It returns a reactive `visibleCount` and `hiddenCount`.

```typescript
import { ref, type Ref, nextTick, onMounted } from 'vue'
import { useResizeObserver } from '@vueuse/core'

export function useTagOverflow(
  containerRef: Ref<HTMLElement | null>,
  totalCount: Ref<number>,
) {
  const visibleCount = ref(0)
  const hiddenCount = ref(0)

  function measure() {
    const container = containerRef.value
    if (!container || totalCount.value === 0) {
      visibleCount.value = totalCount.value
      hiddenCount.value = 0
      return
    }

    // Get all badge children (exclude the "+N more" indicator)
    const children = Array.from(container.children).filter(
      (el) => !el.hasAttribute('data-overflow-indicator'),
    )

    if (children.length === 0) {
      visibleCount.value = 0
      hiddenCount.value = 0
      return
    }

    const containerTop = children[0].getBoundingClientRect().top
    let count = 0

    for (const child of children) {
      if (child.getBoundingClientRect().top > containerTop) break
      count++
    }

    // If not all tags fit, reserve space for the "+N more" indicator
    // by reducing visible count by 1 to make room
    if (count < totalCount.value) {
      visibleCount.value = Math.max(count - 1, 1)
    } else {
      visibleCount.value = count
    }

    hiddenCount.value = totalCount.value - visibleCount.value
  }

  onMounted(async () => {
    await nextTick()
    measure()
  })

  useResizeObserver(containerRef, () => {
    measure()
  })

  return { visibleCount, hiddenCount }
}
```

The algorithm works by rendering all tags initially, measuring which ones share the same top offset (same row), then clamping the visible set. The "+N more" indicator element is excluded from measurement via a `data-overflow-indicator` attribute.

### Phase 4: ContentItemCard Component

#### Step 4.1: Create `src/main/webui/src/components/content/ContentItemCard.vue`

The component composes the shadcn/vue Card primitives with the content type config and tag overflow composable:

```vue
<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { RouterLink } from 'vue-router'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPE_CONFIG, type ContentType } from '@/lib/content-types'
import { useTagOverflow } from '@/composables/useTagOverflow'
import { cn } from '@/lib/utils'

const props = defineProps<{
  title: string
  description: string
  tags: string[]
  contentType: ContentType
  authorName: string
  url: string
}>()

const slots = useSlots()

const typeConfig = computed(() => CONTENT_TYPE_CONFIG[props.contentType])

const tagsContainerRef = ref<HTMLElement | null>(null)
const totalTagCount = computed(() => props.tags.length)
const { visibleCount, hiddenCount } = useTagOverflow(tagsContainerRef, totalTagCount)
</script>

<template>
  <Card :class="cn('border-t-2 overflow-hidden', typeConfig.borderColor)">
    <CardHeader>
      <div class="flex items-center gap-2">
        <component
          :is="typeConfig.icon"
          :class="cn('size-4 shrink-0', typeConfig.iconColor)"
          :aria-label="typeConfig.label"
          role="img"
        />
        <CardTitle class="truncate">
          <RouterLink
            :to="url"
            class="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring line-clamp-2"
          >
            {{ title }}
          </RouterLink>
        </CardTitle>
      </div>
    </CardHeader>

    <CardContent v-if="description" class="space-y-3">
      <p class="text-sm text-muted-foreground line-clamp-3">
        {{ description }}
      </p>
    </CardContent>

    <CardContent v-if="tags.length > 0" class="pt-0">
      <div ref="tagsContainerRef" class="flex flex-wrap items-center gap-1 overflow-hidden max-h-7">
        <Badge
          v-for="(tag, index) in tags"
          :key="tag"
          variant="secondary"
          :class="{ 'invisible absolute': index >= visibleCount && hiddenCount > 0 }"
          class="truncate max-w-32 text-xs"
        >
          {{ tag }}
        </Badge>
        <span
          v-if="hiddenCount > 0"
          data-overflow-indicator
          class="text-xs text-muted-foreground whitespace-nowrap"
        >
          +{{ hiddenCount }} more
        </span>
      </div>
    </CardContent>

    <CardContent class="pt-0">
      <p class="text-xs text-muted-foreground">{{ authorName }}</p>
    </CardContent>

    <CardFooter v-if="slots.actions">
      <div class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </CardFooter>
  </Card>
</template>
```

Key implementation details:
- The colored top border uses `border-t-2` combined with the type-specific `border-t-{color}-500` class.
- The content type icon is rendered with `component :is` for dynamic icon selection, with `role="img"` and `aria-label` for accessibility (NFR-003).
- Description uses `line-clamp-3` for CSS-only 3-line truncation (FR-002).
- Title uses `line-clamp-2` for long title truncation (EC-2).
- Tags that exceed the visible count are hidden with `invisible absolute` (removed from flow but still measured).
- Individual tags have `truncate max-w-32` to handle very long single tags (EC-3).
- The `max-h-7` on the tags container constrains to a single visual row.
- The description section is not rendered when empty (EC-4).
- The tags section is not rendered when the tags array is empty (EC-1).
- The footer uses `v-if="slots.actions"` to conditionally render (FR-010).

#### Step 4.2: Create `src/main/webui/src/components/content/index.ts`

```typescript
export { default as ContentItemCard } from './ContentItemCard.vue'
```

### Phase 5: Tests

#### Step 5.1: Create `src/main/webui/src/lib/__tests__/content-types.spec.ts`

Test the content type configuration module:

```typescript
import { describe, it, expect } from 'vitest'
import { CONTENT_TYPE_CONFIG, CONTENT_TYPES } from '../content-types'

describe('content-types', () => {
  it('defines config for all four content types', () => {
    expect(CONTENT_TYPES).toEqual(['prompt', 'skill', 'agent', 'workflow'])
    for (const type of CONTENT_TYPES) {
      const config = CONTENT_TYPE_CONFIG[type]
      expect(config.label).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(config.borderColor).toMatch(/^border-t-/)
      expect(config.iconColor).toMatch(/^text-/)
    }
  })

  it('assigns unique colors to each type', () => {
    const colors = CONTENT_TYPES.map((t) => CONTENT_TYPE_CONFIG[t].borderColor)
    expect(new Set(colors).size).toBe(4)
  })

  it('assigns unique icons to each type', () => {
    const icons = CONTENT_TYPES.map((t) => CONTENT_TYPE_CONFIG[t].icon)
    expect(new Set(icons).size).toBe(4)
  })
})
```

#### Step 5.2: Create `src/main/webui/src/components/content/__tests__/ContentItemCard.spec.ts`

Test the component against the acceptance scenarios from the spec:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentItemCard from '../ContentItemCard.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}))

const defaultProps = {
  title: 'My Prompt',
  description: 'A useful prompt for code reviews',
  tags: ['kotlin', 'review'],
  contentType: 'prompt' as const,
  authorName: 'Jane Doe',
  url: '/prompts/my-prompt',
}

function mountCard(propsOverride = {}, slots = {}) {
  return mount(ContentItemCard, {
    props: { ...defaultProps, ...propsOverride },
    slots,
    global: {
      stubs: {
        RouterLink: {
          template: '<a :href="to"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}
```

Test cases to implement in this file, covering each acceptance scenario:

- **SC-001**: Card displays title, description, tag badges, and author name.
- **SC-002**: Description element has the `line-clamp-3` class.
- **SC-003/SC-004**: Each content type renders the correct icon (check `aria-label`) and border color class.
- **SC-005**: Title link has the correct `href` pointing to the `url` prop.
- **SC-006**: Footer renders when the `actions` slot has content.
- **SC-007**: Footer is not in the DOM when no `actions` slot is provided.
- **EC-1**: Tags section is not rendered when `tags` is empty.
- **EC-4**: Description section is not rendered when `description` is empty.

Note: SC-008 and SC-009 (tag overflow measurement) are difficult to test in jsdom because `getBoundingClientRect` returns zeros. These scenarios should be tested visually or with an E2E framework. The unit tests should verify the composable is wired up (the container ref exists) but not attempt to simulate DOM measurements.

## File Inventory

### New Files

- `src/main/webui/src/components/ui/badge/Badge.vue` -- shadcn/vue Badge component (generated by CLI)
- `src/main/webui/src/components/ui/badge/index.ts` -- Badge barrel export (generated by CLI)
- `src/main/webui/src/lib/content-types.ts` -- Content type to icon/color mapping
- `src/main/webui/src/composables/useTagOverflow.ts` -- Tag overflow measurement composable
- `src/main/webui/src/components/content/ContentItemCard.vue` -- The main component
- `src/main/webui/src/components/content/index.ts` -- Content components barrel export
- `src/main/webui/src/lib/__tests__/content-types.spec.ts` -- Tests for content type config
- `src/main/webui/src/components/content/__tests__/ContentItemCard.spec.ts` -- Component tests

### Modified Files

None. This is a purely additive frontend feature.

## Testing Strategy

### Unit Tests (Vitest + @vue/test-utils)

**Content type configuration** (`content-types.spec.ts`):
- Verify all four types have complete config entries.
- Verify unique colors and icons per type.

**ContentItemCard component** (`ContentItemCard.spec.ts`):
- Mount with default props, assert title text, description text, tag badges, and author name are rendered.
- Assert the description paragraph has `line-clamp-3` class.
- For each content type, mount and verify the icon's `aria-label` matches the expected label and the card has the correct `border-t-{color}` class.
- Assert the title link's `href` matches the `url` prop.
- Mount with an `actions` slot containing a button, assert the footer renders with the button.
- Mount without an `actions` slot, assert no `[data-slot="card-footer"]` element exists.
- Mount with `tags: []`, assert no badge elements exist and no "+0 more" indicator.
- Mount with `description: ''`, assert no description paragraph exists.

**Tag overflow composable** (`useTagOverflow.ts`):
- The composable relies on DOM measurements that jsdom cannot meaningfully simulate. The composable is tested indirectly through the component integration (container ref exists, reactive properties are defined). Full testing of overflow behavior requires a browser-based test runner or E2E tests.

### Visual Verification

After implementation, manually verify in the browser:
- All four content types render with distinct colors and icons.
- Long descriptions truncate at 3 lines with ellipsis.
- Tag overflow shows "+N more" when the card is narrow.
- Title navigation works.
- Footer actions render and hide correctly.

## Migration Notes

- No database migrations required.
- No backwards compatibility concerns -- this is a new component with no existing consumers.
- The Badge component added via shadcn/vue CLI becomes part of the project's UI component library and is available for use in other features.
- The `composables/` directory is new; it follows the Vue 3 convention for reusable composition functions. The `components.json` file already has a `composables` alias configured (`@/composables`).
- The `content-types.ts` module is designed for reuse: future features (content list, search, detail pages) will import the same type config rather than redefining it.
