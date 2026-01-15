# PRD Skill

Generate Product Requirements Documents (PRDs) for Ralph Loop from Linear tickets or descriptions.

## Installation

The skill is located in `.claude/skills/prd/` and should be automatically discovered by Claude Code.

If it's not working, you may need to:

1. **Copy to global skills directory:**
```bash
mkdir -p ~/.config/amp/skills/
cp -r .claude/skills/prd ~/.config/amp/skills/
```

2. **Or symlink it:**
```bash
mkdir -p ~/.config/amp/skills/
ln -s "$(pwd)/.claude/skills/prd" ~/.config/amp/skills/prd
```

## Usage

### From Linear Ticket

```bash
/prd LIN-123
```

Fetches the Linear ticket and generates user stories based on the description.

### From Description

```bash
/prd "Add user authentication with email/password"
```

Generates user stories by breaking down the description into small, implementable tasks.

### From Ticket Number

```bash
/prd 123
```

If your Linear tickets use a consistent prefix, you can just use the number.

## What It Does

1. **Parses input** - Detects if it's a Linear ticket or description
2. **Fetches Linear data** (if applicable) - Gets title, description, criteria
3. **Breaks down features** - Creates small, focused user stories
4. **Generates PRD** - Updates `scripts/ralph/prd.json` with stories
5. **Assigns priorities** - Orders stories for logical implementation
6. **Provides summary** - Shows what was created and next steps

## Output

The skill updates `scripts/ralph/prd.json` with user stories like:

```json
{
  "branchName": "ralph/feature-name",
  "userStories": [
    {
      "id": "US-001",
      "title": "Create login form component",
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
    }
  ]
}
```

## Quality Guidelines

The skill follows Ralph best practices:

- **Small stories** - Each fits in one context window
- **Explicit criteria** - Testable, specific requirements
- **Fast feedback** - Always includes "typecheck passes"
- **Logical ordering** - Dependencies via priority

## Examples

### Example 1: Authentication Feature

```bash
/prd "Add user authentication"
```

Might generate:
- US-001: Create login form component
- US-002: Add form validation
- US-003: Create login server action
- US-004: Add session management
- US-005: Create logout functionality

### Example 2: From Linear Ticket

```bash
/prd LIN-456
```

If Linear ticket LIN-456 is titled "User Profile Page" with description:
> Users should be able to view and edit their profile with avatar upload

Might generate:
- US-001: Create profile page layout
- US-002: Add profile form fields
- US-003: Implement avatar upload component
- US-004: Create profile update server action
- US-005: Add form validation

## Next Steps

After generating a PRD:

```bash
# Run Ralph Loop
./scripts/ralph/ralph.sh 25

# Monitor progress
cat scripts/ralph/prd.json | jq '.userStories[] | {id, passes}'
```
