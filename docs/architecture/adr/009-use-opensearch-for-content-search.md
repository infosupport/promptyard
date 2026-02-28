# [ADR009] - Use OpenSearch as the search engine

- **Status**: Accepted
- **Date:** 2026-02-28

## Context

Promptyard needs full-text search to allow users to find content items by
keyword, tag, or author. This requires a dedicated search engine that can index
content and serve queries efficiently. The search engine must integrate well
with the existing Quarkus backend and be available as a dev service for local
development.

## Considered options

### OpenSearch

OpenSearch is a community-driven, open-source search engine forked from
Elasticsearch 7.10. It is licensed under the Apache 2.0 license.

**Pros:**
- Familiar to the team — no learning curve
- Apache 2.0 license — no usage restrictions
- Quarkiverse provides a Quarkus extension with dev services support
- Active community and ecosystem

**Cons:**
- Slightly behind Elasticsearch on some newer features

### Elasticsearch

Elasticsearch is the original search engine that OpenSearch was forked from.
Elastic changed the license from Apache 2.0 to a dual Server Side Public License
(SSPL) / Elastic License in 2021.

**Pros:**
- Mature ecosystem with extensive documentation
- Broader feature set in recent versions

**Cons:**
- SSPL/Elastic License restricts how the software can be used and distributed
- Licensing complexity creates risk for the project

## Decision

Use OpenSearch as the search engine for content indexing and search in the server module.

## Consequences

- The team can use a familiar search engine without a learning curve
- The Apache 2.0 license poses no restrictions on how we use or distribute the software
- The Quarkus OpenSearch extension provides dev services, so no manual Docker setup is needed for development
- Future search features (query API, UI) will be built on OpenSearch
- We accept that some newer Elasticsearch-specific features may not be available in OpenSearch

## More information

- [Quarkus OpenSearch extension documentation](https://docs.quarkiverse.io/quarkus-opensearch/dev/index.html)
- [OpenSearch project](https://opensearch.org/)
