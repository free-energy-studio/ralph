# Ralph

Autonomous AI agent loop that implements features using Claude Code. Give it a PRD with user stories, it codes them, commits, and opens a PR.

## Installation

```bash
bun add github:free-energy-studio/ralph
```

On install, Ralph automatically:
- Adds `.ralph/` to `.gitignore`
- Symlinks the `/prd` Claude Code skill into your project

To re-run setup manually:
```bash
bunx ralph-init
```

### Requirements

- [Bun](https://bun.sh)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub CLI](https://cli.github.com/) (`gh`) — authenticated

## Usage

### 1. Generate PRD

In Claude Code:
```
/prd DEN-381        # from Linear ticket
/prd "Add auth"     # from description
```

This creates `.ralph/prd.json` with atomic user stories.

### 2. Run Ralph

```bash
bun ralph 25          # 25 iterations max (default)
bun ralph 5           # shorter run
```

Ralph will:
- Create a feature branch + draft PR
- Implement stories one at a time, committing each
- Mark PR ready when all stories pass

### 3. Monitor

```bash
tail -f .ralph/progress.txt
cat .ralph/prd.json | jq '.userStories[] | {id, passes}'
```

## Development Workflow

Full workflow when used with Linear + Cursor Bug Bot:

```
Ticket → /prd → Ralph → Bug Bot fix loop → QA Review → Merge
```

1. **Ticket** — every task needs a Linear ticket with full context
2. **PRD** — `/prd TICKET-ID` generates atomic user stories
3. **Ralph** — `bun ralph 25` implements and opens PR
4. **Bug Bot** — wait for Cursor Bug Bot (2-10 min), fix any comments with another Ralph loop
5. **QA** — move to QA Review, assign to reviewer
6. **Merge** — reviewer merges

See [DEV-WORKFLOW.md](https://github.com/free-energy-studio/ralph/blob/main/DEV-WORKFLOW.md) for full details.

## PRD Structure

```json
{
  "branchName": "ralph/feature-name",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add user table schema",
      "acceptanceCriteria": [
        "Create users table with id, email, name fields",
        "Add unique index on email",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "Use existing drizzle patterns"
    }
  ]
}
```

**Stories must be atomic** — one responsibility, 1-3 files, independently verifiable.

## How It Works

Each iteration Ralph:
1. Reads `.ralph/prd.json` and `.ralph/progress.txt`
2. Picks highest priority story where `passes: false`
3. Implements that ONE story
4. Runs typecheck/tests
5. Commits: `feat: [ID] - [Title]`
6. Updates prd.json and progress.txt
7. Repeats until done or max iterations

When all stories pass, outputs `<promise>COMPLETE</promise>` and marks PR ready.

## When NOT to Use Ralph

- Exploratory/research work
- Major refactors without clear criteria
- Security-critical code (needs human review)
- Design decisions requiring judgment
