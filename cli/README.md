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
npx tambo add message
```

### `update <component-name>`

Update an existing Tambo component in your project:

```bash
npx tambo update message
```

Available components:

#### Chat Components

- `message-thread-full` - Full-screen chat interface with history and typing indicators
- `message-thread-panel` - Split-view chat with integrated workspace
- `message-thread-collapsible` - Collapsible chat for sidebars
- `thread-content` - Message thread with grouping and timestamps
- `message-input` - Rich text input
- `message` - Individual message display with content formatting

#### Navigation & Control

- `control-bar` - Spotlight-style command palette
- `thread-list` - Organized chat thread navigation

#### Form & Input

- `form` - Dynamic form with validation
- `input-fields` - Text inputs

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
│   └── app/
│       └── layout.tsx  # Add TamboProvider here
└── .env.local         # Your API key configuration
```

## Environment Setup

The CLI will automatically create/update your `.env.local` file with:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your-api-key
```

## Provider Setup

After initialization, add the TamboProvider to your `app/layout.tsx`:

```tsx
import { TamboProvider } from "@tambo-ai/react";

export default function RootLayout({ children }) {
  return (
    <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}>
      {children}
    </TamboProvider>
  );
}
```

## Documentation

For detailed documentation and examples, visit [tambo.co/docs](https://tambo.co/docs)

## Development Status

This CLI is currently in active development. While core features are stable, you might encounter:

- Regular updates with new features
- API refinements
- Additional component options
- Enhanced configuration options

See demos of the components in action:

--> [here](https://tambo-ui.vercel.app/) <--

## License

MIT License - see the [LICENSE](https://github.com/tambo-ai/tambo/blob/main/LICENSE) file for details.

## Join the Community

We're building tools for the future of user interfaces. Your contributions matter.

**[Star this repo](https://github.com/tambo-ai/tambo)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.

---

<p align="center">
  <i>Built by developers, for developers.</i><br>
  <i>Because we believe the future of UI is generative and hyper-personalized.</i>
</p>
