---
name: building-settings-ui
description: >-
  Use this skill when adding or modifying settings UI in Tambo Cloud. Covers where a new settings
  section belongs (project vs agent category, route structure, sidebar registration) and the
  component patterns used across settings (card layout, toasts, confirmation dialogs, destructive
  styling, save behavior conventions). Triggers on "add a new settings section", "where should X
  go?", "settings UI", "settings page", or any work touching
  apps/web/components/dashboard-components/project-details/ or project-settings.tsx.
  Not for full-stack feature building (DB, tRPC, tests); those patterns will get their own skills.
metadata:
  internal: true
---

# Building Settings UI

Guide for placing and styling settings sections in the Tambo Cloud dashboard. Covers two concerns: where a feature belongs in the navigation, and how to build the UI component to match existing patterns.

## Gotchas

1. **Settings subsections are scroll targets, NOT routes**. Do not create a new route under `settings/`. All sections render within `settings/page.tsx`.
2. **Agent and Project sections are grouped**. Do not interleave. Check the current order table before placing a new section.
3. **Do not add a new top-level tab** without explicit team alignment. Current tabs (Overview, Observability, Settings) have been stable.
4. **Settings page sidebar nav must be updated in TWO places**: the desktop sidebar and the mobile dropdown menu. Missing one creates a broken nav on that viewport.
5. **`EditWithTamboButton` goes inside `CardTitle`**, not as a sibling of `CardHeader`. It must have a `description` prop explaining what the section configures.
6. **Invalidate the query before toasting** in `onSuccess`. Reversing the order can show a success toast while the UI still displays old data.
7. **Use `DeleteConfirmationDialog`**, never inline `AlertDialog` for destructive confirmations.
8. **Use `text-destructive` semantic color**, never `text-red-500`. Cancel/discard buttons are NOT destructive.

---

## Feature Placement

### Settings Sections (current order)

| #   | Section             | Category | Component                                        |
| --- | ------------------- | -------- | ------------------------------------------------ |
| 1   | API Keys            | Project  | `project-details/api-key-list.tsx`               |
| 2   | LLM Providers       | Agent    | `project-details/provider-key-section.tsx`       |
| 3   | Custom Instructions | Agent    | `project-details/custom-instructions-editor.tsx` |
| 4   | Skills              | Agent    | `project-details/skills-section.tsx`             |
| 5   | MCP Servers         | Agent    | `project-details/available-mcp-servers.tsx`      |
| 6   | Tool Call Limit     | Agent    | `project-details/tool-call-limit-editor.tsx`     |
| 7   | User Authentication | Project  | `project-details/oauth-settings.tsx`             |

**Container:** `apps/web/components/dashboard-components/project-settings.tsx`

### Placement Decision Tree

1. **Configures AI agent behavior?** (model selection, prompts, tools, memory, context) -> **Agent** category, grouped with LLM Providers through Tool Call Limit.
2. **Configures project infrastructure?** (API keys, auth, team access, billing, webhooks) -> **Project** category, grouped with API Keys and User Authentication.
3. **Monitoring or debugging view?** -> **Observability** tab.
4. **High-level summary or status?** -> **Overview** tab.
5. **None of the above?** -> Ask the user.

### Registering a New Section

Four changes in `project-settings.tsx`:

1. **Import** the component
2. **Add a ref**: `const myFeatureRef = useRef<HTMLDivElement>(null)`
3. **Add to sidebar nav** in BOTH the desktop sidebar (`hidden sm:block` div) AND the mobile dropdown (`sm:hidden` div)
4. **Add the section** in the scrollable content area, placed in the correct category group

Also add the ref to the `scrollToSection` refs map.

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
// Inline delete button
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

**Reference implementations:** `custom-instructions-editor.tsx` (edit/save/cancel), `tool-call-limit-editor.tsx` (simpler form).
