# [ADR002] - Use Kotlin as the main programming language

- **Status**: Accepted
- **Date:** 2026-02-23

## Context

With Quarkus selected as the application framework (see [ADR001](001-use-quarkus-as-application-framework.md)),
we need to choose a programming language for the backend. Quarkus supports both Java and Kotlin
as first-class languages. We are looking for a language that offers modern language features,
good developer productivity, and strong compatibility with the Quarkus ecosystem.

## Considered options

### Kotlin

Kotlin is a modern JVM language developed by JetBrains. It offers concise syntax, null safety,
coroutines, and data classes among other modern language features.

**Pros:**

- More concise and expressive syntax compared to Java
- Built-in null safety reduces common runtime errors
- Well supported by Quarkus with dedicated extensions
- Full interoperability with Java libraries
- Open language specification, making migration to Java feasible if needed

**Cons:**

- Backed by JetBrains, a single company, rather than being a fully community-governed project
- Slightly slower compilation times compared to Java
- Smaller talent pool than Java

### Java

Java is the primary language of the JVM ecosystem, maintained under the OpenJDK project with
broad industry support.

**Pros:**

- Largest JVM ecosystem and talent pool
- Fully open-source under the OpenJDK project
- First-class support in all JVM frameworks
- Recent versions (17+) have introduced modern features like records, sealed classes, and pattern matching

**Cons:**

- More verbose syntax compared to Kotlin
- Modern language features are being adopted incrementally and are less mature than Kotlin equivalents

## Decision

Use Kotlin as the main programming language for the Promptyard backend.

## Consequences

- The codebase benefits from Kotlin's concise syntax, null safety, and modern language features
- We depend on JetBrains for language development and tooling, which carries some governance risk
- The open language specification and full Java interoperability provide an exit path — the codebase can be translated to Java if necessary
- Team members need Kotlin proficiency, which may require onboarding for developers coming from a Java background
- We can leverage the full Java library ecosystem thanks to Kotlin's interoperability

## More information

- [Kotlin](https://kotlinlang.org/)
- [Quarkus Kotlin Guide](https://quarkus.io/guides/kotlin)
