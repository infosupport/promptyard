# [ADR006] - Use @primevue/forms for form handling

- **Status**: Superseded by [ADR008](008-use-shadcn-vue-for-ui-components.md)
- **Date:** 2026-02-23

## Context

The frontend needs a form handling solution for building and validating user input forms. Since we already use PrimeVue for UI components (see ADR005), we need to decide whether to use its companion forms library or adopt a separate form solution.

## Considered options

### @primevue/forms

- **Pros:** Seamless integration with existing PrimeVue components. Maintained by the same team, ensuring compatibility across versions. Reduces the number of third-party dependencies.
- **Cons:** Smaller community and ecosystem compared to standalone form libraries. Tightly coupled to PrimeVue.

### FormKit

- **Pros:** Feature-rich form framework with built-in input components, validation, and schema-driven form generation. Large plugin ecosystem.
- **Cons:** Adds a separate dependency with its own component set, which overlaps with PrimeVue inputs. Introduces a second styling system to maintain alongside PrimeVue themes.

## Decision

We use @primevue/forms to implement forms in the frontend.

## Consequences

- Form components integrate natively with PrimeVue inputs and theming, providing a consistent look and feel.
- The dependency footprint stays small by staying within the PrimeVue ecosystem.
- The team relies on PrimeVue's forms documentation and community for support, which is smaller than standalone alternatives.
- Validation and form state management follow PrimeVue conventions, reducing context switching for developers already familiar with the library.

## More information

- [PrimeVue Forms documentation](https://primevue.org/forms/)
- [FormKit documentation](https://formkit.com/)
