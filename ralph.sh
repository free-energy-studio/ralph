#!/bin/bash
set -e

MAX_ITERATIONS=${1:-25}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_PATH="$SCRIPT_DIR/prompt.md"
RALPH_DIR="$(pwd)/.ralph"

echo "🚀 Starting Ralph"
echo "💡 Tip: tail -f $RALPH_DIR/progress.txt"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══ Iteration $i/$MAX_ITERATIONS ═══"
  echo ""

  claude --dangerously-skip-permissions \
    -p "Read the file $PROMPT_PATH and follow its instructions exactly." \
    2>&1 || true

  CODE=$?
  echo ""
  echo "--- Iteration $i exited with code $CODE ---"

  # Check if ralph marked all stories complete
  if [ -f "$RALPH_DIR/prd.json" ]; then
    REMAINING=$(grep -c '"passes": false' "$RALPH_DIR/prd.json" 2>/dev/null || echo "0")
    echo "Stories remaining: $REMAINING"
    if [ "$REMAINING" = "0" ]; then
      echo "✅ All stories complete!"
      exit 0
    fi
  fi

  sleep 2
done

echo "⚠️ Max iterations reached"
exit 1
