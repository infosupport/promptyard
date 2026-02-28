# [ADR001] - Use Quarkus as the application framework

- **Status**: Accepted
- **Date:** 2026-02-23

## Context

We need to select a framework for building the Promptyard application backend. The framework
should be open-source with a governance model that protects against sudden license changes or
privatization. It should also provide a productive developer experience and a solid foundation
for building web applications with REST APIs, persistence, and authentication. Since Promptyard
has a SvelteKit SPA frontend, good SPA hosting integration is an important selection criterion.
During evaluation we tested both candidates for their ability to serve a SPA alongside the
backend API.

## Considered options

### Quarkus

Quarkus is a Kubernetes-native Java/Kotlin framework designed for building cloud-native
applications. It is backed by the Commonhaus Foundation, which provides governance guarantees
that the project will remain open-source.

**Pros:**

- Open-source with governance through Commonhaus Foundation, reducing risk of sudden license changes
- Excellent developer experience with live reload and dev services
- Strong Kotlin support
- Built-in extensions for OIDC, Hibernate ORM, Flyway, and other common needs
- Fast startup time and low memory footprint
- Excellent SPA integration through the Quinoa extension, allowing the frontend to be served directly from the backend

**Cons:**

- Smaller community compared to Spring Boot
- Some Kotlin-specific tooling is less mature than Java equivalents

### .NET with C\#

.NET is a mature, cross-platform framework maintained by Microsoft, offering a comprehensive
ecosystem for building web applications.

**Pros:**

- Large ecosystem and mature tooling
- Strong enterprise adoption and support from Microsoft
- Good performance characteristics

**Cons:**

- Governed by a single corporation (Microsoft), which introduces risk around licensing and strategic direction
- Less alignment with the open-source governance model we prefer
- Different language ecosystem (C#) compared to the JVM-based tools we are familiar with
- ASP.NET Core has moved away from good SPA hosting support, making it harder to serve a frontend application alongside the backend API

## Decision

Use Quarkus as the application framework for the Promptyard backend.

## Consequences

- The backend will be built using Kotlin on the JVM with Quarkus as the application framework
- We benefit from Commonhaus Foundation governance, giving us confidence the framework will remain open-source
- We can leverage Quarkus dev services for local development (PostgreSQL, Keycloak)
- The team needs to stay current with the Quarkus ecosystem, which evolves quickly
- Some advanced use cases may require falling back to Java-specific libraries due to less mature Kotlin support in certain extensions

## More information

- [Quarkus](https://quarkus.io/)
- [Commonhaus Foundation](https://www.commonhaus.org/)
