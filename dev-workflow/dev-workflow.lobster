name: dev-workflow
args:
  ticket:
    required: true
  project:
    default: "/projects/ichabod-doma"

steps:
  - id: ralph
    command: su - ubuntu -c "cd $project && bun /opt/skills/ralph/scripts/ralph.js 25"

  - id: get-pr
    command: su - ubuntu -c "cd $project && gh pr list --head $(git branch --show-current) --json number --jq '.[0].number'"

  - id: wait-bugbot
    command: sleep 300

  - id: bugbot-comments
    command: su - ubuntu -c "cd $project && gh api repos/ondomain/ichabod-doma/pulls/$(cat $get-pr.stdout | tr -d '[:space:]')/comments --jq '[.[] | {body: .body, path: .path, line: .line}]'"

  - id: review
    approval: required
    stdin: $bugbot-comments.stdout
    prompt: "Bug Bot comments shown above. Any unresolved issues? Approve to move to QA, deny to fix first."

  - id: qa-handoff
    command: bun /opt/skills/linear/scripts/linear.ts status $ticket qa-review
    condition: $review.approved
