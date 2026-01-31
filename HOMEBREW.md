# Homebrew Installation

This repository serves as a Homebrew tap for the Tambo CLI.

## Installation

```bash
brew tap tambo-ai/tambo
brew install tambo
```

## Verification

```bash
tambo --version
tambo --help
```

## Requirements

- Node.js >= 22 (installed automatically via Homebrew's `node` dependency)
- macOS (Homebrew standard support)

## Updating

```bash
brew update
brew upgrade tambo
```

## Uninstallation

```bash
brew uninstall tambo
brew untap tambo-ai/tambo
```

## Formula Maintenance

The Homebrew formula is automatically updated when new versions of the Tambo CLI are released. The update workflow:

1. Detects new releases tagged with `tambo-v*`
2. Fetches the npm tarball URL and SHA256 checksum
3. Updates `Formula/tambo.rb`
4. Creates a pull request for review

Manual updates can be triggered via the GitHub Actions workflow dispatch.
