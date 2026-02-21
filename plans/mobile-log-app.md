# feat: Mobile Log App (Expo/React Native)

A chat-first mobile logging app where each Tambo thread is a "log" -- an activity journal, project log, or step-by-step instructable. The AI asks contextual follow-up questions (including multiple-choice prompts) about each entry, and the answers are stored naturally in the conversation history.

## Enhancement Summary

**Deepened on:** 2026-02-20
**Sections enhanced:** 8
**Research agents used:** RN chat UI patterns, blocking-Promise tool research, Expo image picker, architecture review, agent-native review, React composition patterns, generate-tambo-demo skill

### Key Improvements

1. **Metro config simplified** — Expo SDK 52+ auto-configures monorepo support; only `resolveRequest` stubs needed
2. **Composition patterns** — Explicit variant components, slot-based input bar, compound log list items
3. **Prompt tool hardening** — Documented singleton limitation, added `selectedOption` data-prop pattern for answered state
4. **Chat UI best practices** — `maintainVisibleContentPosition`, memoized `renderItem`, separate streaming message from list data
5. **Image pipeline** — Compress with `expo-image-manipulator` (1024px, quality 0.6) before base64 encoding

### Research-Identified Risks

- Module-level `pendingResolve` singleton will break if AI calls two prompt tools in one turn (documented as known limitation for POC)
- `react-media-recorder` is a direct dependency (not peer dep) — Metro must stub it as an empty module
- No cancellation/cleanup for pending Promises on navigation — accept for POC, harden later

## Overview

The core insight: a Tambo thread is already a structured log. By setting the system prompt to be an insightful interviewer, and registering tools that render as quick-answer UI (multiple choice, ratings, tags), we turn a chat into a rich, structured activity log with minimal typing.

**User flow:**

1. Open app → see list of logs (threads)
2. Tap "New Log" → camera opens or text input appears
3. Snap a photo or type a quick entry → AI responds with contextual follow-up questions
4. Questions render as tappable multiple-choice buttons, sliders, or short text prompts
5. Tap an answer → stored as tool result in the thread, AI asks next question
6. Say "new log" or tap + to start a fresh log

## Problem Statement / Motivation

- Tambo has no React Native demo, and we don't know where the SDK breaks on mobile
- Logging activities (cooking, woodworking, hiking, repairs) is tedious on mobile -- too much typing
- Chat-first with AI-prompted questions makes logging fast and structured
- This is a forcing function to make `@tambo-ai/react` work on React Native

## Proposed Solution

### Architecture

```
demos/mobile-log/          ← Expo app (not in apps/ to keep it separate from Cloud)
  app/                     ← Expo Router file-based routes
    _layout.tsx            ← Root layout: TamboProvider wrapper
    index.tsx              ← Log list (thread list)
    log/[id].tsx           ← Single log view (thread)
  components/
    log-entry.tsx          ← Dispatcher: maps content block types to variant renderers
    log-entry-text.tsx     ← Text bubble (user vs assistant styling)
    log-entry-prompt.tsx   ← Wiring layer: prompt tool → generic component + resolvePrompt
    log-entry-photo.tsx    ← Photo display + caption
    quick-answer.tsx       ← Multiple-choice answer component (generic, callback-based)
    rating-prompt.tsx      ← Star/number rating component (generic, callback-based)
    tag-picker.tsx         ← Tag selection component (generic, callback-based)
    input-bar.tsx          ← Text input with slot-based accessories (camera, send)
    log-list-item.tsx      ← Compound component with Title/Timestamp/Preview sub-components
  lib/
    tools.ts               ← Tool definitions + resolvePrompt() (ask_multiple_choice, etc.)
    components.ts          ← Component registrations
    system-prompt.ts       ← System prompt / initial messages
    image-utils.ts         ← Image capture + compression utilities
  metro.config.js          ← Monorepo Metro config (mostly auto with SDK 52+, just stubs)
  app.json                 ← Expo config with camera permissions
  package.json
  tsconfig.json
```

### Research Insights: Component Architecture

