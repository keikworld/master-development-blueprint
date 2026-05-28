# Daily Development Checklist

## Session Start

- [ ] **Read CLAUDE.md** — Refresh project overview, build commands, rules
- [ ] **Read planning.md** — What phase are we in?
- [ ] **Read tasks.md** — What's the active task?
- [ ] **Read LESSONS_LEARNED.md** — Quick scan of recent lessons
- [ ] **Read target file(s)** — Full file before editing, not just the function
- [ ] **Check git status** — Clean branch, or resume work on feature branch

## During Development

- [ ] **Verify before writing** — Read actual source files, don't assume imports
- [ ] **Follow templates** — Router/service templates for new endpoints
- [ ] **Run per-change tests** — `npm test` after each logical change
- [ ] **Update affected tests** — Every code change updates ALL related tests
- [ ] **Write compliance doc** — If >100 LOC new feature

## Before Commit

- [ ] **Read GATES.md** — Verify against 7 non-negotiable rules
- [ ] **Run pre-push agent** — `./scripts/agent @all` (exit 0)
- [ ] **Update planning files** — tasks.md (timestamped), planning.md (% complete)
- [ ] **Update CLAUDE.md/GEMINI.md/.antigravity.md** — If >500 LOC or new patterns
- [ ] **Update AGENTS.md** — If check counts, commands, or paths changed
- [ ] **Write commit message** — Concise, matches repo style

## Session End

- [ ] **Push or stash** — No stale branches
- [ ] **Document session** — tasks.md updated with results
- [ ] **Document lessons** — Any lessons learned added to LESSONS_LEARNED.md
