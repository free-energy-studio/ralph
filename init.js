#!/usr/bin/env bun

/**
 * ralph init — sets up a project for Ralph development workflow
 *
 * What it does:
 * 1. Adds .ralph/ to .gitignore
 * 2. Symlinks the /prd Claude Code skill into the project
 * 3. Verifies required tools (gh, claude, bun)
 */

import { existsSync, mkdirSync, symlinkSync, readFileSync, writeFileSync, lstatSync } from "fs";
import { resolve, join, relative } from "path";

const PROJECT_DIR = process.cwd();
const RALPH_DIR = import.meta.dir;
const SKILL_SRC = join(RALPH_DIR, "skills", "prd");
const SKILL_DEST_DIR = join(PROJECT_DIR, ".claude", "skills");
const SKILL_DEST = join(SKILL_DEST_DIR, "prd");
const GITIGNORE = join(PROJECT_DIR, ".gitignore");

console.log("🔧 Ralph Init\n");

// 1. Check required tools
const tools = ["gh", "claude", "bun"];
const missing = [];
for (const tool of tools) {
  try {
    Bun.spawnSync(["which", tool], { stdout: "pipe", stderr: "pipe" });
  } catch {
    missing.push(tool);
  }
}

// which returns 0 even if not found on some systems, check output
for (const tool of tools) {
  const result = Bun.spawnSync(["which", tool], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    missing.push(tool);
  }
}

if (missing.length > 0) {
  console.log(`⚠️  Missing tools: ${[...new Set(missing)].join(", ")}`);
  console.log("   Install them before running Ralph.\n");
} else {
  console.log("✅ Tools: gh, claude, bun — all found");
}

// 2. Add .ralph/ to .gitignore
let gitignoreContent = "";
if (existsSync(GITIGNORE)) {
  gitignoreContent = readFileSync(GITIGNORE, "utf-8");
}

const entries = [".ralph/"];
let gitignoreUpdated = false;
for (const entry of entries) {
  if (!gitignoreContent.includes(entry)) {
    gitignoreContent = gitignoreContent.trimEnd() + "\n" + entry + "\n";
    gitignoreUpdated = true;
  }
}

if (gitignoreUpdated) {
  writeFileSync(GITIGNORE, gitignoreContent);
  console.log("✅ .gitignore: added .ralph/");
} else {
  console.log("✅ .gitignore: .ralph/ already present");
}

// 3. Symlink /prd skill
if (!existsSync(SKILL_SRC)) {
  console.log("⚠️  Skill source not found at", SKILL_SRC);
  process.exit(1);
}

mkdirSync(SKILL_DEST_DIR, { recursive: true });

if (existsSync(SKILL_DEST)) {
  try {
    const stat = lstatSync(SKILL_DEST);
    if (stat.isSymbolicLink()) {
      console.log("✅ Skill: /prd already symlinked");
    } else {
      console.log("⚠️  Skill: .claude/skills/prd exists but is not a symlink — skipping");
    }
  } catch {
    console.log("⚠️  Skill: could not check .claude/skills/prd");
  }
} else {
  const relPath = relative(SKILL_DEST_DIR, SKILL_SRC);
  symlinkSync(relPath, SKILL_DEST);
  console.log("✅ Skill: /prd symlinked to", relPath);
}

console.log("\n🎉 Ready. Run `bun ralph` to start.\n");
