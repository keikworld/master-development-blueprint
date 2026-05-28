# Technology Selection

## Decision Framework

Every technology choice follows this process:

1. **Identify need** — What problem does this technology solve?
2. **Research options** — 3-5 candidates with web-researched data
3. **Evaluate against criteria** — Security, ecosystem, team, scale, compliance
4. **Document decision** — Include rejected options with rationale
5. **Add to comparison matrix** — `12-APPENDIX/02-tech-comparison-matrix.md`

---

## Backend Runtime

### Options (2026)

| Criteria | Node.js 24 LTS | Deno 2.7 | Bun 1.3 |
|----------|---------------|----------|---------|
| **Production maturity** | 15+ years (millions of deployments) | 6 years (tens of thousands) | 2 years (thousands) |
| **Ecosystem** | 2.5M+ npm packages (everything works) | 2.1M+ (95% compatibility) | 2.1M+ (90% compatibility) |
| **Performance** | Baseline | +30% HTTP throughput | +2-4x HTTP throughput |
| **Cold start** | 850-940ms | 720-25ms | 290-310ms |
| **Security model** | None (--experimental-permission) | ✅ Sandboxed by default | None |
| **TypeScript** | Via ts-node/compilation | ✅ Native | ✅ Native |
| **LTS guarantee** | ✅ Yes (formal) | ❌ | ❌ |
| **Enterprise support** | ✅ Every cloud provider, APM tool | ✅ Growing (Deno Deploy) | ❌ Limited |
| **Security advantage** | — | Blocks malicious npm deps from reading .env | — |

### Recommendation

| Scenario | Choice | Rationale |
|----------|--------|-----------|
| **Enterprise / LTS needed** | **Node.js** | Every cloud provider supports it, formal LTS, SOC 2 documentation exists |
| **Security-critical API** | **Deno** | Only runtime with mandatory sandbox; prevents supply chain attacks |
| **Greenfield / speed-focused** | **Node.js** (with Bun for local dev) | Use Node.js for production (compatibility), Bun for dev tooling (35x faster install) |
| **Serverless / edge** | **Deno** (Deno Deploy) or **Bun** | Cold start advantages matter |

**Default recommendation:** Node.js 24 LTS — the safe choice with maximum ecosystem compatibility. Use Deno for services where security is paramount.

---

## Cross-Platform Mobile

### Options (2026)

| Criteria | Kotlin Multiplatform 2.1 | Flutter 4 | React Native 0.78 |
|----------|-------------------------|----------|-------------------|
| **Language** | Kotlin (Android developers) | Dart (new for most) | TypeScript/JS (largest talent pool) |
| **UI approach** | Native (Compose + SwiftUI) | Custom engine (Impeller) | Native components + Fabric |
| **Code sharing** | 40-60% (logic only), 80-95% (+ CMP) | ~95% | ~85% |
| **Performance** | Native-level | Near-native (120fps) | Good (New Architecture) |
| **App size baseline** | Smallest (native) | 15-30 MB | 10-20 MB |
| **Startup time** | Fastest (native compile) | Fast (AOT) | Improved (Hermes) |
| **iOS UI dev time** | 4.1 weeks (SwiftUI) | 2.8 weeks | 2.3 weeks |
| **Enterprise readiness** | Excellent | High | Medium |
| **Incremental adoption** | ✅ Add module by module | ❌ Full rewrite | ❌ Full rewrite |
| **Backed by** | Google + JetBrains | Google | Meta |

### Recommendation

| Scenario | Choice | Rationale |
|----------|--------|-----------|
| **Enterprise / native parity needed** | **KMP** | Native binaries, deep OS integration, incremental adoption |
| **UI-heavy / pixel-perfect** | **Flutter** | Single codebase, custom renderer, best multi-platform story |
| **Fast MVP / JS team** | **React Native** | Largest talent pool, fastest iteration, massive ecosystem |
| **Fintech / security-critical** | **KMP** | Native-level performance, memory safety, no bridge overhead |

**Default recommendation:** Kotlin Multiplatform for shared business logic + native UI. This is a proven pattern for cross-platform projects — share what's expensive (business logic, API contracts), keep UI native. Only choose Flutter or React Native if your team lacks Kotlin/Swift expertise.

