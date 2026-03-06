# Manual QA Testing Checklist

Comprehensive manual QA checklist covering all standard user flows across Tambo Cloud, CLI, SDK, API, and Documentation.

---

## Distilled QA Walkthrough

A compact, action-based walkthrough that validates the app through real user interactions. Organized by where you go and what you do — each action covers multiple features at once.

### Smoketest Page (`/internal/smoketest` — requires login + Cloud running)

The smoketest page is the primary integration surface. It exercises ThreadContent, MessageInput, suggestions, tool calls, generative components, thread management, and streaming status all on one page.

**1. Send a message and watch the response stream**

- [ ] Type a message in the input, press Enter
- [ ] Watch the response stream character-by-character in the ThreadContent area
- [ ] Observe the streaming status indicator below the messages update through states
- [ ] Send a follow-up to confirm the conversation loop works
- Covers: MessageInput submit, streaming, Message rendering, ThreadContent (solid variant), streaming status

**2. Trigger weather tool calls**

- [ ] Ask "What's the weather in Tokyo?" — observe tool calls fire
- [ ] Watch the API Activity panel light up (running state, duration timers)
- [ ] See the WeatherDay or AirQuality component render with real data
- [ ] Ask for air quality or historical weather to trigger different tools
- Covers: ToolcallInfo loading/success, generative component rendering (WeatherDay, AirQuality), tool result display

**3. Test API activity controls**

- [ ] Toggle "Pause" on one of the API monitors (e.g. Forecast), then trigger that tool — confirm it hangs
- [ ] Unpause and confirm the call completes
- [ ] Toggle "Error" on an API monitor, trigger the tool — confirm the error surfaces in the Errors card
- [ ] Clear errors with the X button
- Covers: API Activity Monitor pause/unpause/error simulation, error display and clearing

**4. Click a suggestion chip**

- [ ] After an assistant response, wait for suggestion chips to appear
- [ ] Click a suggestion — confirm it populates the input (does not auto-submit)
- [ ] Observe loading state while suggestions generate
- Covers: useTamboSuggestions, suggestion accept flow, loading/selected states

**5. Test thread management**

- [ ] Click "New Thread" — confirm a fresh thread starts, messages clear
- [ ] Send a message in the new thread
- [ ] In the thread list on the left, click back to the previous thread — messages reload
- [ ] Click Refresh on the thread list — confirm it updates
- Covers: startNewThread, switchThread, ThreadList rendering, thread persistence

**6. Test the Streaming Tools section**

- [ ] Scroll to the Streaming Tools card
- [ ] Trigger the story generation tool and watch partial results stream in
- Covers: streaming tool execution, incremental result rendering

### Showcase App (secondary — UI variant coverage)

**7. Have a conversation in MessageThreadFull**

- [ ] Open the showcase, go to MessageThreadFull
- [ ] Send a message, click stop mid-stream, send another
- Covers: stop button visibility, cancel streaming, message loop

**8. Attach an image and send**

- [ ] Paste or drag an image into the input (or use file picker)
- [ ] Submit the message with the attachment
- Covers: file staging, image content blocks, input toolbar

**9. Test generative component demos**

- [ ] Go to `/components/form` — ask for a form, fill it out, submit
- [ ] Go to `/components/graph` — see chart render
- [ ] Go to `/components/map` — see markers, pan/zoom
- Covers: generative component rendering, component prop streaming

**10. Test CanvasSpace**

- [ ] Go to `/components/canvas-space` — ask for a component, see it render
- [ ] Switch to a new thread, confirm canvas clears
- Covers: canvas-space event API, thread switching

**11. Test collapsible, panel, and ControlBar variants**

- [ ] `/components/message-thread-collapsible` — expand, chat, collapse
- [ ] `/components/message-thread-panel` — split layout, send a message
- [ ] `/components/control-bar` — Cmd+K to open, send message, close
- Covers: block variant orchestration, hotkey binding, modal overlay

**12. Test EditWithTambo button**

- [ ] Go to `/components/edit-with-tambo-button`
- [ ] Hover, click edit, type an instruction, send
- Covers: interactable component detection, inline edit flow

**13. Test Elicitation UI**

- [ ] Go to `/components/elicitation`
- [ ] Single-field boolean (should auto-respond, no submit)
- [ ] Multi-field (fill fields, submit)
- [ ] Decline an elicitation
- Covers: Elicitation mode switching, form field types, submit/decline/cancel

**14. Test MCP pickers (if MCP servers configured)**

- [ ] Click MCP config button in any MessageInput
- [ ] Browse prompts, select one — text inserts
- [ ] Browse resources, search/filter, select
- Covers: McpPrompts and McpResources picker lifecycle

**15. Test thread history and switching**

