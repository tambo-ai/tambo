# Settings UX Audit

**Date:** 2026-04-02
**Scope:** `/apps/web/app/(authed)/(dashboard)/[projectId]/settings/` and all settings components
**Purpose:** Pre-meeting document cataloging every interaction pattern, established conventions, outliers, and UX problems in the project settings area.

---

## Table of Contents

1. [Page Architecture](#1-page-architecture)
2. [Interaction Inventory](#2-interaction-inventory)
3. [Established Patterns](#3-established-patterns)
4. [Outliers and Inconsistencies](#4-outliers-and-inconsistencies)
5. [What's Working Well](#5-whats-working-well)
6. [What's a Poor Experience](#6-whats-a-poor-experience)
7. [Performance and Optimization](#7-performance-and-optimization)
8. [Accessibility](#8-accessibility)
9. [Prioritized Recommendations](#9-prioritized-recommendations)

---

## 1. Page Architecture

### Route Structure

```
/(authed)/(dashboard)/[projectId]/settings/page.tsx
  --> ProjectSettings component (single-page, scrollable sections)
```

The settings page is a single long-scrolling page with a sidebar navigation (desktop) or collapsible menu (mobile). There are no sub-routes. All seven sections render on the same page and scroll into view via `scrollToSection()`.

### Navigation Hierarchy

```
Dashboard Layout (sticky header)
  --> Project Layout (breadcrumbs + tabs: Overview | Observability | Settings)
    --> Settings Page
      --> Sidebar nav (7 items, scroll-to-section)
      --> Content pane (7 card sections stacked vertically)
```

### Section Inventory

| #   | Section                | Component                              | File                                             |
| --- | ---------------------- | -------------------------------------- | ------------------------------------------------ |
| 1   | API Keys               | `InteractableAPIKeyList`               | `project-details/api-key-list.tsx`               |
| 2   | LLM Providers          | `InteractableProviderKeySection`       | `project-details/provider-key-section.tsx`       |
| 3   | Custom Instructions    | `InteractableCustomInstructionsEditor` | `project-details/custom-instructions-editor.tsx` |
| 4   | Skills                 | `InteractableSkillsSection`            | `project-details/skills-section.tsx`             |
| 5   | MCP Servers            | `InteractableAvailableMcpServers`      | `project-details/available-mcp-servers.tsx`      |
| 6   | Tool Call Limit        | `InteractableToolCallLimitEditor`      | `project-details/tool-call-limit-editor.tsx`     |
| 7   | OAuth Token Validation | `InteractableOAuthSettings`            | `project-details/oauth-settings.tsx`             |

### Data Loading Strategy

The parent `ProjectSettings` component fetches the project via `api.project.getUserProjects` and filters client-side (`projects.find(p => p.id === projectId)`). Each child section then fetches its own data independently (API keys, provider config, OAuth settings, skills, MCP servers). This means **8+ tRPC queries fire simultaneously on page load**.

---

## 2. Interaction Inventory

### A. Buttons

| Button                                    | Location                                                       | Action Type                             | Feedback                                                |
| ----------------------------------------- | -------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| "Delete" (project)                        | Header, `project-settings.tsx:230`                             | Opens `DeleteConfirmationDialog`        | Toast on success/failure, navigates to `/`              |
| "Edit" / "Save" / "Cancel" (project name) | Header, `project-settings.tsx:251-276`                         | Inline text editing                     | Toast, input + buttons swap                             |
| "Add Key"                                 | API Keys card, `api-key-list.tsx:339`                          | Reveals inline create form              | AnimatePresence transition                              |
| "Create Key"                              | API Keys create form, `api-key-list.tsx:401`                   | tRPC mutation                           | Spinner in button, toast, reveals generated key         |
| "Copy" (new API key)                      | Generated key row, `api-key-list.tsx:458`                      | Clipboard write                         | No visual "copied" confirmation                         |
| "Close" (generated key)                   | Generated key row, `api-key-list.tsx:466`                      | Hides generated key panel               | AnimatePresence exit                                    |
| "Copy API Key"                            | API Key Dialog, `api-key-dialog.tsx:45`                        | Clipboard write                         | Icon swaps to checkmark for 2s                          |
| Delete (trash icon per key)               | API Key list item, `api-key-list-item.tsx:64`                  | Opens `DeleteConfirmationDialog`        | Toast on success/failure                                |
| "Save Settings"                           | LLM Providers header, `provider-key-section.tsx:1016`          | tRPC mutation                           | Button shows "Saving...", toast                         |
| "Add Key" / "Update Key"                  | LLM Providers API key row, `provider-key-section.tsx:1370`     | Reveals inline edit                     | Debounced validation, toast                             |
| "Save Key"                                | LLM Providers API key edit, `provider-key-section.tsx:1322`    | tRPC mutation                           | Button shows "Saving...", toast                         |
| "Edit Instructions" / "Add Instructions"  | Custom Instructions, `custom-instructions-editor.tsx:349`      | Toggles edit mode                       | AnimatePresence                                         |
| "Save Instructions"                       | Custom Instructions edit, `custom-instructions-editor.tsx:298` | tRPC mutation                           | Spinner, toast                                          |
| "Cancel" (instructions)                   | Custom Instructions edit, `custom-instructions-editor.tsx:313` | Reverts to saved value                  | Red text styling                                        |
| "Create Skill"                            | Skills header, `skills-section.tsx:413`                        | Opens inline form                       | AnimatePresence                                         |
| "Import"                                  | Skills header, `skills-section.tsx:406`                        | Opens file picker                       | Toast on invalid file                                   |
| "Save changes" / "Create skill"           | Skill form, `skill-form.tsx:217`                               | tRPC mutation                           | Spinner, toast                                          |
| Toggle (skill enable/disable)             | Skill card, `skill-card.tsx:42`                                | Immediate tRPC mutation                 | No pending UI besides switch state; toast on error only |
| Edit (pencil icon per skill)              | Skill card, `skill-card.tsx:48`                                | Opens skill form pre-filled             | N/A                                                     |
| Delete (trash icon per skill)             | Skill card, `skill-card.tsx:57`                                | Opens `DeleteConfirmationDialog`        | Card goes `opacity-50` during delete                    |
| "Add MCP Server"                          | MCP Servers header, `available-mcp-servers.tsx:202`            | Appends new `McpServerRow` in edit mode | N/A                                                     |
| "Save" (MCP server)                       | MCP server editor, `mcp-server-editor.tsx:266`                 | tRPC mutation                           | Loader2 spinner in button                               |
| "Cancel" (MCP server)                     | MCP server editor, `mcp-server-editor.tsx:281`                 | Exits edit mode or removes new row      | N/A                                                     |
| "Edit" (MCP server)                       | MCP server editor, `mcp-server-editor.tsx:304`                 | Enters edit mode                        | N/A                                                     |
| "Delete" (MCP server)                     | MCP server editor, `mcp-server-editor.tsx:313`                 | **Direct delete, no confirmation**      | Spinner, then row removed                               |
| Inspect tools (info icon)                 | MCP server editor, `mcp-server-editor.tsx:296`                 | Opens `McpServerToolsDialog`            | N/A                                                     |
| "Begin Authorization"                     | MCP server editor, `mcp-server-editor.tsx:352`                 | Triggers OAuth flow, redirects          | N/A                                                     |
| "Edit" (tool call limit)                  | Tool Call Limit, `tool-call-limit-editor.tsx:243`              | Toggles edit mode                       | AnimatePresence                                         |
| "Save" (tool call limit)                  | Tool Call Limit edit, `tool-call-limit-editor.tsx:203`         | tRPC mutation                           | Spinner, toast                                          |
| "Save" (OAuth)                            | OAuth settings, `oauth-settings.tsx:612`                       | tRPC mutation                           | Spinner, toast                                          |
| "Apply a preset"                          | OAuth settings, `oauth-settings.tsx:412`                       | Opens dropdown, applies preset          | No confirmation, changes form state                     |

### B. Forms and Save Behavior

| Section                  | Save Pattern                                            | Unsaved Changes Tracking                 |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------- |
| Project Name             | Explicit "Save" button, Enter to save, Escape to cancel | No visual indicator                      |
| API Keys                 | Explicit "Create Key" button, Enter to submit           | N/A (create-only)                        |
| LLM Providers (settings) | Explicit "Save Settings" (appears only when dirty)      | Yes -- `hasActualChanges` computed value |
| LLM Providers (API key)  | Explicit "Save Key" button                              | No -- separate from settings save        |
| Custom Instructions      | Explicit "Save Instructions" button                     | No tracking; edit mode is the indicator  |
| Skills                   | Explicit "Create skill" / "Save changes" button         | N/A                                      |
| MCP Servers              | Explicit "Save" button per server                       | No tracking                              |
| Tool Call Limit          | Explicit "Save" button                                  | No tracking                              |
| OAuth Settings           | Explicit "Save" button (disabled until dirty)           | Yes -- `hasUnsavedChanges` state         |

**Toggle-specific save behavior:**

- "Allow system prompt override" toggle in Custom Instructions: **Saves immediately when NOT in edit mode, defers save when in edit mode.** This is a hybrid pattern unique to this one toggle. (`custom-instructions-editor.tsx:158-183`)
- "Token Required" toggle in OAuth: **Deferred save only** -- included in the "Save" button action. (`oauth-settings.tsx:398-401`)
- Skill enable/disable toggles: **Immediate save** via mutation. (`skills-section.tsx:145-162`)

### C. Panels / Drawers / Modals / Dialogs

| Component                     | Trigger                                      | Type                        | Close Behavior                                    |
| ----------------------------- | -------------------------------------------- | --------------------------- | ------------------------------------------------- |
| `DeleteConfirmationDialog`    | Delete project, delete API key, delete skill | AlertDialog (modal overlay) | Cancel button or backdrop click                   |
| `APIKeyDialog`                | Auto-generated first key only                | Dialog (modal overlay)      | Backdrop click or after copy                      |
| `McpServerToolsDialog`        | Inspect tools button on MCP server           | Dialog (modal, scrollable)  | Backdrop click or X                               |
| Overwrite skill dialog        | File import with name conflict               | AlertDialog                 | Cancel or Overwrite buttons                       |
| `EditWithTamboButton` popover | Bot icon inline in each section title        | Popover (floating)          | Click outside, X button, or auto-close after send |

### D. Copy-to-Clipboard Patterns

| Location                                 | What's Copied                    | Feedback                                 | Hook                                     |
| ---------------------------------------- | -------------------------------- | ---------------------------------------- | ---------------------------------------- |
| API Key list item click                  | Partially hidden key (truncated) | **None** -- no toast, no icon change     | `useClipboard`                           |
| "Copy" button (new generated key inline) | Full API key                     | **None** -- button text does not change  | `useClipboard` (ignores `copied` return) |
| "Copy API Key" (dialog)                  | Full API key                     | Checkmark icon replaces copy icon for 2s | `useClipboard`                           |

### E. Loading States

| Section             | Loading Mechanism                 | Type                     |
| ------------------- | --------------------------------- | ------------------------ |
| Full page           | `SettingsPageSkeleton`            | Skeleton cards + sidebar |
| API Keys            | Inline `animate-pulse` divs       | Pulse placeholders       |
| LLM Providers       | `animate-pulse` space inside card | Pulse blocks             |
| Custom Instructions | N/A (inherits from parent)        | None separate            |
| Skills              | `SkillsSkeleton`                  | Pulse rows               |
| MCP Servers         | Inline `animate-pulse` divs       | Pulse placeholders       |
| Tool Call Limit     | N/A (inherits from parent)        | None separate            |
| OAuth Settings      | `Loader2` spinner centered        | **Spinner only**         |

### F. Error States

| Section                | Error Display                                           | Recovery            |
| ---------------------- | ------------------------------------------------------- | ------------------- |
| API Keys query failure | Toast (destructive), fires via useEffect                | Manual page refresh |
| LLM Providers          | Toast per operation                                     | Retry manually      |
| Custom Instructions    | Toast per operation                                     | Retry manually      |
| Skills query failure   | Inline text: "Failed to load skills. Please try again." | No retry button     |
| MCP Servers            | Inline `text-destructive` below URL input               | Fix input and retry |
| Tool Call Limit        | Toast per operation                                     | Retry manually      |
| OAuth Settings         | Toast per operation                                     | Retry manually      |
| Project not found      | Full-card "Project not found" message                   | Back button / nav   |

### G. Empty States

| Section                     | Empty State                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| API Keys (zero keys)        | **Auto-opens create form** with pre-filled name "My first API key" (`api-key-list.tsx:283-288`)  |
| Skills (zero skills)        | Dedicated `SkillsEmptyState` with icon, heading, description, and drag-drop hint                 |
| MCP Servers (zero servers)  | CardContent is not rendered at all -- just an empty card with header and "Add MCP Server" button |
| Custom Instructions (empty) | Shows description text and "Add Instructions" button (good)                                      |
| Tool Call Limit             | Always has a value (defaults from model) -- no empty state needed                                |
| OAuth Settings              | Always renders the form regardless -- no empty state needed                                      |

---

## 3. Established Patterns

These conventions are followed consistently across most settings sections:

1. **Card-per-section layout.** Each section is a `<Card>` with `<CardHeader>` and `<CardContent>`. Titles use `text-lg font-semibold`.

2. **Explicit save buttons.** No auto-save anywhere (except the one toggle described below). Users must click Save/Create to persist changes.

3. **Toast notifications for all mutations.** Every tRPC `onSuccess` and `onError` callback fires a toast with title "Success" or "Error".

4. **DeleteConfirmationDialog for destructive actions.** Used consistently for project deletion, API key deletion, and skill deletion. Uses the shared `AlertState` interface.

5. **AnimatePresence for show/hide transitions.** Edit modes, form reveals, and state transitions consistently use framer-motion with `opacity + height` or `opacity + y` animations at `duration: 0.3`.

6. **EditWithTamboButton in every section title.** Each card includes an inline bot icon that opens a popover for AI-assisted editing. Consistently placed right after the title text.

7. **`withTamboInteractable` wrapping.** Every settings section exports both a raw component and an `Interactable` variant with Zod props schema and suggestions.

8. **Cancel button styling for non-destructive cancel.** Uses `variant="outline"` or `variant="ghost"` consistently.

9. **Disabled state during pending mutations.** Save/Create buttons disable themselves and show either "Saving..." text or a `Loader2` spinner while mutations are in flight.

---

## 4. Outliers and Inconsistencies

### 4.1 Sidebar Navigation Mismatch with Content Order

**Sidebar order (both desktop and mobile):**
API Keys -> LLM Providers -> Custom Instructions -> Skills -> MCP Servers -> Tool Call Limit -> User Authentication

**Label inconsistency:** The sidebar says "User Authentication" but the card title says "OAuth Token Validation" (`project-settings.tsx:471` vs `oauth-settings.tsx:385`).

**Label inconsistency:** The sidebar uses "Tool Call Limit" with capital letters, while other items use sentence case ("API keys", "LLM providers", "Custom instructions"). "Tool Call Limit" breaks the casing pattern. (`project-settings.tsx:375` and `:461`)

### 4.2 Skeleton Mismatch with Actual Content

`SettingsPageSkeleton` renders 5 section skeletons: API Keys, Provider Keys, Custom Instructions, MCP Servers, OAuth. **Missing:** Skills skeleton, Tool Call Limit skeleton. The skeleton shows 5 nav items in the sidebar; the real sidebar shows 7. (`settings-skeletons.tsx:34`)

### 4.3 MCP Server Delete Has No Confirmation

The "Delete" button on an MCP server (`mcp-server-editor.tsx:313-324`) calls `onDelete` directly -- no `DeleteConfirmationDialog`. This is inconsistent with API keys and skills which both use the confirmation dialog pattern. The only time a confirmation appears is when deletion is triggered via the Tambo interactable `shouldDelete` prop, which shows the dialog (`mcp-server-editor.tsx:149-157`).

### 4.4 Copy-to-Clipboard Feedback Inconsistency

Three different copy interactions, three different feedback behaviors:

- API key list item (click to copy): **Zero feedback** -- no toast, no icon change, no "Copied!" text. The `useClipboard` hook's `copied` boolean is destructured away (`api-key-list-item.tsx:36`: `const [, copy] = useClipboard(...)`).
- Inline "Copy" button after key generation: **Zero feedback** -- same issue (`api-key-list.tsx:107`: `const [, copy] = useClipboard(...)`).
- API Key Dialog copy button: **Good feedback** -- icon swaps from Copy to Check for 2 seconds.

### 4.5 Toggle Save Behavior Inconsistency

Three toggles on the settings page, three different save behaviors:

- "Allow system prompt override": Immediate auto-save UNLESS the instructions editor is in edit mode, in which case it's deferred to the explicit save. This is clever but undiscoverable.
- "Token Required" (OAuth): Always deferred -- user must click Save.
- Skill enable/disable: Always immediate.

A user switching between sections has no way to predict whether flipping a toggle takes effect immediately or requires a save.

### 4.6 The "generated key" Inline Display vs Dialog Split

When a new API key is created normally, the key appears **inline** in the card (`api-key-list.tsx:423-485`). When it's the auto-generated "first-tambo-key", it appears in a **modal dialog** (`api-key-dialog.tsx`). Same data, two different presentations based on `keyName === "first-tambo-key"` (`api-key-list.tsx:188`).

### 4.7 Cancel Button Styling Inconsistency

- Custom Instructions cancel: Red text on transparent background (`custom-instructions-editor.tsx:313-315`): `text-red-500 hover:bg-red-500/10`
- MCP Server cancel: Same red text pattern (`mcp-server-editor.tsx:284-287`)
- API Key create cancel: Neutral outline (`api-key-list.tsx:391`)
- Tool Call Limit cancel: Neutral outline (`tool-call-limit-editor.tsx:213`)
- Project name cancel: Neutral outline (`project-settings.tsx:253`)
- LLM Provider API key cancel: Neutral ghost (`provider-key-section.tsx:1338`)

Red cancel buttons imply a destructive action, but cancel is inherently non-destructive. The red styling on cancel is misleading.

### 4.8 No Unsaved Changes Warning for Navigation

When a user has unsaved changes in LLM Providers (tracked by `hasActualChanges`) or OAuth Settings (tracked by `hasUnsavedChanges`) and navigates away via the tab bar (Overview / Observability) or breadcrumb, **all changes are silently lost**. There is no `beforeunload` handler or navigation-blocking prompt.

### 4.9 API Key List Item Copies a Truncated/Masked Key

`api-key-list-item.tsx:36` copies `apiKey.partiallyHiddenKey` to clipboard. This is a masked value like `sk-abc...xyz`. Copying a partially hidden key to the clipboard is useless to the user -- they cannot use a masked key for anything.

### 4.10 hardcoded bg-white in API Key Dialog

`api-key-dialog.tsx:38`: `className="font-mono text-sm bg-white dark:bg-gray-800"` -- uses raw `bg-white` instead of a Tailwind theme token. Breaks if the app ever uses a non-white light-mode background.

---

## 5. What's Working Well

### 5.1 Progressive Disclosure in LLM Providers

The provider/model combobox collapses a complex two-level selection into a single searchable dropdown. Selecting "OpenAI-compatible" reveals additional fields (Model Name, Base URL, Max Input Tokens). Selecting a standard model hides them. The API key section contextualizes to the selected provider. This is well-designed progressive disclosure.

### 5.2 Skills Section -- Drag-and-Drop Import

The Skills card supports drag-and-drop of SKILL.md files with visual feedback (ring color changes, drag state text updates). It validates file types during the drag phase using MIME types and does full validation on drop. The overwrite confirmation dialog when importing a skill with a conflicting name is a nice safeguard.

### 5.3 API Key Section -- Auto-open on Empty

When a project has zero API keys, the create form auto-opens with "My first API key" pre-filled. This eliminates a zero-state dead end and gets the user to the critical first action immediately.

### 5.4 OAuth Presets

The "Apply a preset" dropdown for OAuth configuration is a good Hick's Law optimization. Instead of requiring users to understand OIDC validation modes, they can select "Google" or "GitHub" and the correct mode + endpoints are pre-filled.

### 5.5 API Key Real-time Validation

The LLM Provider section validates API keys in real-time with a debounced server-side check (`provider-key-section.tsx:504-522`). The input border turns red for invalid keys, green text confirms valid keys, and a spinner shows during validation. This is good inline validation UX.

### 5.6 Custom LLM Parameters

The custom LLM parameters editor within the LLM Providers section supports per-provider, per-model parameter configuration with type-aware inputs and parameter suggestions. This is power-user functionality handled through progressive disclosure.

---

## 6. What's a Poor Experience

### 6.1 [Blocker] Copying a Masked API Key is Misleading

**File:** `api-key-list-item.tsx:36-37, 56-60`

The partially hidden key is rendered as a clickable button with `title="Click to copy"`, but copying `sk-abc...xyz` gives the user a useless string. Either:

- Remove the click-to-copy behavior entirely, or
- Don't offer copy on masked keys (the full key is only available at creation time)

Users will click this, paste it into their code, and wonder why it doesn't work.

### 6.2 [Blocker] No Clipboard Feedback on Most Copy Actions

**Files:** `api-key-list.tsx:107`, `api-key-list-item.tsx:36`

Two of the three copy interactions give the user absolutely no feedback. They click, nothing visible happens. The user has no way to know if the copy succeeded without pasting somewhere.

### 6.3 [Friction] Toggle Behavior is Unpredictable

A user toggling "Allow system prompt override" outside edit mode will see an immediate save. The same user toggling "Token Required" in OAuth will see nothing happen until they click Save. There is no visual cue distinguishing immediate-effect toggles from deferred-save toggles.

### 6.4 [Friction] MCP Server Delete Skips Confirmation

**File:** `mcp-server-editor.tsx:313-324`

Deleting an MCP server is a single click with no undo. Every other destructive action in settings uses a confirmation dialog. A mis-click deletes server config that may contain custom headers and auth state.

### 6.5 [Friction] Settings Sidebar Does Not Scroll-Track

The sidebar `activeSection` state is only updated when the user clicks a nav item. It does not update as the user scrolls through content. If a user scrolls to "OAuth Settings" manually, the sidebar still highlights "API Keys" (or whichever was last clicked). This makes the sidebar unreliable as a wayfinding tool.

### 6.6 [Friction] Hidden Scrollbar Removes Scroll Affordance

**File:** `project-settings.tsx:482`

The content pane uses `[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]` to hide the scrollbar. Users on non-trackpad devices have no visual indication that the content is scrollable. The sidebar nav compensates partially, but only if users notice it.

### 6.7 [Friction] Project Name Fetch is Wasteful

**File:** `project-settings.tsx:68-74` and `[projectId]/layout.tsx:44-46`

Both the settings page and the project layout fetch `getUserProjects` (the full list) and filter client-side. This query runs twice, and if the user has 50 projects, both components download all 50 to find the one they need. There should be a `getProjectById` query (one exists per `custom-llm-parameters/editor.tsx:57`).

### 6.8 [Friction] Mobile Navigation Label is Broken

**File:** `project-settings.tsx:290-291`

The mobile nav button shows the active section via: `activeSection.replace("-", " ").split(" ").join(" ")`. This replaces the first hyphen with a space, then splits on spaces and re-joins with spaces -- which is a no-op for multi-hyphen strings. "oauth-settings" displays as "oauth settings" (lowercase, no "User Authentication" label). The transform should map to the display label, not do string gymnastics.

### 6.9 [Enhancement] No Keyboard Navigation for Sidebar

The sidebar is built from `<Button>` elements, so it is technically focusable. But there is no arrow-key navigation between items, no `role="tablist"` / `role="tab"` semantics, and no focus management when a section is selected.

---

## 7. Performance and Optimization

### 7.1 Duplicate Data Fetching

`getUserProjects` is called in:

- `project-settings.tsx:72` (settings page)
- `[projectId]/layout.tsx:44` (layout breadcrumb)

Both run the same query with client-side filtering. React Query deduplication may handle this if the query keys match, but it's still fetching the entire project list when a single-project endpoint exists.

### 7.2 Excessive useEffect Chains in Provider Key Section

`provider-key-section.tsx` has **13 separate `useEffect` hooks** for syncing interactable props to local state (lines ~422-501). Each of these fires on a single prop change and does a `setState`. This creates cascading renders when Tambo updates multiple props simultaneously. A reducer or a single sync effect would reduce render cycles.

### 7.3 OAuth Settings has 8 useEffect Hooks

`oauth-settings.tsx` similarly has 8 `useEffect` hooks for prop syncing. The pattern is identical: one per Tambo interactable prop.

### 7.4 Full Page Re-render on Any Section Change

`ProjectSettings` holds refs and state for all 7 sections. When any section calls `onEdited` -> `handleRefreshProject`, it refetches the entire project and triggers a re-render of the parent and all children. Each section should ideally manage its own data lifecycle.

---

## 8. Accessibility

### 8.1 API Key List Item Copy Button

`api-key-list-item.tsx:55-61`: The "click to copy" element is a `<button>`, which is correct. It has `title="Click to copy"` but no `aria-label`. Screen reader users hear the truncated key text, which is cryptic.

### 8.2 Missing aria-label on Delete Buttons

- Project delete button (`project-settings.tsx:229-249`): No `aria-label`. Screen readers announce "Delete" which is ambiguous.
- API key trash button (`api-key-list-item.tsx:64-69`): No `aria-label`. Screen readers don't know which key is being deleted.

**Contrast:** Skill card buttons have good `aria-label` attributes (`skill-card.tsx:47,54,63`).

### 8.3 Mobile Navigation Missing ARIA

The mobile dropdown (`project-settings.tsx:283-396`) is built with a `<Button>` that toggles a `div` of more buttons. This is not an accessible disclosure pattern. Missing: `aria-expanded`, `aria-controls`, and the dropdown `div` should have `role="menu"` or similar.

### 8.4 Sidebar Has No Landmark or Role

The sidebar nav (`project-settings.tsx:401-477`) is a `<div>` with buttons. It lacks `role="navigation"` or a `<nav>` element, making it invisible to screen reader landmark navigation.

### 8.5 Scrollable Content Area Has No Focus Management

When a sidebar item is clicked and the content scrolls, focus does not move to the target section. Screen reader users have no way to know the page scrolled.

### 8.6 Color-Only Status Indicators

LLM provider model status badges (tested/untested/known-issues) use color only: green, gray, yellow. No icon, no pattern differentiation. (`provider-key-section.tsx:1118-1129`)

### 8.7 OAuth Warning Uses Color Only

The warning about missing User Info Endpoint (`oauth-settings.tsx:483-491`) uses `bg-amber-50 border-amber-200 text-amber-800` -- amber tones that may not be distinguishable from surrounding elements for colorblind users. It does include an `AlertTriangle` icon, which helps.

---

## 9. Prioritized Recommendations

### Blockers (Must Fix)

| #   | Issue                                        | Recommendation                                                                                                                                                                                             |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | Masked key copy is misleading                | Remove click-to-copy on `api-key-list-item.tsx`. The partially hidden key should be display-only. If copy is desired, toast "This is a masked key preview. Full keys can only be copied at creation time." |
| B2  | No copy feedback on 2 of 3 copy interactions | Use the `copied` boolean from `useClipboard` to show a checkmark or "Copied!" state, matching the `APIKeyDialog` pattern.                                                                                  |

### Friction (Should Fix)

| #   | Issue                                                            | Recommendation                                                                                                                                                            |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | MCP server delete lacks confirmation                             | Add `DeleteConfirmationDialog` to match API keys and skills.                                                                                                              |
| F2  | Toggle save behavior is inconsistent                             | Pick one pattern. Recommendation: all toggles save immediately with optimistic UI. If deferred save is needed, add a visible "unsaved changes" indicator near the toggle. |
| F3  | "User Authentication" vs "OAuth Token Validation" label mismatch | Use one label everywhere.                                                                                                                                                 |
| F4  | Sidebar does not scroll-track                                    | Add an `IntersectionObserver` on each section ref to update `activeSection` as the user scrolls.                                                                          |
| F5  | Mobile nav label shows raw slug                                  | Map `activeSection` to a display-label lookup instead of string replacement.                                                                                              |
| F6  | No unsaved-changes warning on navigation                         | Add a `beforeunload` handler when `hasActualChanges` or `hasUnsavedChanges` is true.                                                                                      |
| F7  | Skeleton doesn't match real content                              | Add Skills and Tool Call Limit skeletons. Update sidebar skeleton to show 7 items.                                                                                        |
| F8  | Hidden scrollbar removes scroll affordance                       | Either show a subtle scrollbar or use `scrollbar-gutter: stable` to reserve space.                                                                                        |

### Enhancements (Nice to Have)

| #   | Issue                                                        | Recommendation                                                                                                   |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| E1  | Cancel buttons styled red in 2 sections                      | Use neutral `variant="outline"` or `variant="ghost"` everywhere for cancel. Reserve red for destructive actions. |
| E2  | Title casing inconsistent in sidebar                         | Standardize: either all sentence case or all title case.                                                         |
| E3  | `getUserProjects` fetched twice for client-side filter       | Use `getProjectById` (already exists) instead of fetching the full list.                                         |
| E4  | 13+ useEffects in provider-key-section                       | Consolidate interactable prop-sync into a single effect or custom hook.                                          |
| E5  | Accessibility: sidebar needs `<nav>` landmark                | Wrap sidebar in `<nav aria-label="Settings sections">`.                                                          |
| E6  | Accessibility: API key delete/copy buttons need `aria-label` | Add descriptive labels including the key name.                                                                   |
| E7  | Accessibility: mobile nav needs disclosure pattern           | Use Radix Collapsible or add `aria-expanded`, `aria-controls`, and `role`.                                       |
| E8  | hardcoded `bg-white` in API key dialog                       | Replace with `bg-background`.                                                                                    |

---

## Appendix: File Reference Index

All file paths are relative to `/Users/seth/repositories/tambo/apps/web/`:

| File                                                                                     | Purpose                                         |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `app/(authed)/(dashboard)/[projectId]/settings/page.tsx`                                 | Settings route entry point                      |
| `app/(authed)/(dashboard)/[projectId]/layout.tsx`                                        | Project layout with tabs and breadcrumbs        |
| `components/dashboard-components/project-settings.tsx`                                   | Main settings orchestrator (sidebar + sections) |
| `components/dashboard-components/delete-confirmation-dialog.tsx`                         | Shared destructive action confirmation          |
| `components/dashboard-components/project-details/api-key-list.tsx`                       | API key CRUD section                            |
| `components/dashboard-components/project-details/api-key-list-item.tsx`                  | Individual API key row                          |
| `components/dashboard-components/project-details/api-key-dialog.tsx`                     | First-key-only modal dialog                     |
| `components/dashboard-components/project-details/provider-key-section.tsx`               | LLM provider + model + API key config           |
| `components/dashboard-components/project-details/agent-settings.tsx`                     | Agent mode sub-form                             |
| `components/dashboard-components/project-details/custom-instructions-editor.tsx`         | Custom instructions textarea + toggle           |
| `components/dashboard-components/project-details/skills-section.tsx`                     | Skills list + create/import                     |
| `components/dashboard-components/project-details/skill-card.tsx`                         | Individual skill row                            |
| `components/dashboard-components/project-details/skill-form.tsx`                         | Skill create/edit form                          |
| `components/dashboard-components/project-details/available-mcp-servers.tsx`              | MCP servers list                                |
| `components/dashboard-components/project-details/mcp-server-row.tsx`                     | MCP server state/mutation orchestrator          |
| `components/dashboard-components/project-details/mcp-server-editor.tsx`                  | MCP server form UI                              |
| `components/dashboard-components/project-details/mcp-server-tools-dialog.tsx`            | MCP server tool inspection dialog               |
| `components/dashboard-components/project-details/headers-editor.tsx`                     | Reusable HTTP headers key-value editor          |
| `components/dashboard-components/project-details/tool-call-limit-editor.tsx`             | Tool call limit config                          |
| `components/dashboard-components/project-details/oauth-settings.tsx`                     | OAuth validation config                         |
| `components/dashboard-components/project-details/custom-llm-parameters/editor.tsx`       | Custom LLM parameters editor                    |
| `components/dashboard-components/project-details/custom-llm-parameters/editor-modes.tsx` | View/Edit mode components                       |
| `components/skeletons/settings-skeletons.tsx`                                            | Loading skeletons                               |
| `components/ui/tambo/edit-with-tambo-button.tsx`                                         | Inline AI edit popover                          |
| `hooks/use-clipboard.ts`                                                                 | Clipboard hook with auto-reset                  |
| `hooks/use-toast.ts`                                                                     | Toast notification hook                         |
