# Tambo Product Discovery Starter (Vite + React)

A minimal, high-fidelity starter template for building **component-first generative UI** with [Tambo](https://tambo.ai) using Vite and React.

**Template Type:** Framework starter (Vite + React)

This template demonstrates how to orchestrate a seamless interaction between AI narration and React components (product cards, comparisons) while maintaining a clean, production-ready aesthetic.

## Demo

📸 **Screenshot**  


🎥 **Video Demo**  


## Primary Objectives

*   **Generative UI First**: Components are the authoritative source of truth; text narration is minimal "glue".
*   **Production Patterns**: Robust handling of "no results" scenarios and intelligent tool schemas.
*   **Minimalist Aesthetic**: Centered, chat-native layout with a neutral, high-end visual tone.
*   **Developer Experience**: Zero-config Vite setup with clean TypeScript patterns.

## Tech Stack

*   **Core**: [Vite](https://vitejs.dev/) + [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
*   **AI Integration**: [@tambo-ai/react](https://www.npmjs.com/package/@tambo-ai/react)
*   **Validation**: [Zod](https://zod.dev/)
*   **Styling**: Vanilla CSS (Custom tokens in `index.css`)

## Prerequisites

*   Node.js 18+
*   A **Tambo API Key** (Available for free at [tambo.ai](https://tambo.ai))

## Getting Started

1.  **Install dependencies**
    ```bash
    npm install
    ```

2.  **Configure environment variables**  
    Create a `.env.local` file in the project root:
    ```env
    VITE_TAMBO_API_KEY=your_api_key_here
    ```

3.  **Start the dev server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view the application.

## Core Concepts

### 1. Component Registration
Custom React components (e.g., `ProductCard`, `ComparisonTable`) are registered in `src/lib/tambo.ts`. These components define their own props, allowing the AI to understand exactly how to hydrate the UI.

### 2. Intelligent Tools
Tools in `src/tools` (like `recommendProduct` and `compareProducts`) are designed with production safety in mind:
*   **Clear Responsibility**: Descriptions instruct the AI to avoid repeating data already shown in cards.
*   **Graceful Failures**: Returns structured messages for "no match" scenarios, which the UI renders in a custom bordered state.

### 3. Component-First UX
The UI follows a strict hierarchy:
1.  **Narration**: AI text introduces the intent or transitions between thoughts.
2.  **Display**: Components (Cards, Tables) own the data (Name, Price, Details).
3.  **No Redundancy**: The template eliminates the common "UX smell" of AI restating card content in plain text.

## Example Interactions

| Prompt | Expected Result |
| :--- | :--- |
| "Recommend a coding laptop" | AI intro + MacBook Air/XPS 13 cards |
| "Compare MacBook Air and iPhone 14" | AI intro + Comparison table component |
| "Find a fitness smartwatch" | AI explanation + Bordered "no results" box |

## Project Structure
```text
src/
├── components/
│   └── tambo/     # AI-renderable UI components (ProductCard, ComparisonTable)
├── tools/         # Tambo tool definitions (Zod + Logic)
├── lib/           # Tambo registration and shared data
├── App.tsx        # Centered, chat-native layout
└── index.css      # Premium design tokens & global styles
```

## What This Template Does Not Include

- Authentication
- Database or backend services
- Server-side rendering (SSR)

These are intentionally omitted to keep the starter minimal and focused on Tambo’s generative UI patterns.

## Why This Template?
Unlike heavy framework starters, this template focuses purely on the **core generative UI interaction model**. It’s intentionally lightweight, making it ideal for hackathons or as a clean base for production experiments.

---

For more information, visit the [Tambo Documentation](https://docs.tambo.ai).