**Explicit variant components over monolithic renderers.** Rather than one `LogEntry` component with conditional branches, use a dispatch map:

```tsx
// components/log-entry.tsx — thin dispatcher
const contentRenderers: Record<string, React.FC<{ block: ContentBlock }>> = {
  text: ({ block }) => <LogEntryText text={block.text} role={block.role} />,
  tool_use: ({ block }) => <LogEntryPrompt block={block} />,
  resource: ({ block }) => <LogEntryPhoto uri={block.resource.blob} />,
};

const LogEntry: React.FC<{ message: Message }> = ({ message }) => (
  <View>
    {message.content.map((block, i) => {
      const Renderer = contentRenderers[block.type];
      return Renderer ? <Renderer key={i} block={block} /> : null;
    })}
  </View>
);
```

**Slot-based input bar.** Instead of `showCamera`/`showVoice` booleans, use `leadingAccessory`/`trailingAccessory` slot props. Adding buttons later means adding elements to slots, not new boolean props.

**Compound log list items.** Use `LogListItem.Title`, `LogListItem.Timestamp`, `LogListItem.Preview` sub-components instead of flat props. The consumer controls layout through composition.

### The "Prompt Tools" Pattern

The key innovation: tools that the AI calls to prompt the user, which render as interactive UI components. When the AI wants to ask a question, it calls a tool like `ask_multiple_choice`. The tool returns a Promise that **blocks until the user answers**.

```
AI calls tool: ask_multiple_choice({
  question: "What technique did you use?",
  options: ["Sautéing", "Braising", "Grilling", "Other"]
})
→ Tool executor creates an unresolved Promise + stores the resolve fn
→ Renders as: QuickAnswer component with tappable buttons
→ User taps "Braising"
→ Component calls the stored resolve fn with { selected: "Braising" }
→ Promise resolves, tool result is sent back to the AI
→ AI continues: "Nice! How long did you braise it for?"
```

**How it works mechanically:**

1. The tool's `tool` function returns a `Promise` that does not resolve immediately. It captures the `resolve` callback in a module-level variable that the corresponding UI component can access.

2. The SDK's tool executor already supports async tools -- it `await`s the tool function. So a long-lived Promise just means the executor waits until the user answers.

3. Meanwhile, the `TOOL_CALL_START/ARGS/END` events have already streamed in. The `TamboToolUseContent` block in the message contains the tool name and parsed args (question, options). A custom message renderer sees "this is a prompt tool" and renders the interactive UI.

4. When the user taps an answer, the UI component calls the module-level `resolve` function with the result. The Promise resolves, the tool executor sends the result back to the API, and the AI continues.

**Simplified implementation sketch:**

```typescript
// lib/tools.ts
let pendingResolve: ((value: unknown) => void) | null = null;

export function resolvePrompt(value: unknown) {
  if (pendingResolve) {
    pendingResolve(value);
    pendingResolve = null;
  }
}

const askMultipleChoice = defineTool({
  name: "ask_multiple_choice",
  description:
    "Present the user with a multiple choice question rendered as tappable buttons. Use this when there are 2-6 discrete options. Do NOT use for open-ended questions. The user's selection is returned as the 'selected' field.",
  inputSchema: z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(6),
  }),
  outputSchema: z.object({ selected: z.string() }),
  tool: () =>
    new Promise((resolve) => {
      pendingResolve = resolve;
    }),
});
```

```tsx
// components/quick-answer.tsx — generic, no knowledge of resolvePrompt
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
// The wiring layer (in log-entry-prompt.tsx) connects resolvePrompt:
<QuickAnswer
  question={toolArgs.question}
  options={toolArgs.options}
  selectedOption={toolResult?.selected} // from tool_result block if answered
  onSelect={(opt) => resolvePrompt({ selected: opt })}
/>
```

One pending prompt at a time. Dead simple. Components are generic (just take callbacks), the wiring layer connects them to `resolvePrompt`. No registry, no IDs, no SDK changes needed.

### Research Insights: Blocking-Promise Pattern

