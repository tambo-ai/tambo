---
name: settings-component-patterns
description: >-
  Enforce consistent UI patterns for settings sections in apps/web. Covers card layout, toasts,
  confirmation dialogs, destructive styling, and save behaviors. Use when: (1) creating or modifying
  settings sections, (2) editing files in apps/web/**/settings/ or
  apps/web/components/dashboard-components/project-details/, (3) adding features to the settings page,
  (4) reviewing settings-related code.
metadata:
  internal: true
---

# Settings Component Patterns

Consistent UI patterns for settings sections in Tambo Cloud (`apps/web`).

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

- Always include `EditWithTamboButton` in `CardTitle` with a descriptive `description` prop
- Wrap the component with `withTamboInteractable()` for AI-driven interactions
- Use `CardDescription` for section descriptions, not raw `<p>`

**Reference:** `project-details/tool-call-editor.tsx`, `project-details/oauth-settings.tsx`

## Toast Notifications

Every mutation shows a toast on both success and error:

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

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

Always invalidate the relevant query in `onSuccess` before toasting. Never skip the error toast.

## Confirmation Dialogs

All destructive actions require confirmation via `DeleteConfirmationDialog`:

```tsx
import { DeleteConfirmationDialog } from "@/components/dashboard-components/delete-confirmation-dialog";

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

- Title includes the item name: `Delete "${name}"?`
- Description warns the action cannot be undone
- Non-destructive actions (save, toggle) skip confirmation

**Reference:** `project-details/skills-section.tsx`, `project-details/api-key-list.tsx`

## Destructive Action Styling

```tsx
// Icon button (inline delete)
<Button variant="ghost" size="icon"
  className="text-destructive hover:text-destructive hover:bg-destructive/10">
  <Trash2 className="h-4 w-4" />
</Button>

// Confirmation dialog action
<AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
```

- Use `text-destructive` semantic color, never `text-red-500`
- Use `hover:bg-destructive/10` for ghost variant hover
- Cancel/discard buttons are NOT destructive
- Use `Trash2` icon from `lucide-react`

## Save Behavior

### Toggles: Immediate Save

Fire mutation on change, no save button:

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

Text and number inputs use edit mode with explicit Save and Cancel:

- Track `isEditing`, `savedValue`, and `displayValue` state
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
