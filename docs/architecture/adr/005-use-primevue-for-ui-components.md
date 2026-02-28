# [ADR005] - Use PrimeVue for UI components

- **Status**: Superseded by [ADR008](008-use-shadcn-vue-for-ui-components.md)
- **Date:** 2026-02-23

## Context

The Vue-based frontend needs a UI component library to provide consistent, ready-made components such as buttons, forms, dialogs, and data tables. We want a library that is low maintenance, easy to integrate, and provides good-looking components without requiring heavy customization.

## Considered options

### PrimeVue

- **Pros:** Large set of pre-built components with sensible defaults. Low maintenance since components work well out of the box. Easy to integrate into an existing Vue project. Active development and good documentation.
- **Cons:** Less flexibility for deep visual customization compared to unstyled approaches.

### shadcn-vue

- **Pros:** Highly customizable since components are copied into the project as source code. Full control over styling and behavior.
- **Cons:** Higher maintenance burden because components live in the project codebase and must be maintained manually. Requires more effort to set up and keep up to date. Overkill when heavy customization is not needed.

## Decision

We use PrimeVue as the UI component library for the frontend.

## Consequences

- Pre-built components reduce development time for common UI patterns.
- Lower maintenance overhead since PrimeVue components are managed as a dependency rather than project source code.
- The team accepts the default look and feel of PrimeVue, trading deep customizability for ease of use.
- Upgrading PrimeVue is straightforward through dependency management.

## More information

- [PrimeVue documentation](https://primevue.org/)
- [shadcn-vue documentation](https://www.shadcn-vue.com/)