**Known pattern:** This is the "deferred promise" or "externalized resolver" pattern. Libraries like `p-defer` formalize it. It is commonly used in testing and bridge code.

**Known limitations (accepted for POC):**

- **Singleton resolve:** If the AI calls two prompt tools before the first is resolved, the second overwrites `pendingResolve` and the first Promise hangs forever. Mitigate via system prompt: instruct the AI to call only one prompt tool at a time, then wait for the result before asking the next question.
- **No cleanup on unmount:** If user navigates away while a Promise is pending, it hangs. Accept for POC.
- **No serialization:** State lives only in memory. Page refresh loses pending state. Accept for POC.

**Why not a Map keyed by tool call ID:** The user explicitly chose the simpler singleton approach for the POC. If concurrent prompts become necessary later, upgrade to a `Map<string, resolve>` keyed by a correlation ID.

**Why not the two-phase approach (Vercel style):** The Vercel AI SDK uses a different pattern where the stream ends with pending tool calls, and `addToolResult(toolCallId, result)` sends a new request. This avoids blocking but requires SDK changes. The blocking-Promise pattern works with the existing Tambo SDK without modification — `tool-executor.ts` already `await`s the tool function.

**Answered state reconstruction:** When reloading a thread, the `tool_result` content block will already exist in the message history. The wiring layer should check for an existing `tool_result` for each `tool_use` block and pass the result to the component (e.g., `selectedOption={toolResult?.selected}`) so it renders in "answered" mode.

### System Prompt Strategy

The system prompt (via `initialMessages` with role `"system"`) instructs the AI to:

- Act as a logging assistant / interviewer
- When the user shares a photo or text entry, ask 1-2 follow-up questions
- Use the `ask_multiple_choice` tool for questions with clear options
- Use the `ask_rating` tool for quality/difficulty assessments
- **Call only one prompt tool at a time** — wait for the result before asking the next question
- Keep questions short and contextual
- After 2-3 questions, summarize the log entry
- When the user says "new log", acknowledge and wait for the next entry

### Research Insights: System Prompt

**Enrich tool descriptions.** Each tool's `description` field should be a complete usage guide for the AI, not just a one-liner. Include when to use it, when NOT to use it, and what the return value means.

**Dynamic context:** Consider using Tambo's `contextHelpers` to inject the current log's topic and entry count so the AI asks contextual (not generic) follow-up questions. Not required for initial POC but worth adding in Phase 4.

## Known Decisions (POC scope)

- **Auth**: Generate a random UUID on first launch, persist in AsyncStorage, pass as `userKey`. No login screen.
- **API key**: Via `EXPO_PUBLIC_TAMBO_API_KEY` env var.
- **Image handling**: SDK's `addImage` takes a web `File` object which doesn't exist in RN. For the POC, bypass `addImage` and construct the `InputMessage` content array directly with base64 resource content from `expo-image-picker`. Use `expo-image-manipulator` to compress (1024px max, quality 0.6) before encoding.
- **Keyboard**: Use `KeyboardAvoidingView` with `behavior="padding"` on iOS, `undefined` on Android + inverted FlatList. Input bar stays above keyboard.
- **Answered prompts**: Use data props (`selectedOption`, `selectedRating`, `selectedTags`) to control both visual state and interactivity. One prop, no booleans.
- **Multi-entry logs**: A single thread/log can have multiple entries. The user keeps adding text/photos to the same log. The AI asks follow-ups per entry then waits for the next.
- **Singleton resolve**: One pending prompt at a time. System prompt instructs AI to call one tool, wait for result, then continue. If this breaks, upgrade to a Map keyed by correlation ID.
- **Human-in-the-loop, not agent-native**: The blocking-Promise tools are explicitly human-interactive. Agents cannot answer them programmatically. This is the intended design for a logging app.
- **Errors/edge cases**: Out of scope for POC. We'll handle them as they come up.

## Technical Approach

### Phase 1: Expo Scaffolding + SDK Integration

**Goal**: Get a blank Expo app running that successfully imports and renders `TamboProvider` from `@tambo-ai/react`.

**Tasks**:

