# [ADR007] - Use functional slicing to structure the backend

- **Status**: Accepted
- **Date:** 2026-02-23

## Context

The backend codebase needs a clear organizational structure so that developers (and AI assistants) can quickly locate and modify functionality. The main alternatives are organizing code by technical layer (e.g., all controllers together, all repositories together) or by functional slice (e.g., grouping all layers for a feature in one package). We want code that changes together to live together, making navigation intuitive and reducing the number of files touched during a feature change.

## Considered options

### Functional slicing (package-by-feature)

- **Pros:** Related code lives in one place, making it easy to find functionality based on what it does. Changes to a feature are localized to a single package. Easier for AI tools to reason about since context is co-located. Supports independent evolution of features.
- **Cons:** Cross-cutting concerns (e.g., shared utilities, security configuration) still need a home outside the feature packages. Can lead to some duplication if features share similar patterns.

### Layered architecture (package-by-layer)

- **Pros:** Familiar structure with clear technical separation (controllers, services, repositories). Easy to enforce architectural rules per layer.
- **Cons:** A single feature change often requires touching files across multiple packages. Harder to find all code related to a specific feature. Packages grow large and unrelated classes end up grouped together.

## Decision

We use functional slicing to structure the backend logic.

## Consequences

- Developers can locate all code for a feature (entity, repository, resource, DTOs) within a single package.
- Code that changes together stays together, reducing the scope of changes during feature work.
- AI assistants can more easily understand feature context since all relevant files are co-located.
- Cross-cutting concerns need to be handled separately, either in a shared package or through framework mechanisms.
- New team members familiar with layered architectures may need time to adjust to the package-by-feature convention.

## More information

- Current backend structure: `src/main/kotlin/com/github/wmeints/promptyard/` with feature packages such as `profiles/` and `content/`.
