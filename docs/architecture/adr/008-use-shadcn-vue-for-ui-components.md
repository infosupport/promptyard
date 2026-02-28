# [ADR008] - Use shadcn/vue for UI components and form handling

- **Status**: Accepted
- **Date:** 2026-02-24
- **Supersedes:** [ADR005](005-use-primevue-for-ui-components.md), [ADR006](006-use-primevue-forms-for-form-handling.md)

## Context

We initially chose PrimeVue for UI components (ADR005) and @primevue/forms for form handling (ADR006), prioritizing low maintenance and ready-made components. After testing PrimeVue in practice, we found that it does not offer the level of visual customization the project needs. PrimeVue's theming system constrains styling to its preset boundaries, making it difficult to achieve a distinctive look and feel.

The frontend already uses Tailwind CSS for styling. We need a component library that gives full control over markup and styling while still providing accessible, well-structured component primitives.

## Considered options

### shadcn/vue

- **Pros:** Components are copied into the project as source code, giving full ownership and unlimited customization. Built on Radix Vue for accessibility. Uses Tailwind CSS for styling, which aligns with our existing setup. Includes a Form component backed by vee-validate for form handling. Growing community with active development.
- **Cons:** Components must be maintained as project code — updates require manual re-copying or diffing. Slightly more setup effort compared to install-and-use libraries.

### PrimeVue (current choice)

- **Pros:** Large set of pre-built components with sensible defaults. Low maintenance as a dependency.
- **Cons:** Insufficient customization depth for our needs. Theming is constrained to preset-based styling that cannot achieve the visual identity we require. Discovered through hands-on testing.

### Headless UI

- **Pros:** Fully unstyled, accessible primitives. Very lightweight.
- **Cons:** Smaller component set — missing many common components (tables, calendars, etc.) that shadcn/vue provides. Would require building more from scratch.

## Decision

We use shadcn/vue as the UI component library and its built-in Form component (backed by vee-validate) for form handling. This replaces both PrimeVue (ADR005) and @primevue/forms (ADR006).

## Consequences

- Components live in project source code (typically under `src/main/webui/src/components/ui/`), giving full control over markup, styling, and behavior.
- Tailwind CSS is the sole styling approach — no additional theming system to learn or maintain.
- Form handling uses vee-validate (via shadcn/vue's Form component), providing schema-based validation with zod.
- The team is responsible for maintaining component source code, including applying upstream updates when desired.
- Component customization is limited only by what HTML, CSS, and Vue can do — no framework constraints.

## More information

- [shadcn/vue documentation](https://www.shadcn-vue.com/)
- [Radix Vue documentation](https://www.radix-vue.com/)
- [vee-validate documentation](https://vee-validate.logaretm.com/v4/)
