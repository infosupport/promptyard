# 12. Glossary

| Term                 | Definition                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content item         | Base entity representing any piece of content in the system. Uses single-table inheritance to support multiple content types (e.g., prompts).                           |
| Prompt               | A specific content type containing a title, description, content body, and tags. Stored as a `ContentItem` with discriminator value `"prompt"`.                         |
| Slug                 | A URL-friendly, human-readable identifier generated from a title or name (e.g., `my-first-prompt`). Used in API paths and URLs instead of numeric IDs.                  |
| User profile         | An application-level representation of an authenticated user, storing display name, email, job title, and business unit. Linked to the OIDC identity via `subjectName`. |
| Onboarding           | The process of creating a user profile for a newly authenticated user. Triggered via `POST /api/profiles`.                                                              |
| Placeholder profile  | A minimal user profile auto-created when a user submits content before completing onboarding. Contains only identity claims (subject, name, email).                     |
| OIDC                 | OpenID Connect — the authentication protocol used between the application and Keycloak.                                                                                 |
| SecurityIdentity     | Quarkus abstraction representing the authenticated user. Provides access to the OIDC subject name and token claims.                                                     |
| Panache              | Quarkus extension that simplifies Hibernate ORM usage with repository or active record patterns.                                                                        |
| Quinoa               | Quarkus extension that integrates a JavaScript frontend (SvelteKit) into the Quarkus build and serves it alongside the REST API.                                        |
| shadcn-svelte        | A UI component collection for Svelte that generates customizable component source code into the project via CLI. Not a runtime dependency.                              |
| Discriminator column | A JPA column (`content_type`) in the `content_item` table that identifies which subclass a row belongs to (e.g., `"prompt"`).                                           |
| Flyway               | Database migration tool that applies versioned SQL scripts at application startup to keep the schema in sync with the code.                                             |
| ADR                  | Architecture Decision Record — a structured document capturing the context, decision, and consequences of a significant architectural choice.                           |
