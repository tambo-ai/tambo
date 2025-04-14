# tambo ai

**Build assistants that do more than talk — they render real UI and get work done.**

tambo-ai is a React SDK for wiring natural language input to live components. Users describe what they want. tambo-ai matches that intent to a React component and passes the right props.

---

## Why tambo-ai

Most apps expect users to navigate to what they need. That works — until the product gets big.

tambo-ai flips the model: users describe what they want to do, and your app shows the right UI — pre-filled, contextual, and ready to use.

[] Demo?

If you've built:

- A chatbot that just responds with text
- A command bar that routes to a new page
- A complicated navigation system

tambo-ai gives you a cleaner, more powerful pattern.

---

## What tambo-ai is (and where it's going)

**Right now:** tambo-ai is a React SDK for building chat-based interfaces that render real UI components.

**Next:** We're building toward a full framework for intent-driven apps — where input comes from chat, docs, transcripts, or other context, and UI is generated dynamically.

tambo-ai is a foundation for apps that don't make users find features — they just use them.

---

## How It Works

tambo-ai connects user input to React components through an LLM.

```text
User Input → LLM → Matched Intent → React Component + Props
```

You provide the components and describe what they do. tambo-ai handles the intent matching, prop generation, and rendering.

Today we support these providers:

- OpenAI
- More cooming soon...

---

## What You Get

- Message thread + state management react hooks
- Intent to componenet matching
- Streaming responses for text and component messages.
- Safe prop generation from LLMs
- React hooks for message history, suggestions, and component state, and more.

## Install

```bash
npm install @tambo-ai/react
```

Or scaffold a full demo:

```bash
npx create-tambo-app@latest .
npm run dev
```

---

## Basic Setup

```jsx
import { TamboProvider } from "@tambo-ai/react";

function App() {
  return (
    <TamboProvider apiKey="your-api-key">
      <YourApp />
    </TamboProvider>
  );
}
```

---

## Example: Chat UI

```jsx
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";

function Chat() {
  const { thread } = useTambo();
  const { value, setValue, submit } = useTamboThreadInput();

  return (
    <>
      <div>
        {thread.messages.map((msg, i) => (
          <div key={i}>{msg.content}</div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input value={value} onChange={(e) => setValue(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```

---

## Example: AI-Generated Component

```jsx
import { useTamboComponentState } from "@tambo-ai/react";

export function EmailForm() {
  const [state, setState] = useTamboComponentState("email", {
    to: "",
    subject: "",
    body: "",
    sent: false,
  });

  const sendEmail = () => {
    // Implementation would connect to your email service
    console.log("Sending email to:", state.to);
    setState({ ...state, sent: true });
  };

  return (
    <div>
      {state.sent ? (
        <p>Email sent to {state.to}!</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendEmail();
          }}
        >
          <div>
            <label htmlFor="to">To:</label>
            <input
              id="to"
              value={state.to}
              onChange={(e) => setState({ ...state, to: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="subject">Subject:</label>
            <input
              id="subject"
              value={state.subject}
              onChange={(e) => setState({ ...state, subject: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="body">Message:</label>
            <textarea
              id="body"
              value={state.body}
              onChange={(e) => setState({ ...state, body: e.target.value })}
            />
          </div>
          <button type="submit">Send Email</button>
        </form>
      )}
    </div>
  );
}
```

Register the component:

```jsx
import { z } from "zod";

const components = [
  {
    name: "EmailForm",
    description: "A form for sending emails",
    component: EmailForm,
    propsSchema: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
      sent: z.boolean().optional(),
    }),
  },
];

<TamboProvider apiKey="your-api-key" components={components}>
  <YourApp />
</TamboProvider>;
```

---

## Resources

- [Docs](https://tambo.co/docs)
- [UI Kit](https://ui.tambo.co)
- [Showcase](./showcase/README.md)

## Community

- [Discord](https://discord.gg/dJNvPEHth6)
- [GitHub Stars](https://github.com/tambo-ai/tambo)

## Contributing

Our React SDK is open source! And we're open to contributions!

To get started, clone the repo:

```bash
git clone https://github.com/tambo-ai/tambo.git
```

Install dependencies:

```bash
npm install
```

Build the package:

```bash
npm run build
```

Link the package to your local project:

```bash
npm link ../path/to/tambo
```

Open a PR and we'll review it!