---

## Database

### Options (2026)

| Criteria | PostgreSQL 18 | MySQL 9.x | CockroachDB 26 |
|----------|---------------|-----------|----------------|
| **Architecture** | Single-node + replicas | Single-node + replicas | Distributed (multi-node) |
| **Scaling** | Vertical (Citus for horizontal) | Vertical (Vitess for horizontal) | Horizontal (automatic) |
| **Performance (QPS)** | 23,441 (high-volume reads) | 6,300 | Varies (consensus overhead) |
| **JSON support** | ✅ JSONB (binary, indexed) | ✅ JSON (virtual indexing) | ✅ JSONB (PG compatible) |
| **Vector search** | ✅ pgvector | ❌ (HeatWave GenAI) | ✅ Built-in |
| **SQL compliance** | Very high (SQL:2023) | Good | High (PG-compatible) |
| **Multi-region active-active** | ❌ | ❌ | ✅ Native |
| **License** | MIT-like (permissive) | GPL 2.0 / Commercial | BSL 1.1 / CCL |
| **Extension ecosystem** | ✅ Rich (PostGIS, TimescaleDB) | ⚠️ Limited | ❌ |
| **Adoption (2025 SO Survey)** | 55.6% (most popular) | 40.7% | Niche |

### Recommendation

| Scenario | Choice | Rationale |
|----------|--------|-----------|
| **General-purpose backend** | **PostgreSQL** | Most features, best ecosystem, permissive license |
| **Global / multi-region** | **CockroachDB** | Survive datacenter failure, geo-partitioned data |
| **AI / vector workloads** | **PostgreSQL** | pgvector is the standard for embeddings |
| **Existing MySQL workload** | **MySQL** | No reason to migrate if it works |
| **Budget-conscious startup** | **PostgreSQL** | Free, permissive, runs anywhere |

**Default recommendation:** PostgreSQL — the industry standard for new projects. Only choose CockroachDB if you specifically need global distributed active-active.

---

## Cache / Session Store

### Options (2026)

| Criteria | Redis | KeyDB | Valkey (Linux Foundation) |
|----------|-------|-------|--------------------------|
| **Production maturity** | 15+ years | 5 years | 2 years (fork) |
| **Performance** | Baseline | +2x (multi-threaded) | Parity with Redis |
| **Protocol** | RESP | RESP (compatible) | RESP (compatible) |
| **License** | RSAL (not open-source 2026) | BSL 1.1 | BSD-3 (fully open) |
| **TLS support** | ✅ | ✅ | ✅ |
| **Enterprise support** | ✅ Redis Enterprise | ❌ | ✅ AWS, Google, Oracle |

### Recommendation

| Scenario | Choice | Rationale |
|----------|--------|-----------|
| **New project (open-source commitment)** | **Valkey** | Fully open-source (BSD-3), Linux Foundation backed, drop-in Redis replacement |
| **Existing Redis infra** | **Redis** or **Valkey** | Valkey is a drop-in replacement |
| **Maximum performance** | **KeyDB** | Multi-threaded, 2x throughput |
| **Enterprise support needed** | **Redis** (Enterprise) | Commercial support |

**Default recommendation:** Valkey (the open-source Redis fork under Linux Foundation). Use KeyDB if you hit performance ceilings. Use Redis only if you need enterprise support.

---

## Message Queue / Event Bus

| Criteria | RabbitMQ | Apache Kafka | Redis Streams |
|----------|---------|-------------|---------------|
| **Use case** | Task queues, RPC | Event streaming, log aggregation | Simple queues, rate limiting |
| **Persistence** | ✅ | ✅ | ⚠️ (AOF/RDB) |
| **Throughput** | Thousands/sec | Millions/sec | Thousands/sec |
| **Ordering** | Per-queue | Per-partition | Per-stream |
| **Operational complexity** | Moderate | High | Low (reuses Redis) |

**Default recommendation:** Redis Streams for simple queues (reuses existing cache infra). Kafka for event sourcing / analytics pipelines. RabbitMQ for traditional task queues.

