# feat: Mobile Log App (Expo/React Native)

A chat-first mobile logging app where each Tambo thread is a "log." The AI asks contextual follow-up questions about each entry, rendered as tappable multiple-choice buttons via blocking-Promise tools. Answers are stored naturally in the conversation history.

## Motivation

- Tambo has no React Native demo, and we don't know where the SDK breaks on mobile
- Logging activities (cooking, woodworking, hiking, repairs) is tedious on mobile -- too much typing
- Chat-first with AI-prompted questions makes logging fast and structured
- This is a forcing function to make `@tambo-ai/react` work on React Native

## Architecture

```
demos/mobile-log/
  app/
    _layout.tsx          ← TamboProvider + Stack navigator
    index.tsx            ← Log list (thread list)
    log/[id].tsx         ← Single log view (chat screen)
  components/
    log-entry.tsx        ← Message renderer (switch on content type)
    quick-answer.tsx     ← Multiple-choice buttons (generic, callback-based)
    input-bar.tsx        ← Text input + camera button + send button
  lib/
    tools.ts             ← ask_multiple_choice tool + resolvePrompt()
    system-prompt.ts     ← System prompt / initial messages
  metro.config.js        ← Stub react-dom + react-media-recorder
  app.json
  package.json
  tsconfig.json
```

## The "Prompt Tools" Pattern

Tools that the AI calls to prompt the user, which render as interactive UI. The tool returns a Promise that **blocks until the user answers**.

```
AI calls tool: ask_multiple_choice({
  question: "What technique did you use?",
  options: ["Sautéing", "Braising", "Grilling", "Other"]
})
→ Tool executor creates an unresolved Promise + stores the resolve fn
→ Renders as: QuickAnswer component with tappable buttons
→ User taps "Braising"
→ resolvePrompt({ selected: "Braising" }) is called
→ Promise resolves, tool result sent back to AI
→ AI continues: "Nice! How long did you braise it for?"
```

**How it works:** The SDK's tool executor (`tool-executor.ts:104`) already `await`s tool functions. A long-lived Promise just means the executor waits. Meanwhile, the `tool_use` content block has streamed in with the tool name and args, so the message renderer sees it and renders the interactive UI.

**Implementation:**

```typescript
// lib/tools.ts
let pendingResolve: ((value: { selected: string }) => void) | null = null;

export function resolvePrompt(value: { selected: string }) {
  if (pendingResolve) {
    pendingResolve(value);
    pendingResolve = null;
  }
}

export const askMultipleChoice = defineTool({
  name: "ask_multiple_choice",
  description:
    "Present the user with a multiple choice question rendered as tappable buttons. Use when there are 2-6 discrete options. Do NOT use for open-ended questions.",
  inputSchema: z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(6),
  }),
  outputSchema: z.object({ selected: z.string() }),
  tool: () =>
    new Promise((resolve, reject) => {
      pendingResolve = resolve;
      // Safety valve: reject after 5 minutes to prevent permanent deadlock
      setTimeout(() => {
        if (pendingResolve === resolve) {
          pendingResolve = null;
          reject(new Error("Prompt timed out"));
        }
      }, 300_000);
    }),
});
```

