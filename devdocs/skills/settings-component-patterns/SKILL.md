---
name: settings-component-patterns
description: >-
  Use this skill when building or modifying any settings UI in apps/web, even if the user just says
  "add a toggle" or "let users delete X." Covers the required Card layout, toast notifications,
  confirmation dialogs, destructive action styling, and save behaviors (toggle vs edit/save/cancel).
  Trigger on: editing files in apps/web/**/settings/ or project-details/, adding settings features,
  wiring up mutations with toasts, or adding delete/remove actions in settings. Includes a validation
  script. Not for deciding where a feature belongs (use settings-feature-placement instead).
metadata:
  internal: true
---

# Settings Component Patterns

Consistent UI patterns for settings sections in Tambo Cloud (`apps/web`).

## Available scripts

- **`scripts/check-settings-section.sh`** -- verifies a settings component has required patterns (EditWithTamboButton, withTamboInteractable, useToast, destructive variant, Card layout). Run from repo root:

```bash
bash devdocs/skills/settings-component-patterns/scripts/check-settings-section.sh <component-file>
```

## Gotchas

- **`EditWithTamboButton` goes inside `CardTitle`**, not as a sibling of `CardHeader`. It must have a `description` prop explaining what the section configures.
- **`withTamboInteractable()` wraps the component export**, not the JSX. Forgetting it breaks AI-driven interactions.
- **Always call the `onEdited` callback** after successful mutations. Forgetting it leaves the parent displaying stale data.
- **Invalidate the query before toasting** in `onSuccess`. Reversing the order can show a success toast while the UI still displays old data.
- **Use `DeleteConfirmationDialog`**, never inline `AlertDialog` for destructive confirmations. It handles the state shape (`show`, `title`, `description`, `data`) consistently.
- **Use `text-destructive` semantic color**, never `text-red-500`. Cancel/discard buttons are NOT destructive.

## Card Layout

Every settings section uses this structure:

```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EditWithTamboButton } from "@tambo-ai/react";

<Card>
  <CardHeader>
    <CardTitle className="text-lg font-semibold">
      Section Name
      <EditWithTamboButton description="Brief description of what this section configures..." />
    </CardTitle>
    <CardDescription className="text-sm font-sans text-foreground">
      Optional longer description.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Controls and form fields */}
  </CardContent>
</Card>;
```

**Reference:** `project-details/tool-call-limit-editor.tsx`, `project-details/oauth-settings.tsx`

## Toast Notifications

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

## Confirmation Dialogs

All destructive actions require `DeleteConfirmationDialog` from `@/components/dashboard-components/delete-confirmation-dialog`:

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

**Reference:** `project-details/skills-section.tsx`, `project-details/api-key-list.tsx`

## Destructive Action Styling

```tsx
// Inline delete button
<Button variant="ghost" size="icon"
  className="text-destructive hover:text-destructive hover:bg-destructive/10">
  <Trash2 className="h-4 w-4" />
</Button>

// Confirmation dialog action
<AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
```

Use `Trash2` from `lucide-react`. Use `hover:bg-destructive/10` for ghost variant hover.

## Save Behavior

**Default:** Use immediate save for toggles, edit/save/cancel for everything else.

### Toggles: Immediate Save

```tsx
<Switch
  checked={isEnabled}
  onCheckedChange={(checked) => {
    toggleMutation.mutate({ projectId, settingId, enabled: checked });
  }}
  disabled={isToggling}
  aria-label={`${isEnabled ? "Disable" : "Enable"} ${settingName}`}
/>
```

### Form Fields: Edit/Save/Cancel

Track `isEditing`, `savedValue`, and `displayValue` state:

- Cancel reverts `displayValue` to `savedValue` and exits edit mode
- Save button disabled during mutation, shows "Saving..."
- `autoFocus` on first input when entering edit mode
- Toggle inside a form batches with the form's save; standalone toggles save immediately

**Reference:** `project-details/custom-instructions-editor.tsx`

## Registering a New Section

In `project-settings.tsx`:

1. Create a ref: `const newSectionRef = useRef<HTMLDivElement>(null)`
2. Add to sidebar navigation (both desktop and mobile)
3. Add section `<div ref={newSectionRef}>` in content area in correct order
4. Wrap with `withTamboInteractable()`
5. Pass `projectId` and `onEdited` callback

### Validation

1. Run the check script on your component:

   ```bash
   bash devdocs/skills/settings-component-patterns/scripts/check-settings-section.sh <your-file>
   ```

2. If any checks fail, fix them and re-run until all pass.
3. Manually verify items the script cannot check:
   - [ ] Section appears in both desktop and mobile sidebar
   - [ ] Clicking the sidebar item scrolls to the section
   - [ ] Mutations show toasts on both success and error
   - [ ] Query invalidation refreshes displayed data
