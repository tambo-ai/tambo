---
name: ui-patterns
description: >-
  Use this skill when building, modifying, or reviewing UI components in apps/web. Covers layout
  primitives (SettingsSection, SettingsRow), interaction patterns (toggles, inline edits, textareas,
  lists), page structure (Agent tab, Settings tab), pattern selection, feature placement (which tab),
  toasts, confirmation dialogs, destructive actions, Tambo interactable wrappers, and adding new
  settings sections. Triggers on any work touching apps/web/components/, layout decisions, "which
  pattern should I use", "how should this look", "where should this setting go", "settings UI",
  "agent page", "settings page", or UI consistency reviews. Not for backend/API work or database
  changes.
---

# UI Patterns

Canonical interaction and layout patterns for the Tambo Cloud web app. Use this as the source of truth when building new UI or reviewing existing components for consistency.

This is a living document. Patterns documented here reflect what has been standardized so far. New patterns will be added as more surfaces are covered.

---

## Layout Primitives

Two components form the backbone of structured settings and detail pages.

### SettingsSection

Groups related settings inside a titled card. Lives in `apps/web/components/ui/settings-section.tsx`.

```
┌─ Title ──────────────────────────── Action ─┐
│                                              │
│  ┌─ CardContent (divide-y) ───────────────┐  │
│  │  Row 1                                 │  │
│  │──────────────────────────────────────── │  │
│  │  Row 2                                 │  │
│  │──────────────────────────────────────── │  │
│  │  Row 3                                 │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

Props: `title`, `description?`, `action?`, `cardClassName?`, `bordered?` (defaults to `true`)

When `bordered={false}`, children render directly without a Card wrapper. Use for full-width content like textareas that don't belong inside a card.

The `CardContent` uses `divide-y divide-border` to draw separator lines between direct children. Every direct child gets a divider. If children are wrapped in a container `<div>`, the dividers disappear. Use fragments (`<>...</>`) when conditionally rendering multiple rows.

```tsx
// Correct: rows are direct children, dividers appear
<SettingsSection title="Behavior">
  <ToggleRow />
  <LimitRow />
  <MemoryRow />
</SettingsSection>

// Wrong: wrapper div swallows the dividers
<SettingsSection title="Behavior">
  <div>
    <ToggleRow />
    <LimitRow />
  </div>
</SettingsSection>

// Correct: conditional rows use fragment
{mode === "llm" && (
  <>
    <ProviderRow />
    <TokenLimitRow />
    <ApiKeyRow />
  </>
)}
```

### SettingsRow

Single setting with label/description on the left, control on the right. Lives in `apps/web/components/ui/settings-row.tsx`.

```
┌──────────────────────────────────────────────┐
│  Label                          [Control]    │
│  Description text                            │
└──────────────────────────────────────────────┘
```

Props: `label`, `description?`, `htmlFor?`, `children`, `className?`

The left column is `flex-1 min-w-0` (takes available space, truncates if needed). The right column is `shrink-0` (never compresses). This works for compact controls (switches, selects, short inputs, buttons). It breaks for wide controls (long code blocks, full-width inputs). See "When SettingsRow Breaks" below.

---

## Interaction Patterns

### Pattern 1: Toggle Switch

For boolean settings that save immediately on change.

```tsx
<SettingsRow label="Enable memory" description="...">
  <Switch
    checked={value}
    onCheckedChange={handleChange}
    disabled={isPending}
    aria-label="Enable memory"
  />
</SettingsRow>
```

State: `useState` for optimistic local value. Revert on API error.
Save: Immediate on `onCheckedChange`. No Save/Cancel buttons.
Examples: `memory-settings.tsx`, `system-prompt-override-toggle.tsx`

### Pattern 2: Select / Enum

For picking from a fixed set of options.

```tsx
<SettingsRow label="AI Mode" description="..." htmlFor={id}>
  <Select value={mode} onValueChange={handleChange}>
    <SelectTrigger id={id} className="w-[140px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="llm">LLM</SelectItem>
      <SelectItem value="agent">Agent</SelectItem>
    </SelectContent>
  </Select>