```tsx
// components/quick-answer.tsx — generic, callback-based
function QuickAnswer({
  question,
  options,
  selectedOption,
  onSelect,
}: {
  question: string;
  options: string[];
  selectedOption?: string; // undefined = unanswered, string = answered
  onSelect: (option: string) => void;
}) {
  const isAnswered = selectedOption !== undefined;
  return (
    <View>
      <Text>{question}</Text>
      {options.map((opt) => (
        <Pressable
          key={opt}
          disabled={isAnswered}
          onPress={() => onSelect(opt)}
          style={[
            styles.option,
            isAnswered && opt === selectedOption && styles.selectedOption,
            isAnswered && opt !== selectedOption && styles.dimmedOption,
          ]}
        >
          <Text>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

```tsx
// In log-entry.tsx, the message renderer wires resolvePrompt:
if (block.type === "tool_use" && block.name === "ask_multiple_choice") {
  return (
    <QuickAnswer
      question={block.input.question}
      options={block.input.options}
      selectedOption={toolResult?.selected}
      onSelect={(opt) => resolvePrompt({ selected: opt })}
    />
  );
}
```

**Known limitations (accepted for POC):**

- **Singleton resolve:** One pending prompt at a time. If the AI calls two prompt tools before the first resolves, the second overwrites `pendingResolve` and the first deadlocks (the sequential `for...of` in `executeAllPendingTools` means the second tool never even starts). Mitigated by system prompt: "call only one prompt tool at a time." If this breaks, upgrade to a `Map<string, resolve>`.
- **No cleanup on unmount:** Navigate away while pending → Promise hangs until timeout. Accept for POC.
- **Answered state reconstruction:** When reloading a thread, check for existing `tool_result` block and pass result as `selectedOption` so component renders in "answered" mode.

## Known Decisions (POC scope)

- **Auth**: Random UUID on first launch, persisted in AsyncStorage, passed as `userKey`. No login.
- **API key**: `EXPO_PUBLIC_TAMBO_API_KEY` env var.
- **Image handling**: Bypass SDK's `addImage` (requires web `File`). Compress with `expo-image-picker` (quality 0.7) and construct `{ type: "resource", resource: { name, mimeType, blob: base64Data } }` directly.
- **Keyboard**: `KeyboardAvoidingView` with `behavior="padding"` on iOS, `undefined` on Android. Inverted FlatList. Use `maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 100 }}`.
- **RN primitives**: All components must use `View`, `Text`, `Pressable` — not web elements. The SDK's existing components render web elements and will crash; we render our own.
- **One prompt tool for POC**: Only `ask_multiple_choice`. `ask_rating` and `ask_tags` are the same pattern with different UI — trivial to add later, proves nothing new.
- **Errors/edge cases**: Out of scope. Handle as they come up.

## Technical Approach

### Phase 1: Expo Scaffolding + Basic Chat

**Goal**: Expo app running with `TamboProvider`, log list, log detail with text chat.

**Tasks**:

1. **Scaffold Expo app**

   ```bash
   mkdir demos
   npx create-expo-app@latest demos/mobile-log --template blank-typescript
   ```

2. **Wire into monorepo**
   - Add `"demos/*"` to root `package.json` workspaces array
   - Set `"name": "@tambo-ai/mobile-log"` in `demos/mobile-log/package.json`
   - Add `"@tambo-ai/react": "*"` as dependency
   - Add `@tambo-ai/mobile-log#dev` task to `turbo.json`
   - Add `"dev:mobile": "turbo dev --filter=@tambo-ai/mobile-log"` to root scripts
   - Run `npm install` from root

3. **Configure Metro** (`metro.config.js`)
   - Expo SDK 52+ auto-configures `watchFolders`/`nodeModulesPaths` for monorepos. Do NOT set these manually.
   - Only custom config: stub `react-dom` and `react-media-recorder` (direct dep, not peer):

   ```javascript
   const { getDefaultConfig } = require("expo/metro-config");
   const config = getDefaultConfig(__dirname);
   config.resolver.resolveRequest = (context, moduleName, platform) => {
     if (moduleName === "react-dom" || moduleName === "react-media-recorder") {
       return { type: "empty" };
     }
     return context.resolveRequest(context, moduleName, platform);
   };
   module.exports = config;
   ```

4. **Build the two screens**
   - `_layout.tsx` → `TamboProvider` + `Stack` navigator
   - `index.tsx` → FlatList of threads (name, date, preview). "New Log" FAB → `startNewThread()` + navigate.
   - `log/[id].tsx` → Inverted FlatList of messages. `KeyboardAvoidingView`. Input bar with text input + send. `switchThread(id)` on mount.

5. **Configure system prompt** via `initialMessages`
   - Logging assistant persona
   - Ask 1-2 follow-up questions per entry
   - Call only one prompt tool at a time, then wait
   - After 2-3 questions, summarize the entry

