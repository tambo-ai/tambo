Do introduce configuration changes to prettier, eslint, or other developer tools unless it is explicitly requested.

Do not introduce new dependencies unless it is explicitly requested.

Do not remove existing dependencies unless it is explicitly requested.

When creating PRs that fix GitHub issues, make sure to add "Fixes #<issue-number>" to the PR description.

When creating PRs, use conventional commits. Most common tags:

- feat: A new feature, specifically one that may introduce minor breaking changes
- fix: A bug fix, specifically one that fixes a bug that may introduce breaking changes
- chore: A change that doesn't fix a bug or add a feature, such as updating dependencies
- refactor: A change that neither fixes a bug nor adds a feature, such as improving readability or performance
- perf: A change that improves performance
- test: A change that adds or modifies tests
- docs: A change that adds or modifies documentation
