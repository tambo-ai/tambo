# @tambo-ai/react-native

React Native SDK for [Tambo](https://tambo.co) — build AI-powered mobile applications.

## Installation

```bash
npm install @tambo-ai/react-native @tambo-ai/typescript-sdk
```

## Quick Start

```tsx
import { TamboProvider, useTamboThread, useTamboThreadInput } from '@tambo-ai/react-native';

function App() {
  return (
    <TamboProvider apiKey="your-api-key">
      <ChatScreen />
    </TamboProvider>
  );
}

function ChatScreen() {
  const { thread, messages, createThread } = useTamboThread();
  const { input, setInput, send, isSending } = useTamboThreadInput(thread?.id ?? '');

  useEffect(() => { createThread(); }, []);

  return (
    <View>
      <FlatList data={messages} renderItem={({ item }) => <Text>{item.content}</Text>} />
      <TextInput value={input} onChangeText={setInput} />
      <Button title="Send" onPress={send} disabled={isSending} />
    </View>
  );
}
```

## Hooks

| Hook | Description |
|------|-------------|
| `useTambo()` | Access the Tambo client |
| `useTamboThread()` | Create and manage threads |
| `useTamboThreadInput(threadId)` | Manage input and send messages |

## Documentation

See [tambo.co/docs](https://docs.tambo.co) for full documentation.
