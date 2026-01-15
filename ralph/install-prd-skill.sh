#!/bin/bash

# Install PRD skill for Claude Code

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_SOURCE="$PROJECT_ROOT/.claude/skills/prd"
SKILL_TARGET="$HOME/.config/amp/skills/prd"

echo "📦 Installing PRD skill..."
echo ""
echo "Source: $SKILL_SOURCE"
echo "Target: $SKILL_TARGET"
echo ""

# Create skills directory if it doesn't exist
mkdir -p "$HOME/.config/amp/skills"

# Check if skill already exists
if [ -L "$SKILL_TARGET" ]; then
  echo "⚠️  Symlink already exists at $SKILL_TARGET"
  read -p "Remove and recreate? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$SKILL_TARGET"
  else
    echo "❌ Installation cancelled"
    exit 1
  fi
elif [ -d "$SKILL_TARGET" ]; then
  echo "⚠️  Directory already exists at $SKILL_TARGET"
  read -p "Remove and recreate? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$SKILL_TARGET"
  else
    echo "❌ Installation cancelled"
    exit 1
  fi
fi

# Create symlink
ln -s "$SKILL_SOURCE" "$SKILL_TARGET"

echo "✅ PRD skill installed!"
echo ""
echo "You can now use it with:"
echo "  /prd LIN-123"
echo "  /prd \"Add user authentication\""
echo ""
