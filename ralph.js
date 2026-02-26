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
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env,
    }
  );

  let output = "";

  const streamOutput = async (stream, target) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      output += text;
      target.write(text);
    }
  };

  await Promise.all([
    streamOutput(proc.stdout, process.stdout),
    streamOutput(proc.stderr, process.stderr),
  ]);

  const code = await proc.exited;
  console.log(`\n--- Iteration ${i} exited with code ${code} ---`);

  if (output.includes("<promise>COMPLETE</promise>")) {
    console.log("✅ All stories complete!");
    process.exit(0);
  }

  if (code !== 0) {
    console.log("⚠️  Non-zero exit, retrying...");
  }

  await Bun.sleep(2000);
}

console.log("⚠️ Max iterations reached");
process.exit(1);
