#!/usr/bin/env bun

// Re-exec as non-root user if running as root
import { userInfo } from "os";
if (userInfo().uid === 0) {
  const proc = Bun.spawn(["sudo", "-u", "ralph", "-E", "bun", ...process.argv.slice(1)], {
    stdout: "inherit",
    stderr: "inherit",
    cwd: process.cwd(),
  });
  process.exit(await proc.exited);
}

const MAX_ITERATIONS = parseInt(process.argv[2] || "25", 10);
const RALPH_DIR = `${process.cwd()}/.ralph`;

const PROMPT = `You are Ralph, an autonomous coding agent. Your task:

1. Read .ralph/prd.json
2. Read .ralph/progress.txt if it exists, otherwise create it with "## Codebase Patterns" header
3. Note the current branch (this is baseBranch)
4. Checkout the branch in prd.json branchName (create if needed)
5. Push and create a draft PR: gh pr create --draft --base <baseBranch>
6. Pick the highest priority story where passes is false
7. Implement that ONE story
8. Run typecheck and tests
9. Commit: git add -A && git commit -m "feat: [ID] - [Title]"
10. Update prd.json: set passes to true for completed story
11. Append learnings to progress.txt

If ALL stories pass: push, run gh pr ready, update PR body with summary, then output <promise>COMPLETE</promise>

Important: commit after completing work. Only implement ONE story per run.`;

console.log("🚀 Starting Ralph");
console.log(`💡 Tip: tail -f ${RALPH_DIR}/progress.txt`);
console.log("");

for (let i = 1; i <= MAX_ITERATIONS; i++) {
  console.log(`\n═══ Iteration ${i}/${MAX_ITERATIONS} ═══\n`);

  const { ANTHROPIC_API_KEY, ...env } = process.env;
  const proc = Bun.spawn(
    [
      "claude",
      "--dangerously-skip-permissions",
      "-p",
      PROMPT,
      "--output-format",
      "stream-json",
      "--verbose",
    ],
    {
      stdout: "pipe",
      stderr: "ignore",
      env,
    }
  );

  let resultText = "";

  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseLine = (line) => {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line);

      if (event.type === "assistant" && event.message?.content) {
        for (const block of event.message.content) {
          if (block.type === "tool_use") {
            const input = block.input || {};
            const detail =
              input.command?.slice(0, 100) ||
              input.file_path ||
              input.pattern ||
              "";
            console.log(`  🔧 ${block.name}${detail ? `: ${detail}` : ""}`);
          }
          if (block.type === "text" && block.text) {
            console.log(`  💬 ${block.text.slice(0, 200)}`);
          }
        }
      }

      if (event.type === "result") {
        resultText = event.result || "";
        console.log(
          `\n  ⏱  ${(event.duration_ms / 1000).toFixed(0)}s | $${event.total_cost_usd?.toFixed(3) || "?"}`
        );
      }
    } catch {}
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) parseLine(line);
  }

  // Parse any remaining buffered content
  if (buffer.trim()) parseLine(buffer);

  const code = await proc.exited;
  console.log(`  Exit code: ${code}`);

  if (resultText.includes("<promise>COMPLETE</promise>")) {
    console.log("\n✅ All stories complete!");
    process.exit(0);
  }

  try {
    const prd = JSON.parse(await Bun.file(`${RALPH_DIR}/prd.json`).text());
    const remaining = prd.userStories.filter((s) => !s.passes).length;
    console.log(`  Stories remaining: ${remaining}`);
    if (remaining === 0) {
      console.log("\n✅ All stories complete!");
      process.exit(0);
    }
  } catch {}

  await Bun.sleep(2000);
}

console.log("\n⚠️ Max iterations reached");
process.exit(1);
