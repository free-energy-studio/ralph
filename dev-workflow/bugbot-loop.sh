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
  local since="${1:-}"
  local jq_filter
  if [ -n "$since" ]; then
    # Only comments posted after the given ISO timestamp
    jq_filter="[.[] | select(.body | startswith(\"###\")) | select(.created_at > \"$since\") | {id: .id, body: .body, path: .path, line: .line}]"
  else
    jq_filter='[.[] | select(.body | startswith("###")) | {id: .id, body: .body, path: .path, line: .line}]'
  fi
  su - ubuntu -c "gh api repos/$REPO/pulls/$PR/comments --jq '$jq_filter'" 2>/dev/null \
    || echo "[]"
}

# Poll until Bug Bot has commented (or timeout)
wait_for_bugbot() {
  local since="$1"
  local timeout="${2:-900}"   # 15 min default
  local interval=60
  local elapsed=0

  log "Polling for Bug Bot comments (timeout ${timeout}s, every ${interval}s)..."
  while [ "$elapsed" -lt "$timeout" ]; do
    local comments
    comments=$(get_bugbot_comments "$since")
    local count
    count=$(echo "$comments" | jq 'length' 2>/dev/null || echo "0")
    if [ "$count" -gt 0 ]; then
      log "Bug Bot posted $count comment(s) after ${elapsed}s"
      echo "$comments"
      return 0
    fi
    log "No comments yet (${elapsed}s elapsed)..."
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  log "Timed out waiting for Bug Bot after ${timeout}s — assuming clean"
  echo "[]"
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

# Capture timestamp just before first check so we only see new comments
push_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

for i in $(seq 1 "$MAX"); do
  iterations=$i
  log "Iteration $i/$MAX — waiting for Bug Bot (push_time: $push_time)..."

  comments=$(wait_for_bugbot "$push_time")
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

  # New push timestamp so next iteration only sees comments after this push
  push_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  log "Ralph done (new push_time: $push_time). Looping back to check Bug Bot..."
done

# Output structured result for Lobster
clean=$([ "$(echo "$final_comments" | jq 'length')" -eq 0 ] && echo "true" || echo "false")
jq -n \
  --argjson iterations "$iterations" \
  --argjson comments "$final_comments" \
  --argjson clean "$clean" \
  '[{"iterations": $iterations, "clean": $clean, "comments": $comments}]'
