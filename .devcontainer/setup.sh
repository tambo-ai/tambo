#!/bin/bash
set -e

# Auto-confirm Corepack downloads (non-interactive mode)
export COREPACK_ENABLE_NETWORK=1

# Trust and install tools from mise.toml and .node-version
mise trust
mise install

# Export mise environment to get correct Node in PATH
eval "$(mise env -s bash)"

# Enable and prepare Corepack for npm (auto-confirm with yes)
yes | corepack enable npm || true
corepack prepare npm@11.7.0 --activate || true

# Verify Node version
echo "Using Node version: $(node --version)"
echo "Using npm version: $(npm --version)"

# Install npm dependencies with correct Node version
npm install

# Set up starship config
mkdir -p /root/.config
cp .config/starship.toml /root/.config/starship.toml

# Add mise and starship to bashrc for future shells
echo 'eval "$(mise activate bash)"' >> /root/.bashrc
echo 'eval "$(starship init bash)"' >> /root/.bashrc

echo "✓ Devcontainer setup complete"
