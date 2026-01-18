# Ralph Loop - PRD Creation Guide

## Quick Start

### Option 1: Use the /prd Command (Recommended)

1. Generate PRD from Linear ticket: `/prd LIN-123`
2. Or from description: `/prd "Add user authentication"`
3. Run Ralph: `./ralph/ralph.sh 25`
4. Monitor progress in `progress.txt`

### Option 2: Manual PRD Creation

1. Edit `prd.json` with your user stories
2. Run `./ralph/ralph.sh 25`
3. Monitor progress in `progress.txt`

## /prd Command

The `/prd` skill automatically generates user stories from Linear tickets or descriptions.

### Installation

Run the install script once:
```bash
./ralph/install-prd-skill.sh
```

### Usage

**From Linear Ticket:**
```bash
/prd LIN-123
```
Fetches the ticket and breaks it into small user stories.

**From Description:**
```bash
/prd "Add user profile page with avatar upload"
```
Analyzes the description and creates focused stories.

**From Ticket Number:**
```bash
/prd 123
```
Works if your Linear workspace has a consistent prefix.

### What It Does

1. Detects if input is a Linear ticket or description
2. Fetches Linear ticket details (if applicable)
3. Breaks down the feature into small, implementable stories
4. Updates `ralph/prd.json` with proper acceptance criteria
5. Assigns priorities in logical implementation order
6. Provides a summary of what was created

See `.claude/skills/prd/README.md` for more details.

## PRD Structure

### Required Fields

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

- **branchName** - Git branch Ralph will use/create
- **id** - Unique identifier (e.g., US-001, US-002)
- **title** - Short, descriptive name for the story
- **acceptanceCriteria** - Array of specific, testable requirements
- **priority** - Lower number = higher priority (Ralph does these first)
- **passes** - Set to `false` initially, Ralph sets to `true` when complete
- **notes** - Optional context or implementation hints

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
./ralph/ralph.sh 25

# Shorter run for testing
./ralph/ralph.sh 5
```

## Monitoring Progress

```bash
# Check which stories are complete
cat ralph/prd.json | jq '.userStories[] | {id, passes}'

# View learnings
cat ralph/progress.txt

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

## Browser Testing

For UI changes, use the dev-browser skill by @sawyerhood:

```bash
# Start the browser server
~/.config/amp/skills/dev-browser/server.sh &

# Write test script
cd ~/.config/amp/skills/dev-browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
const client = await connect();
const page = await client.page("test");
await page.setViewportSize({ width: 1280, height: 900 });
const port = process.env.PORT || "3000";
await page.goto(`http://localhost:${port}/your-page`);
await waitForPageLoad(page);
await page.screenshot({ path: "tmp/screenshot.png" });
await client.disconnect();
EOF
```

**Not complete until verified with screenshot.**
