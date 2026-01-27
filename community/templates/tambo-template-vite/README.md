# Vite + React + Tambo Starter

A minimal Vite + React starter template demonstrating how to integrate the Tambo React SDK with proper provider setup and environment configuration.

---

## Preview

### Screenshot

![App Screenshot](IMAGE_LINK_HERE)

### Video Demo

[Watch Demo](VIDEO_LINK_HERE)

---

## What This Template Demonstrates

This template shows the **required baseline setup** for using Tambo in a plain Vite React application:

- Configuring `TamboProvider`
- Supplying API key via environment variables
- Proper project structure
- Minimal clean UI
- Ready for registering components and tools

It is intentionally minimal so developers can extend it for their own use cases.

---

## Prerequisites

- Node.js 18+
- A Tambo API key

Get your API key from the Tambo dashboard.

---

## Setup

Clone or copy this template, then run:
```bash
npm install
cp .env.example .env
```

Add your API key inside `.env`:
```bash
VITE_TAMBO_API_KEY=your_api_key_here
```

Start the development server:
```bash
npm run dev
```

Open:
```
http://localhost:5173
```

---

## Project Structure
```
src/
├── main.tsx        # TamboProvider configuration
├── App.tsx         # Minimal UI layout
├── App.css         # Basic styling
└── lib/
    └── tambo.ts    # Environment + API key setup
```

---

## What's Included

- Vite
- React
- TypeScript
- @tambo-ai/react
- Minimal styling (plain CSS)

No additional libraries are included to keep the template lightweight and focused.

---

## How to Extend

You can now:

- Register custom Tambo components
- Add tools/actions
- Build AI-powered interfaces
- Add routing or styling libraries
- Connect to backend services

Example:
```tsx
<TamboProvider
  apiKey={apiKey}
  components={[/* your components */]}
  tools={[/* your tools */]}
>
```

