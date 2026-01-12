# Devcontainer for Tambo AI monorepo
# Supports git worktrees with parallel development

FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install system dependencies for Node.js native modules and bash completion
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    bash-completion \
    && rm -rf /var/lib/apt/lists/*
