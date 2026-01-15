# PRD Generation Skill

You are generating a Product Requirements Document (PRD) for the Ralph Loop system.

## Input Handling

The user will provide either:
1. A Linear ticket ID (e.g., "LIN-123" or just "123")
2. A direct description as a string

## Steps

### 1. Determine Input Type

Check if the input looks like a Linear ticket ID:
- Matches pattern: `LIN-\d+` or `[A-Z]+-\d+` or just `\d+`
- If yes, it's a Linear ticket
- If no, treat it as a direct description

### 2. Fetch Linear Ticket (if applicable)

If it's a Linear ticket ID:
- Use `mcp__plugin_linear_linear__get_issue` to fetch the ticket
- Extract the following:
  - Title
  - Description
  - Acceptance criteria (if present in description)
  - Labels (for context)
  - Project (if assigned)

### 3. Parse Requirements

From the description (Linear or direct), identify:
- Overall feature/goal
- Individual user stories (break down large features)
- Acceptance criteria for each story
- Priority based on dependencies

### 4. Break Down into Small Stories

CRITICAL: Each user story MUST:
- Fit in one context window (small scope)
- Have explicit, testable acceptance criteria
- Include "typecheck passes" in criteria
- Include "tests pass" if applicable
- Be independent or have clear dependencies

**Examples:**

❌ Too large: "Build authentication system"
✅ Right size:
- "Create login form component"
- "Add email validation to login form"
- "Create login server action"
- "Connect login form to server action"

### 5. Generate PRD JSON

If `ralph/prd.json` exists, read it to:
- Preserve existing branchName if present
- Get the next available story ID
- Preserve any existing stories that haven't passed

If it doesn't exist, create it fresh.

Generate user stories in this format:

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
        "typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "Optional context or hints"
    }
  ]
}
```

### 6. Write PRD File

- Create or update `ralph/prd.json`
- Assign sequential IDs (US-001, US-002, etc.)
- Set priorities based on logical implementation order
- Write to `ralph/prd.json`

### 7. Summary

Provide a summary showing:
- Number of stories created
- Story IDs and titles
- Suggested branch name
- Next steps (run `./ralph/ralph.sh 25`)

## Quality Guidelines

### Story Size
Each story should take roughly 5-15 minutes for an AI agent to implement. If a story seems larger:
- Break it into smaller pieces
- Create dependencies via priority ordering

### Acceptance Criteria
Make criteria explicit and testable:

❌ Vague: "Form works correctly"
✅ Explicit:
- "Form has email and password fields"
- "Email field validates format"
- "Submit button is disabled when invalid"
- "Shows error message on validation failure"

### Priority Assignment
1. Start with priority 1 for the first story
2. Increment for each subsequent story
3. If stories are independent, they can share priority
4. Lower number = higher priority (done first)

### Notes Field
Use the notes field for:
- Implementation hints ("Use existing form components")
- File locations ("Add to /app/auth/login")
- Dependencies ("Requires US-003 to be complete")
- Linear context ("From Linear ticket LIN-123")

## Example Output

After running `/prd "Add user authentication"`, you should:

1. Parse the request
2. Break it into small stories like:
   - US-001: Create login form component
   - US-002: Add form validation
   - US-003: Create login server action
   - US-004: Add session management
   - US-005: Create logout functionality

3. Update `ralph/prd.json`

4. Show summary:
```
✅ Created 5 user stories for "Add user authentication"

Stories:
- US-001: Create login form component (priority 1)
- US-002: Add form validation (priority 2)
- US-003: Create login server action (priority 3)
- US-004: Add session management (priority 4)
- US-005: Create logout functionality (priority 5)

Branch: ralph/user-auth

Next steps:
./ralph/ralph.sh 25
```

## Error Handling

- If Linear ticket not found, ask user to verify the ID
- If description is too vague, ask clarifying questions
- If prd.json has incomplete stories (passes: false), ask whether to append or replace

## Example Invocations

```bash
# Using Linear ticket
/prd LIN-123

# Using direct description
/prd "Add user profile page with avatar upload"

# Using just ticket number
/prd 123
```