- [ ] After several conversations, open ThreadHistory
- [ ] Search/filter, click a different thread, click "New"
- Covers: ThreadHistory list/search/select, ThreadDropdown new-thread

**16. Verify MessageInput and Message display variants**

- [ ] `/components/message-input` — all variants render, auto-resize works
- [ ] `/components/message` — all 7 examples display correctly
- Covers: input variant rendering, all message rendering paths

### apps/web Dashboard

**17. Open Tambo Cloud chat panel (Cmd+K)**

- [ ] Send a message, see panel stream a response with tools
- [ ] Drag the resize handle
- Covers: panel integration, tool execution, MessageThreadPanel, resize

**18. Mobile nav**

- [ ] Shrink to mobile width, open hamburger, tap "Ask Tambo"
- Covers: mobile trigger, responsive layout

### Docs Site

**19. Visit each react-ui-base reference page**

- [ ] Navigate to reference section, open each primitive page (MessageInput, Elicitation, Message, ToolcallInfo, ReasoningInfo, ThreadHistory, ThreadDropdown, ThreadContent, McpPrompts, McpResources)
- [ ] Confirm Demo, Anatomy, Examples, API reference sections present
- [ ] Confirm live DemoPreview components render and code is expandable
- Covers: docs compilation, API table accuracy, interactive demos

---

## 1. Authentication & Onboarding (Cloud)

- [ ] **Sign up via GitHub** — create new account via GitHub OAuth
- [ ] **Sign up via Google** — create new account via Google OAuth
- [ ] **Legal acceptance** — verify Terms/Privacy gate blocks dashboard access until accepted
- [ ] **Log in via GitHub** — existing user authenticates successfully
- [ ] **Log in via Google** — existing user authenticates successfully
- [ ] **Unauthorized domain** — blocked user sees `/unauthorized` page (if domain whitelisting enabled)
- [ ] **Log out** — session is cleared and user is redirected to login

## 2. CLI Authentication

- [ ] **`tambo auth login`** — opens browser, completes device code flow, stores token
- [ ] **`tambo auth login --no-browser`** — prints URL instead of opening browser
- [ ] **`tambo auth status`** — shows authenticated user info
- [ ] **`tambo auth status --quiet`** — exit code 0 if authenticated, 1 otherwise
- [ ] **`tambo auth logout`** — clears stored credentials
- [ ] **`tambo auth sessions`** — lists active CLI sessions
- [ ] **`tambo auth revoke-session`** — revokes a specific session
- [ ] **`tambo auth revoke-session --all`** — revokes all sessions
- [ ] **Device code page** (`/device`) — enter 8-char code, verify auto-formatting (XXXX-XXXX), success state

## 3. CLI Sessions (Cloud)

- [ ] **View CLI sessions** — `/cli-sessions` lists all active sessions with creation/expiration dates
- [ ] **Revoke individual session** — session disappears from list
- [ ] **Revoke all sessions** — all sessions cleared

## 4. Dashboard & Projects

- [ ] **Empty state** — new user sees onboarding wizard (no projects)
- [ ] **Create project** — via onboarding wizard (first project) or CreateProjectDialog (subsequent)
- [ ] **Dashboard metrics** — total projects, total messages, total users displayed
- [ ] **Period selector** — toggle between all time / 30 days / 7 days for messages and users
- [ ] **Project list** — shows name, message count, user count, created date per project
- [ ] **Project dropdown** — search/filter projects, quick switch, create new from dropdown
- [ ] **Delete project** — project removed from list

## 5. Project Overview

- [ ] **Project page** (`/[projectId]`) — shows project info
- [ ] **Missing API key alert** — shows warning with link to settings if no keys exist
- [ ] **Daily messages chart** — 30-day visualization renders correctly
- [ ] **Message usage stats** — accurate counts

## 6. Project Settings — API Keys

- [ ] **Generate new API key** — key appears in list with optional name
- [ ] **Copy key to clipboard** — clipboard contains correct key
- [ ] **View existing keys** — creation/expiration dates shown
- [ ] **Delete API key** — key removed from list

## 7. Project Settings — LLM Providers

- [ ] **Select provider** — dropdown shows available providers (OpenAI, Anthropic, etc.)
- [ ] **Enter provider API key** — saves successfully
- [ ] **Select model** — model dropdown populates for chosen provider
- [ ] **Custom parameters** — visual editor and JSON editor both work
- [ ] **Free message limit** — displayed correctly for project
- [ ] **Save changes** — settings persist on page reload

## 8. Project Settings — Custom Instructions

- [ ] **Edit system prompt** — rich text editor works
- [ ] **System prompt override toggle** — toggles correctly
- [ ] **Persistence** — instructions saved and reloaded on revisit

## 9. Project Settings — MCP Servers

