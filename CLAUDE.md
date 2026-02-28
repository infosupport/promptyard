# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Promptyard is a full-stack prompt management application with a Quarkus/Kotlin backend and Vue 3 frontend, using Keycloak for authentication (dev) / Microsoft Entra ID (prod) and PostgreSQL for persistence.

## Build & Development Commands

### Prerequisites
Start dev services (PostgreSQL + Keycloak) before running the app:

```
docker compose up -d
```

### Backend (Quarkus + Kotlin, Maven)
- **Dev mode (live reload):** `./mvnw quarkus:dev`
- **Run all tests:** `./mvnw test`
- **Run a single test class:** `./mvnw test -Dtest=PromptsResourceTest`
- **Run a single test method:** `./mvnw test -Dtest=PromptsResourceTest#testMethodName`
- **Package:** `./mvnw package`

### Frontend (Vue 3 + pnpm, in `src/main/webui/`)
- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Format:** `pnpm format`
- **Unit tests:** `pnpm test:unit`
- **Storybook:** `pnpm storybook` (runs on port 6006)
- **Build Storybook:** `pnpm build-storybook`

## Architecture

### Backend (`src/main/kotlin/com/infosupport/promptyard/`)

Two domain modules organized by functional slice (ADR007):

- **`profiles/`** — User profile management (onboarding, retrieval, updates)
- **`content/`** — Content items using single-table inheritance (`ContentItem` base → `Prompt` subclass)

Each module follows a consistent layered pattern:
- **Entity** (JPA/Hibernate with Panache) → **Repository** (`PanacheRepository`) → **Resource** (Jakarta REST endpoints under `/api/`)
- **Request/Response DTOs** use `@Serializable` (kotlinx.serialization)
- **Slug generators** produce unique URL-friendly slugs with counter-based deduplication
- **No service layer:** Resources call repositories directly (thin resource pattern)

### Key Patterns
- **Security:** Quarkus OIDC with `@Authenticated` annotation; `SecurityIdentity` injected for authorization checks (e.g., verifying content ownership via `identity.principal.name`)
- **DI:** Quarkus Arc (CDI) with `@Inject` and `@ApplicationScoped`
- **Database migrations:** Flyway in `src/main/resources/db/migration/`, auto-run at startup
- **Frontend integration:** Quinoa plugin serves the Vue build; dev mode proxies to Vite on port 5173, backend runs on port 5000

### Frontend (`src/main/webui/`)

Vue 3 with Composition API (`<script setup>`), TypeScript strict mode. The frontend is in early scaffold state.

- **UI components:** [shadcn/vue](https://www.shadcn-vue.com/) — components copied into project source, styled with Tailwind CSS (ADR008)
- **Forms:** vee-validate via shadcn/vue Form component, with zod for schema validation (ADR008)
- **State management:** Pinia 3
- **Routing:** Vue Router 5 (HTML5 history mode)
- **Path alias:** `@/*` maps to `src/*` (configured in tsconfig and Vite)
- **Linting:** ESLint + oxlint (runs oxlint first, then eslint via `run-s lint:*`)
- **Formatting:** Prettier (no semicolons, single quotes, 100 char print width)
- **Component development:** [Storybook 10](https://storybook.js.org/) (`@storybook/vue3-vite`) for developing and documenting components in isolation. Stories are co-located with components using `*.stories.ts` files. Storybook tests run as a Vitest project via `@storybook/addon-vitest` with Playwright browser mode. Accessibility checks available via `@storybook/addon-a11y`.

### Testing (`src/test/kotlin/`)

- **Framework:** JUnit 5 with `@QuarkusTest`, REST Assured (Kotlin extensions)
- **Auth in tests:** `@TestSecurity` annotation to simulate authenticated users
- **Test data:** `TestObjectFactory` (CDI bean) creates entities; tests clean up with `@AfterEach @Transactional`
- **Unauthenticated tests:** Use `redirects().follow(false)` and assert HTTP 302
- Test structure mirrors the main source package layout

### Dev Environment

- **PostgreSQL 17** on port 5432, **Keycloak 26.5** on port 8180 (via `docker-compose.yml`)
- Environment variables for dev services loaded from `.env`
- Keycloak realm pre-configured via `docker/keycloak/promptyard-realm.json`

## Documentation

- All documentation must be written in **English**. Some Dutch files exist in the repo but were provided externally — do not use them as a language precedent.

Documentation lives in `docs/` organized by category:

- **`docs/architecture/`** — arc42 architecture documentation (sections 01–12). All diagrams use **Mermaid** syntax (not ASCII art). When adding or updating diagrams, always use Mermaid code blocks (` ```mermaid `).
- **`docs/architecture/adr/`** — Architecture Decision Records. Use the `/record-adr` skill to create new ADRs and update the index in `09-architecture-decisions.md`.
- **`docs/legal/`** — Legal and compliance documents (written in Dutch, externally provided).
- **`docs/product/`** — Product strategy and planning (written in Dutch, externally provided).

## Agents

This project uses specialized Claude Code agents (defined in `.claude/agents/`) to divide work across focused roles. Each agent has persistent memory in `.claude/agent-memory/` so it builds knowledge across sessions.

### Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **backend-developer** | Implements Kotlin/Quarkus features with tests | Building endpoints, entities, repositories, migrations, bug fixes |
| **frontend-developer** | Implements Vue 3 components, pages, and routes | Building components, forms, pages, Pinia stores, Vitest tests |
| **backend-code-reviewer** | Reviews backend code quality and architecture | After writing or modifying code in `src/main/kotlin/` or `src/test/kotlin/` |
| **frontend-code-reviewer** | Reviews frontend component design and practices | After writing or modifying code in `src/main/webui/` |
| **implementation-planner** | Creates implementation plans from spec documents | When a spec exists in `docs/specs/` and you need a step-by-step plan |

### Typical Workflow

1. **Plan** — If you have a spec document, use `implementation-planner` to produce a plan in `docs/plans/`.
2. **Build** — Use `backend-developer` and/or `frontend-developer` to implement features. These agents follow the project's architecture patterns and write tests.
3. **Review** — After implementation, use `backend-code-reviewer` and/or `frontend-code-reviewer` to validate code quality, architecture compliance, and test coverage.

Reviewers run automatically after developers when invoked through the standard tool dispatch (see agent descriptions in the system prompt). You can also invoke them manually for code you wrote by hand.

### Agent Memory

Each agent maintains its own memory directory under `.claude/agent-memory/<agent-name>/`. This allows agents to remember patterns, conventions, and lessons learned across sessions. You do not need to manage these files — agents update them automatically.

## Tech Stack Reference

- **Kotlin 2.3, Java 25, Quarkus 3.31**
- **Hibernate ORM Panache (Kotlin), Flyway, PostgreSQL**
- **Vue 3, shadcn/vue, Pinia 3, Vue Router 5, Vite 7, Vitest, Storybook 10**
- **pnpm** (frontend), **Maven** (backend)
