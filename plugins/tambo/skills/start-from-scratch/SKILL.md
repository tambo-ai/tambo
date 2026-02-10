---
name: start-from-scratch
description: Guides creation of a new Tambo project from scratch with technology recommendations. Use when user wants to start a NEW project, build a new app with Tambo, create something from nothing, or needs help choosing technologies for a new generative UI application. For adding Tambo to EXISTING projects, use add-to-existing-project skill instead.
---

# Start From Scratch

Guide users through creating a new Tambo project with recommended technologies.

## Quick Start (Recommended Stack)

```bash
npx tambo create-app my-app --template=standard
cd my-app
npm run dev
```

This creates a Next.js + Tailwind + TypeScript + Zod project ready for generative UI.

## Guided Flow

When user wants to start fresh, ask about their preferences:

### Question 1: Framework

```
What framework would you like to use?

1. Next.js (Recommended) - Full-stack React with App Router
2. Vite - Fast, lightweight React setup
3. Other - I'll adapt to your choice
```

**Recommendation reasoning:**

- Next.js: Best for production apps, built-in API routes, great DX
- Vite: Great for SPAs, faster dev server, simpler setup

### Question 2: Styling

```
How would you like to style your app?

1. Tailwind CSS (Recommended) - Utility-first, works great with Tambo components
2. Plain CSS/CSS Modules - No framework, full control
3. Other (styled-components, Emotion, etc.)
```

**Recommendation reasoning:**

- Tailwind: Tambo CLI components use Tailwind by default
- Plain CSS: Works fine, but need to style Tambo components manually

### Question 3: TypeScript

```
Use TypeScript?

1. Yes (Recommended) - Type safety, better IDE support
2. No - Plain JavaScript
```

**Recommendation reasoning:**

- TypeScript: Tambo's Zod schemas provide excellent type inference

## Technology Stacks

### Recommended Stack (Default)

```
Next.js 14+ (App Router)
├── TypeScript
├── Tailwind CSS
├── Zod (for schemas)
└── @tambo-ai/react
```

```bash
npx tambo create-app my-app --template=standard
```

### Vite Stack

```
Vite + React
├── TypeScript
├── Tailwind CSS
├── Zod
└── @tambo-ai/react
```

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install @tambo-ai/react zod
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx tambo init --api-key=sk_...
```

### Minimal Stack

```
Vite + React
├── TypeScript
├── Plain CSS
├── Zod
└── @tambo-ai/react
```

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install @tambo-ai/react zod
npx tambo init --api-key=sk_...
```

## Setup Steps by Stack

### Next.js (Recommended)

```bash
# 1. Create app
npx tambo create-app my-app --template=standard
cd my-app

# 2. Initialize with API key
npx tambo init --api-key=sk_...

# 3. Start development
npm run dev
```

### Vite + Tailwind

```bash
# 1. Create Vite app
npm create vite@latest my-app -- --template react-ts
cd my-app

# 2. Install dependencies
npm install @tambo-ai/react zod
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Configure Tailwind (tailwind.config.js)
# content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]

# 4. Add Tailwind directives to src/index.css
# @tailwind base; @tailwind components; @tailwind utilities;

# 5. Initialize Tambo (sets up .env.local automatically)
npx tambo init --api-key=sk_...

# 6. Start development
npm run dev
```

### Vite Minimal (No Tailwind)

```bash
# 1. Create Vite app
npm create vite@latest my-app -- --template react-ts
cd my-app

# 2. Install dependencies
npm install @tambo-ai/react zod

# 3. Initialize Tambo (sets up .env.local automatically)
npx tambo init --api-key=sk_...

# 4. Start development
npm run dev
```

## Project Structure

After setup, create this structure:

```
my-app/
├── src/
│   ├── components/
│   │   └── tambo/           # Tambo UI components (from CLI)
│   ├── lib/
│   │   └── tambo.ts         # Component registry
│   ├── App.tsx              # Main app with TamboProvider
│   └── main.tsx             # Entry point
├── .env.local               # API key
└── package.json
```

## First Component

After project setup, guide user to create their first component:

```tsx
// src/components/Greeting.tsx
import { z } from "zod";

export const GreetingSchema = z.object({
  name: z.string().describe("Person's name"),
  mood: z.enum(["happy", "excited", "friendly"]).optional(),
});

type GreetingProps = z.infer<typeof GreetingSchema>;

export function Greeting({ name, mood = "friendly" }: GreetingProps) {
  const emojis = { happy: "😊", excited: "🎉", friendly: "👋" };
  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      <p className="text-lg">
        Hello, {name}! {emojis[mood]}
      </p>
    </div>
  );
}
```

```tsx
// src/lib/tambo.ts
import { TamboComponent } from "@tambo-ai/react";
import { Greeting, GreetingSchema } from "@/components/Greeting";

export const components: TamboComponent[] = [
  {
    name: "Greeting",
    component: Greeting,
    description:
      "Greets a person by name. Use when user wants to say hello or greet someone.",
    propsSchema: GreetingSchema,
  },
];
```

## Adding Chat UI

```bash
npx tambo add message-thread-full --yes
```

Then use in your app:

```tsx
import { MessageThreadFull } from "@/components/tambo/message-thread-full";

function App() {
  return (
    <div className="h-screen">
      <MessageThreadFull />
    </div>
  );
}
```

## Supported Technologies

| Technology       | Support Level | Notes                             |
| ---------------- | ------------- | --------------------------------- |
| Next.js 14+      | Full          | Recommended, App Router preferred |
| Vite             | Full          | Great for SPAs                    |
| Create React App | Partial       | Works but CRA is deprecated       |
| Remix            | Partial       | Works with client components      |
| TypeScript       | Full          | Strongly recommended              |
| JavaScript       | Full          | Works but less type safety        |
| Tailwind CSS     | Full          | Default for CLI components        |
| Plain CSS        | Full          | Need custom component styling     |
| CSS Modules      | Full          | Supported                         |
| Zod              | Required      | Used for all schemas              |
