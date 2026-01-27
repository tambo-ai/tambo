# Tambo + Elysia.js + Bun Starter Template 🥁⚡️

A high-performance, developer-first starter template for building Generative AI applications with Elysia.js and Bun.

## ✨ Features at a Glance

- **Bun Monorepo**: Clean separation between `apps/web` and `apps/server`.
- **Tambo AI Layer**: Optimized for real-time text and tool streaming using `RunCreateParams` with Elysia.js.
- **Tambo Component Registry**: Easy-to-extend registry in `apps/web/src/tambo/registry.ts`.
- **Power Prompts**: Pre-configured data-rich suggestions to showcase Generative UI instantly.

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed.
- [Tambo API Key](https://tambo.ai) (Add to `.env`).

### Setup Steps

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Setup environment**:

   ```bash
   cp .env.example .env
   # Add your TAMBO_API_KEY (Backend) and VITE_TAMBO_API_KEY (Frontend) to .env
   ```

3. **Run development server**:
   ```bash
   bun dev
   ```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 📦 What's Included

- **Bun & Elysia.js**: A high-performance stack for lightning-fast AI response times.
- **Tambo React SDK**: Native hooks and components for streaming Generative UI.
- **Pre-built Components**: Interactive `SimpleChart` and `TodoList` examples.
- **Modern UI**: Clean, light-mode design with purple accents (`indigo-600`).

## 📋 Tambo Integration

This template showcases a production-ready pattern for connecting a fast backend with a reactive frontend:

- **Type-Safe Backend**: Tool definitions optimized for LLM function calling.
- **Dynamic Frontend**: Automatic component mapping via a centralized registry.
- **Zod Validation**: Robust prop validation ensures your components always receive the right data.

---

## 📄 License

MIT. Built for the Tambo Community.