</SettingsRow>
```

Width: Constrain the trigger (`w-[140px]`, `w-[200px]`) so it doesn't stretch.
Examples: `provider-key-section.tsx` (AI Mode select)

### Pattern 3: Inline Edit (Number / Short String)

For simple values that toggle between view and edit mode inside the same SettingsRow.

View mode: display value + Edit button.
Edit mode: input + Cancel + Save.

```tsx
<SettingsRow label="Tool call limit" description="...">
  {isEditing ? (
    <div className="flex items-center gap-2">
      <Input className="w-20 text-right tabular-nums" autoFocus />
      <Button size="sm" variant="outline">
        Cancel
      </Button>
      <Button size="sm">Save</Button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium tabular-nums">{value}</span>
      <Button variant="outline" size="sm">
        Edit
      </Button>
    </div>
  )}
</SettingsRow>
```

The row itself never changes or disappears. Only the right side swaps.
Keyboard: Enter to save, Escape to cancel, autoFocus on edit entry.
Input width: `w-20` for numbers, `w-48` for short strings.
Examples: `tool-call-limit-editor.tsx`, `project-name-section.tsx`

### Pattern 4: Combobox / Searchable Select

For selecting from a large list with search.

```tsx
<SettingsRow label="Provider and Model" description="...">
  <Combobox
    items={options}
    value={selected}
    onChange={handleChange}
    placeholder="Select provider and model"
    searchPlaceholder="Search..."
    emptyText="No results."
  />
</SettingsRow>
```

Works inside SettingsRow because the Combobox popover expands on click but the trigger is compact.
Examples: `provider-key-section.tsx` (Provider and Model)

### Pattern 5: Textarea (Breaks Out of Card)

For large text content that needs full width. Uses `SettingsSection` with `bordered={false}` for the header, then renders the textarea directly.

```tsx
<SettingsSection
  title="Instructions"
  description="Added to each conversation to guide how your agent responds."
  action={<EditWithTamboButton ... />}
  bordered={false}
>
  <Textarea
    value={displayValue}
    onChange={handleChange}
    placeholder="..."
    className="min-h-[150px] w-full"
  />
  {isEditing && (
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="outline">Cancel</Button>
      <Button size="sm">Save</Button>
    </div>
  )}
</SettingsSection>
```

`bordered={false}` renders children directly without the Card/CardContent wrapper, but still gives you the consistent section header (title, description, action button).
Keyboard: Cmd/Ctrl+Enter to save, Escape to cancel.
Examples: `custom-instructions-editor.tsx`

### Pattern 6: Stacked Layout (Wide Content)

When a SettingsRow control is too wide to sit beside the label (long code blocks, full-width inputs with adjacent buttons), use a stacked layout: title + description + action button on top, full-width content below.

```tsx
<div className="px-4 py-3 space-y-2">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold">API key for OpenAI</p>
      <p className="text-sm text-muted-foreground">Description.</p>
    </div>
    <Button size="sm" variant="outline" className="shrink-0">
      Edit
    </Button>
  </div>
  <code className="block truncate rounded-md border bg-background px-2 py-1.5 font-mono text-sm">
    {maskedValue}
  </code>
</div>
```

Use `px-4 py-3` to match SettingsRow internal padding. This is a direct child of `CardContent` so it still gets `divide-y` separators.
Examples: `provider-key-section.tsx` (API key row)

### Pattern 7: List with Action Bar

For collections of items with add/delete. Description on the left, Add button on the right, items below.

```tsx
<div className="px-4 py-3 space-y-4">
  <div className="flex items-center justify-between">
    <p className="text-sm text-muted-foreground">
      Description of what these items are.
    </p>
    <Button size="sm">
      <Plus className="h-4 w-4 mr-1" />
      Add Item
    </Button>
  </div>
  {/* Item list */}
  {items.map((item) => (
    <ItemRow key={item.id} />
  ))}
