# PRD Builder for Ralph

You are helping the user build a Product Requirements Document (PRD) for the Ralph autonomous agent to work on.

## Input Handling

The user will provide either:
1. A Linear ticket ID (e.g., "LIN-123" or just "123")
2. A direct description as a string

## Process

### Phase 1: Clean Up Existing Files

Before generating a new PRD, check for existing files:

1. Check if `ralph/prd.json` exists
2. Check if `ralph/progress.json` exists

If either file exists:
- Delete both files (they are a pair and should be regenerated together)
- Inform the user that existing PRD/progress files were removed
- Proceed with fresh generation

### Phase 2: Determine Input Type

Check if the input looks like a Linear ticket ID:
- Matches pattern: `LIN-\d+` or `[A-Z]+-\d+` or just `\d+`
- If yes, fetch the Linear ticket using `mcp__plugin_linear_linear__get_issue`
- Extract: Title, Description, Acceptance criteria, Labels, Project, **Git branch name**
- Use the Linear-provided git branch name as the `branchName` in the PRD
- If no, treat it as a direct description and generate a branch name like `ralph/[feature-name]`

### Phase 3: Discovery

1. **Understand the request** - What feature/fix is being requested?
2. **Explore the codebase** - Find relevant files, patterns, and existing implementations
3. **Ask clarifying questions** - Use AskUserQuestion to clarify:
   - Scope boundaries (what's in/out)
   - Expected behavior
   - Edge cases
   - Dependencies on other features

### Phase 4: Architecture

1. **Identify affected areas**:
   - Database schemas (`packages/core/src/{domain}/{domain}.sql.ts`)
   - Domain logic (`packages/core/src/{domain}/index.ts`)
   - API handlers (`packages/functions/src/{domain}/`)
   - Dashboard routes (`packages/dashboard/app/routes/`)
   - Dashboard components (`packages/dashboard/app/components/{feature}/`)
   - Flow nodes (`packages/core/src/{domain}/nodes/`)
   - Queue handlers (`packages/queue/src/`)

2. **Map dependencies** - What needs to be built first?

### Phase 5: Story Breakdown

**CRITICAL: Stories must be ATOMIC**

Each story should be:

- **Single responsibility** - One thing only
- **Independently verifiable** - Can run typecheck after completion
- **Small** - Should take 1-3 files to change
- **Clear acceptance criteria** - Specific, testable conditions

**Story Granularity Examples:**

BAD (too big):

```json
{
  "title": "Implement calendar syncing feature",
  "acceptanceCriteria": ["Calendar syncs work"]
}
```

GOOD (atomic):

```json
{
  "title": "Add calendarEvents table schema",
  "acceptanceCriteria": [
    "Create `packages/core/src/calendar/calendar.sql.ts`",
    "Define pgTable with: id (uuid), organizationId, teamId, title, startTime, endTime, externalId",
    "Use timestampColumns helper for audit fields",
    "Export Zod schema using drizzle-zod",
    "Typecheck passes (`npm run typecheck:core`)"
  ]
}
```

### Phase 6: Generate PRD

Create the PRD with this structure:

```json
{
  "branchName": "[Linear git branch name OR ralph/feature-name]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Concise action: verb + noun]",
      "acceptanceCriteria": [
        "Specific file to create/modify",
        "Specific fields/functions to add",
        "Specific behavior to implement",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "Optional context for Ralph"
    }
  ]
}
```

Write the PRD to `ralph/prd.json`.

### Phase 7: Summary

Provide a summary explaining:
1. The overall approach
2. Why stories are ordered this way
3. Any assumptions made
4. Number of stories created with IDs and titles
5. Suggested first story to start with
6. Next steps (run `./ralph/ralph.sh 25`)

## Story Templates

### Database Schema Story

```json
{
  "title": "Add [entity] table schema",
  "acceptanceCriteria": [
    "Create `packages/core/src/[domain]/[domain].sql.ts`",
    "Define pgTable with fields: id (uuid primary key), organizationId, teamId, [domain fields]",
    "Use timestampColumns helper for createdAt, updatedAt, deletedAt",
    "Add appropriate indexes and foreign key constraints",
    "Export Zod schemas using createInsertSchema/createSelectSchema from drizzle-zod",
    "Typecheck passes (`npm run typecheck:core`)"
  ]
}
```

### Domain Model Story

```json
{
  "title": "Create [entity] domain model",
  "acceptanceCriteria": [
    "Create `packages/core/src/[domain]/index.ts`",
    "Implement core business logic functions",
    "Use Drizzle ORM for database queries",
    "Export public API from index.ts",
    "Typecheck passes (`npm run typecheck:core`)"
  ]
}
```

### Hono API Handler Story

```json
{
  "title": "Create [entity].[action] API endpoint",
  "acceptanceCriteria": [
    "Add route handler in `packages/functions/src/[domain]/`",
    "Define OpenAPI spec with Zod schemas",
    "Implement endpoint logic using domain model from @safetyradar/core",
    "Return typed JSON response",
    "Typecheck passes (`npm run typecheck:functions`)"
  ]
}
```

### Dashboard Route Story

```json
{
  "title": "Create [feature] dashboard route",
  "acceptanceCriteria": [
    "Create route file in `packages/dashboard/app/routes/`",
    "Use flat-routes naming convention",
    "Implement loader/action as needed",
    "Wire up TanStack Query for data fetching",
    "Typecheck passes (`npm run typecheck:dashboard`)"
  ]
}
```

### Dashboard Component Story

```json
{
  "title": "Create [component] UI component",
  "acceptanceCriteria": [
    "Create component in `packages/dashboard/app/components/[feature]/`",
    "Use TailwindCSS for styling",
    "Integrate with Jotai atoms if state management needed",
    "Handle loading/error states",
    "Typecheck passes (`npm run typecheck:dashboard`)"
  ]
}
```

### Flow Node Story

```json
{
  "title": "Create [nodeType] flow node",
  "acceptanceCriteria": [
    "Create node definition in `packages/core/src/[domain]/nodes/`",
    "Define configSchema and outputSchema using Zod",
    "Implement run() method with lifecycle hooks",
    "Register node in domain registry",
    "Typecheck passes (`npm run typecheck:core`)"
  ]
}
```

### Queue Job Story

```json
{
  "title": "Create [jobName] queue handler",
  "acceptanceCriteria": [
    "Add job handler in `packages/queue/src/`",
    "Define job payload schema with Zod",
    "Implement job processing logic",
    "Handle errors and retries appropriately",
    "Typecheck passes"
  ]
}
```

### Integration Story

```json
{
  "title": "Connect [component] to [entity] API",
  "acceptanceCriteria": [
    "Use TanStack Query hooks for data fetching",
    "Handle loading/error states with appropriate UI feedback",
    "Display data in component",
    "Typecheck passes"
  ]
}
```

## Ordering Rules

1. **Database first** - Schema must exist before domain logic
2. **Core before functions** - Domain models before API handlers
3. **Backend before frontend** - API must exist before dashboard calls it
4. **Types before implementation** - Shared types/schemas before they're used
5. **Core before edge cases** - Happy path before error handling
6. **Flow nodes after schemas** - Node definitions after underlying data structures

## Error Handling

- If Linear ticket not found, ask user to verify the ID
- If description is too vague, ask clarifying questions
- If existing prd.json or progress.json files are found, they will be automatically removed (inform the user)

## Example Invocations

```bash
# Using Linear ticket
/prd LIN-123

# Using direct description
/prd "Add user profile page with avatar upload"

# Using just ticket number
/prd 123
```
