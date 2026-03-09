# PRD Format Reference

## Structure

```json
{
  "branchName": "linear-branch-name-or-ralph/feature",
  "userStories": [
    {
      "id": "US-001",
      "title": "Verb + noun, concise",
      "acceptanceCriteria": [
        "Specific file to create/modify",
        "Specific behavior to implement",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "Optional context"
    }
  ]
}
```

## Story Quality Checklist

- Single responsibility (one thing only)
- 1-3 files changed
- Independently verifiable (typecheck passes after each)
- Ordered by dependency (schemas before logic, backend before frontend)
- Acceptance criteria are specific and testable (not "users can log in" but "POST /login returns 200 with valid session cookie")

## Bug Bot Fix PRD

When creating a PRD from Bug Bot comments, each comment becomes a story:

```json
{
  "id": "BF-001",
  "title": "Fix: [bug bot comment summary]",
  "acceptanceCriteria": [
    "Address comment on [file]:[line]",
    "[specific fix description]",
    "Typecheck passes"
  ],
  "priority": 1,
  "passes": false,
  "notes": "Bug Bot comment: [paste relevant excerpt]"
}
```
