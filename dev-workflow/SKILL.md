---
name: dev-workflow
description: End-to-end development workflow using Linear tickets, Ralph (autonomous coding agent), and Cursor Bug Bot. Use when assigned a ticket, asked to implement a feature, fix a bug, or work on any Linear issue. Triggers on ticket IDs (e.g. DEN-381), "work on", "implement", "build", or references to Linear tickets.
---

# Dev Workflow

Deterministic development flow: Ticket → PRD → Ralph → Bug Bot loop → QA handoff.

## Prerequisites

1. **Non-root dev user** — Claude Code refuses `--dangerously-skip-permissions` as root. All development work (git, file editing, ralph, claude code) must run as a dedicated non-root user (e.g. `dev`). Setup:
   - Project files owned by this user (`chown -R dev:dev /projects/`)
   - `gh auth login` completed (needed for push + PR creation)
   - `claude` CLI installed and authenticated (OAuth)
   - Root is only for system-level tasks (apt, services, openclaw)

2. **Ralph installed** — `bun add github:free-energy-studio/ralph` in the target project. Postinstall handles `.gitignore` and `/prd` skill setup. If postinstall is blocked, run `bunx ralph-init`.

Verify: `ls node_modules/ralph/ralph.js` and `.claude/skills/prd/` exists (symlink).

## Flow

### 1. Discovery & Q/A

Before writing any code, understand the problem:

- **Scope** — What's in, what's out?
- **Existing patterns** — How does the codebase handle similar features?
- **Dependencies** — Does this touch other features or require migrations?
- **Edge cases** — What could go wrong? Empty states, permissions, error handling?
- **UX expectations** — Any specific UI patterns, copy, or interactions expected?

**How to research:**
1. Explore relevant code — schemas, routes, components, tests
2. Check related tickets or PRs for context
3. Ask the assigner specific questions — don't guess on ambiguous requirements

**When to move on:** When scope is clear, questions are answered, and you could explain the task to another developer.

### 2. Create or Update Ticket

Every task requires a Linear ticket with enough detail that a developer with zero context could implement it.

- **No ticket exists?** Create one with: what, why, acceptance criteria, edge cases, dependencies
- **Ticket exists but vague?** Update it with findings from discovery
- Move ticket to **To Do**

### 3. Generate PRD

In Claude Code (in the project directory):

```
/prd TICKET-ID
```

This creates `.ralph/prd.json` with atomic user stories. Review the output — stories should be small (1-3 files each), independently verifiable, and ordered by dependency.

If `/prd` command is not available, run `bunx ralph-init` to set up the skill symlink.

### 4. Run Ralph

```bash
bun node_modules/ralph/ralph.js 25
```

- Ralph creates a feature branch, opens a draft PR, implements stories sequentially
- Monitor: `tail -f .ralph/progress.txt`
- Ralph marks the PR ready when all stories pass
- Move ticket to **In Progress** when Ralph starts

### 5. Bug Bot Loop

After Ralph completes and the PR is ready for review:

1. Wait for Cursor Bug Bot to run (2-10 minutes) — it posts PR comments with bugs
2. Check PR comments: `gh pr view <number> --json comments,reviews`
3. If Bug Bot found issues:
   - Create a new `.ralph/prd.json` addressing the Bug Bot comments as user stories
   - Run Ralph again: `bun node_modules/ralph/ralph.js 25`
   - Repeat until Bug Bot produces no new comments
4. If clean — proceed to step 5

### 6. QA Handoff

When Bug Bot passes clean:

1. Move ticket to **QA Review** in Linear
2. Assign to the reviewer (typically Sam)
3. Notify them the PR is ready
4. **Do not merge** — reviewer merges after approval

## Decision Points

- **Ticket too vague?** → Ask for clarification before creating PRD. Don't guess.
- **Ralph fails repeatedly on a story?** → Read progress.txt for error patterns. May need to manually fix and re-run.
- **Bug Bot finds architectural issues?** → Flag to reviewer — may need design discussion before fixing.
- **PR has merge conflicts?** → Rebase onto base branch before re-running Ralph.

## Linear Status Map

| Stage | Linear Status |
|-------|--------------|
| PRD generation | To Do |
| Ralph running | In Progress |
| Bug Bot loop | Code Review |
| Awaiting human review | QA Review |
| Approved + merged | Done |
