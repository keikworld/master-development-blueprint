# Local Development Workflow

## Goal: Fastest Possible Feedback Loop

A developer should go from `git clone` to running tests in under 60 seconds with zero manual configuration.

## Docker Compose with Profiles

### The Pattern: Dev vs Prod Profiles

```yaml
# docker-compose.yml — single file, two profiles
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"] }

  redis-dev:      # profile: dev — NO TLS
    image: redis:7-alpine
    ports: ["6379:6379"]
    profiles: ["dev"]

  redis-prod:     # profile: prod — TLS enabled
    image: redis:7-alpine
    ports: ["6380:6380"]
    profiles: ["prod"]
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]

volumes:
  postgres_data:
```

```bash
# Usage
docker compose --profile dev up -d postgres redis-dev   # Development
docker compose --profile prod up -d postgres redis-prod  # Production (TLS)
```

### One-Command Setup Script

```bash
#!/bin/bash
# scripts/local-setup.sh
set -e

case "${1:---dev}" in
  --dev)    docker compose --profile dev up -d postgres redis-dev
            echo "✅ Dev mode: http://localhost:3000" ;;
  --prod)   docker compose --profile prod up -d postgres redis-prod
            echo "✅ Prod mode: https://localhost:3000" ;;
  --stop)   docker compose down ;;
  --reset)  docker compose down -v ;;
  --status) docker compose ps ;;
esac
```

## Multi-Stage Dockerfile

```dockerfile
# Stage 1: Dependencies (separate for layer caching)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Development (full deps + hot reload)
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]   # nodemon

# Stage 3: Production (minimal image)
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S app -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=app:nodejs . .
RUN rm -rf tests .eslintrc.js nodemon.json
USER app
HEALTHCHECK --interval=30s --timeout=10s CMD wget --spider http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
```

## Startup Validator (Boot-Time Safety Net)

Run at server startup — logs warnings but doesn't block. Shows up in observability dashboards.

```javascript
// utils/startupValidator.js
const REQUIRED_ENV = {
  security:   ['PRIVACY_APP_SALT', 'ADMIN_API_KEY'],
  database:   ['DATABASE_URL'],
  encryption: ['ENCRYPTION_MASTER_KEY']
};

function validateStartup() {
  for (const [group, vars] of Object.entries(REQUIRED_ENV)) {
    for (const v of vars) {
      if (!process.env[v]) {
        logger.error(`MISSING REQUIRED ENV: ${v} (group: ${group})`);
      }
    }
  }
  // Guard rails: check for common mistakes
  if (process.env.MOCK_REDIS === 'true' && process.env.NODE_ENV === 'production') {
    logger.error('MOCK_REDIS=true in production — data is NOT persisted!');
  }
  if (!process.env.REDIS_PASSWORD && process.env.NODE_ENV === 'production') {
    logger.warn('REDIS_PASSWORD not set — Redis is unauthenticated');
  }
}
```

## Environment Variable Loading

```javascript
// server.js — priority chain
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });  // Local overrides (gitignored)
  require('dotenv').config({ path: '.env' });          // Shared defaults (committed)
  require('dotenv').config({ path: '.env.example' });  // Fallback template
} else {
  // Production: Railway/Fargate inject env vars directly
}
```

## Package.json Script Conventions

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "DOTENV_CONFIG_PATH=.env.test node -r dotenv/config ./node_modules/.bin/mocha",
    "test:coverage": "DOTENV_CONFIG_PATH=.env.test c8 --check-coverage --lines 60 node -r dotenv/config ./node_modules/.bin/mocha",
    "test:services": "DOTENV_CONFIG_PATH=.env.test mocha --no-config --require tests/setup.js tests/*.test.js",
    "test:integration": "DOTENV_CONFIG_PATH=.env.test mocha --no-config tests/integration/**/*.test.js",
    "test:e2e": "DOTENV_CONFIG_PATH=.env.test mocha --no-config --timeout 30000 tests/e2e/**/*.test.js",
    "test:railway": "DOTENV_CONFIG_PATH=.env.test TEST_BASE_URL=https://api.example.com mocha --no-config tests/**/*.test.js",
    "lint": "eslint .",
    "validate": "npm run lint && npm test",
    "db:migrate": "node scripts/run-migrations.js",
    "db:seed": "node scripts/seedDatabase.js"
  }
}
```

## Git Clone → Productive in 60 Seconds

```bash
# 1. Clone
git clone <repo> && cd <repo>

# 2. Start infrastructure (Docker)
docker compose --profile dev up -d postgres redis-dev

# 3. Install deps and run tests
cd backend && npm install && npm test

# 4. Start dev server
npm run dev   # nodemon, auto-reload on change
```

## Hot Module Replacement (KMP Kotlin/JS)

```bash
# Web target: starts dev server with browser reload on Kotlin changes
./gradlew :online-web:jsBrowserDevelopmentRun --no-daemon
```

## Lessons Learned

### Lesson: Docker Compose profiles prevent config drift

- Single source of truth for infrastructure
- Dev gets no-TLS Redis (fast, simple); Prod gets TLS Redis (secure)
- Same file, different `--profile` → zero config differences between environments

### Lesson: Startup validator catches env mistakes early

- Catches missing `PRIVACY_APP_SALT` before a developer wastes 30 minutes debugging
- Catches `MOCK_REDIS=true` in production before data loss
- Non-blocking — logs warnings, doesn't prevent startup

### Lesson: `.env.local` > `.env` loading order

- `.env.local` is in `.gitignore` — used for local overrides (API keys, ports)
- `.env` is committed — shared defaults
- Loading order: local overrides shared → developer never needs to edit shared file

### Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Single `docker-compose.yml` without profiles | Use profiles for dev/prod differences (TLS, ports, tooling containers) |
| Hardcoded Redis/DB credentials in code | `.env` + `.env.local` loading chain |
| No boot-time validation | Add `startupValidator.js` that checks required env + common mistakes |
| Production container runs as root | Always `RUN adduser -S app -u 1001` + `USER app` |
| `node_modules` in production image | Multi-stage build: `COPY --from=deps` |
| Environment-specific Dockerfiles | Single `Dockerfile` with target stages (`--target development`) |
