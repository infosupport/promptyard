# [ADR003] - Use PostgreSQL for data persistence

- **Status**: Accepted
- **Date:** 2026-02-23

## Context

Promptyard needs a relational database for persisting application data such as prompts, user
profiles, and content metadata. The database should be cost-effective to run on Azure, portable
across deployment environments, and well supported by the Quarkus ecosystem. We evaluated
PostgreSQL and SQL Server as candidates.

## Considered options

### PostgreSQL

PostgreSQL is a fully open-source relational database with a permissive license and broad
community support.

**Pros:**

- Open-source and free to use with no licensing fees
- Lower hosting costs on Azure compared to SQL Server
- Portable across environments — can run as a managed service or self-hosted on Kubernetes
- Excellent support in Quarkus via Hibernate ORM and dev services
- Large community and extensive ecosystem of extensions

**Cons:**

- Some enterprise tooling and integration with Microsoft services is less mature than SQL Server
- Requires more hands-on configuration for advanced features like replication and high availability

### SQL Server

SQL Server is a commercial relational database developed by Microsoft, available as a managed
service on Azure (Azure SQL).

**Pros:**

- Deep integration with the Microsoft/Azure ecosystem
- Mature enterprise tooling and management capabilities
- Strong support for advanced features like in-memory OLTP and columnstore indexes

**Cons:**

- Higher licensing and hosting costs on Azure
- Proprietary — creates vendor lock-in with Microsoft
- Less portable to non-Azure environments, especially self-hosted Kubernetes deployments
- Less idiomatic support in the Quarkus ecosystem compared to PostgreSQL

## Decision

Use PostgreSQL as the relational database for data persistence in Promptyard.

## Consequences

- No database licensing fees, reducing overall operational costs
- Lower Azure hosting costs compared to SQL Server
- The application remains portable — PostgreSQL can be deployed as a managed service on Azure or self-hosted on Kubernetes in another environment
- Quarkus dev services provide a local PostgreSQL instance out of the box, simplifying the development workflow
- The team needs to manage PostgreSQL-specific operational concerns (backup strategies, connection pooling, upgrades) rather than relying on SQL Server's managed tooling

## More information

- [PostgreSQL](https://www.postgresql.org/)
- [Azure Database for PostgreSQL](https://azure.microsoft.com/en-us/products/postgresql)
- [Quarkus Datasource Guide](https://quarkus.io/guides/datasource)
