# Ralph

An autonomous AI agent loop that implements features using Claude Code. Ralph takes a PRD (Product Requirements Document) with user stories and iteratively completes them, tracking progress and learnings along the way.

## How It Works

1. You provide a PRD with user stories in `.ralph/prd.json`
2. Ralph runs Claude in a loop, completing one story per iteration
3. After each story, Ralph commits changes and updates progress
4. When all stories pass, Ralph marks the PR ready for review

## Quick Start

### Option 1: Use the /prd Command (Recommended)

1. Generate PRD from Linear ticket: `/prd LIN-123`
2. Or from description: `/prd "Add user authentication"`
3. Run Ralph: `bun ralph.js 25`
4. Monitor progress: `tail -f .ralph/progress.txt`

### Option 2: Manual PRD Creation

1. Create `.ralph/prd.json` with your user stories (see structure below)
2. Run Ralph: `bun ralph.js 25`
3. Monitor progress: `tail -f ralph/progress.txt`

## Installation

Ralph requires [Bun](https://bun.sh) and [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code).

```bash
# Add to your project
bun add github:free-energy-studio/ralph
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "ralph": "github:free-energy-studio/ralph"
  }
}
```

Then run with:

```bash
bun node_modules/ralph/ralph.js 25
```

## /prd Command

The `/prd` skill automatically generates user stories from Linear tickets or descriptions.

**From Linear Ticket:**
```bash
/prd LIN-123
```

**From Description:**
```bash
/prd "Add user profile page with avatar upload"
```

**From Ticket Number:**
```bash
/prd 123
```

The skill will:
1. Detect if input is a Linear ticket or description
2. Fetch Linear ticket details (if applicable)
3. Break down the feature into small, implementable stories
4. Create `.ralph/prd.json` with proper acceptance criteria
5. Assign priorities in logical implementation order

See [.claude/skills/prd/README.md](.claude/skills/prd/README.md) for more details.

## PRD Structure

Create `.ralph/prd.json` with this structure:

```json
{
  "branchName": "ralph/feature-name",
  "userStories": [
    {
      "id": "US-001",
      "title": "Short descriptive title",
      "acceptanceCriteria": [
        "Specific criterion 1",
        "Specific criterion 2",
        "typecheck passes",
        "tests pass"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `branchName` | Git branch Ralph will create/use |
| `id` | Unique identifier (e.g., US-001, US-002) |
| `title` | Short, descriptive name for the story |
| `acceptanceCriteria` | Array of specific, testable requirements |
| `priority` | Lower number = higher priority (Ralph does these first) |
| `passes` | Set to `false` initially, Ralph sets to `true` when complete |
| `notes` | Optional context or implementation hints |

## Critical Success Factors

### 1. Small Stories

Stories MUST fit in one context window.

❌ **Too big:**
```
"Build entire auth system"
```

✅ **Right size:**
```
"Add login form"
"Add email validation"
"Add auth server action"
```

### 2. Explicit Criteria

Be specific and testable. Avoid vague requirements.

❌ **Vague:**
```json
"acceptanceCriteria": [
  "Users can log in"
]
```

✅ **Explicit:**
```json
"acceptanceCriteria": [
  "Email/password fields exist",
  "Validates email format",
  "Shows error on failure",
  "typecheck passes",
  "Verify at localhost:3000/login"
]
```

### 3. Fast Feedback Loops

Ralph needs fast validation:

- Always include `"typecheck passes"` in criteria
- Always include `"tests pass"` if you have tests
- Without these, broken code compounds

### 4. Learnings Compound

By story 10, Ralph knows patterns from stories 1-9.

- Ralph appends to `progress.txt` after each story
- Codebase patterns accumulate at the top
- Later stories benefit from earlier learnings

### 5. AGENTS.md Updates

Ralph updates `AGENTS.md` when it discovers reusable patterns:

✅ **Good additions:**
- "When modifying X, also update Y"
- "This module uses pattern Z"
- "Tests require dev server running"

❌ **Don't add:**
- Story-specific details
- Temporary notes
- Info already in progress.txt

## Example PRD

```json
{
  "branchName": "ralph/user-auth",
  "userStories": [
    {
      "id": "US-001",
      "title": "Create user login form",
      "acceptanceCriteria": [
        "Form has email and password fields",
        "Email field validates format",
        "Password field is masked",
        "Submit button exists",
        "typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "Use existing form components from /components/ui"
    },
    {
      "id": "US-002",
      "title": "Add login form validation",
      "acceptanceCriteria": [
        "Shows error when email is invalid",
        "Shows error when password is too short",
        "Disables submit when form is invalid",
        "Clears errors on input change",
        "typecheck passes"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-003",
      "title": "Create login server action",
      "acceptanceCriteria": [
        "Server action accepts email and password",
        "Validates credentials against database",
        "Returns success/error status",
        "Sets session cookie on success",
        "typecheck passes",
        "tests pass"
      ],
      "priority": 3,
      "passes": false,
      "notes": "Follow existing server action pattern in /app/actions"
    }
  ]
}
```

## When NOT to Use Ralph

- **Exploratory work** - Ralph needs clear goals
- **Major refactors** - Without explicit criteria
- **Security-critical code** - Needs human review
- **Anything needing human judgment** - Design decisions, etc.

## Running Ralph

```bash
# Standard run (25 iterations max)
bun ralph.js 25

# Shorter run for testing
bun ralph.js 5
```

Ralph will:
- Create a git branch from `branchName`
- Open a draft PR
- Complete stories one at a time
- Commit after each story: `feat: [ID] - [Title]`
- Mark PR ready when all stories pass

## Monitoring Progress

```bash
# Watch progress in real-time
tail -f .ralph/progress.txt

# Check which stories are complete
cat .ralph/prd.json | jq '.userStories[] | {id, passes}'

# See commits
git log --oneline -10
```

## Common Gotchas

### Idempotent Migrations
```sql
ADD COLUMN IF NOT EXISTS email TEXT;
```

### Interactive Prompts
```bash
echo -e "\n\n\n" | npm run db:generate
```

### Schema Changes
After editing schema, check:
- Server actions
- UI components
- API routes

**Fixing related files is OK** - If typecheck requires other changes, make them. That's not scope creep.

## How Ralph Works

Each iteration, Ralph:
1. Reads `.ralph/prd.json` for user stories
2. Reads `.ralph/progress.txt` for codebase learnings
3. Picks the highest priority story where `passes: false`
4. Implements that ONE story
5. Runs typecheck and tests
6. Commits with format: `feat: [ID] - [Title]`
7. Updates `prd.json` to mark story as `passes: true`
8. Appends learnings to `progress.txt`
9. Repeats until all stories pass or max iterations reached

When complete, Ralph outputs `<promise>COMPLETE</promise>` and marks the PR ready for review.