---

## Frontend Web

| Criteria | React | Vue | Svelte | Solid |
|----------|-------|-----|--------|-------|
| **Ecosystem** | Largest | Large | Growing | Small |
| **Bundle size** | ~40KB (gzip) | ~20KB | ~3KB | ~7KB |
| **Learning curve** | Moderate | Low | Low | Moderate |
| **SSR/SSG** | ✅ Next.js | ✅ Nuxt | ✅ SvelteKit | ✅ SolidStart |
| **TypeScript** | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Good |
| **Job market** | Largest | Large | Growing | Niche |

**Default recommendation:** React + Next.js for most projects. Vue + Nuxt if team prefers it. Svelte for performance-critical UIs where bundle size matters. For security-critical applications that need to avoid innerHTML XSS, consider Kotlin/JS with kotlinx-html DSL.

---

## API Style

| Criteria | REST | GraphQL | gRPC |
|----------|------|---------|------|
| **Simplicity** | ✅ High | ❌ Medium | ❌ Low |
| **Versioning** | ✅ URL/Header | ✅ Schema evolution | ✅ Proto compatibility |
| **Over-fetching** | ❌ Yes | ✅ No (query fields) | ✅ No (schema) |
| **Tooling** | ✅ Mature | ✅ Mature | ❌ Moderate |
| **Streaming** | ❌ (SSE for events) | ✅ Subscriptions | ✅ Bidirectional |
| **Browser support** | ✅ Native | ✅ HTTP/2 | ❌ (requires grpc-web) |
| **Caching** | ✅ HTTP caching | ❌ Complex | ❌ Complex |

**Default recommendation:** REST for most projects. GraphQL for data-diverse UIs (multiple consumers, different field needs). gRPC for internal service-to-service communication.

---

## Authentication

| Criteria | JWT | Session (Redis) | OAuth 2.0 / OIDC |
|----------|-----|----------------|-------------------|
| **Stateless** | ✅ Yes | ❌ No (server-side) | ✅ Yes (tokens) |
| **Revocation** | ❌ (blacklist needed) | ✅ (delete session) | ⚠️ (depends on provider) |
| **Scalability** | ✅ (no server state) | ❌ (shared Redis needed) | ✅ |
| **Complexity** | Low | Low | High |
| **SSO** | ❌ | ❌ | ✅ |

**Default recommendation:** JWT for APIs (with blacklist for revocation), Redis sessions for web apps that need instant revocation. OAuth 2.0 / OIDC for SSO and third-party auth.

---

## Technology Radar

### Adopt (Proven, Default)
- **Backend:** Node.js 24 LTS, Express/Fastify
- **Database:** PostgreSQL 18
- **Cache:** Valkey (or Redis)
- **Mobile (shared logic):** Kotlin Multiplatform
- **Mobile (UI):** Jetpack Compose (Android) + SwiftUI (iOS)
- **Frontend Web:** React + Next.js
- **API:** REST (JSON)
- **Auth:** JWT + Redis session blacklist
- **Testing:** Mocha + Chai (Node), JUnit (Kotlin)
- **CI/CD:** GitHub Actions
- **Secrets:** Env vars + secrets manager (env file pattern)

### Trial (Promising, Use for New Projects)
- **Backend (security-critical):** Deno 2.7
- **Backend (dev tooling):** Bun 1.3
- **Cache (open-source):** Valkey
- **Database (global):** CockroachDB
- **API (complex UIs):** GraphQL
- **Queue:** Redis Streams

### Assess (Watch, Not Ready Yet)
- **Backend:** Bun 1.3 for production (compatibility gaps)
- **Mobile:** Compose Multiplatform for iOS (stable but new)
- **Database:** MySQL 9.x vector support (immature)
- **Frontend:** Solid.js (ecosystem too small)

### Hold (Avoid for New Projects)
- **Backend:** PHP, Ruby on Rails (unless existing team)
- **Database:** MongoDB (unless document model is truly needed)
- **Mobile:** Cordova, Ionic (performance issues)
- **Auth:** Basic Auth, API keys without rotation
