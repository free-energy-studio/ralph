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
import { execSync } from "child_process";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = process.env.INIT_CWD || process.cwd();
const RALPH_DIR = __dirname;
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
    execSync(`which ${tool}`, { stdio: "pipe" });
  } catch {
    missing.push(tool);
  }
}

if (missing.length > 0) {
  console.log(`⚠️  Missing tools: ${missing.join(", ")}`);
  console.log("   Install them before running Ralph.\n");
} else {
  console.log("✅ Tools: gh, claude, bun — all found");
}

// 2. Add .ralph/ to .gitignore
let gitignoreContent = "";
if (existsSync(GITIGNORE)) {
  gitignoreContent = readFileSync(GITIGNORE, "utf-8");
}

if (!gitignoreContent.includes(".ralph/")) {
  gitignoreContent = gitignoreContent.trimEnd() + "\n.ralph/\n";
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

let skillExists = false;
try {
  const stat = lstatSync(SKILL_DEST);
  skillExists = true;
  if (stat.isSymbolicLink()) {
    // Check if symlink target exists; recreate if broken
    if (existsSync(SKILL_DEST)) {
      console.log("✅ Skill: /prd already symlinked");
    } else {
      const { unlinkSync } = await import("fs");
      unlinkSync(SKILL_DEST);
      const relPath = relative(SKILL_DEST_DIR, SKILL_SRC);
      symlinkSync(relPath, SKILL_DEST);
      console.log("✅ Skill: /prd symlink was broken — recreated to", relPath);
    }
  } else {
    console.log("⚠️  Skill: .claude/skills/prd exists but is not a symlink — skipping");
  }
} catch {
  // lstatSync throws if path doesn't exist at all
}

if (!skillExists) {
  const relPath = relative(SKILL_DEST_DIR, SKILL_SRC);
  symlinkSync(relPath, SKILL_DEST);
  console.log("✅ Skill: /prd symlinked to", relPath);
}

console.log("\n🎉 Ready. Run `bun ralph` to start.\n");
