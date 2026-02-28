# 2. Constraints

## Technical Constraints

- **EntraID for authentication and identity management.**
  Info Support uses EntraID as organizational identity provider.
  We use Keycloak during development so we can test multiple user accounts.

- **Open-source software only.**
  All software dependencies must be open-source to maximize portability of the system and avoid vendor lock-in.

## Organizational Constraints

- **Small development team**
  Limited dedicated capacity; we need to focus on using AI and good quality software to keep the system maintainable. 

- **Internal Info Support audience only.**
  No external users or public access. No multi-tenancy required. Authentication delegates to EntraID.

- **Must comply with Info Support AI policy.**
  AI policy is being written by Hans Kunz as part of RAISE. Content submission must respect sensitivity classification. 

## Conventions

- **All documentation written in English.**
  Architecture docs, code comments, commit messages, and API documentation are all in English. Some externally provided Dutch documents exist but are not a precedent.

- **Arc42 for architecture documentation, Mermaid for diagrams.**
  Documentation lives in `docs/architecture/` following sections 01-12. All diagrams use Mermaid code blocks, no ASCII art.

- **Feature-based module organization.**
  Code is organized by domain feature (e.g., `profiles/`, `content/`) rather than by technical layer. Each module contains its own entities, repositories, resources, and DTOs.

- **Automated tests on unit, component, and system level.**
  All code changes must be covered by automated tests. Unit tests verify individual classes in isolation, component tests verify module behavior with dependencies (e.g., database), and system tests verify end-to-end API behavior.

- **Automated builds and continuous delivery.**
  Automated builds verify solution quality on every change. Continuous delivery is used to deploy the system, ensuring that validated changes reach production without manual intervention.
