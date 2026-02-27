---
name: linear
description: Query and manage Linear issues, projects, and team workflows for the Domain team. Use when creating, updating, or searching Linear issues, checking project status, assigning work, or running a standup summary.
metadata:
  {"openclaw":{"requires":{"env":["LINEAR_API_KEY"]}}}
---

# Linear

Manage issues and projects via the official `@linear/sdk`.

Default team: **DOMA** (set via `LINEAR_DEFAULT_TEAM` env var).

## Run

```bash
bun {baseDir}/scripts/linear.ts <command> [args]
```

## Commands

```bash
# Browse
bun {baseDir}/scripts/linear.ts my-issues
bun {baseDir}/scripts/linear.ts team [TEAM_KEY]
bun {baseDir}/scripts/linear.ts teams
bun {baseDir}/scripts/linear.ts issue DOMA-123
bun {baseDir}/scripts/linear.ts search "auth bug"
bun {baseDir}/scripts/linear.ts projects

# Create & update
bun {baseDir}/scripts/linear.ts create "Title" "Description"
bun {baseDir}/scripts/linear.ts update DOMA-123 --title "New title" --description "Full desc" --priority high --status progress
bun {baseDir}/scripts/linear.ts comment DOMA-123 "Comment text"
bun {baseDir}/scripts/linear.ts status DOMA-123 progress
bun {baseDir}/scripts/linear.ts priority DOMA-123 high
bun {baseDir}/scripts/linear.ts assign DOMA-123 Sam

# Overview
bun {baseDir}/scripts/linear.ts standup
```

## Status values
`todo` · `progress` · `review` · `done` · `blocked` · `backlog` · `cancelled`

## Priority values
`urgent` · `high` · `medium` · `low` · `none`

## Notes
- For `create` and `update`, descriptions support full markdown — no escaping needed
- `update` supports multiple flags in one call: `--title --description --priority --status --assignee`
- `search` does full-text search across all issues