1. **Create `demos/` directory and scaffold Expo app**

   ```bash
   mkdir demos
   npx create-expo-app@latest demos/mobile-log --template blank-typescript
   ```

2. **Wire into monorepo**
   - Add `"demos/*"` to root `package.json` workspaces array
   - Set `"name": "@tambo-ai/mobile-log"` in `demos/mobile-log/package.json`
   - Add `"@tambo-ai/react": "*"` as dependency
   - Run `npm install` from root

3. **Configure Metro for monorepo** (`demos/mobile-log/metro.config.js`)
   - Use `@expo/metro-config` — **Expo SDK 52+ auto-configures `watchFolders` and `nodeModulesPaths` for monorepos**. Do NOT manually set these.
   - Only custom config needed: `resolveRequest` to stub `react-dom` and `react-media-recorder` as empty modules
   - `react-media-recorder` is a **direct dependency** of `@tambo-ai/react` (not a peer dep), so Metro will try to bundle it and it will fail with browser-only API errors

   ```javascript
   // metro.config.js — minimal config for SDK 52+ monorepo
   const { getDefaultConfig } = require("expo/metro-config");
   const path = require("path");

   const config = getDefaultConfig(__dirname);

   // Stub web-only modules that @tambo-ai/react depends on
   config.resolver.resolveRequest = (context, moduleName, platform) => {
     if (moduleName === "react-dom" || moduleName === "react-media-recorder") {
       return { type: "empty" };
     }
     return context.resolveRequest(context, moduleName, platform);
   };

   module.exports = config;
   ```

4. **Add turbo config**
   - Add `@tambo-ai/mobile-log#dev` task to `turbo.json`
   - Add `"dev:mobile": "turbo dev --filter=@tambo-ai/mobile-log"` to root scripts

5. **Verify basic integration**
   - Wrap app in `TamboProvider` with API key
   - Call `useTambo()` and log the result
   - Confirm no crashes or module resolution errors

**SDK Compatibility Issues to Surface**:

- `react-dom` peer dep → Metro stubs it, but we should make it optional in the SDK
- `react-media-recorder` → **Direct dep, not peer** — stubbed in Metro; `useTamboVoice` will be a no-op
- `currentPageContextHelper` → Returns null (guarded by `typeof window`)
- `FileReader` in `useMessageImages` → May need RN-specific handling
- `"use client"` directives → Harmless, ignored by Metro

### Phase 2: Core Log UI

**Goal**: Working log list + log detail screens with basic text chat.

**Tasks**:

1. **Set up Expo Router** in `app/` directory
   - `_layout.tsx` → `TamboProvider` + `Stack` navigator
   - `index.tsx` → Log list using `useTamboThreadList()`
   - `log/[id].tsx` → Single log view using `useTambo()`

2. **Log list screen** (`index.tsx`)
   - FlatList of threads, showing name/date/preview
   - Use compound `LogListItem` component with `Title`/`Timestamp`/`Preview` sub-components
   - "New Log" FAB button → calls `startNewThread()`, navigates to new log
   - Pull-to-refresh

3. **Log detail screen** (`log/[id].tsx`)
   - Inverted FlatList of messages (standard RN chat pattern)
   - `KeyboardAvoidingView` wrapping the screen: `behavior="padding"` on iOS, `undefined` on Android
   - Slot-based input bar at bottom with camera button and send button as `trailingAccessory`
   - Each message renders via `LogEntry` dispatcher → variant components
   - Call `switchThread(id)` on mount to sync with stream context

4. **Configure system prompt** via `initialMessages`
   - System message establishing the logging assistant persona
   - Instruct the AI to ask follow-up questions

### Research Insights: Chat UI

**Inverted FlatList critical props:**

```tsx
<FlatList
  inverted
  data={messagesNewestFirst}
  renderItem={renderItem} // memoized with useCallback
  keyExtractor={keyExtractor} // stable reference
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
    autoscrollToTopThreshold: 100,
  }}
/>
```

**Key gotchas:**