</div>
```

The description + Add button row mirrors the Skills section pattern.
Delete actions use `DeleteConfirmationDialog` for persisted items.
Examples: `api-key-list.tsx`, `skills-section.tsx`

### Pattern 8: ViewMode / EditMode Toggle

For complex editors that switch between a summary view (SettingsRow) and a full editing interface.

```tsx
// ViewMode: compact summary in a SettingsRow
<SettingsRow label="Custom LLM parameters" description="2 parameters configured.">
  <Button variant="outline" size="sm">Edit</Button>
</SettingsRow>

// EditMode: expanded form with full padding
<div className="px-4 py-3">
  {/* Parameter rows, suggestions, Add/Save/Cancel buttons */}
</div>
```

ViewMode uses SettingsRow. EditMode replaces it entirely with a padded container.
The outer component uses `AnimatePresence` to switch between them.
Examples: `custom-llm-parameters/editor-modes.tsx`

---

## When SettingsRow Breaks

SettingsRow assumes the control on the right is compact. It fails when:

1. **The control is a long code/text block** (API keys, masked secrets). The code block pushes the label column to zero width.
2. **The control contains a full-width input + multiple buttons**. The flex row can't fit label + input + buttons.
3. **The control has unpredictable width** (user-generated content).

When this happens, use Pattern 6 (Stacked Layout) instead. Keep `px-4 py-3` padding so it aligns with adjacent SettingsRows inside the same card.

---

## Pattern Selection

```
Is it a boolean on/off?
  -> Pattern 1 (Toggle Switch)

Is it picking from a fixed list?
  -> Pattern 2 (Select)

Is it a number or short string?
  -> Pattern 3 (Inline Edit)

Is it picking from a large searchable list?
  -> Pattern 4 (Combobox)

Is it a large text field?
  -> Pattern 5 (Textarea, no card)

Is the control too wide for a row?
  -> Pattern 6 (Stacked Layout)

Is it a list of items with add/delete?
  -> Pattern 7 (List with Action Bar)

Is it a complex editor with view/edit modes?
  -> Pattern 8 (ViewMode / EditMode Toggle)
```

---

## Page Structure

### Agent Tab

Container: `agent-settings.tsx`. AI behavior configuration.

```
Model (SettingsSection + card)
  AI Mode (SettingsRow, select)
  Provider and Model (SettingsRow, combobox)
  Input token limit (SettingsRow, inline edit)
  API key (stacked layout)
  Custom LLM parameters (ViewMode/EditMode)

Instructions (standalone, no card)
  Textarea

Behavior (SettingsSection + card)
  Allow system prompt override (SettingsRow, toggle)
  Tool call limit (SettingsRow, inline edit)
  Enable memory (SettingsRow, toggle)
  Enable memory tools (SettingsRow, toggle)

Skills (SettingsSection + card)
  Description + Import/Create buttons
  Skill cards list

Integrations (SettingsSection + card)
  MCP servers
```

### Settings Tab

Container: `project-settings.tsx`. Project infrastructure.

```
General (SettingsSection + card)
  Project name (SettingsRow, inline edit)

API Keys (SettingsSection + card)
  Description + Add Key button
  Key list items

Authentication (SettingsSection + card)
  Token required (SettingsRow, toggle)
  Validation mode (RadioGroup)

Danger Zone (SettingsSection + card, border-destructive/50)
  Delete project button
```

---

## Microcopy and Grammar

Labels, descriptions, and placeholders appear everywhere in settings. Apply these rules consistently so the UI reads like one voice.

### Punctuation on descriptions

- **Full sentences get a terminal period.** "Added to each conversation to guide how your agent responds."
- **Sentence fragments do not get a terminal period.** "Custom headers sent to your Agent URL" (no period).
- **Never use a period after a single-word fragment like "Optional".** It reads as two disconnected sentences and looks broken next to the real sentence that follows.
- **Never use em dashes (—) or double-hyphen separators (`--`)** in user-facing copy. Use colons, parentheses, commas, or periods.

### The "Optional" prefix

When a setting is optional, lead with `Optional:` followed by the description. Use a colon, never a period, to join them.

```tsx
// Correct
<p>Optional: Add HTTP headers sent to your Agent URL.</p>

