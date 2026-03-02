# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Promptyard is a full-stack prompt management application organized as a Maven multi-module monorepo. It uses Keycloak for authentication (dev) / Microsoft Entra ID (prod) and PostgreSQL for persistence.

### Repository Structure

```
promptyard/
├── pom.xml                    # Root aggregator POM
├── mvnw                       # Maven wrapper (shared by all modules)
├── apps/
│   ├── server/                # Quarkus/Kotlin backend + Vue 3 frontend
│   │   ├── pom.xml
│   │   ├── src/main/kotlin/   # Backend source (Kotlin)
│   │   ├── src/main/webui/    # Frontend source (Vue 3)
│   │   ├── src/main/resources/
│   │   ├── src/test/kotlin/   # Backend tests
│   │   └── docker/            # Docker configs (Keycloak realm, Postgres init)
│   └── client/                # Quarkus/Kotlin client library
│       ├── pom.xml
│       └── src/main/kotlin/   # Client source (Kotlin)
└── docs/                      # Documentation
```

## Build & Development Commands

### Root (Multi-Module)
All commands run from the repo root:

- **Build all modules:** `./mvnw package`
- **Run all tests:** `./mvnw test`

### Server App (`apps/server/`)
All server commands run from the repo root:

- **Dev mode (live reload):** `./mvnw -pl apps/server quarkus:dev`
- **Run all tests:** `./mvnw -pl apps/server test`
- **Run a single test class:** `./mvnw -pl apps/server test -Dtest=PromptsResourceTest`
- **Run a single test method:** `./mvnw -pl apps/server test -Dtest=PromptsResourceTest#testMethodName`
- **Package:** `./mvnw -pl apps/server package`

Dev services (PostgreSQL, Keycloak) are managed automatically by Quarkus Dev Services — no need to run `docker compose` manually.

### Client App (`apps/client/`)
All client commands run from the repo root:

- **Dev mode:** `./mvnw -pl apps/client quarkus:dev`
- **Run all tests:** `./mvnw -pl apps/client test`
- **Package:** `./mvnw -pl apps/client package`

### Frontend (Vue 3 + pnpm, in `apps/server/src/main/webui/`)
All frontend commands run from `apps/server/src/main/webui/`:

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Format:** `pnpm format`
- **Unit tests:** `pnpm test:unit`
- **Storybook:** `pnpm storybook` (runs on port 6006)
- **Build Storybook:** `pnpm build-storybook`

## Architecture

### Server App (`apps/server/`)

The server is the main application. It contains both the Quarkus/Kotlin backend and the Vue 3 frontend (served via the Quinoa plugin).

#### Backend (`apps/server/src/main/kotlin/com/infosupport/promptyard/`)

Two domain modules organized by functional slice (ADR007):

- **`profiles/`** — User profile management (onboarding, retrieval, updates)
- **`content/`** — Content items using single-table inheritance (`ContentItem` base → `Prompt` subclass)

Each module follows a consistent layered pattern:
- **Entity** (JPA/Hibernate with Panache) → **Repository** (`PanacheRepository`) → **Resource** (Jakarta REST endpoints under `/api/`)
- **Request/Response DTOs** use `@Serializable` (kotlinx.serialization)
- **Slug generators** produce unique URL-friendly slugs with counter-based deduplication
- **No service layer:** Resources call repositories directly (thin resource pattern)

#### Key Patterns
- **Security:** Quarkus OIDC with `@Authenticated` annotation; `SecurityIdentity` injected for authorization checks (e.g., verifying content ownership via `identity.principal.name`)
- **DI:** Quarkus Arc (CDI) with `@Inject` and `@ApplicationScoped`
- **Database migrations:** Flyway in `apps/server/src/main/resources/db/migration/`, auto-run at startup
- **Frontend integration:** Quinoa plugin serves the Vue build; dev mode proxies to Vite on port 5173, backend runs on port 8080

#### Frontend (`apps/server/src/main/webui/`)

Vue 3 with Composition API (`<script setup>`), TypeScript strict mode.

