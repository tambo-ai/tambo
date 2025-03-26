# tambo ai

Build AI assistants and agents in React with a few lines of code.

<p align="center">
  <img src="assets/tambo-animation.gif" alt="tambo ai Logo">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tambo-ai/react"><img src="https://img.shields.io/npm/v/@tambo-ai/react.svg" alt="npm version"></a>
  <a href="https://github.com/tambo-ai/tambo/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tambo-ai/tambo.svg" alt="license"></a>
  <a href="https://github.com/tambo-ai/tambo/commits/main"><img src="https://img.shields.io/github/last-commit/tambo-ai/tambo.svg" alt="GitHub last commit"></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
  <a href="https://github.com/tambo-ai/tambo/stargazers"><img src="https://img.shields.io/github/stars/tambo-ai/tambo.svg?style=social" alt="GitHub stars"></a>
</p>

## The Future is Generative

The future of UX is generative and hyper-personalized. But today its really hard to build AI powered generative UI experiences. We are building tools that make this possible without complexity.

tambo ai eliminates React boilerplate for AI features. We handle the hard parts so you can focus on creating exceptional user experiences.

**Build AI assistants and agents in React without the headache.**

## What is tambo ai?

tambo ai is a React library that deals with the boring parts. Get started with an AI assistant in minutes.

- Thread management
- State persistence
- Streaming responses
- AI Orchestration
- A Compatabile React UI Library

You get clean React hooks that integrate seamlessly with your codebase.

## How It Works

Add tambo ai to your React app with a simple provider pattern:

```jsx
// Wrap your app with the provider
<TamboProvider apiKey="your-api-key">
  <App />
</TamboProvider>
```

### Core Features

- **Specialized hooks for specific needs:**

  - `useTamboThreadInput` - Input state and submission
  - `useTamboSuggestions` - AI-powered message suggestions
  - `useTamboThreadList` - Conversation management
  - `useTamboComponentState` - AI-generated component state

- **Component registration for AI-generated UI**
- **Tool integration for your data sources**
- **Streaming responses for real-time interactions**

## Getting Started

### Quick Start

```bash
# Install the package
npm install @tambo-ai/react

# Or with the CLI for guided setup
npx tambo --full-send
```

### Basic Usage

```jsx
import { TamboProvider, useTambo } from '@tambo-ai/react';

function MyAIComponent() {
  const { thread, sendThreadMessage } = useTambo();

  return (
    <div>
      <button onClick={() => sendThreadMessage('What's the weather today?')}>
        Ask about weather
      </button>
      {thread.messages.map((message, index) => (
        <div key={index}>
          <div>{message.content}</div>
          {message.component && message.component.renderedComponent}
        </div>
      ))}
    </div>
  );
}
```

[Read our full documentation](https://tambo.co/docs)

## Development

### Prerequisites

- Node.js 18.x+
- npm 10.x+

### Quick Commands

```bash
# Install
git clone https://github.com/tambo-ai/tambo.git && cd tambo && npm install

# Develop
npm run dev

# Build
npm run build

# Test
npm run test
```

## Resources

- [React Package Documentation](./react/README.md)
- [Showcase Documentation](./showcase/README.md)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Join the Community

We're building tools for the future of user interfaces. Your contributions matter.

**[Star this repo](https://github.com/tambo-ai/tambo)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.

---

<p align="center">
  <i>Built by developers, for developers.</i><br>
  <i>Because we believe the future of UI is generative and hyper-personalized.</i>
</p>