// Wrong (period makes "Optional." a stranded fragment)
<p>Optional. Add HTTP headers sent to your Agent URL.</p>

// Also acceptable: put optionality in parentheses at the end
<p>Add HTTP headers sent to your Agent URL (optional).</p>
```

Pick one style per surface and stick with it. Don't mix `Optional:` and `(optional)` in the same section.

### Labels

- Labels are noun phrases, not sentences. No terminal punctuation. "Custom headers", not "Custom headers."
- Use sentence case, not title case, for labels and descriptions. "Tool call limit", not "Tool Call Limit".
- Exception: proper nouns and acronyms keep their casing (API, URL, MCP, OpenAI).

### Placeholders

- Placeholders are hints, not sentences. No terminal period.
- Use `e.g., value` for example values: `e.g., tambo-agent`.
- Never repeat the label inside the placeholder ("Agent name" label with "Agent name" placeholder).

### Error messages

- Full sentences. Terminal period required.
- Say what's wrong and how to fix it, not just that something failed.

---

## Conventions

### Typography

- Labels: `text-sm font-semibold`
- Descriptions: `text-sm text-muted-foreground`
- Section titles: `text-base font-semibold font-sans`

### Spacing

- SettingsRow internal: `px-4 py-3 gap-4`
- Stacked layouts: `px-4 py-3 space-y-2`
- Section gaps: `space-y-8` between SettingsSections
- Button gaps: `gap-2`

### Buttons

Every button has an **intent**. The intent determines the variant, icon, and color. No exceptions.

All buttons in settings use `size="sm"` unless inside a modal or full-page form.

#### Intent: Create (adds something new)

Filled button (default variant) with Plus icon. Used for actions that bring something into existence.

```tsx
<Button size="sm">
  <Plus className="h-4 w-4 mr-1" />
  Add Key
</Button>
```

| Label          | Icon   | Variant | Examples                                           |
| -------------- | ------ | ------- | -------------------------------------------------- |
| Add [Thing]    | Plus   | default | Add Key, Add MCP Server, Add Parameter, Add header |
| Create [Thing] | Plus   | default | Create Skill                                       |
| Import         | Import | outline | Import (skill file)                                |

Create buttons always have an icon. The icon signals "this makes something new." Import uses outline because it's a secondary creation path (file upload vs. primary create).

#### Intent: Modify (changes existing state)

Outline button, no icon. Used for entering edit mode on an existing value.

```tsx
<Button variant="outline" size="sm">
  Edit
</Button>
```

| Label | Icon | Variant | Examples                               |
| ----- | ---- | ------- | -------------------------------------- |
| Edit  | None | outline | Edit (inline value, skill, MCP server) |
| Add   | None | outline | Add (API key when none exists)         |

Edit buttons never have icons. The outline variant signals "this is a secondary action that opens an editing state." "Add" as an edit trigger (e.g., "Add" an API key to an existing provider) uses outline because it's modifying an existing setting, not creating a standalone resource.

#### Intent: Confirm (persists a change)

Filled button (default variant), no icon. Primary action in a form or edit state.

```tsx
<Button size="sm">Save</Button>
```

| Label  | Icon                        | Variant | Loading label | Examples                         |
| ------ | --------------------------- | ------- | ------------- | -------------------------------- |
| Save   | None (Loader2 when pending) | default | Saving...     | Save instructions, Save settings |
| Create | None (Loader2 when pending) | default | Creating...   | Create (in a form context)       |

Confirm buttons are always the rightmost button in their group. They use the default (filled) variant because they're the primary action. Loading state replaces the label text.

#### Intent: Cancel (abandons a change)

Outline button, no icon. Always paired with a Confirm button, always to its left.

```tsx
<Button variant="outline" size="sm">
  Cancel
