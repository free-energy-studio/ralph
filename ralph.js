#!/usr/bin/env bun

import { $ } from "bun";

const MAX_ITERATIONS = parseInt(process.argv[2] || "25", 10);
const SCRIPT_DIR = import.meta.dir;

console.log("🚀 Starting Ralph");
console.log(`💡 Tip: In another terminal, run: tail -f ${SCRIPT_DIR}/progress.txt`);
console.log("");

for (let i = 1; i <= MAX_ITERATIONS; i++) {
  console.log(`═══ Iteration ${i} ═══`);

  const prompt = await Bun.file(`${SCRIPT_DIR}/prompt.md`).text();

  const proc = Bun.spawn(["claude", "--dangerously-skip-permissions"], {
    stdin: new Response(prompt),
    stdout: "pipe",
    stderr: "pipe",
  });

  let output = "";

  // Stream output in real-time while capturing it
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

  if (output.includes("<promise>COMPLETE</promise>")) {
    console.log("✅ Done!");
    process.exit(0);
  }

  await Bun.sleep(2000);
}

console.log("⚠️ Max iterations reached");
process.exit(1);
