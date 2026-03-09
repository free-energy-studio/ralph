#!/bin/bash
set -e

REPO="https://github.com/free-energy-studio/skills.git"
INSTALL_DIR="${HOME}/.local/share/free-energy-skills"

# Clone or pull
if [ -d "$INSTALL_DIR" ]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO" "$INSTALL_DIR"
fi

# Default to ralph if no args
skills=("${@:-ralph}")

for skill in "${skills[@]}"; do
  if [ ! -d "$INSTALL_DIR/$skill" ]; then
    echo "Skill '$skill' not found, skipping"
    continue
  fi
  echo "Installing $skill..."
  cd "$INSTALL_DIR/$skill"
  bun install
  # Only bun link if the package has a bin entry
  if bun -e "const p=require('./package.json'); process.exit(p.bin ? 0 : 1)" 2>/dev/null; then
    bun link
    echo "Linked $skill globally"
  else
    echo "Installed $skill (no CLI binary)"
  fi
done

echo "Done!"
