# Fork, Run, and Build Your Own Project

## You Have 3 Options

Choose the one that fits what you're doing:

| Option | When to Use | What You Get |
|--------|-------------|-------------|
| **Option A: Use as Template** | You want your own copy of the blueprint to customize | A private or public repo on your GitHub with your own modifications |
| **Option B: `init.sh` + LLM** | You want to build a NEW project using the blueprint as a guide | A fresh project skeleton with the right structure, ready for the LLM to guide you through all 8 phases |
| **Option C: Fork + Contribute** | You want to help improve the blueprint itself | A fork where you can add patterns, fix docs, suggest presets, and open PRs |

---

## Option A: Use as a Template (Recommended for New Projects)

> **Note:** This repo is set as a GitHub template repository. That means you can click **"Use this template"** on the GitHub page to create your own copy with a clean commit history. If you're forking to build your own project, this is the way to go.

### On GitHub (web):

1. Go to [github.com/keikworld/master-development-blueprint](https://github.com/keikworld/master-development-blueprint)
2. Click the green **"Use this template"** button
3. Name your repo (e.g., `my-project`)
4. Choose public or private
5. Click **"Create repository from template"**

You now have your own copy with the full commit history removed — a clean start.

### On the command line:

```bash
npx create-blueprint-app my-project
cd my-project
npm install
npm test          # If it's a web-api project with the example test suite
```

This uses the npm package `create-blueprint-app` — it clones the latest template, runs `init.sh`, and your project is ready to go.

### Clone and go:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Or start fresh with init.sh:

```bash
bash init.sh
# Follow the prompts: project name, type, language, package manager
# Creates a clean project skeleton at ./YOUR-PROJECT-NAME/
```

### Then give it to an LLM:

```
Read MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md first,
then read my project files and start the discovery phase.
```

---

## Option B: Just Build a Project (No Fork Needed)

You don't need to fork anything. The `init.sh` script creates a self-contained project:

```bash
# From anywhere:
curl -L https://raw.githubusercontent.com/keikworld/master-development-blueprint/main/init.sh | bash
# Or clone just the scripts:
git clone --depth 1 https://github.com/keikworld/master-development-blueprint.git ~/blueprint-tmp
bash ~/blueprint-tmp/init.sh
rm -rf ~/blueprint-tmp
```

Then push your new project to your own repo:

```bash
cd YOUR-PROJECT-NAME
git remote add origin https://github.com/YOUR_USERNAME/YOUR_PROJECT.git
git push -u origin main
```

---

## Option C: Fork to Contribute

If you want to improve the blueprint itself — add patterns, fix docs, suggest presets — fork it:

```bash
# On GitHub: click "Fork" on the repo
# Then clone your fork:
git clone https://github.com/YOUR_USERNAME/master-development-blueprint.git
cd master-development-blueprint
git remote add upstream https://github.com/keikworld/master-development-blueprint.git
```

Make your changes, push to your fork, and open a Pull Request. See `CONTRIBUTING.md` for guidelines.

---

## What Goes in Your Repo vs What Stays Here

| Should Be in YOUR Project Repo | Stays in the Blueprint Repo |
|--------------------------------|----------------------------|
| Your actual source code | The MASTER_DEVELOPMENT_BLUEPRINT/ directory (reference only) |
| Your policies/ | The 8-phase LLM protocol |
| Your tests/ | Pattern libraries |
| Your deployed app | Project-type presets |
| Your README, CLAUDE.md | Contributing guidelines |

**The blueprint is a guide, not a dependency.** You don't import it. You consume it through the LLM during setup, and your project becomes self-contained.

---

## Quick-Start: Weekend Project Workflow

See `WEEKEND_PROJECT.md` for the streamlined "Saturday morning to Sunday night" path:

```
Saturday 9am:  init.sh + LLM Discovery (30 min)
Saturday 10am: Policies + Patterns (30 min)
Saturday 11am: First feature (tests first) (3 hours)
Saturday 3pm:  Second feature (2 hours)
Saturday 6pm:  Core done
Sunday 10am:   Polish + Security quick-check (2 hours)
Sunday 1pm:    Deploy (1 hour)
Sunday 3pm:    Done. Ship.
```
