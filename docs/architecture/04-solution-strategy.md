# 4. Solution Strategy

## Technology Decisions

| Decision              | Choice                                                                      | Motivation                                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application framework | Quarkus ([ADR001](adr/001-use-quarkus-as-application-framework.md))         | Open-source governance through Commonhaus Foundation, excellent developer experience with live reload and dev services, and SPA integration via the Quinoa extension. |
| Backend language      | Kotlin ([ADR002](adr/002-use-kotlin-as-programming-language.md))            | Concise syntax, built-in null safety, and full Java interoperability. The open language specification provides an exit path to Java if needed.                        |
| Database              | PostgreSQL ([ADR003](adr/003-use-postgresql-for-data-persistence.md))       | Open-source with no licensing fees, lower Azure hosting costs than SQL Server, and portable across managed services and self-hosted Kubernetes.                       |
| Frontend framework    | Vue with Vue Router ([ADR004](adr/004-use-vue-for-the-frontend.md))         | Community-governed project not tied to a single corporation, with a large ecosystem and mature routing solution.                                                      |
| UI components         | shadcn/vue ([ADR008](adr/008-use-shadcn-vue-for-ui-components.md))          | Components copied into project source for full customization control. Built on Radix Vue for accessibility, styled with Tailwind CSS.                                |
| Form handling         | vee-validate via shadcn/vue Form ([ADR008](adr/008-use-shadcn-vue-for-ui-components.md)) | Schema-based validation with zod, integrated with shadcn/vue form components.                                                                              |

## Approaches to Achieve Quality Goals

- **Discoverability** — Prompts are organized by workflow item and receive unique, URL-friendly slugs for easy sharing. PostgreSQL provides a solid foundation for search and filtering queries.
- **Extensibility** — The content model uses single-table inheritance (`ContentItem` base with `Prompt` as the first subclass), allowing new content types to be added without schema redesign. Flyway migrations manage schema evolution incrementally.
- **Security** — Quarkus OIDC handles authentication (Keycloak in development, Microsoft Entra ID in production). Authorization is enforced at the resource level using `SecurityIdentity` to verify content ownership.
- **Simplicity** — Functional slicing ([ADR007](adr/007-use-functional-slicing-for-backend-structure.md)) keeps related code co-located. Each feature follows a consistent Entity, Repository, Resource pattern with no service layer. shadcn/vue provides customizable UI components as project source code, styled with Tailwind CSS.

## Organizational Decisions

The backend is structured using functional slicing ([ADR007](adr/007-use-functional-slicing-for-backend-structure.md)) — code is organized by feature rather than by technical layer. Each feature package (e.g., `profiles/`, `content/`) contains its entity, repository, resource, and DTOs. This keeps code that changes together in one place and makes the codebase navigable for both developers and AI assistants.
