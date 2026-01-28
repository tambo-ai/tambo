# Bun + Elysia.js + Vite + Tambo Template 🥁⚡️

A high-performance, full-stack starter template for building Generative AI applications. Combines the speed of **Bun**, the elegance of **Elysia.js** backend, **Vite** frontend, and **Tambo SDK** for AI-powered generative interfaces.

## ✨ Key Features

- **⚡ Bun Monorepo**: Lightning-fast JavaScript runtime with built-in bundler and package manager
- **🚀 Elysia.js Backend**: Performant, type-safe API with automatic validation and streaming support
- **⚛️ Vite + React Frontend**: Lightning-fast HMR and optimized builds
- **🎙️ Voice Input**: Native `useTamboVoice` hook for speech-to-text integration
- **🧩 Generative Components**: Pre-built `SimpleChart` and `TodoList` with Tambo integration
- **🔧 Tool Integration**: Seamless backend tool calls with automatic UI component rendering
- **🎨 Polish UI**: Modern design system with smooth animations and responsive layout
- **📦 Type-Safe**: Full TypeScript support with Zod schema validation

## 🎯 Perfect For

- Building AI assistants with generative UIs
- Rapid prototyping of AI features
- Learning how to integrate Tambo with modern tech stacks
- Production-ready AI applications

## 🛠️ Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0+ installed
- [Tambo API Key](https://tambo.co/dashboard) (free)

### Installation

1. **Clone and install dependencies**:

   ```bash
   git clone <this-repo>
   cd bun-elysia-vite-tambo-template
   bun install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env
   ```

   Add your credentials:

   ```env
   # Backend API Key
   TAMBO_API_KEY=your_key_here

   # Frontend Public Key
   VITE_TAMBO_API_KEY=your_key_here
   ```

3. **Run development servers**:
   ```bash
   bun dev
   ```

   - **Frontend**: http://localhost:5173
   - **Backend**: http://localhost:3000

## 📁 Project Structure

```
bun-elysia-vite-tambo-template/
├── apps/
│   ├── server/               # Elysia.js backend
│   │   ├── src/
│   │   │   └── index.ts     # API routes, tools, and Tambo integration
│   │   └── package.json
│   │
│   └── web/                  # Vite + React frontend
│       ├── src/
│       │   ├── App.tsx              # Main chat interface
│       │   ├── components/
│       │   │   ├── DictationButton.tsx   # Voice input
│       │   │   ├── SimpleChart.tsx       # Chart component
│       │   │   └── TodoList.tsx          # Todo component
│       │   ├── tambo/
│       │   │   └── registry.ts      # Component & tool registration
│       │   └── index.css
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── .env.example              # Environment template
├── package.json              # Monorepo root
└── README.md                 # This file
```

## 🎤 Voice Input Feature

The template includes native voice-to-text using `useTamboVoice`:

```tsx
import { useTamboVoice, useTamboThreadInput } from "@tambo-ai/react";

export default function DictationButton() {
  const { startRecording, stopRecording, isRecording, transcript } =
    useTamboVoice();
  const { setValue } = useTamboThreadInput();

  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? "Stop" : "Start"}
    </button>
  );
}
```

## 🧩 Adding Custom Components

1. **Create a new component** in `apps/web/src/components/`:

```tsx
// MyComponent.tsx
export function MyComponent(props: { title: string; data: any[] }) {
  return <div>{props.title}</div>;
}
```

2. **Register it** in `apps/web/src/tambo/registry.ts`:

```typescript
import { MyComponent } from "../components/MyComponent";

export const components: TamboComponent[] = [
  {
    name: "myComponent",
    component: MyComponent,
    description: "A description for the AI to understand",
    propsSchema: z.object({
      title: z.string(),
      data: z.array(z.any()),
    }),
  },
  // ... existing components
];
```

3. **Use it in your prompts**: "Create a MyComponent with title 'Hello' and some data"

## 🔧 Adding Tools

Tools are defined in `apps/server/src/index.ts`:

```typescript
const tools: TamboTool[] = [
  {
    name: "getWeather",
    description: "Get weather for a location",
    tool: (params: { city: string }) => {
      return { temp: 72, condition: "sunny" };
    },
    inputSchema: z.object({
      city: z.string(),
    }),
    outputSchema: z.object({
      temp: z.number(),
      condition: z.string(),
    }),
  },
];
```

## 📖 Documentation

- **Tambo Docs**: https://docs.tambo.co/
- **Elysia.js Docs**: https://elysiajs.com/
- **Bun Docs**: https://bun.sh/docs
- **Vite Docs**: https://vitejs.dev/

## 🚀 Deployment

### Frontend (Vercel, Netlify, etc.)

```bash
bun run build
# Deploy the apps/web/dist folder
```

### Backend (Railway, Fly.io, Heroku, etc.)

```bash
bun run build
# Deploy apps/server with bun runtime
```

## 📝 License

MIT - Built for the Tambo Community

## 🤝 Contributing

We'd love your improvements! Open an issue or PR to help make this template even better.

---

**Happy building! 🚀**
