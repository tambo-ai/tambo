---
name: building-settings-ui
description: >-
  Use this skill when adding or modifying settings UI in Tambo Cloud. Covers where a new settings
  section belongs (Agent tab vs Settings tab), and the component patterns used across both pages
  (card layout, toasts, confirmation dialogs, destructive styling, save behavior conventions).
  Triggers on "add a new settings section", "where should X go?", "settings UI", "settings page",
  "agent page", or any work touching apps/web/components/dashboard-components/project-details/,
  project-settings.tsx, or agent-settings.tsx.
  Not for full-stack feature building (DB, tRPC, tests); those patterns will get their own skills.
metadata:
  internal: true
---

# Building Settings UI

Guide for placing and styling settings sections in the Tambo Cloud dashboard. Covers two concerns: where a feature belongs (which tab/page), and how to build the UI component to match existing patterns.

## Architecture

Settings are split across two top-level tabs in the project layout:

- **Agent tab** (`/[projectId]/agent`) - How the AI agent behaves
- **Settings tab** (`/[projectId]/settings`) - Project infrastructure and access

Each tab renders a flat vertical stack of Card components. There is no sidebar navigation; each page is short enough to scroll naturally.

### Tab layout

```
Overview | Observability | Agent | Settings
```

- Layout file: `apps/web/app/(authed)/(dashboard)/[projectId]/layout.tsx`
- Agent page: `apps/web/app/(authed)/(dashboard)/[projectId]/agent/page.tsx`
- Settings page: `apps/web/app/(authed)/(dashboard)/[projectId]/settings/page.tsx`

## Gotchas

1. **Do not add a new top-level tab** without explicit team alignment. Current tabs (Overview, Observability, Agent, Settings) have been stable.
2. **`EditWithTamboButton` goes inside `CardTitle`**, not as a sibling of `CardHeader`. It must have a `description` prop explaining what the section configures.
3. **Invalidate the query before toasting** in `onSuccess`. Reversing the order can show a success toast while the UI still displays old data.
4. **Use `DeleteConfirmationDialog`**, never inline `AlertDialog` for destructive confirmations.
5. **Use `text-destructive` semantic color**, never `text-red-500`. Cancel/discard buttons are NOT destructive.

---

## Feature Placement

### Agent Tab Sections

| #   | Section             | What it configures                                 | Component                        |
| --- | ------------------- | -------------------------------------------------- | -------------------------------- |
| 1   | Model               | Provider + model selection, API key, custom params | `provider-key-section.tsx`       |
| 2   | Custom Instructions | System prompt, prompt override toggle              | `custom-instructions-editor.tsx` |
| 3   | Skills              | Skill definitions and imports                      | `skills-section.tsx`             |
| 4   | Tool Call Limit     | Max tool calls per response                        | `tool-call-limit-editor.tsx`     |
| 5   | MCP                 | MCP server URLs + headers                          | `available-mcp-servers.tsx`      |

**Container:** `apps/web/components/dashboard-components/agent-settings.tsx`

### Settings Tab Sections

| #   | Section        | What it configures             | Component                  |
| --- | -------------- | ------------------------------ | -------------------------- |
| 1   | Name           | Project display name           | `project-name-section.tsx` |
| 2   | API Keys       | API key list + create          | `api-key-list.tsx`         |
| 3   | Authentication | OAuth mode, token requirements | `oauth-settings.tsx`       |
| 4   | Danger Zone    | Project deletion               | `danger-zone-section.tsx`  |

**Container:** `apps/web/components/dashboard-components/project-settings.tsx`

All section components live in `apps/web/components/dashboard-components/project-details/`.

### Placement Decision Tree

1. **Configures AI agent behavior?** (model selection, prompts, tools, memory, context) -> **Agent tab**
2. **Configures project infrastructure?** (API keys, naming, deletion, billing, webhooks) -> **Settings tab**
3. **Configures who can access?** (auth, tokens, team members, permissions) -> **Settings tab**
4. **Monitoring or debugging view?** -> **Observability tab**
5. **High-level summary or status?** -> **Overview tab**
6. **None of the above?** -> Ask the user.

### Adding a New Section

1. **Create the component** in `project-details/` following the Card layout pattern below.
2. **Import and render** in the correct container (`agent-settings.tsx` or `project-settings.tsx`).
3. **Update the skeleton** in `settings-skeletons.tsx` (either `AgentPageSkeleton` or `SettingsPageSkeleton`).

---

## Component Patterns

### Card Layout

Every settings section uses `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`.

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg font-semibold">
      Section Name
      <EditWithTamboButton description="Configure section settings..." />
    </CardTitle>
    <CardDescription className="text-sm font-sans text-foreground">
      Description of what this section does.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">{/* Content */}</CardContent>
</Card>
```

### Toast Notifications

Every mutation shows a toast on both success and error. Import `useToast` from `@/hooks/use-toast`.

```tsx
const mutation = api.someRoute.someMutation.useMutation({
  onSuccess: async () => {
    await utils.someRoute.someQuery.invalidate();
    toast({ title: "Success", description: "Setting updated successfully" });
  },
  onError: () => {
    toast({
      title: "Error",
      description: "Failed to update setting",
      variant: "destructive",
    });
  },
});
```

Never skip the error toast.

### Confirmation Dialogs

All destructive actions use `DeleteConfirmationDialog` from `@/components/dashboard-components/delete-confirmation-dialog`:

```tsx
const [alertState, setAlertState] = useState<{
  show: boolean;
  title: string;
  description: string;
  data?: { id: string };
}>({ show: false, title: "", description: "" });

<DeleteConfirmationDialog
  mode="single"
  alertState={alertState}
  setAlertState={setAlertState}
  onConfirm={handleConfirmDelete}
/>;
```

Title includes the item name (`Delete "${name}"?`). Description warns the action cannot be undone.

### Destructive Action Styling

```tsx
<Button
  variant="ghost"
  size="icon"
  className="text-destructive hover:text-destructive hover:bg-destructive/10"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

Use `Trash2` from `lucide-react`. Use `hover:bg-destructive/10` for ghost variant hover.

### Save Behavior

**Toggles: Immediate save.** `onCheckedChange` fires the mutation directly. Include `aria-label` with state context.

**Form fields: Edit/Save/Cancel.** Track `isEditing`, `savedValue`, and `displayValue` state. Cancel reverts to `savedValue`. Save button disabled during mutation, shows "Saving...". `autoFocus` on first input when entering edit mode.

**Reference implementations:** `custom-instructions-editor.tsx` (edit/save/cancel), `tool-call-limit-editor.tsx` (simpler form), `project-name-section.tsx` (basic edit/save/cancel).

### Danger Zone Pattern

For irreversible destructive actions, use the Danger Zone card pattern:

```tsx
<Card className="border-destructive/50">
  <CardHeader>
    <CardTitle>Danger Zone</CardTitle>
    <CardDescription>Warning about permanence.</CardDescription>
  </CardHeader>
  <CardContent>
    <Button
      variant="ghost"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      aria-label="Delete this project"
    >
      Delete this project
    </Button>
  </CardContent>
</Card>
```

The `DeleteConfirmationDialog` should be owned by the parent component that handles the mutation and post-delete navigation.
