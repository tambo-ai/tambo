#!/bin/bash
set -e

# Trust and install tools from mise.toml and .node-version
mise trust
mise install

# Export mise environment to get correct Node in PATH
eval "$(mise env -s bash)"

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