</Button>
```

Never use `variant="ghost"` for Cancel. Outline gives it enough visual weight to be findable.

#### Intent: Destroy (removes something permanently)

**Always use `DestructiveActionButton`** from `@/components/ui/destructive-action-button`. Never hand-roll destructive button markup. The component enforces consistent icon spacing (`gap-1`), hover colors, loading states, and accessibility attributes.

```tsx
<DestructiveActionButton
  onClick={handleDelete}
  isPending={isDeleting}
  aria-label="Delete skill My Skill"
/>
```

Props: `onClick`, `disabled?`, `isPending?`, `aria-label` (required), `label?` (default "Delete"), `pendingLabel?` (default "Deleting..."), `className?`

| Label               | Examples                                                  |
| ------------------- | --------------------------------------------------------- |
| Delete (default)    | Delete key, Delete skill, Delete parameter, Delete header |
| Delete this project | Danger zone                                               |

Ghost variant keeps destructive actions visually recessive until hovered. Always include both icon and text (never icon-only for delete).

#### Intent: Utility (copies, inspects, closes)

Ghost or outline button, icon optional. Low-emphasis actions that don't modify data.

```tsx
<Button variant="outline" size="sm">
  <Copy className="h-4 w-4 mr-1" />
  Copy
</Button>
```

| Label         | Icon | Variant             | Examples          |
| ------------- | ---- | ------------------- | ----------------- |
| Copy          | Copy | outline             | Copy API key      |
| Close         | None | outline             | Close dialog      |
| Inspect tools | Info | ghost + size="icon" | Inspect MCP tools |

#### Button order and alignment

- **In SettingsRow controls**: buttons sit naturally on the right via the row's flex layout.
- **In form footers**: `<div className="flex gap-2 justify-end">`, Cancel left, Save/Create right.
- **In action bars** (list headers): description left, action button right via `justify-between`.

#### Summary table

| Intent  | Variant          | Icon required             | Color       |
| ------- | ---------------- | ------------------------- | ----------- |
| Create  | default (filled) | Yes (Plus, Import)        | Primary     |
| Modify  | outline          | No                        | Neutral     |
| Confirm | default (filled) | No (Loader2 when pending) | Primary     |
| Cancel  | outline          | No                        | Neutral     |
| Destroy | ghost            | Yes (Trash2)              | Destructive |
| Utility | outline or ghost | Optional                  | Neutral     |

### Inputs

- Number inputs: `w-20 text-right tabular-nums` (or `w-24`)
- Short string inputs: `w-48`
- Select triggers: explicit width (`w-[140px]`, etc.)
- All editable inputs: `autoFocus` on edit mode entry

### Keyboard

- Enter: save (single-line)
- Cmd/Ctrl+Enter: save (multi-line)
- Escape: cancel

### State Management

- Toggles: optimistic local state, revert on error
- Inline edits: `isEditing` boolean, `savedValue` + `displayValue`
- Tambo integration: `useRef` to track prop changes and prevent post-save resets (`justSavedRef`, `prevEditedRef`)

### Toasts

- Success: `toast({ title: "Saved", description: "..." })`
- Error: `toast({ title: "Error", description: "...", variant: "destructive" })`
- Always show both. Never skip the error toast.

---

## Feature Placement

Settings are split across two top-level tabs:

- **Agent tab** (`/[projectId]/agent`) - How the AI agent behaves
- **Settings tab** (`/[projectId]/settings`) - Project infrastructure and access

Layout file: `apps/web/app/(authed)/(dashboard)/[projectId]/layout.tsx`

### Placement Decision Tree

1. **Configures AI agent behavior?** (model selection, prompts, tools, memory, context) -> Agent tab
2. **Configures project infrastructure?** (API keys, naming, deletion, billing, webhooks) -> Settings tab
3. **Configures who can access?** (auth, tokens, team members, permissions) -> Settings tab
4. **Monitoring or debugging view?** -> Observability tab
5. **High-level summary or status?** -> Overview tab
6. **None of the above?** -> Ask the user.

Do not add a new top-level tab without explicit team alignment.

### Adding a New Section

1. Create the component in `apps/web/components/dashboard-components/project-details/`.
2. Import and render in the correct container (`agent-settings.tsx` or `project-settings.tsx`).
3. Update the skeleton in `apps/web/components/skeletons/settings-skeletons.tsx`.

### Conditional and Dependent Settings

Never hide a section entirely based on another setting's state. Always render the card; use an Alert or disabled state to communicate the dependency.

**Show but warn (soft dependency).** Render normally but display an `Alert` when the dependency isn't met. Example: Skills section shows a provider compatibility notice when the selected provider doesn't support skills.

**Conditionally pass props (data dependency).** The parent reads one setting and passes it as a prop so the child adapts. Example: MCP servers section receives `providerType` to toggle agent-mode-specific UI.

Rules:

- The warning message must name the dependency and tell the user what to change.
- Keep dependency checks in the section component, not the container.
- If a setting depends on state from a different tab, pass it through the shared project query rather than cross-tab state.

---

## Confirmation Dialogs

All destructive actions use `DeleteConfirmationDialog` from `@/components/dashboard-components/delete-confirmation-dialog`:

```tsx
const [alertState, setAlertState] = useState<AlertState>({
  show: false,
  title: "",
  description: "",
});

