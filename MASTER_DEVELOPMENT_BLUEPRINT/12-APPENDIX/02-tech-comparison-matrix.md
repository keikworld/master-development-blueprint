# Technology Comparison Matrix

## Backend Runtimes

| Feature | Node.js (LTS) | Deno | Bun |
|---------|--------------|------|-----|
| **TypeScript** | Via tsc/esbuild | Native | Native |
| **npm compatibility** | Native | Partial (npm specifiers) | Native |
| **Security** | Good (sandbox: limited) | Better (sandbox by default) | Good (sandbox: limited) |
| **Ecosystem** | Vast | Growing | Growing |
| **Startup time** | ~200ms | ~150ms | ~40ms |
| **HTTP performance** | Good | Good | Excellent |
| **Std library** | None (need express/fastify) | Built-in | Built-in |
| **Enterprise readiness** | Highest | Medium | Low |
| **When to choose** | Need stable ecosystem, existing npm packages | Security-critical, want built-in TypeScript, avoid node_modules | Need maximum performance, new project, willing to accept risk |

**Recommendation:**
- **Adopt:** Node.js (most enterprise-ready, largest ecosystem)
- **Trial:** Deno (if security is the #1 concern)
- **Assess:** Bun (for greenfield high-performance projects)

---

## Cross-Platform Mobile

| Feature | KMP | Flutter | React Native |
|---------|-----|---------|--------------|
| **Language** | Kotlin | Dart | JavaScript/TypeScript |
| **Code sharing** | ~95% (shared business logic) | ~70% (UI + logic) | ~60% (logic, UI separate) |
| **Native performance** | Native (compiled) | Skia engine (fast) | JS bridge (medium) |
| **UI layer** | Compose Multiplatform | Built-in widgets | React components |
| **Fintech ecosystem** | Strong (biometrics, crypto) | Growing | Mature |
| **Native API access** | expect/actual pattern | Platform channels | Native modules |
| **Security (crypto)** | Excellent (Kotlin crypto) | Good (dart:typed_data) | Good (node crypto) |
| **Learning curve** | Steep (Kotlin + multiplatform) | Medium (Dart unique) | Low (React devs) |
| **Maturity** | Growing (Kotlin 2.x) | Mature | Mature |
| **When to choose** | Fintech, native parity, maximum code sharing | Rapid cross-platform UI, design-focused apps | React expertise, large JS ecosystem |

**KMP Rule:** Never import Android/iOS in commonMain (use expect/actual).

**Recommendation:**
- **Adopt:** KMP (for fintech/payments max security)
- **Trial:** Flutter (for rapid cross-platform UI)
- **Assess:** React Native (only with existing React team)

---

## Database

| Feature | PostgreSQL | MySQL 8+ | CockroachDB |
|---------|-----------|----------|-------------|
| **ACID compliance** | Full | Full (InnoDB) | Full (distributed) |
| **JSON support** | Excellent (JSONB) | Good (JSON) | Good (JSONB) |
| **Replication** | Streaming, logical | Master-slave, group | Built-in (distributed) |
| **Horizontal scaling** | Manual (read replicas) | Manual (read replicas) | Automatic |
| **Full-text search** | Built-in | Built-in | Basic |
| **GIS support** | PostGIS | Built-in | Limited |
| **Performance** | Good (optimizer is solid) | Excellent (read-heavy) | Good (geo-distributed) |
| **Ecosystem** | Rich extensions | Very wide adoption | Growing |
| **License** | Open source (MIT-style) | Open source (GPL) | Open source (BSL) |
| **When to choose** | Complex queries, data integrity, enterprise | Read-heavy workloads, existing MySQL | Multi-region, automatic scaling |

**Recommendation:**
- **Adopt:** PostgreSQL (best for fintech, data integrity, extensibility)
- **Trial:** CockroachDB (if you need multi-region)
- **Hold:** MySQL (only if existing MySQL infrastructure)

---

## Cache / Key-Value Store

| Feature | Redis | Valkey | Dragonfly |
|---------|-------|--------|-----------|
| **License** | RSALv2/SSPL | BSD-3 | BSL |
| **Open source** | No (since 2024) | Yes (Linux Foundation) | Source-available |
| **API compatibility** | Standard | Redis-compatible | Redis-compatible |
| **Performance** | Good | Good | Excellent (multi-threaded) |
| **Cluster mode** | Built-in | Built-in | Built-in |
| **Module system** | Redis Stack | Limited | Not yet |
| **When to choose** | Existing Redis infra | New projects (OSS), want freedom | Maximum throughput, large datasets |

**Recommendation:**
- **Trial:** Valkey (new projects, avoid Redis license change)
- **Assess:** Dragonfly (for extreme throughput needs)
- **Adopt:** Redis (for existing Redis infrastructure)

---

## Message Queue

| Feature | RabbitMQ | Redis Streams | Kafka | NATS |
|---------|----------|--------------|-------|------|
| **Throughput** | Good | Good | Excellent | Excellent |
| **Persistence** | Yes | Yes | Yes (disk) | Yes (JetStream) |
| **Exactly-once** | With plugins | No | Yes | With JetStream |
| **Ordering** | Per queue | Per stream | Per partition | Per subject |
| **Operations** | Medium | Simple | Complex | Simple |
| **When to choose** | Reliable delivery, complex routing | Simple queue, already using Redis | High-throughput event sourcing | Lightweight, cloud-native |

**Recommendation:**
- **Adopt:** RabbitMQ (best balance of features and ops simplicity)
- **Trial:** NATS (cloud-native, lightweight)
- **Assess:** Kafka (only for high-throughput event sourcing)

---

## Frontend / Web

| Feature | React | Vue | Svelte | Solid |
|---------|-------|-----|--------|-------|
| **Ecosystem** | Vast | Large | Growing | Growing |
| **Performance** | Good | Good | Excellent | Excellent |
| **TypeScript** | Excellent | Good | Good | Excellent |
| **Bundle size** | ~40KB | ~20KB | ~5KB | ~8KB |
| **Learning curve** | Medium | Low | Low | Medium |
| **Mobile** | React Native | NativeScript | Svelte Native | None |
| **SSR** | Next.js | Nuxt | SvelteKit | SolidStart |
| **When to choose** | Need ecosystem, SSR, existing team | Simplicity, moderate needs | Performance, minimal bundle | Fine-grained reactivity |

**Recommendation:**
- **Adopt:** React (largest ecosystem, Next.js SSR, React Native)
- **Trial:** Svelte (performance-critical, minimal bundle)
- **Hold:** Vue (only with existing Vue team)

---

## Technology Radar Summary

| Category | Adopt | Trial | Assess | Hold |
|----------|-------|-------|--------|------|
| **Backend** | Node.js | Deno | Bun | — |
| **Mobile** | KMP | Flutter | React Native | — |
| **Database** | PostgreSQL | CockroachDB | — | MySQL (new projects) |
| **Cache** | Redis (existing) | Valkey (new) | Dragonfly | — |
| **Queue** | RabbitMQ | NATS | Kafka | — |
| **Frontend** | React | Svelte | Solid | Vue (new projects) |
| **API** | REST | GraphQL | tRPC | SOAP |
| **Auth** | JWT + RBAC | OAuth 2.0 | WebAuthn | — |
| **Secrets** | Env + KMS | Vault | — | Git-tracked secrets |
| **Monitoring** | ELK/Prometheus | Grafana Tempo | OpenTelemetry | — |
| **CI/CD** | GitHub Actions | Woodpecker | — | Jenkins |
| **Container** | Docker | Podman | — | — |
