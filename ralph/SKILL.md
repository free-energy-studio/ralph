---
name: ralph
description: Autonomous AI coding agent that implements features from PRDs. Runs Claude Code in a loop, picking up user stories from .ralph/prd.json, implementing them one at a time, committing, and opening PRs. Use when you need to execute a PRD or run the development agent.
---

# Ralph — Autonomous Coding Agent

Implements features by looping Claude Code over atomic user stories from a PRD.

## Prerequisites

- [Bun](https://bun.sh)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) — authenticated via OAuth
- [GitHub CLI](https://cli.github.com/) (`gh`) — authenticated
- Non-root user (Claude Code refuses `--dangerously-skip-permissions` as root)

## Setup

Install in your project:

```bash
bun add github:free-energy-studio/ralph
```

Postinstall runs `ralph-init` which:
- Adds `.ralph/` to `.gitignore`
- Symlinks the `/prd` Claude Code skill into `.claude/skills/prd/`

Manual setup: `bunx ralph-init`

## Usage

### Run Ralph

```bash
bun ralph 25          # 25 iterations max (default)
bun ralph 5           # shorter run
```

### Monitor

```bash
tail -f .ralph/progress.txt
cat .ralph/prd.json | jq '.userStories[] | {id, passes}'
```

## How It Works

Each iteration:
1. Reads `.ralph/prd.json` and `.ralph/progress.txt`
2. Picks highest priority story where `passes: false`
3. Implements that ONE story
4. Runs typecheck/tests
5. Commits: `feat: [ID] - [Title]`
6. Updates prd.json and progress.txt
7. Repeats until done or max iterations

When all stories pass, marks the PR ready and exits.

## Scripts

- `scripts/ralph.js` — The agent loop
- `scripts/init.js` — Project setup (gitignore + skill symlink)

## When NOT to Use

- Exploratory/research work
- Major refactors without clear criteria
- Security-critical code (needs human review)
- Design decisions requiring judgment