<DeleteConfirmationDialog
  mode="single"
  alertState={alertState}
  setAlertState={setAlertState}
  onConfirm={handleConfirmDelete}
/>;
```

Title includes the item name (`Delete "${name}"?`). Description warns the action cannot be undone. Use `DeleteConfirmationDialog` for server-persisted items (skills, API keys, MCP servers, projects). Skip confirmation for ephemeral/local-only items (unsaved parameter rows, header rows).

### Destructive Action Styling

**Always use `DestructiveActionButton`** from `@/components/ui/destructive-action-button`. Never hand-roll destructive button markup.

```tsx
<DestructiveActionButton
  onClick={handleDelete}
  isPending={isDeleting}
  aria-label="Delete API key production-key"
/>
```

The component handles: ghost variant, destructive colors, Trash2/Loader2 icon swap, `gap-1` spacing, `aria-hidden` on icons. Cancel/discard buttons are NOT destructive and should not use this component.

### Danger Zone Section

```tsx
<SettingsSection title="Danger Zone" cardClassName="border-destructive/50">
  <DangerZoneContent />
</SettingsSection>
```

The `DeleteConfirmationDialog` should be owned by the parent component that handles the mutation and post-delete navigation.

---

## Edit Trigger Button Text

| Context                  | Button text |
| ------------------------ | ----------- |
| Simple value exists      | "Edit"      |
| Empty long text          | "Add"       |
| Long text has content    | "Edit"      |
| Creating a new list item | "Create"    |

Never use verb+noun combinations like "Edit Instructions" or "Save changes". Just "Edit", "Add", "Create", or "Save". All edit trigger buttons use `variant="outline" size="sm"`.

---

## Control Type Rules

| Setting type                    | Control                                            | Save behavior                      |
| ------------------------------- | -------------------------------------------------- | ---------------------------------- |
| Boolean on/off                  | Switch                                             | Immediate (onCheckedChange)        |
| Enum / pick-one                 | Select or Combobox                                 | Immediate (onValueChange/onChange) |
| Short string                    | Inline Input with Edit/Save/Cancel                 | Explicit save                      |
| Number                          | Inline Input (type="number") with Edit/Save/Cancel | Explicit save                      |
| Long text                       | Textarea with Edit/Save/Cancel                     | Explicit save                      |
| Complex form (needs validation) | Full card content with Save button                 | Explicit save                      |
| List of items                   | Full card content with add/remove                  | Per-item actions                   |

### Save behavior principles

- **No batched "Save Settings" buttons.** Each field or logical group saves independently.
- **Selects and comboboxes auto-save on change**, like toggles. The user's intent is clear from the selection; no confirmation needed. Revert optimistically on error.
- **Text and number inputs require explicit Save/Cancel.** Typing is ambiguous; the user may not be done. Enter to save, Escape to cancel.
- **Complex forms with validation** (e.g., Agent mode with required URL) keep an explicit Save button at the bottom of their form section. Only use this when fields have cross-field validation that can't be checked per-field.
- **Never save on blur.** Blur-save causes accidental mutations when users click away.

---

## Tambo Interactable Wrapper

Components that Tambo can control use `withTamboInteractable`:

```tsx
export const InteractableXyzProps = z.object({
  projectId: z.string().describe("The project ID."),
  editedValue: z
    .string()
    .optional()
    .describe("When set, enters edit mode with this value."),
  triggerSave: z
    .boolean()
    .optional()
    .describe("When true, triggers the save action."),
});