6. **Verify**: Text chat works end-to-end. Messages stream in. No web-only API crashes.

**SDK issues to document as they surface:**

- `react-dom` peer dep → should be optional
- `react-media-recorder` → direct dep, stubbed; `useTamboVoice` is a no-op
- `currentPageContextHelper` → returns null (guarded by `typeof window`)
- `FileReader` in `useMessageImages` → may need RN-specific handling
- `"use client"` directives → harmless, ignored by Metro

### Phase 2: Prompt Tool + Photo Capture

**Goal**: `ask_multiple_choice` tool renders as tappable buttons, blocks until answered. Camera capture works.

**Tasks**:

1. **Define `ask_multiple_choice` tool** in `lib/tools.ts`
   - Module-level `pendingResolve` + `resolvePrompt()` export (see sketch above)
   - 5-minute timeout safety valve on the Promise

2. **Build `QuickAnswer` component** (`components/quick-answer.tsx`)
   - Generic: takes `question`, `options`, `selectedOption?`, `onSelect`
   - Shows selected answer highlighted, others dimmed when answered

3. **Wire into message renderer** (`components/log-entry.tsx`)
   - `switch` on content block type: text → chat bubble, `tool_use` → `QuickAnswer` with `resolvePrompt` wired in, resource → photo display inline
   - Check for existing `tool_result` → pass to `selectedOption` for answered state

4. **Photo capture** using `expo-image-picker`
   - Camera button in input bar
   - Capture → get base64 (`quality: 0.7, base64: true`)
   - Construct `{ type: "resource", resource: { name: "photo.jpg", mimeType: "image/jpeg", blob: base64Data } }`
   - Display captured photos with RN `Image` component

5. **Tune system prompt** to use `ask_multiple_choice`
   - Use it when there are 2-5 clear options
   - Don't use for open-ended questions
   - One tool call per turn, wait for result

## Acceptance Criteria

- [ ] Expo app runs on iOS simulator via `npm run dev:mobile` from repo root
- [ ] App imports and uses `@tambo-ai/react` from the monorepo
- [ ] User can create a new log, type entries, see AI responses
- [ ] User can take/attach a photo to a log entry
- [ ] AI calls `ask_multiple_choice` → renders as tappable buttons that block until answered
- [ ] Tapping an answer resolves the Promise, result sent back to AI, conversation continues
- [ ] Answered prompts show selection as static/completed UI
- [ ] User can view list of past logs and switch between them
- [ ] Metro resolves all monorepo dependencies correctly
- [ ] No web-only API crashes at runtime
- [ ] All SDK incompatibilities documented

## Risks

| Risk                                              | Mitigation                                        |
| ------------------------------------------------- | ------------------------------------------------- |
| `@tambo-ai/react` has undiscovered web-only deps  | Metro stubs + iterative SDK fixes                 |
| `react-media-recorder` is a direct dep (not peer) | `resolveRequest` returns `{ type: "empty" }`      |
| Image handling differs in RN (no `FileReader`)    | Construct `resource` content directly with base64 |
| AI calls two prompt tools in one turn             | System prompt + 5-min timeout safety valve        |
| User navigates away during pending prompt         | Timeout rejects after 5 minutes                   |
| Expo SDK version churn                            | Pin to SDK 52+                                    |

## References

### Internal

- Tool executor (`await tool.tool(args)`): `react-sdk/src/v1/utils/tool-executor.ts:104`
- Send message hook (stream loop): `react-sdk/src/v1/hooks/use-tambo-v1-send-message.ts`
- Image staging (`resource` content): `react-sdk/src/v1/providers/tambo-v1-thread-input-provider.tsx:43-73`
- Provider hierarchy: `react-sdk/src/v1/providers/tambo-v1-provider.tsx`
- DOM guard: `react-sdk/src/context-helpers/current-page-context-helper.ts`
- Showcase wiring: `showcase/src/app/template.tsx`

### External

- Expo monorepo guide: https://docs.expo.dev/guides/monorepos/
- Expo Router: https://docs.expo.dev/router/introduction/
- expo-image-picker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
