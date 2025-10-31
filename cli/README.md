# tambo-cli

The Official CLI for tambo ui.

**⚠️ Note: This project is currently in active development. APIs and features may change.**

## Quick Start

```bash
npx tambo full-send
```

This command will:

1. Set up your Tambo API key
2. Install required components
3. Configure your project with necessary dependencies

## Installation

While you can install globally, we recommend using `npx` to ensure you're always using the latest version:

```bash
# Using npx (recommended)
npx tambo <command>
```

## Commands

### `init`

Initialize Tambo in your Next.js project. Two modes available:

```bash
# Full setup - recommended for new projects
npx tambo full-send

# Basic setup - just API key configuration
npx tambo init
```

### `add <component-name>`

Add a Tambo component to your project:

```bash
# Basic usage
npx tambo add message

# With legacy peer dependencies flag
npx tambo add message --legacy-peer-deps
```

### `update <component-name>`

Update an existing Tambo component in your project:

```bash
# Basic usage
npx tambo update message

# With legacy peer dependencies flag
npx tambo update message --legacy-peer-deps
```

Available components:

#### Chat Components

- `message-thread-full` - Full-screen chat interface with history and typing indicators
- `message-thread-panel` - Split-view chat with integrated workspace
- `message-thread-collapsible` - Collapsible chat for sidebars
- `thread-content` - Message thread with grouping and timestamps
- `thread-history` - Chat history management
- `message-input` - Rich text input
- `message` - Individual message display with content formatting
- `message-suggestions` - AI-powered message suggestions

#### Navigation & Control

- `control-bar` - Spotlight-style command palette
- `thread-list` - Organized chat thread navigation

#### Form & Input

- `form` - Dynamic form with validation
- `input-fields` - Text inputs
- `map` - Interactive Map

#### Data Visualization

- `graph` - Interactive charts (line, bar, scatter, pie)

## Project Structure

When you add components, they'll be installed in your project following this structure:

```
your-next-app/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── message-thread-full.tsx
│   │       └── ...
│   ├── lib/
│   │   └── tambo.ts       # Tool registry
│   └── app/
│       └── layout.tsx     # you could add TamboProvider here (for entire app)
└── .env.local            # Your API key configuration
```

## Environment Setup

The CLI will automatically create/update your `.env.local` file with:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your-api-key
```

## TamboProvider Setup

After initialization, you can add the TamboProvider in one of two ways:

### Option 1: Page-specific (easiest)

If you just want to add Tambo to specific pages or components, this is the quickest approach:

```jsx
// In a specific page file (e.g., app/ai-chat/page.tsx)
"use client"; // Important! TamboProvider is a client component

import { TamboProvider } from "@tambo-ai/react";
import { components } from "../../lib/tambo"; // Import components
import { MessageThreadFull } from "@/components/tambo/message-thread-full";

export default function AIChat() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
      components={components}
    >
      <MessageThreadFull />
    </TamboProvider>
  );
}
```

### Option 2: App-wide in layout file (best practice)

This approach provides better context sharing between components and is recommended for production apps:

```jsx
// In your layout file (e.g., app/layout.tsx)
"use client"; // Important! TamboProvider is a client component

import { TamboProvider } from "@tambo-ai/react";
import { components } from "../lib/tambo"; // Import components

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TamboProvider
          apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
          components={components}
        >
          {children}
        </TamboProvider>
      </body>
    </html>
  );
}
```

> **Note:** The TamboProvider manages client-side state for features like thread management, message history, and component state. The `"use client"` directive is required.

## Documentation

For detailed documentation and examples, visit [docs.tambo.co](https://docs.tambo.co)

For more information about all available components and installation options, check out the [tambo ui showcase](https://github.com/tambo-ai/tambo/tree/main/showcase).

## Development Status

This CLI is currently in active development. While core features are stable, you might encounter:

- Regular updates with new features
- API refinements
- Additional component options
- Enhanced configuration options

See demos of the components in action:

--> [here](https://ui.tambo.co/) <--

## License

MIT License - see the [LICENSE](https://github.com/tambo-ai/tambo/blob/main/LICENSE) file for details.

## Join the Community

We're building tools for the future of user interfaces. Your contributions matter.

**[Star this repo](https://github.com/tambo-ai/tambo)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.

---

<p align="center">
  <i>Built by developers, for developers.</i><br>
  <i>Because we believe the future is generative.</i>
</p>
