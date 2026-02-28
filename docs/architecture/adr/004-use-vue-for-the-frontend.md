# [ADR004] - Use Vue with Vue Router for the frontend

- **Status**: Accepted
- **Date:** 2026-02-23

## Context

Promptyard needs a frontend framework to build its user interface. The framework should be portable, have strong community support, and not be tied to a single corporate backer. We evaluated three options: Vue, Svelte, and React.

## Considered options

### Vue

- **Pros:** True community-driven project without a single corporate owner. Large and active ecosystem. Vue Router provides a mature, well-integrated routing solution. Good portability since it is not tied to a specific platform or vendor.
- **Cons:** Slightly smaller ecosystem than React.

### React

- **Pros:** Largest ecosystem and community. Wide adoption across the industry. Extensive library support.
- **Cons:** Backed by Meta, which creates a dependency on a single corporation's priorities and direction. This conflicts with our portability requirements.

### Svelte

- **Pros:** Lightweight, compiles to vanilla JavaScript with minimal runtime overhead. Simple and expressive syntax.
- **Cons:** Smaller community compared to Vue and React. Not a true community project, as development is primarily driven by a small core team. Fewer third-party libraries and integrations available.

## Decision

We use Vue with Vue Router as the frontend framework for Promptyard.

## Consequences

- The frontend benefits from a community-governed framework that is not dependent on a single corporation's roadmap.
- Vue Router provides integrated routing support out of the box.
- The existing SvelteKit frontend code needs to be replaced with a Vue-based implementation.
- Team members unfamiliar with Vue will need to learn its conventions and APIs.
- The Vue ecosystem provides a wide range of compatible libraries and tools for future needs.

## More information

- [Vue documentation](https://vuejs.org/)
- [Vue Router documentation](https://router.vuejs.org/)
