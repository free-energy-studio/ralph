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

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const output = stdout + stderr;
  process.stdout.write(output);

  if (output.includes("<promise>COMPLETE</promise>")) {
    console.log("✅ Done!");
    process.exit(0);
  }

  await Bun.sleep(2000);
}

console.log("⚠️ Max iterations reached");
process.exit(1);