- [ ] **Add MCP server** — enter URL, select transport type (stdio/SSE/HTTP), custom headers
- [ ] **Authorize server** — authorization flow completes
- [ ] **View server tools** — lists available tools for server
- [ ] **Edit server config** — changes persist
- [ ] **Delete server** — removed from list

## 10. Project Settings — Tool Call Limit

- [ ] **Set limit** — numeric input validates and saves

## 11. Project Settings — User Authentication (OAuth)

- [ ] **Toggle token requirement** — on/off
- [ ] **Symmetric validation** — enter shared secret, saves
- [ ] **Asymmetric manual** — enter public key, saves
- [ ] **Asymmetric JWKS URL** — enter URL, saves
- [ ] **Userinfo endpoint** — enter URL, saves

## 12. Project Settings — Navigation

- [ ] **Desktop sidebar** — all sections accessible, active section highlighted
- [ ] **Mobile dropdown** — navigation works on small screens
- [ ] **Smooth scrolling** — clicking section scrolls to it

## 13. Observability / Threads

- [ ] **Threads table** — paginated list renders
- [ ] **Search threads** — filter by thread properties
- [ ] **Sort columns** — created date, updated date, thread ID, name, context key, message count, error count
- [ ] **Compact mode toggle** — hides less important columns
- [ ] **Refresh button** — reloads thread data
- [ ] **Thread details modal** — click thread to view messages
- [ ] **Message types in detail** — user messages, assistant responses, tool calls (with args), tool responses, component renders all display correctly
- [ ] **Stats header** — total messages, tool calls, errors shown
- [ ] **Delete thread** — thread removed from table

## 14. CLI — Project Init & Scaffolding

- [ ] **`tambo init`** — initializes Tambo in existing project (interactive mode)
- [ ] **`tambo init --api-key=sk_...`** — direct API key mode, no browser needed
- [ ] **`tambo init --project-name=myapp`** — creates new project
- [ ] **`tambo init --project-id=abc123`** — uses existing project
- [ ] **`tambo full-send`** — init + auto-install all components
- [ ] **`tambo create-app`** — scaffolds new app from template
- [ ] **`tambo create-app --template=vite`** — vite template works
- [ ] **`tambo create-app --template=analytics`** — analytics template works

## 15. CLI — Component Management

- [ ] **`tambo list`** — shows all available components
- [ ] **`tambo add <component>`** — installs component with dependencies
- [ ] **`tambo add <comp1> <comp2>`** — multi-component install
- [ ] **`tambo add --dry-run`** — shows what would be installed without changes
- [ ] **`tambo update <component>`** — updates specific component
- [ ] **`tambo update installed`** — updates all installed components
- [ ] **`tambo upgrade`** — upgrades packages, components, LLM rules
- [ ] **`tambo migrate`** — migrates ui/ components to tambo/ directory

## 16. SDK — Provider & Setup

- [ ] **TamboProvider renders** — wrap app with `apiKey` + `userKey`, no errors
- [ ] **TamboProvider with userToken** — JWT auth mode works
- [ ] **Component registration via props** — `components` array accepted
- [ ] **Tool registration via props** — `tools` array accepted
- [ ] **contextKey isolation** — different contextKeys get separate thread histories
- [ ] **initialMessages** — new threads seed with starter messages
- [ ] **autoGenerateThreadName** — thread gets named after messages exchanged

## 17. SDK — Core Chat Flow (Smoketest)

- [ ] **Type message in MessageInput** — text appears in input
- [ ] **Submit message** — message sent to thread, user message appears
- [ ] **Assistant response streams** — text arrives character-by-character in real time
- [ ] **Streaming indicators** — `isStreaming` / `isWaiting` states reflected in UI
- [ ] **Stop generation** — cancel button stops streaming mid-response
- [ ] **Multiple messages** — conversation continues with context
- [ ] **Enter to submit** — keyboard shortcut works (Shift+Enter for newline)

## 18. SDK — Thread Management

- [ ] **Start new thread** — `startNewThread()` creates fresh conversation
- [ ] **Switch thread** — `switchThread(id)` loads existing thread with messages
- [ ] **Thread list** — `useTamboThreadList()` returns user's threads
- [ ] **Thread history UI** — ThreadHistory component shows thread list with names
- [ ] **Rename thread** — `updateThreadName()` persists
- [ ] **Delete thread** — thread removed from list
- [ ] **Placeholder thread** — new thread uses placeholder ID until first message

## 19. SDK — Generative UI / Component Rendering

- [ ] **Component renders in chat** — registered component appears in assistant response
- [ ] **Component props from AI** — AI-generated props populate component correctly
- [ ] **Component streaming** — props stream in incrementally (`useTamboStreamStatus`)
- [ ] **Loading component** — `loadingComponent` shows while component pending
- [ ] **Multiple components** — multiple different components render in one conversation
- [ ] **Form component** — dynamic fields (text, email, number, select, textarea, radio, checkbox, slider, yes-no), submit works
- [ ] **Graph component** — data visualization renders
- [ ] **Map component** — geographic visualization renders

