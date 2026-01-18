# Ralph Agent Instructions

## Your Task

1. Read `ralph/prd.json`
2. Read `ralph/progress.txt` if it exists, otherwise create it with a "## Codebase Patterns" header
3. Note the current branch name (this is the `baseBranch` to merge back into)
4. Checkout to the branch specified in `branchName` (create it if it doesn't exist)
5. Push the branch and create a **draft PR** using `gh pr create --draft --base <baseBranch>`
6. Pick highest priority story where `passes: false`
7. Implement that ONE story
8. Run typecheck and tests
9. Update AGENTS.md files with learnings
10. Commit: `feat: [ID] - [Title]` (include ALL modified files)
11. Update prd.json: `passes: true`
12. Append learnings to progress.txt

**Important:** Commit after every turn with all modified files using `git add -A && git commit`.

## Progress Format

APPEND to progress.txt:

```
## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Codebase Patterns

Add reusable patterns to the TOP of progress.txt:

```
## Codebase Patterns
- Migrations: Use IF NOT EXISTS
- React: useRef<Timeout | null>(null)
```

## Stop Condition

If ALL stories pass:

1. Push the branch to remote: `git push origin <branchName>`
2. Mark the draft PR as ready for review using `gh pr ready`
3. Update the PR body using `gh pr edit --body` with:

   ```
   ## Summary
   <Comprehensive description of what was implemented>

   ## Changes
   <Bulleted list of all stories completed with their IDs>

   ## Files Changed
   <List key files that were modified/created>

   ## Testing
   - [ ] Typecheck passes
   - [ ] Manual testing completed
   ```

4. Then reply:

```
<promise>COMPLETE</promise>
```

Otherwise end normally (do NOT mark PR ready if stories remain).