export function Xyz(props: XyzProps) {
  /* component */
}

export const InteractableXyz = withTamboInteractable(Xyz, {
  componentName: "XyzName",
  description: "What this component does and how Tambo can control it.",
  propsSchema: InteractableXyzProps,
});
```

Zod `.describe()` on each prop tells Tambo what the prop does. Use `useRef` to track prop changes from Tambo and prevent post-save resets (`justSavedRef`, `prevEditedRef` patterns).

---

## DRY: Use Shared Components

**Never copy-paste raw element patterns.** When a UI pattern appears in more than one file, it must be a shared component in `components/ui/`. Copy-pasting leads to inconsistent spacing, missing accessibility attributes, and divergent behavior.

### Shared components to use (not rebuild)

| Pattern                   | Component                  | Location                                              |
| ------------------------- | -------------------------- | ----------------------------------------------------- |
| Section with title + card | `SettingsSection`          | `ui/settings-section.tsx`                             |
| Label + control row       | `SettingsRow`              | `ui/settings-row.tsx`                                 |
| Delete/remove button      | `DestructiveActionButton`  | `ui/destructive-action-button.tsx`                    |
| Delete confirmation       | `DeleteConfirmationDialog` | `dashboard-components/delete-confirmation-dialog.tsx` |

### When to extract a new component

If you find yourself writing the same 5+ lines of JSX in a third file, stop and extract it into `components/ui/`. The component should:

- Live in `components/ui/` with a descriptive name
- Accept props for the varying parts only
- Handle its own spacing, icons, and accessibility attributes internally
- Be used in all existing instances (update them in the same PR)

### What NOT to abstract

- One-off layouts specific to a single component
- Simple className strings (use Tailwind directly)
- Wrapper divs that just add padding (use the layout primitives instead)

## Gotchas

1. **Do not add a new top-level tab** without explicit team alignment. Current tabs (Overview, Observability, Agent, Settings) have been stable.
2. **`EditWithTamboButton` goes in the SettingsSection `action` prop**, not inside card content.
3. **Invalidate the query before toasting** in `onSuccess`. Reversing the order can show a success toast while the UI still displays old data.
4. **Use `DeleteConfirmationDialog`**, never inline `AlertDialog` for destructive confirmations.
5. **Use `DestructiveActionButton`**, never hand-roll destructive button markup with inline classes.
6. **Use `text-destructive` semantic color**, never `text-red-500`.
7. **Wrapper divs inside SettingsSection swallow `divide-y` separators.** Use fragments for conditional row groups.
8. **SettingsRow breaks with wide controls.** Use Pattern 6 (Stacked Layout) for API keys, long code blocks, or full-width inputs.

---

## Surfaces Not Yet Documented

The following areas will be added to this skill as they are standardized:

- Overview tab layout and data display patterns
- Observability tab (logs, traces, metrics)
- Navigation and tab structure
- Modal and dialog patterns beyond delete confirmation
- Empty states and loading skeletons
- Form validation and error display
- Responsive behavior and mobile breakpoints
- Data tables and list views outside settings
- Marketing and public-facing pages