- `ListHeaderComponent` renders at the visual **bottom** in an inverted list (newest messages area). Use it for typing indicators or streaming messages.
- `ListFooterComponent` renders at the visual **top** (oldest messages area). Use it for "loading more" spinners.
- Empty inverted list anchors content to bottom — flip the empty state with `transform: [{ scaleY: -1 }]`.
- Use `React.memo` with custom comparator on message components to prevent re-renders during streaming.

**Streaming optimization:** Keep the "in-progress" streaming message in a separate state slot, rendered as `ListHeaderComponent`. Token updates never touch the FlatList data array, preventing full list diffing.

**Keyboard handling:** On iOS use `behavior="padding"`. On Android, `adjustResize` (the default) handles it automatically — pass `behavior={undefined}`. Use `react-native-safe-area-context` for bottom inset on the input bar.

### Phase 3: Prompt Tools + Photo Capture

**Goal**: Implement the blocking-tool pattern for user prompts, add photo capture.

**Tasks**:

1. **Define prompt tools** (`lib/tools.ts`)
   - Module-level `pendingResolve` variable + `resolvePrompt()` export (see sketch above)
   - `ask_multiple_choice` tool — returns unresolved Promise, stores resolve
   - `ask_rating` tool — same pattern, `outputSchema: z.object({ rating: z.number() })`
   - `ask_tags` tool — same pattern, `outputSchema: z.object({ tags: z.array(z.string()) })`
   - Enrich tool descriptions with usage guidance (when to use, when not to, return value semantics)

2. **Build generic prompt components** (`components/`)
   - `quick-answer.tsx` — takes `question: string`, `options: string[]`, `selectedOption?: string`, `onSelect: (option: string) => void`. Pure presentational, no knowledge of tools. Use `selectedOption` data prop (not boolean) for answered state.
   - `rating-prompt.tsx` — takes `question: string`, `min/max/labels`, `selectedRating?: number`, `onRate: (rating: number) => void`
   - `tag-picker.tsx` — takes `question: string`, `tags: string[]`, `selectedTags?: string[]`, `onSubmit: (selected: string[]) => void`

3. **Build the wiring layer** (`components/log-entry-prompt.tsx`)
   - Dispatch map from tool name → component renderer
   - Each renderer wires `resolvePrompt` into the generic component's callback
   - Check for existing `tool_result` content block → pass result to component for "answered" mode

4. **Photo capture** using `expo-image-picker` + `expo-image-manipulator`
   - Camera button in the input bar (`trailingAccessory` slot)
   - Capture photo → compress with `expo-image-manipulator` (1024px max dimension, JPEG quality 0.6)
   - Construct message content directly with `{ type: "resource", resource: { name, mimeType, blob: base64Data } }`
   - Display photos with `expo-image` (not RN Image) — better caching, blurhash placeholders, `contentFit`

5. **Tune the system prompt** to use these tools
   - AI should call `ask_multiple_choice` when it has 2-5 clear options
   - AI should call `ask_rating` for subjective assessments
   - AI should call `ask_tags` for categorization
   - AI should NOT use these tools for open-ended questions (just ask in text)
   - AI should call only one prompt tool per turn, then wait for the result

### Research Insights: Image Pipeline

**Recommended compression settings for a logging app:**
| Quality | Approximate Size (12MP photo) | Use Case |
|---------|-------------------------------|----------|
| 1.0 | 3-6 MB | Archival |
| 0.7 | 800 KB - 1.5 MB | Good quality |
| **0.6** | **400-800 KB** | **Logging app sweet spot** |
| 0.3 | 200-400 KB | Thumbnails |

**Pipeline:** Capture at full quality (`quality: 1` in picker) → compress separately with `expo-image-manipulator` for more control → base64 encode → send as resource content.

**Permission handling:** Request lazily when user taps camera. Check `canAskAgain` — if false, offer `Linking.openSettings()` fallback. On iOS 14+, `launchImageLibraryAsync` uses `PHPickerViewController` which handles its own permission flow.

**Display:** Use `expo-image` package with `cachePolicy="memory-disk"`, `contentFit="cover"`, and `recyclingKey` in lists for optimal performance.

