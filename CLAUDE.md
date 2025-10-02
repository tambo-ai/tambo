# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**⚠️ IMPORTANT: Read [AGENTS.md](./AGENTS.md) before making any changes or using any tools. It contains detailed architectural guidance and development workflows.**

## Quick Reference

This is a Turborepo monorepo for Tambo AI containing:

- **react-sdk/** - Core React hooks and providers
- **cli/** - Command-line tools and component registry
- **showcase/** - Next.js demo application
- **docs/** - Documentation site with Fumadocs
- **create-tambo-app/** - App creation bootstrap tool

## Essential Commands

```bash
turbo dev               # Start all packages in development
turbo build             # Build all packages
turbo lint              # Lint all packages
turbo test              # Test all packages
```

For detailed information on architecture, development patterns, and cross-package workflows, see [AGENTS.md](./AGENTS.md).
