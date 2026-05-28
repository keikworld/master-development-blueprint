# Community Tools Catalog

A crowdsourced collection of open-source and free tools for building, testing, securing, and managing software projects. **Anyone can contribute** — add tools you use, update descriptions, fix broken links. See `CONTRIBUTING.md`.

---

## How to Use This Catalog

| I Want To... | Look Here |
|--------------|-----------|
| Secure my app | `03-Security & Pentesting` |
| Manage tasks and track progress | `01-Project Management` |
| Brainstorm and design | `02-Design & Brainstorming` |
| Write and test code | `04-Development & Testing` |
| Monitor production | `06-Monitoring & Analytics` |
| Deploy and operate | `07-Deployment & DevOps` |
| Learn something new | `08-Learning & Reference` |

---

## 01 — Project Management

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **Linear** | Paid (free tier) | Modern issue tracking, sprint planning, roadmaps | [linear.app](https://linear.app) |
| **Plane** | Open Source | Linear alternative — self-hostable, full project management | [github.com/makeplane/plane](https://github.com/makeplane/plane) |
| **Taiga** | Open Source | Agile project management with Scrum/Kanban | [taiga.io](https://www.taiga.io/) |
| **OpenProject** | Open Source | Traditional project management, Gantt charts, time tracking | [openproject.org](https://www.openproject.org/) |
| **Focalboard** | Open Source | Trello/Notion-like task boards, self-hosted | [github.com/mattermost/focalboard](https://github.com/mattermost/focalboard) |
| **Huly** | Open Source | All-in-one project management + CRM + HR | [github.com/hcengineering/huly-platform](https://github.com/hcengineering/huly-platform) |
| **Dependency Track** | Open Source | Component analysis — tracks third-party risk | [dependencytrack.org](https://dependencytrack.org/) |
| **Logseq** | Open Source | Knowledge management, task tracking, whiteboards | [logseq.com](https://logseq.com/) |
| **Outline** | Open Source | Team knowledge base, documentation hub | [github.com/outline/outline](https://github.com/outline/outline) |

---

## 02 — Design & Brainstorming

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **Excalidraw** | Open Source | Virtual whiteboard for diagrams and brainstorming | [excalidraw.com](https://excalidraw.com/) |
| **tldraw** | Open Source | Infinite canvas whiteboard, embeddable | [tldraw.com](https://tldraw.com/) |
| **Penpot** | Open Source | Figma alternative — design and prototyping | [penpot.app](https://penpot.app/) |
| **Mermaid** | Open Source | Diagram from markdown (flowcharts, sequence, Gantt) | [mermaid.js.org](https://mermaid.js.org/) |
| **Diagrams.net** | Open Source | Draw.io successor — UML, network, architecture diagrams | [diagrams.net](https://www.diagrams.net/) |
| **NocoDB** | Open Source | Airtable alternative — turn any DB into a spreadsheet | [github.com/nocodb/nocodb](https://github.com/nocodb/nocodb) |
| **JSON Crack** | Open Source | Visualize JSON/XML/YAML as graphs | [jsoncrack.com](https://jsoncrack.com/) |

---

## 03 — Security & Pentesting

### Automated Scanners

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **OWASP ZAP** | Open Source | Web app scanner, active/passive scanning, API fuzzing | [zaproxy.org](https://www.zaproxy.org/) |
| **Semgrep** | Open Source | SAST rules engine — find bug patterns in code | [semgrep.dev](https://semgrep.dev/) |
| **CodeQL** | Free (public repos) | GitHub's semantic code analysis engine | [github.com/github/codeql](https://github.com/github/codeql) |
| **SonarQube** | Open Source (community) | Continuous code quality and security inspection | [sonarsource.com](https://www.sonarsource.com/products/sonarqube/) |
| **Nuclei** | Open Source | Fast vulnerability scanner with YAML templates | [github.com/projectdiscovery/nuclei](https://github.com/projectdiscovery/nuclei) |
| **Trivy** | Open Source | All-in-one vulnerability scanner (files, repos, containers, k8s) | [github.com/aquasecurity/trivy](https://github.com/aquasecurity/trivy) |
| **Grype** | Open Source | Container and filesystem vulnerability scanner | [github.com/anchore/grype](https://github.com/anchore/grype) |
| **OpenVAS** | Open Source | Full network vulnerability scanner | [greenbone.net](https://www.greenbone.net/) |

### Secret Detection

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **gitleaks** | Open Source | Detect hardcoded secrets in git repos | [github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) |
| **trufflehog** | Open Source | Deep secret scanning (git, S3, files) | [github.com/trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog) |

### Dependency Scanning

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **Dependabot** | Free (GitHub) | Automated dependency updates + vulnerability alerts | Built into GitHub |
| **Renovate** | Open Source | Multi-platform dependency update bot | [github.com/renovatebot/renovate](https://github.com/renovatebot/renovate) |
| **npm audit** | Built-in | Node.js dependency vulnerability check | `npm audit` |
| **pip-audit** | Open Source | Python dependency vulnerability scanner | [pypi.org/project/pip-audit/](https://pypi.org/project/pip-audit/) |
| **cargo audit** | Open Source | Rust dependency vulnerability scanner | `cargo audit` |
| **govulncheck** | Open Source | Go vulnerability checker | [go.dev/security/vuln/](https://go.dev/security/vuln/) |

### Human Pentesting Platforms

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **HackerOne** | Paid (free to start) | Bug bounty + pentest-as-a-service | [hackerone.com](https://www.hackerone.com/) |
| **Bugcrowd** | Paid | Bug bounty + managed pentests | [bugcrowd.com](https://www.bugcrowd.com/) |
| **Intigriti** | Paid | European bug bounty platform | [intigriti.com](https://www.intigriti.com/) |
| **Synack** | Paid | Vetted researcher pentest teams | [synack.com](https://www.synack.com/) |

### API Security

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **FFUF** | Open Source | Fast web fuzzer for API endpoints | [github.com/ffuf/ffuf](https://github.com/ffuf/ffuf) |
| **HTTPie** | Open Source | User-friendly curl alternative for API testing | [httpie.io](https://httpie.io/) |
| **Bruno** | Open Source | Postman/Insomnia alternative — offline-first API client | [github.com/usebruno/bruno](https://github.com/usebruno/bruno) |
| **Hoppscotch** | Open Source | Lightweight API testing in the browser | [hoppscotch.io](https://hoppscotch.io/) |
| **Mitmproxy** | Open Source | Interactive HTTPS proxy for inspecting traffic | [mitmproxy.org](https://mitmproxy.org/) |

---

## 04 — Development & Testing

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **Vitest** | Open Source | Blazing-fast unit test framework (Vite-native) | [vitest.dev](https://vitest.dev/) |
| **Playwright** | Open Source | Cross-browser E2E testing (Chromium, Firefox, WebKit) | [playwright.dev](https://playwright.dev/) |
| **Cypress** | Open Source | Developer-friendly E2E testing | [cypress.io](https://www.cypress.io/) |
| **Storybook** | Open Source | Component-driven UI development and testing | [storybook.js.org](https://storybook.js.org/) |
| **Sentry** | Open Source + Paid | Error tracking and performance monitoring | [sentry.io](https://sentry.io/) |
| **Husky** | Open Source | Git hooks made easy | [github.com/typicode/husky](https://github.com/typicode/husky) |
| **lint-staged** | Open Source | Run linters on git staged files | [github.com/lint-staged/lint-staged](https://github.com/okonet/lint-staged) |
| **ESLint** | Open Source | Pluggable JavaScript/TypeScript linter | [eslint.org](https://eslint.org/) |
| **Prettier** | Open Source | Opinionated code formatter | [prettier.io](https://prettier.io/) |
| **Turborepo** | Open Source | Monorepo build system (cache + parallel) | [turbo.build](https://turbo.build/) |
| **Nx** | Open Source | Extensible monorepo tooling | [nx.dev](https://nx.dev/) |
| **Act** | Open Source | Run GitHub Actions locally | [github.com/nektos/act](https://github.com/nektos/act) |
| **Dagger** | Open Source | CI/CD as code — run anywhere | [dagger.io](https://dagger.io/) |
| **Earthly** | Open Source | CI/CD build system with Docker-like syntax | [earthly.dev](https://earthly.dev/) |

---

## 05 — Databases & Storage

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **Supabase** | Open Source | Firebase alternative — PostgreSQL + realtime + auth | [supabase.com](https://supabase.com/) |
| **Appwrite** | Open Source | Backend-as-a-Service — DB, auth, storage, functions | [appwrite.io](https://appwrite.io/) |
| **Drizzle** | Open Source | TypeScript ORM — lightweight, type-safe | [orm.drizzle.team](https://orm.drizzle.team/) |
| **Prisma** | Open Source | Type-safe ORM with auto-generated queries | [prisma.io](https://www.prisma.io/) |
| **MinIO** | Open Source | S3-compatible object storage | [min.io](https://min.io/) |
| **Valkey** | Open Source | Redis alternative (open-source fork) | [valkey.io](https://valkey.io/) |
| **KeyDB** | Open Source | Multi-threaded Redis-compatible DB | [github.com/Snapchat/KeyDB](https://github.com/Snapchat/KeyDB) |
| **SurrealDB** | Open Source | Multi-model DB (SQL + graph + documents) | [surrealdb.com](https://surrealdb.com/) |

---

## 06 — Monitoring & Analytics

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **Grafana** | Open Source | Metrics visualization and alerting | [grafana.com](https://grafana.com/) |
| **Prometheus** | Open Source | Time-series monitoring system | [prometheus.io](https://prometheus.io/) |
| **Uptime Kuma** | Open Source | Self-hosted uptime monitoring | [github.com/louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) |
| **Better Stack** | Paid (free tier) | Uptime monitoring + logging + incident management | [betterstack.com](https://betterstack.com/) |
| **PostHog** | Open Source | Product analytics — self-host or cloud | [posthog.com](https://posthog.com/) |
| **Plausible** | Open Source | Privacy-friendly web analytics | [plausible.io](https://plausible.io/) |
| **Umami** | Open Source | Simple, fast web analytics | [umami.is](https://umami.is/) |
| **Matomo** | Open Source | Google Analytics alternative (self-hosted) | [matomo.org](https://matomo.org/) |
| **GlitchTip** | Open Source | Sentry-compatible error tracking (self-hosted) | [glitchtip.com](https://glitchtip.com/) |
| **Highlight** | Open Source | Full-stack monitoring (errors, sessions, logs) | [highlight.io](https://www.highlight.io/) |
| **HyperDX** | Open Source | Datadog alternative — logs, traces, metrics | [hyperdx.io](https://www.hyperdx.io/) |
| **Netdata** | Open Source | Real-time infrastructure monitoring | [netdata.cloud](https://www.netdata.cloud/) |

---

## 07 — Deployment & DevOps

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **Coolify** | Open Source | Heroku/Vercel alternative — self-hosted PaaS | [coolify.io](https://coolify.io/) |
| **CapRover** | Open Source | Self-hosted PaaS with simple CLI | [caprover.com](https://caprover.com/) |
| **Dokku** | Open Source | Mini-Heroku on your own server | [dokku.com](https://dokku.com/) |
| **Portainer** | Open Source | Docker/K8s management UI | [portainer.io](https://www.portainer.io/) |
| **K3s** | Open Source | Lightweight Kubernetes for edge/IoT/ARM | [k3s.io](https://k3s.io/) |
| **K9s** | Open Source | Terminal UI for managing Kubernetes | [k9scli.io](https://k9scli.io/) |
| **Lens** | Open Source (core) | Kubernetes IDE — cluster management | [k8slens.dev](https://k8slens.dev/) |
| **Terraform** | Open Source | Infrastructure as Code (any provider) | [terraform.io](https://www.terraform.io/) |
| **OpenTofu** | Open Source | Terraform fork (Linux Foundation) | [opentofu.org](https://opentofu.org/) |
| **Pulumi** | Open Source | Infrastructure as Code with real languages (TS, Python, Go) | [pulumi.com](https://www.pulumi.com/) |
| **Ansible** | Open Source | Configuration management and automation | [ansible.com](https://www.ansible.com/) |
| **NixOS** | Open Source | Declarative OS configuration and package management | [nixos.org](https://nixos.org/) |

---

## 08 — Learning & Reference

| Tool | Type | Description | Link |
|------|------|-------------|------|
| **OWASP Top 10** | Free | Web application security risks (updated 2021) | [owasp.org/Top10](https://owasp.org/www-project-top-ten/) |
| **OWASP ASVS** | Free | Application Security Verification Standard — detailed checklist | [owasp.org/ASVS](https://owasp.org/www-project-application-security-verification-standard/) |
| **MITRE ATT&CK** | Free | Knowledge base of adversary tactics and techniques | [attack.mitre.org](https://attack.mitre.org/) |
| **Roadmap.sh** | Free | Developer roadmaps for every role | [roadmap.sh](https://roadmap.sh/) |
| **Learn X in Y Minutes** | Free | Quick language/framework overviews | [learnxinyminutes.com](https://learnxinyminutes.com/) |
| **DevDocs** | Free | API documentation browser (offline-capable) | [devdocs.io](https://devdocs.io/) |
| **ExplainShell** | Free | Break down shell commands into explanations | [explainshell.com](https://explainshell.com/) |
| **Regex101** | Free | Regex tester with full explanation | [regex101.com](https://regex101.com/) |

---

## Contributing

This catalog is community-maintained. To add a tool:

1. **Check it's not already listed** — search this file first
2. **Verify it's actively maintained** — no dead projects
3. **Open a PR** with the addition following the same table format
4. **Include**: Tool name, type (Open Source / Free / Paid), one-line description, link

**Guidelines:**
- Prefer open-source tools when equal alternatives exist
- Include both free and paid — different budgets need different tools
- Keep descriptions factual ("fast" not "the fastest")
- Link to the official site or GitHub repo, not a blog post
- Tools must have been updated within the last 2 years

See `CONTRIBUTING.md` for full guidelines.
