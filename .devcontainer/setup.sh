#!/bin/bash
set -e

ensure_line() {
  local line="$1" file="$2"

  if ! grep -qxF "$line" "$file" 2>/dev/null; then
    if [ -s "$file" ] && [ -n "$(tail -c1 "$file" 2>/dev/null)" ]; then
      echo >> "$file"
    fi
    echo "$line" >> "$file"
  fi
}

ensure_bash_completion() {
  local bashrc_path="$1"
  local marker="# Enable bash completion (devcontainer)"

  if grep -qF "$marker" "$bashrc_path" 2>/dev/null; then
    return
  fi

  cat >> "$bashrc_path" <<'BASH_EOF'

# Enable bash completion (devcontainer)
if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
fi
BASH_EOF
}

# Auto-confirm Corepack downloads (non-interactive mode)
export COREPACK_ENABLE_NETWORK=1

# Trust and install tools from mise.toml and .node-version
mise trust
mise install

# Export mise environment to get correct Node in PATH
eval "$(mise env -s bash)"

# Enable and prepare Corepack for npm (auto-confirm with yes)
if ! yes | corepack enable npm; then
  echo "Warning: corepack enable npm failed; continuing with existing npm" >&2
fi

if ! corepack prepare npm@11.7.0 --activate; then
  echo "Warning: corepack prepare npm@11.7.0 failed; continuing with existing npm" >&2
fi

# Verify Node version
echo "Using Node version: $(node --version)"
echo "Using npm version: $(npm --version)"

# Install npm dependencies with correct Node version
npm ci

# Set up starship config
mkdir -p "$HOME/.config"
cp .config/starship.toml "$HOME/.config/starship.toml"

# Add mise and starship to bashrc for future shells
touch "$HOME/.bashrc"
ensure_line 'eval "$(mise activate bash)"' "$HOME/.bashrc"
ensure_line 'eval "$(starship init bash)"' "$HOME/.bashrc"

# Enable bash completion
ensure_bash_completion "$HOME/.bashrc"

echo "✓ Devcontainer setup complete"
