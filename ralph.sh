#!/bin/bash
set -e

MAX_ITERATIONS=${1:-25}
RALPH_DIR="$(pwd)/.ralph"

echo "🚀 Starting Ralph"
echo "💡 Tip: tail -f $RALPH_DIR/progress.txt"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══ Iteration $i/$MAX_ITERATIONS ═══"
  echo ""

  PROMPT='Read the file .ralph/prd.json and implement the next incomplete story. Follow standard Ralph workflow: checkout branch, implement, typecheck, commit, update prd.json. If all stories pass, push and output <promise>COMPLETE</promise>'

  claude --dangerously-skip-permissions -p "$PROMPT" 2>&1
  CODE=$?
  echo ""
  echo "--- Iteration $i exited with code $CODE ---"

  # Check if ralph marked all stories complete
  if [ -f "$RALPH_DIR/prd.json" ]; then
    REMAINING=$(grep -c '"passes": false' "$RALPH_DIR/prd.json" || true)
    echo "Stories remaining: $REMAINING"
    if [ "$REMAINING" = "0" ] || [ -z "$REMAINING" ]; then
      echo "✅ All stories complete!"
      exit 0
    fi
  fi

  sleep 2
done

echo "⚠️ Max iterations reached"
exit 1
