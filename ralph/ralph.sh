#!/bin/bash

# Ralph Loop Script
# Runs an AI agent iteratively to complete user stories

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS="${1:-25}"

echo "🤖 Starting Ralph Loop (max $MAX_ITERATIONS iterations)"
echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Instructions for each iteration:
for i in $(seq 1 $MAX_ITERATIONS); do
  echo "═══ Iteration $i ═══"

  OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" \
    | claude --dangerously-skip-permissions 2>&1 \
    | tee /dev/stderr) || true

  if echo "$OUTPUT" | \
    grep -q "<promise>COMPLETE</promise>"
  then
    echo "✅ Done!"
    exit 0
  fi

  sleep 2
done

echo "⚠️ Max iterations reached"
exit 1
