# Contributing

## Why Contribute?

This blueprint is extracted from a real production system and battle-tested patterns. But no single project covers everything. Your insights — from your language, your domain, your mistakes — make this better for everyone.

**The goal:** A community-curated collection of engineering patterns that any LLM can use to guide any developer through building any project, correctly, the first time.

## What Kind of Contributions?

| Type | Examples | Effort |
|------|----------|--------|
| **New pattern** | A pattern from your project that should be in the blueprint | Medium-High |
| **New project-type preset** | mobile-app, microservice, game, data-pipeline, etc. | Low |
| **New universal rule** | Something every project should do (but isn't listed) | Low |
| **Fix typo/clarity** | Better explanations, beginner-friendly rewrites | Very Low |
| **New example** | Runnable demo in Python/Go/Rust/Swift | Medium |
| **New checklist** | Migration, incident response, compliance audit | Low |
| **New lesson learned** | Something that cost you time — write it down so others don't repeat it | Low |
| **Translation** | Blueprint in other languages (Spanish, Mandarin, etc.) | High |
| **Tool integration** | GitHub Action, VS Code extension, CLI plugin | Medium-High |
| **Bug fix** | Dead links, broken references, outdated info | Very Low |

## How to Contribute

### Small changes (typos, clarity, links)

Open an issue describing the change, or directly open a Pull Request:

1. Fork the repo
2. Make your change
3. Open a PR with a clear description of what and why

### New patterns, presets, or examples

1. Open an issue first — describe what you want to add and why it matters
2. Get feedback from maintainers
3. Open a PR with your addition
4. Include tests if adding a runnable example

### Structure guidelines

- **Patterns** go in the appropriate `0X-FOLDER/` directory
- **Presets** go in `02-PROJECT_SETUP/06-project-type-presets.md`
- **Examples** go in `12-APPENDIX/0X-example-NAME/`
- **Lessons** go in `10-LESSONS_LEARNED/0X-topic.md`
- **Checklists** go in `11-CHECKLISTS/0X-name.md`

### Commit conventions

```
type: short description

Longer explanation of what and why.

Co-authored-by: Your Name <email>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `example`

## Code of Conduct

Be respectful. This project is for learners and experts alike. No condescension, no gatekeeping.

**Core principle:** Every contributor was a beginner once. Write for the person who will read this a year from now at 2am, frustrated, trying to figure out why their code doesn't work.

## Questions?

Open a [Discussion](https://github.com/keikworld/master-development-blueprint/discussions) or an Issue.
