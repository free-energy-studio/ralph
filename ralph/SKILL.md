---
name: ralph
description: End-to-end development workflow — generate a PRD from a Linear ticket, run Ralph (autonomous coding agent), and fix Bug Bot comments. Use when assigned a ticket, asked to implement a feature, fix a bug, or work on any Linear issue. Triggers on ticket IDs (e.g. DEN-381, LIN-123), "work on", "implement", "build", or references to Linear tickets.
---

# Ralph — Ticket to PR

Deterministic development flow: Ticket → PRD → Ralph → Bug Bot loop → QA handoff.

## Prerequisites

1. **Ralph installed globally** — Install via the skills repo:
   ```bash
   # One-liner from any machine
   curl -fsSL https://raw.githubusercontent.com/free-energy-studio/skills/main/install.sh | bash -s ralph

   # Or manually
   git clone https://github.com/free-energy-studio/skills.git ~/.local/share/free-energy-skills
   cd ~/.local/share/free-energy-skills/ralph && bun install && bun link
   ```
   Verify: `which ralph` should return a path.

2. **Claude Code CLI** — Installed and authenticated (`claude` in PATH)

3. **GitHub CLI** — Authenticated (`gh auth status`)

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

This is the core PRD generation step. The user provides either:
1. A Linear ticket ID (e.g., "LIN-123" or just "123")
2. A direct description as a string

#### Phase 1: Clean Up Existing Files

Before generating a new PRD, check for existing files:

1. Check if `.ralph/prd.json` exists
2. Check if `.ralph/progress.txt` exists

If either file exists:
- Delete both files (they are a pair and should be regenerated together)
- Inform the user that existing PRD/progress files were removed
- Proceed with fresh generation

#### Phase 2: Determine Input Type

Check if the input looks like a Linear ticket ID:
- Matches pattern: `LIN-\d+` or `[A-Z]+-\d+` or just `\d+`
- If yes, fetch the Linear ticket using `mcp__plugin_linear_linear__get_issue`
- Extract: Title, Description, Acceptance criteria, Labels, Project, **Git branch name**
- Use the Linear-provided git branch name as the `branchName` in the PRD
- If no, treat it as a direct description and generate a branch name like `ralph/[feature-name]`

#### Phase 3: Discovery

1. **Understand the request** - What feature/fix is being requested?
2. **Explore the codebase** - Find relevant files, patterns, and existing implementations
3. **Ask clarifying questions** if scope is ambiguous

#### Phase 4: Architecture

1. **Identify affected areas** - schemas, domain logic, API handlers, routes, components
2. **Map dependencies** - What needs to be built first?

#### Phase 5: Story Breakdown

**CRITICAL: Stories must be ATOMIC**

- **Single responsibility** - One thing only
- **Independently verifiable** - Can run typecheck after completion
- **Small** - 1-3 files to change
- **Clear acceptance criteria** - Specific, testable conditions

BAD: `"Implement calendar syncing feature"` → too big

GOOD:
```json
{
  "title": "Add calendarEvents table schema",
  "acceptanceCriteria": [
    "Create `packages/core/src/calendar/calendar.sql.ts`",
    "Define pgTable with: id, organizationId, teamId, title, startTime, endTime, externalId",
    "Export Zod schema using drizzle-zod",
    "Typecheck passes"
  ]
}
```

#### Phase 6: Generate PRD

Write `.ralph/prd.json`:

```json
{
  "branchName": "[Linear git branch name OR ralph/feature-name]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Concise action: verb + noun]",
      "acceptanceCriteria": ["..."],
      "priority": 1,
      "passes": false,
      "notes": "Optional context for Ralph"
    }
  ]
}
```

#### Phase 7: Summary

1. Overall approach
2. Story ordering rationale
3. Assumptions made
4. Story count with IDs and titles
5. Next steps: `bun ralph 25`

#### Ordering Rules

1. Database first → domain logic → API handlers → frontend
2. Types/schemas before implementation
3. Happy path before edge cases

### 4. Run Ralph

```bash
ralph 25
```

Ralph runs up to 25 iterations, implementing one user story per iteration. It creates a branch, opens a draft PR, and works through each story.

Monitor progress: `tail -f .ralph/progress.txt`

### 5. Bug Bot Fix Loop

After Ralph finishes and the PR is up, run the Bug Bot fixer:

```bash
bugwatch 20
```

This script:
1. Polls the `Cursor Bugbot` check run status on the PR
2. Waits if Bug Bot is still running — won't act prematurely
3. Uses GitHub GraphQL API to find unresolved `cursor[bot]` review threads
4. Spawns Claude to fix each comment, commit, and push
5. Waits for Bug Bot to re-run, then repeats

The loop exits when Bug Bot has **finished running** AND there are no unresolved comments. Once you see "All clean", move on to QA handoff.

### 6. QA Handoff

Once Bug Bot is clean:
1. Move the Linear ticket to **QA Review**
2. Mark the PR as ready for review: `gh pr ready`

**Do not merge** — reviewer merges after approval.

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

## Error Handling

- Linear ticket not found → ask user to verify ID
- Description too vague → ask clarifying questions
- Existing prd.json/progress.txt → auto-remove and inform user