### Phase 4: Polish + SDK Fixes

**Goal**: Smooth experience, document and fix SDK issues as they come up.

**Tasks**:

1. **Track and fix SDK compatibility issues** as they surface
   - `react-dom` peer dep → make it optional in `react-sdk/package.json`
   - `react-media-recorder` → stub in Metro (it's a direct dep, not peer)
   - Image handling (`FileReader`) → test on RN, add `expo-file-system` fallback if needed
   - Voice hook → no-op on RN is fine for MVP

2. **Thread naming** → Auto-generated log names (SDK already supports this)

3. **Dark mode** → Follow system theme via `useColorScheme()`

4. **Dynamic context** → Add a context helper that injects current log topic/entry count into system prompt

## Acceptance Criteria

### Functional Requirements

- [ ] Expo app runs on iOS simulator via `npm run dev:mobile` from repo root
- [ ] App successfully imports and uses `@tambo-ai/react` from the monorepo
- [ ] User can create a new log (thread)
- [ ] User can type text entries and see AI responses
- [ ] User can take/attach a photo to a log entry
- [ ] AI calls `ask_multiple_choice` tool → renders as tappable buttons that block until answered
- [ ] Tapping an answer resolves the tool's Promise, result sent back to AI, conversation continues
- [ ] Answered prompts show the selection as static/completed UI
- [ ] User can view a list of past logs (threads)
- [ ] User can switch between logs

### Non-Functional Requirements

- [ ] Metro bundler resolves all monorepo dependencies correctly
- [ ] No web-only API crashes at runtime
- [ ] Document all SDK incompatibilities found

## Dependencies & Risks

| Risk                                                         | Mitigation                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `@tambo-ai/react` has undiscovered web-only deps             | Metro stubs + iterative fixes in SDK                                           |
| `react-media-recorder` is a direct dep (not peer)            | Metro `resolveRequest` returns `{ type: "empty" }`                             |
| `@tambo-ai/typescript-sdk` may use Node.js APIs              | Investigate at integration time; likely uses `fetch` which RN supports         |
| Image handling differs in RN (no `FileReader.readAsDataURL`) | Use `expo-image-manipulator` + base64, construct `resource` content directly   |
| AI calls two prompt tools in one turn                        | System prompt instructs one-at-a-time; if broken, upgrade to Map-based resolve |
| User navigates away during pending prompt                    | Promise hangs; accept for POC, add cleanup later                               |
| Expo SDK version churn                                       | Pin to latest stable (SDK 52+)                                                 |
| Metro config complexity with monorepo                        | SDK 52+ auto-configures; only stubs needed                                     |

## References

### Internal

- Showcase template (how TamboProvider is wired): `showcase/src/app/template.tsx`
- SDK entry point: `react-sdk/src/v1/index.ts`
- Provider hierarchy: `react-sdk/src/v1/providers/tambo-v1-provider.tsx`
- Tool types: `react-sdk/src/model/component-metadata.ts`
- Tool executor (where `await tool.tool(args)` happens): `react-sdk/src/v1/utils/tool-executor.ts`
- Stream/thread state: `react-sdk/src/v1/utils/event-accumulator.ts`
- Thread input: `react-sdk/src/v1/providers/tambo-v1-thread-input-provider.tsx`
- Send message hook (while-loop over streams): `react-sdk/src/v1/hooks/use-tambo-v1-send-message.ts`
- Component renderer: `react-sdk/src/v1/components/v1-component-renderer.tsx`
- DOM guard example: `react-sdk/src/context-helpers/current-page-context-helper.ts`
- Image staging (shows `resource` content construction): `react-sdk/src/v1/providers/tambo-v1-thread-input-provider.tsx:43-73`

### External

- Expo docs: https://docs.expo.dev
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo monorepo guide: https://docs.expo.dev/guides/monorepos/
- expo-image-picker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- expo-image-manipulator: https://docs.expo.dev/versions/latest/sdk/imagemanipulator/
- expo-image: https://docs.expo.dev/versions/latest/sdk/image/
- AG-UI protocol: https://docs.ag-ui.com
