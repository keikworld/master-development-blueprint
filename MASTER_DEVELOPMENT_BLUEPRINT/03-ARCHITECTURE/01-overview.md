# Architecture Overview

## System Context

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Android  │  │   iOS    │  │   Web    │  │ Third-Party    │   │
│  │   App    │  │   App    │  │  (SPA)   │  │ Integrations   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘   │
│       │             │             │                 │            │
│       └─────────────┴─────────────┴─────────────────┘            │
│                              │ HTTPS/TLS 1.3                     │
│                              │ JWT + Nonce + Timestamp           │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    ┌─────────▼─────────┐                        │
│                    │   API Gateway     │                        │
│                    │  (Rate Limit,     │                        │
│                    │   Auth, SSRF)     │                        │
│                    └─────────┬─────────┘                        │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                     Backend Services                      │  │
│  │                                                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Auth    │ │Enrollment│ │Verificat.│ │  PSP     │    │  │
│  │  │  Router  │ │  Router  │ │  Router  │ │  Router  │    │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │  │
│  │       │            │            │             │          │  │
│  │  ┌────▼────────────▼────────────▼─────────────▼──────┐   │  │
│  │  │               Service Layer                       │   │  │
│  │  │  (cacheService, dbService, auditService, etc.)     │   │  │
│  │  └────────────────────┬──────────────────────────────┘   │  │
│  │                       │                                  │  │
│  │  ┌────────────────────┼──────────────────────────────┐   │  │
│  │  │         Provider Abstraction Layer                │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │  │  │
│  │  │  │  Redis   │  │PostgreSQL│  │AWS KMS/LocalKMS│   │  │  │
│  │  │  │ (Valkey) │  │          │  │                │   │  │  │
│  │  │  └──────────┘  └──────────┘  └────────────────┘   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Stateless API servers** — All state in Redis/PostgreSQL, enabling horizontal scaling
2. **Provider abstraction** — Every infrastructure dependency has an interface for swapping
3. **Defense in depth** — Every request passes through auth → rate limit → replay protection → SSRF validation
4. **Privacy by design** — Data minimized, anonymized, time-limited at collection point
5. **Constant-time by default** — All secret comparisons use timing-safe operations
6. **Fail closed** — If security middleware can't verify, deny the request

---

## Request Lifecycle

```
Client Request
    │
    ▼
1. TLS Termination (HTTPS)
    │
    ▼
2. Rate Limiting (sliding window, per-IP + per-user)
    │
    ▼
3. Replay Protection (nonce + timestamp validation)
    │
    ▼
4. Authentication (JWT verification / API key check)
    │
    ▼
5. Authorization (RBAC / ownership check)
    │
    ▼
6. Input Validation (SSRF check, UUID format, sanitization)
    │
    ▼
7. Business Logic (route handler → service)
    │
    ▼
8. Response (JSON with safe error messages)
    │
    ▼
9. Audit Logging (structured, PII-free)
```

---

## Security Architecture (Summary)

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **Transport** | TLS 1.3 | HTTPS only, HSTS headers |
| **Authentication** | JWT + API keys | Short-lived JWTs (15min), long-lived API keys with rotation |
| **Authorization** | RBAC + ownership | Role-based access + resource ownership verification |
| **Replay** | Nonce + timestamp | Per-request nonce (Redis TTL 5min), timestamp drift < 30s |
| **Rate limit** | Sliding window | Per-IP and per-user, configurable limits |
| **SSRF** | URL validation | Block private IP ranges, validate redirect_uri |
| **Timing** | Constant-time | All digest/key comparisons use timing-safe operations |
| **Memory** | Buffer wipe | Secrets zeroed after use in finally blocks |

---

## Module Architecture (KMP)

```
┌──────────────────────────────────────────────────────────────────┐
│                         commonMain                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │
│  │ Factors  │ │  Crypto  │ │  Models  │ │  API     │ │ UI   │  │
│  │ (15 types)│ │ (SHA256, │ │ (Request,│ │ Clients  │ │(Canvas│  │
│  │          │ │  PBKDF2, │ │ Response)│ │          │ │Factory│  │
│  │          │ │  ConstT) │ │          │ │          │ │ )    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘  │
│                               │                                 │
│              expect/actual pattern for platform APIs             │
│                               │                                 │
├───────────────────────────────┼─────────────────────────────────┤
│         androidMain           │          jsMain                 │
│  ┌────────────────────┐      │  ┌────────────────────┐         │
│  │ SecureStorage      │      │  │ Web Crypto (async) │         │
│  │ Android KeyStore   │      │  │ DOM APIs           │         │
│  │ Biometrics (Finger)│      │  │ kotlinx-html DSL   │         │
│  │ OkHttp (HTTP)      │      │  │ window.fetch       │         │
│  └────────────────────┘      │  └────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

**Principle:** 95%+ code reuse from commonMain. Platform-specific code only for:
- Storage (Android KeyStore vs IndexedDB vs Keychain)
- HTTP client (OkHttp vs fetch vs URLSession)
- Biometrics (Android BiometricManager vs Face ID)
- Crypto (Java crypto vs Web Crypto vs CommonCrypto)

---

## Module Dependency Map

```
sdk (foundation)
 ├── enrollment (5-step wizard, 15 factors)
 ├── merchant (verification, 4 screens, 15 canvases)
 ├── online-web (web enrollment + verification)
 ├── psp-sdk (payment gateway integrations)
 │
 └── These are consumed by:
      ├── app (Android demo application)
      └── Third-party integrations
```

**CRITICAL RULE:** No circular dependencies between `enrollment` and `merchant`. Both depend on `sdk`. Shared enrollment/verification logic lives in `sdk`.
