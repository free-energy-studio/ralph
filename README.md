# Ralph

A skills repo for AI-powered development workflows. Three skills that work together: generate PRDs, execute them autonomously, and orchestrate the full dev lifecycle.

## Skills

### `/ralph-prd` — PRD Generator
Generate atomic user stories from Linear tickets or descriptions. Claude Code slash command that creates `.ralph/prd.json`.

```bash
/ralph-prd DEN-381        # from Linear ticket
/ralph-prd "Add auth"     # from description
```

### `/ralph` — Autonomous Coding Agent
Loops Claude Code over user stories, implementing them one at a time with commits and PRs.

```bash
bun ralph 25        # run with 25 iteration max
```

### `/dev-workflow` — Development Orchestration
End-to-end flow: Ticket → PRD → Ralph → Bug Bot loop → QA handoff. Guides the full lifecycle from Linear ticket to merged PR.

## Installation

```bash
bun add github:free-energy-studio/ralph
```

Postinstall automatically:
- Adds `.ralph/` to `.gitignore`
- Symlinks the `/ralph-prd` skill into `.claude/skills/ralph-prd/`

Manual setup: `bunx ralph-init`

### Requirements

- [Bun](https://bun.sh)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) — authenticated
- [GitHub CLI](https://cli.github.com/) (`gh`) — authenticated

## Workflow

```
Ticket → /ralph-prd → bun ralph → Bug Bot fix loop → QA Review → Merge
```

1. **Ticket** — Linear ticket with full context
2. **PRD** — `/ralph-prd TICKET-ID` generates atomic user stories
3. **Ralph** — `bun ralph 25` implements and opens PR
4. **Bug Bot** — Cursor Bug Bot reviews, fix comments with another Ralph loop
5. **QA** — Move to QA Review, assign reviewer
6. **Merge** — Reviewer merges

## Repo Structure

```
ralph-prd/                # PRD generation (Claude Code skill)
  SKILL.md
  README.md
ralph/              # Agent loop + setup scripts
  SKILL.md
  scripts/
    ralph.js        # The autonomous agent loop
    init.js         # Project setup (gitignore + symlinks)
dev-workflow/       # Orchestration workflow
  SKILL.md
  references/
    prd-format.md
```
