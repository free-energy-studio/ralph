name: dev-workflow
args:
  ticket:
    required: true
  project:
    default: "/projects/ichabod-doma"
  repo:
    default: "ondomain/ichabod-doma"
  max_bugbot_iterations:
    default: "3"

steps:
  - id: ralph
    command: su - ubuntu -c "cd $project && bun /opt/skills/ralph/scripts/ralph.js 25"

  - id: get-pr
    command: su - ubuntu -c "cd $project && gh pr list --head $(git branch --show-current) --json number --jq '.[0].number'"

  - id: bugbot-loop
    command: bash /opt/skills/dev-workflow/bugbot-loop.sh $project $repo $(echo $get-pr.stdout | tr -d '[:space:]') $max_bugbot_iterations

  - id: review
    approval: required
    stdin: $bugbot-loop.stdout
    prompt: "Bug Bot loop complete (see results above). Approve to move to QA, deny if issues remain."

  - id: qa-handoff
    command: bun /opt/skills/linear/scripts/linear.ts status $ticket qa-review
    condition: $review.approved
