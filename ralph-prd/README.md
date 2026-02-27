# PRD Skill

Generate Product Requirements Documents (PRDs) for Ralph from Linear tickets or descriptions.

## Overview

This skill helps you create structured PRDs that Ralph can execute. It breaks down features into small, atomic user stories with explicit acceptance criteria.

## Installation

The skill is located in `.claude/skills/prd/` and is automatically discovered by Claude Code when you're in the ralph project directory.

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
2. **Fetches Linear data** (if applicable) - Gets title, description, criteria, and git branch name
3. **Explores the codebase** - Finds relevant patterns and existing implementations
4. **Asks clarifying questions** - Scope, behavior, edge cases
5. **Breaks down features** - Creates small, atomic user stories
6. **Generates PRD** - Creates `.ralph/prd.json` with stories
7. **Assigns priorities** - Orders stories for logical implementation (database → core → API → UI)
8. **Provides summary** - Shows what was created and next steps

## Output

The skill creates `.ralph/prd.json` with user stories like:

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

- **Atomic stories** - Single responsibility, 1-3 files changed
- **Explicit criteria** - Testable, specific requirements
- **Fast feedback** - Always includes "typecheck passes"
- **Logical ordering** - Database → Core → API → UI via priority

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
# Run Ralph
bun ralph.js 25

# Monitor progress in real-time
tail -f .ralph/progress.txt

# Check story status
cat .ralph/prd.json | jq '.userStories[] | {id, passes}'
```