## 20. SDK — Interactable Components

- [ ] **`withTamboInteractable()` wrapping** — component registers as interactable
- [ ] **AI updates props** — assistant can modify interactable component props
- [ ] **AI updates state** — assistant can modify interactable component state
- [ ] **`useTamboComponentState()` sync** — state changes sync to server (debounced)
- [ ] **Bidirectional sync** — local changes go to server, server changes update local

## 21. SDK — Tools

- [ ] **Tool registration** — registered tool appears in AI's capabilities
- [ ] **Tool execution** — AI calls tool, tool runs, result returned
- [ ] **Tool call display** — tool call shows in message with name and arguments
- [ ] **Tool result display** — tool result appears after tool call
- [ ] **`transformToContent`** — rich output (images, etc.) from tool results

## 22. SDK — Suggestions

- [ ] **Auto-generate suggestions** — suggestions appear after assistant message
- [ ] **Manual generate** — `generate()` triggers new suggestions
- [ ] **Accept suggestion** — sets input text or auto-submits
- [ ] **Suggestion loading** — loading state shown during generation

## 23. SDK — Voice Input

- [ ] **Start recording** — microphone access requested and recording begins
- [ ] **Stop recording** — recording ends
- [ ] **Transcription** — audio transcribed to text
- [ ] **Error handling** — media access errors and transcription errors displayed

## 24. SDK — Image Attachments

- [ ] **Paste image in input** — image attaches to message
- [ ] **File picker** — select image from filesystem
- [ ] **Multiple images** — multiple images attach
- [ ] **Image sent with message** — images appear as content blocks

## 25. SDK — MCP Integration

- [ ] **MCP server connection** — configured servers connect
- [ ] **Tool discovery** — MCP server tools available to AI
- [ ] **Elicitation UI** — ElicitationUI renders JSON Schema-driven forms
- [ ] **Single-question elicitation** — auto-response, no submit button
- [ ] **Multi-question elicitation** — submit/decline/cancel buttons work
- [ ] **MCP config button in input** — opens MCP server configuration

## 26. SDK — Chat Interface Variants

- [ ] **MessageThreadFull** — full-screen chat works
- [ ] **MessageThreadCollapsible** — expands/collapses correctly
- [ ] **MessageThreadPanel** — split-view layout works
- [ ] **ControlBar** — floating button opens chat, Cmd+K shortcut works
- [ ] **CanvasSpace** — shows latest generated component, clears on thread switch
- [ ] **EditWithTamboButton** — spawns AI editor modal

## 27. SDK — Error States

- [ ] **API error** — user sees error message in input area
- [ ] **Rate limit** — appropriate message shown
- [ ] **Network failure** — graceful error handling
- [ ] **Invalid API key** — clear error on provider init

## 28. API — Direct Endpoint Testing

- [ ] **`GET /health`** — returns healthy status
- [ ] **`POST /v1/threads/runs`** (SSE) — creates thread + streams response
- [ ] **`DELETE /v1/threads/:id/runs/:runId`** — cancels active run
- [ ] **`POST /v1/threads/:id/components/:compId/state`** — updates component state
- [ ] **`POST /storage/presign`** — returns presigned S3 upload URL
- [ ] **`POST /audio/transcribe`** — transcribes uploaded audio file
- [ ] **`POST /oauth/token`** — token exchange works for supported providers

## 29. Documentation Site

- [ ] **Homepage loads** — docs site renders at port 8263
- [ ] **Navigation** — sidebar shows all sections, links work
- [ ] **Search** — search API returns results (if enabled in UI)
- [ ] **Quickstart guide** — steps are accurate and work end-to-end
- [ ] **Live demos** — DemoPreview components render with expandable code
- [ ] **Code examples** — syntax highlighted, copy-paste ready
- [ ] **API reference** — OpenAPI spec renders
- [ ] **LLM provider pages** — all 6+ providers documented
- [ ] **Self-hosting guide** — Docker/Kubernetes instructions present
- [ ] **Mobile responsive** — docs readable on mobile

## 30. Cross-Cutting Concerns

- [ ] **Responsive design** — Cloud dashboard works on mobile (hamburger menu, dropdowns)
- [ ] **Loading states** — skeletons shown during data fetches, not just spinners
- [ ] **Toast notifications** — errors and success actions show toasts
- [ ] **404 page** — invalid routes show not found page
- [ ] **Deep linking** — direct URLs to project/settings/observability work
- [ ] **Browser back/forward** — navigation history works correctly
- [ ] **Multiple tabs** — app works in multiple tabs simultaneously
- [ ] **Telemetry opt-out** — `TAMBO_TELEMETRY_DISABLED=1` prevents CLI tracking
