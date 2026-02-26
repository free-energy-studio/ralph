#!/usr/bin/env bun

const MAX_ITERATIONS = parseInt(process.argv[2] || "25", 10);
const SCRIPT_DIR = import.meta.dir;
const RALPH_DIR = `${process.cwd()}/.ralph`;
const PROMPT_PATH = `${SCRIPT_DIR}/prompt.md`;

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
      `Read the file ${PROMPT_PATH} and follow its instructions exactly.`,
      "--output-format",
      "stream-json",
      "--verbose",
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env,
    }
  );

  let resultText = "";
  let lastToolName = "";

  // Parse stream-json lines and print human-readable progress
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);

        if (event.type === "assistant" && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === "tool_use") {
              lastToolName = block.name;
              const input = block.input || {};
              const detail =
                input.command?.slice(0, 80) ||
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
      } catch {
        // non-JSON line, ignore
      }
    }
  }

  // drain stderr
  const stderrReader = proc.stderr.getReader();
  while (true) {
    const { done } = await stderrReader.read();
    if (done) break;
  }

  const code = await proc.exited;
  console.log(`  Exit code: ${code}`);

  if (resultText.includes("<promise>COMPLETE</promise>")) {
    console.log("\n✅ All stories complete!");
    process.exit(0);
  }

  // Backup check: look at prd.json directly
  try {
    const prd = JSON.parse(
      await Bun.file(`${RALPH_DIR}/prd.json`).text()
    );
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
