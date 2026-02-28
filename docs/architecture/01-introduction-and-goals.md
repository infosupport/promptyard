# 1. Introduction and Goals

## Requirements Overview

Promptyard is a knowledge platform for Info Support's RAISE program, enabling teams to share prompts, skills, and workflows that support AI integration across five core workflow items: user story implementation, debugging, code reviews, writing tests, and writing user stories. The platform contributes to the program goal of 80% of teams having AI integrated into their workflow on at least 3 of these 5 items by end of 2026.

The system provides:

- **Prompt sharing organized by workflow item** — users contribute prompts for implementation, debugging, review, testing, and user story writing. Each prompt receives a unique, URL-friendly slug for easy sharing across teams.
- **Search and discovery** — team members can find and apply proven techniques contributed by others across the organization.
- **Contributor recognition** — the platform highlights contributions to encourage knowledge sharing and make contributors visible.
- **Content curation** — AI Champions curate and organize content to maintain quality and relevance across different roles and contexts.
- **User onboarding and profile management** — users authenticate via OpenID Connect (Keycloak), create a profile, and manage their identity within the application.
- **Extensible content model** — the platform supports prompts as its initial content type, with the architecture designed to accommodate additional content types such as Claude Code skills and MCP configurations.

## Quality Goals

| Priority | Quality Goal    | Motivation                                                                                                                                                     |
| -------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Discoverability | Team members must quickly find relevant prompts for their workflow item. Search, tagging, and organization by workflow category are essential.                 |
| 2        | Extensibility   | The content model must accommodate new content types (e.g., Claude Code skills, MCP configurations) beyond prompts without requiring extensive schema changes. |
| 3        | Security        | All API endpoints require authentication; authorization is enforced at the resource level so only content authors can modify or delete their own items.        |
| 4        | Simplicity      | Feature-based module organization with a consistent layered pattern (Entity → Repository → Resource) keeps the codebase navigable for contributors.            |

## Stakeholders

| Role                     | Expectations                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Development team members | Find and apply proven prompts and techniques for the top 5 workflow items to integrate AI into their daily work.    |
| Contributors (Meesters)  | Share cross-project learnings, prompts, and patterns that help scale AI knowledge beyond their own teams.           |
| AI Champions             | Curate content, organize it by role and context, and ensure quality and relevance across the platform.              |
| Team leads & architects  | Discover leadership use cases and team-level practices that help them model AI usage and set expectations.          |
| Developers               | A well-structured codebase with fast feedback loops (dev mode, tests, Storybook) to enable rapid iteration.         |
| Operations               | Containerized dependencies (PostgreSQL, Keycloak) with declarative configuration (Flyway migrations, realm import). |
