#!/usr/bin/env bash
# bugbot-loop.sh <project> <repo> <pr> <max_iterations>
# Runs the Bug Bot fix loop: check comments → generate PRD → run Ralph → repeat
# Outputs final JSON state: { "iterations": N, "comments": [...], "clean": true|false }

set -euo pipefail

PROJECT="${1:-/projects/ichabod-doma}"
REPO="${2:-ondomain/ichabod-doma}"
PR="${3}"
MAX="${4:-3}"

log() { echo "[bugbot-loop] $*" >&2; }

get_bugbot_comments() {
  su - ubuntu -c "gh api repos/$REPO/pulls/$PR/comments \
    --jq '[.[] | select(.body | startswith(\"###\")) | {id: .id, body: .body, path: .path, line: .line}]'" 2>/dev/null \
    || echo "[]"
}

generate_prd_from_comments() {
  local comments="$1"
  local branch
  branch=$(su - ubuntu -c "cd $PROJECT && git branch --show-current")

  # Use claude to turn Bug Bot comments into user stories
  local prompt
  prompt=$(cat <<EOF
You are generating a .ralph/prd.json to fix bugs identified by Cursor Bug Bot.

Bug Bot comments (JSON):
$comments

Generate a prd.json with one user story per bug. Each story must be atomic (1-3 files), independently verifiable, and have clear acceptance criteria. Format:

{
  "branchName": "$branch",
  "userStories": [
    {
      "id": "BUG-001",
      "title": "<concise fix description>",
      "acceptanceCriteria": ["..."],
      "priority": 1,
      "passes": false,
      "notes": "<bug location and root cause>"
    }
  ]
}

Output ONLY valid JSON, no markdown, no explanation.
EOF
)

  su - ubuntu -c "claude --dangerously-skip-permissions -p '$prompt' 2>/dev/null" \
    | grep -A 9999 '{' | head -n -0 \
    || echo ""
}

iterations=0
final_comments="[]"

for i in $(seq 1 "$MAX"); do
  iterations=$i
  log "Iteration $i/$MAX — waiting 5 min for Bug Bot..."
  sleep 300

  log "Checking Bug Bot comments on PR #$PR..."
  comments=$(get_bugbot_comments)
  count=$(echo "$comments" | jq 'length' 2>/dev/null || echo "0")

  log "Found $count Bug Bot comment(s)"
  final_comments="$comments"

  if [ "$count" -eq 0 ]; then
    log "Clean! No Bug Bot comments."
    break
  fi

  if [ "$i" -eq "$MAX" ]; then
    log "Reached max iterations ($MAX) with $count comment(s) remaining."
    break
  fi

  log "Generating PRD from Bug Bot comments..."
  prd=$(generate_prd_from_comments "$comments")

  if [ -z "$prd" ] || ! echo "$prd" | jq . >/dev/null 2>&1; then
    log "Failed to generate valid PRD, skipping iteration"
    break
  fi

  log "Writing .ralph/prd.json..."
  echo "$prd" > "$PROJECT/.ralph/prd.json"
  rm -f "$PROJECT/.ralph/progress.txt"

  log "Running Ralph..."
  su - ubuntu -c "cd $PROJECT && bun /opt/skills/ralph/scripts/ralph.js 25" >&2

  log "Ralph done. Looping back to check Bug Bot..."
done

# Output structured result for Lobster
clean=$([ "$(echo "$final_comments" | jq 'length')" -eq 0 ] && echo "true" || echo "false")
jq -n \
  --argjson iterations "$iterations" \
  --argjson comments "$final_comments" \
  --argjson clean "$clean" \
  '[{"iterations": $iterations, "clean": $clean, "comments": $comments}]'
