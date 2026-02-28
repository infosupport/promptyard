# RAISE Knowledge Platform

A central knowledge-sharing platform enabling Info Support teams to find and apply AI techniques in their software development workflow.

## Goal

**Enable 80% of Info Support teams to integrate AI into at least 3 of the top 5 workflow items:**

1. User story implementation in code
2. Debugging and bug fixing
3. Code reviews
4. Writing tests
5. Writing user stories

## Key Features

### MVP (Phase 1 - Q2 2026)

- **Prompt and Skill Library** - Central repository for prompts, Claude Code skills, and MCP configurations
- **Search and Discovery** - Browse by task or search across all content types
- **Video Content System** - Technique demonstrations with transcript-based search
- **Rating and Feedback** - Quality signals from the community
- **AI Skills Profile** - Personal learning goals and experience tracking
- **SSO Integration** - Corporate authentication

### Phase 2 (Q3 2026)

- **Curation Tools** - Champion picks and bounty system for content gaps
- **Contributor Dashboard** - Impact metrics and contribution opportunities

### Phase 3 (Q4 2026)

- **Analytics Dashboard** - Platform insights and content strategy
- **Recognition System** - Badges and achievements for contributors

## Getting Started

### Prerequisites

- Java 25 or later (set `JAVA_HOME`)
- Node.js 20+ with npm (for the SvelteKit frontend)
- Maven wrapper included (`./mvnw` or `mvnw.cmd`)

### Configuration

Quarkus dev mode uses the defaults in `src/main/resources/application.properties`. Flyway runs on startup.

### Running the Application

```bash
./mvnw quarkus:dev
```

For frontend-only work, run the SvelteKit dev server from `src/main/webui/`:

```bash
cd src/main/webui
npm install
npm run dev
```

When the backend is running, Quinoa proxies the Vite dev server for hot reload.

## Documentation

| Document                                                      | Description                               |
| ------------------------------------------------------------- | ----------------------------------------- |
| [Architecture](docs/architecture/README.md)                   | System architecture documentation         |
| [Impact Map](docs/product/impactmapping.md)                   | Program-level impact mapping              |
| [Platform Impact Map](docs/product/platform-impactmapping.md) | Platform-specific features and priorities |
| [Design](docs/design/)                                        | Design specs and prototypes               |

## Project Context

This platform addresses the **Knowledge** dimension of the RAISE Program 2026 (AI-Augmented Software Engineering). The **Executability** dimension (meester-gezel program, management mandate, project incentives) requires organizational interventions outside the platform scope.

## Authors

- Joop Snijder
- Willem Meints

---

*Part of the RAISE Program 2026 - Info Support*
