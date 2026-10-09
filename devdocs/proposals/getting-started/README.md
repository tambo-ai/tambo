# Guided dashboard entry (#2478)

Accounts without projects see an inline project form on the authenticated dashboard. The form calls the existing `project.createProject2` mutation. Its successful response moves to starter instructions and a link to that saved project, even if refreshing the project list fails. Failed creation retains the entered name; pending creation disables duplicate submission.

The optional referral question uses `user.saveReferralSource` independently. Existing projects retain their regular dashboard and create dialog. Quickstart and existing-app documentation remain available from the project overview after leaving the guide. The former three-path modal and its unused helper components are removed.

The guide confirms project creation only. It does not claim that an app is connected, a message arrived, or that copying a command completed setup. No backend endpoint, database migration, new dependency, or tool configuration is needed.

## Verification

Run the web workspace lint, type check, and Jest suite. Route integration tests render the actual dashboard, NextAuth session provider, tRPC client, and React Query cache. Only the transport and navigation boundaries are controlled. They cover successful creation, pending duplicate protection, creation retry, list refresh failure after a save, initial query retry, and existing-user continuity. Component tests cover form validation, focus, clipboard denial, documentation links, and optional referral retry.

For a manual check, run the normal dashboard with a signed-in account containing no projects. Create a named project, follow the starter instructions, and open its dashboard. Repeat with a failed creation request and a failed list refresh. Use keyboard-only navigation and a narrow viewport; verify that the project name and command fields remain readable. Test an account with existing projects to confirm the regular dashboard remains available.

A deterministic local browser fixture exercises the same dashboard code and design tokens for UI review. It does not replace a live authenticated backend test or a real starter-app conversation.
