#!/bin/bash
set -e

# Assumes this script runs as the same user configured as remoteUser in
# devcontainer.json, so that $HOME points at that user's home directory.

if [ -z "${HOME:-}" ] || [ ! -d "${HOME}" ] || [ ! -w "${HOME}" ]; then
  echo "ERROR: HOME is not set to a writable directory; expected to run as remoteUser" >&2
  exit 1
fi

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
EXPECTED_NPM_VERSION="11.7.0"

# Trust and install tools from mise.toml and .node-version
mise trust
mise install

# Export mise environment to get correct Node in PATH
eval "$(mise env -s bash)"

# Enable and prepare Corepack for npm (auto-confirm with yes)
if ! yes | corepack enable npm; then
  echo "Warning: corepack enable npm failed; continuing with existing npm" >&2
fi

if ! corepack prepare "npm@${EXPECTED_NPM_VERSION}" --activate; then
  echo "Warning: corepack prepare npm@${EXPECTED_NPM_VERSION} failed; continuing with existing npm" >&2
fi

# Verify Node version
echo "Using Node version: $(node --version)"
npm_version="$(npm --version)"
echo "Using npm version: ${npm_version}"

if [ "${npm_version}" != "${EXPECTED_NPM_VERSION}" ]; then
  echo "WARNING: npm version is ${npm_version} but expected ${EXPECTED_NPM_VERSION}; installs may be non-reproducible" >&2
fi

# Install npm dependencies with correct Node version
# Use npm ci for reproducible installs; requires committed, up-to-date package-lock.json
if [ ! -f package-lock.json ]; then
  echo "ERROR: package-lock.json is missing. This repo expects a committed lockfile." >&2
  exit 1
fi

if ! npm ci; then
  echo "ERROR: npm ci failed. Ensure package-lock.json is present and up to date, then rebuild the devcontainer." >&2
  exit 1
fi

# Set up starship config
mkdir -p "$HOME/.config"
cp .config/starship.toml "$HOME/.config/starship.toml"

# Add mise and starship to bashrc for future shells
touch "$HOME/.bashrc"
ensure_line '# Managed by devcontainer: mise and starship initialization' "$HOME/.bashrc"
ensure_line 'eval "$(mise activate bash)"' "$HOME/.bashrc"
ensure_line 'eval "$(starship init bash)"' "$HOME/.bashrc"

# Enable bash completion
ensure_bash_completion "$HOME/.bashrc"

echo "✓ Devcontainer setup complete"
