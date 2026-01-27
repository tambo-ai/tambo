# AGENTS.md

Guidance for agents working in `.github/` (GitHub Actions workflows and composite actions). This file is referenced from the root [`AGENTS.md`](../AGENTS.md).

## GitHub Actions

When creating or modifying GitHub Actions workflows:

- **Pin actions to full commit SHA** with a version comment for security and reproducibility:

  ```yaml
  # Good - pinned to SHA with version comment
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

  # Bad - unpinned version tag
  - uses: actions/checkout@v4
  ```

- **Look up the SHA** from the action's releases page (e.g., https://github.com/actions/checkout/releases)
- **Include the version in a comment** so humans can understand what version is pinned
- **Local actions** (`./.github/actions/*`) don't need pinning since they're in the repo