- **UI components:** [shadcn/vue](https://www.shadcn-vue.com/) — components copied into project source, styled with Tailwind CSS (ADR008)
- **Forms:** vee-validate via shadcn/vue Form component, with zod for schema validation (ADR008)
- **State management:** Pinia 3
- **Routing:** Vue Router 5 (HTML5 history mode)
- **Path alias:** `@/*` maps to `src/*` (configured in tsconfig and Vite)
- **Linting:** ESLint + oxlint (runs oxlint first, then eslint via `run-s lint:*`)
- **Formatting:** Prettier (no semicolons, single quotes, 100 char print width)
- **Component development:** [Storybook 10](https://storybook.js.org/) (`@storybook/vue3-vite`) for developing and documenting components in isolation. Stories are co-located with components using `*.stories.ts` files. Storybook tests run as a Vitest project via `@storybook/addon-vitest` with Playwright browser mode. Accessibility checks available via `@storybook/addon-a11y`.

#### Testing (`apps/server/src/test/kotlin/`)

- **Framework:** JUnit 5 with `@QuarkusTest`, REST Assured (Kotlin extensions)
- **Auth in tests:** `@TestSecurity` annotation to simulate authenticated users
- **Test data:** `TestObjectFactory` (CDI bean) creates entities; tests clean up with `@AfterEach @Transactional`
- **Unauthenticated tests:** Use `redirects().follow(false)` and assert HTTP 302
- Test structure mirrors the main source package layout

### Client App (`apps/client/`)

A Quarkus/Kotlin library for client-side integrations. Minimal dependencies (quarkus-kotlin, quarkus-arc). Currently in early development.

### Dev Environment

- **PostgreSQL** and **Keycloak** are provisioned automatically via Quarkus Dev Services when running the server in dev mode
- Keycloak realm pre-configured via `apps/server/docker/keycloak/promptyard-realm.json`

## Deployment (GitOps)

Kubernetes manifests live in `deploy/`. Full details in `docs/architecture/07-deployment-view.md`.

### Key Rules

- **Never commit plain-text secrets.** All secrets are `SealedSecret` resources encrypted with `kubeseal`. The files `sealed-secret.yaml` and `ghcr-pull-secret.yaml` contain ciphertext — do not edit them by hand.
- **Production has `prune: false`** in its ArgoCD Application (`deploy/apps/prod.yaml`). Do not change this — it prevents accidental resource deletion.
- **Infrastructure deploys to the `infra` namespace**, not `kube-system`. Both Sealed Secrets and Postgres Operator run there.

### Structure

- **`deploy/root-app.yaml`** — the single ArgoCD entry point (App of Apps). Apply this to bootstrap the entire cluster.
- **`deploy/apps/`** — child ArgoCD Application manifests (postgres-operator, sealed-secrets, staging, prod). The root app watches this directory.
- **`deploy/envs/base/`** — shared Kustomize base referenced by environment overlays. When modifying base resources (deployment, service, ingress, database), edit the files here.
- **`deploy/envs/staging/`** and **`deploy/envs/prod/`** — environment overlays. Each contains a namespace, configmap, sealed secrets, and patches that customize replicas, resources, ingress hostname, and database sizing.
- **`deploy/base/server/`** — original base manifests (duplicated in `envs/base/server/`; overlays reference `envs/base/`).

### Database

PostgreSQL is managed by the Zalando Postgres Operator via a CRD (`acid.zalan.do/v1`) in `database.yaml`. The operator auto-creates a secret named `promptyard-server.promptyard-db.credentials.postgresql.acid.zalan.do` containing the DB username and password — the deployment references this secret directly.

### Image Tags

Image tags are set in each overlay's `kustomization.yaml` under the `images:` block. CI updates staging; production is updated manually via PR.

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
| **backend-code-reviewer** | Reviews backend code quality and architecture | After writing or modifying code in `apps/server/src/main/kotlin/` or `apps/server/src/test/kotlin/` |
| **frontend-code-reviewer** | Reviews frontend component design and practices | After writing or modifying code in `apps/server/src/main/webui/` |
| **implementation-planner** | Creates implementation plans from spec documents | When a spec exists in `docs/specs/` and you need a step-by-step plan |

### Typical Workflow

1. **Plan** — If you have a spec document, use `implementation-planner` to produce a plan in `docs/plans/`.
2. **Build** — Use `backend-developer` and/or `frontend-developer` to implement features. These agents follow the project's architecture patterns and write tests.
3. **Review** — After implementation, use `backend-code-reviewer` and/or `frontend-code-reviewer` to validate code quality, architecture compliance, and test coverage.

Reviewers run automatically after developers when invoked through the standard tool dispatch (see agent descriptions in the system prompt). You can also invoke them manually for code you wrote by hand.

### Agent Memory

Each agent maintains its own memory directory under `.claude/agent-memory/<agent-name>/`. This allows agents to remember patterns, conventions, and lessons learned across sessions. You do not need to manage these files — agents update them automatically.

## Tech Stack Reference

- **Kotlin 2.3, Java 25, Quarkus 3.31+ (server) / 3.32+ (client)**
- **Hibernate ORM Panache (Kotlin), Flyway, PostgreSQL** (server)
- **Vue 3, shadcn/vue, Pinia 3, Vue Router 5, Vite 7, Vitest, Storybook 10** (server frontend)
- **pnpm** (frontend), **Maven** (backend, multi-module aggregator)
