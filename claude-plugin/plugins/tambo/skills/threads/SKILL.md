---
name: threads
description: Manages Tambo threads, messages, suggestions, voice input, and image attachments. Use when working with conversations, sending messages, implementing AI suggestions, adding voice input, managing multi-thread UIs, or handling image attachments with useTamboThread, useTamboSuggestions, or useTamboVoice.
---

# Threads and Input

Manages conversations, suggestions, voice input, and image attachments.

## Quick Start

```tsx
const { thread, sendThreadMessage, isIdle } = useTamboThread();

await sendThreadMessage("Hello", { streamResponse: true });
```

## Thread Management

Access and manage the current thread:

```tsx
import { useTamboThread } from "@tambo-ai/react";

function Chat() {
  const {
    thread, // Current thread with messages
    sendThreadMessage, // Send user message
    isIdle, // True when not generating
    generationStage, // Current stage (IDLE, STREAMING_RESPONSE, etc.)
    switchCurrentThread, // Switch to different thread
    inputValue, // Current input field value
    setInputValue, // Update input field
  } = useTamboThread();

  const handleSend = async () => {
    await sendThreadMessage(inputValue, { streamResponse: true });
    setInputValue("");
  };

  return (
    <div>
      {thread?.messages.map((msg) => (
        <div key={msg.id}>
          {msg.content.map((part, i) =>
            part.type === "text" ? <p key={i}>{part.text}</p> : null,
          )}
          {msg.renderedComponent}
        </div>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button onClick={handleSend} disabled={!isIdle}>
        Send
      </button>
    </div>
  );
}
```

### Generation Stages

| Stage                 | Description                      |
| --------------------- | -------------------------------- |
| `IDLE`                | Not generating                   |
| `CHOOSING_COMPONENT`  | Selecting which component to use |
| `FETCHING_CONTEXT`    | Calling registered tools         |
| `HYDRATING_COMPONENT` | Generating component props       |
| `STREAMING_RESPONSE`  | Actively streaming               |
| `COMPLETE`            | Finished successfully            |
| `ERROR`               | Error occurred                   |

## Thread List

Manage multiple conversations:

```tsx
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";

function ThreadSidebar() {
  const { data: threads, isPending } = useTamboThreadList();
  const { thread, switchCurrentThread } = useTamboThread();

  if (isPending) return <Skeleton />;

  return (
    <ul>
      {threads?.items.map((t) => (
        <li key={t.id}>
          <button
            onClick={() => switchCurrentThread(t.id)}
            className={thread?.id === t.id ? "active" : ""}
          >
            {t.name || "Untitled"}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## Suggestions

AI-generated follow-up suggestions after each assistant message:

```tsx
import { useTamboSuggestions } from "@tambo-ai/react";

function Suggestions() {
  const { suggestions, isLoading, accept, isAccepting } = useTamboSuggestions({
    maxSuggestions: 3, // 1-10, default 3
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="suggestions">
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={() => accept(s)} // Sets input value
          // onClick={() => accept(s, true)}  // Sets and auto-submits
          disabled={isAccepting}
        >
          {s.title}
        </button>
      ))}
    </div>
  );
}
```

### Custom Suggestions

Override auto-generated suggestions:

```tsx
const { setCustomSuggestions } = useTamboContextAttachment();

setCustomSuggestions([
  { id: "1", title: "Edit this", detailedSuggestion: "...", messageId: "" },
  { id: "2", title: "Add feature", detailedSuggestion: "...", messageId: "" },
]);

// Clear to return to auto-generated
setCustomSuggestions(null);
```

## Voice Input

Speech-to-text transcription:

```tsx
import { useTamboVoice } from "@tambo-ai/react";

function VoiceButton() {
  const {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
    transcriptionError,
    mediaAccessError,
  } = useTamboVoice();

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop" : "Record"}
      </button>
      {isTranscribing && <span>Transcribing...</span>}
      {transcript && <p>{transcript}</p>}
      {transcriptionError && <p className="error">{transcriptionError}</p>}
    </div>
  );
}
```

### Voice Hook Returns

| Property             | Type             | Description                       |
| -------------------- | ---------------- | --------------------------------- |
| `startRecording`     | `() => void`     | Start recording, reset transcript |
| `stopRecording`      | `() => void`     | Stop and start transcription      |
| `isRecording`        | `boolean`        | Currently recording               |
| `isTranscribing`     | `boolean`        | Processing audio                  |
| `transcript`         | `string \| null` | Transcribed text                  |
| `transcriptionError` | `string \| null` | Transcription error               |
| `mediaAccessError`   | `string \| null` | Mic access error                  |

## Image Attachments

Manage images in message input:

```tsx
import { useMessageImages } from "@tambo-ai/react";

function ImageInput() {
  const { images, addImage, addImages, removeImage, clearImages } =
    useMessageImages();

  const handleFiles = async (files: FileList) => {
    await addImages(Array.from(files)); // Only valid images added
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files!)}
      />
      {images.map((img) => (
        <div key={img.id}>
          <img src={img.preview} alt={img.file.name} />
          <button onClick={() => removeImage(img.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### Image Hook Returns

| Property      | Type                               | Description                            |
| ------------- | ---------------------------------- | -------------------------------------- |
| `images`      | `StagedImage[]`                    | Staged images ready to send            |
| `addImage`    | `(file: File) => Promise<void>`    | Add single image (throws if not image) |
| `addImages`   | `(files: File[]) => Promise<void>` | Add multiple (only valid images kept)  |
| `removeImage` | `(id: string) => void`             | Remove by ID                           |
| `clearImages` | `() => void`                       | Remove all                             |

## User Authentication

Enable per-user thread isolation with `userToken`:

```tsx
import { TamboProvider } from "@tambo-ai/react";

function App() {
  const userToken = useUserToken(); // From your auth provider (Auth0, Clerk, etc.)

  return (
    <TamboProvider userToken={userToken}>
      <Chat />
    </TamboProvider>
  );
}
```

With `userToken`, each user sees only their own threads. Supports Auth0, Clerk, Supabase, WorkOS, and any OAuth 2.0 provider with JWT tokens.
