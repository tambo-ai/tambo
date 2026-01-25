# Tambo AI Text Toolkit

A starter template for building AI-powered text transformation tools using Tambo.

## Screenshot

![Tambo AI Text Toolkit Screenshot](./screenshot.png)
> Screenshot coming soon

## Video Demo

[Watch Demo Video](#)
> Demo video coming soon

## What's This?

This template demonstrates how to build task-focused AI text tools (not a chat app) using Tambo's generative and interactive components. It includes:

- **Text Input Panel**: Large textarea for user input
- **AI Action Buttons**: Interactive buttons that trigger different AI transformations
- **AI Output Display**: Generative component that shows AI-processed results

Users can paste text, click an action button (Explain, Summarize, or Simplify), and see AI-generated output instantly.

## Prerequisites

- **Node.js** 18 or higher
- **Tambo API Key**: Get yours at [tambo.co](https://tambo.co)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Tambo API key:

```
VITE_TAMBO_API_KEY=your_tambo_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## What's Included

### Technology Stack

- **React 18** - UI library
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **@tambo-ai/react** - Tambo React SDK

### Tambo Features Demonstrated

- **TamboProvider**: Root provider with API key configuration
- **Structured Content**: Transforming text into strictly formatted JSON
- **Generative UI**: Rendering React components from AI-generated data
- **Thread Management**: Automatic message handling via `useTambo` hook

## Generative UI Philosophy

This template demonstrates **Generative UI**, a pattern where the AI generates *data*, not just text. Instead of a chatbot returning paragraphs, the AI acts as a structured data API.

### How It Works

1. **Strict JSON Schema**: We force the LLM to output valid JSON matching a specific schema:
   ```typescript
   interface Output {
     title: string;
     mode: 'simplify' | 'summarize' | 'explain';
     sections: { heading: string; points: string[] }[];
     examples: string[];
   }
   ```

2. **UI Component Rendering**: The React app parses this JSON and passes it to the `StructuredOutputCards` component.

3. **Separation of Concerns**: 
   - **Tambo**: Handles the intelligence (summarizing, simplifying, explaining).
   - **React**: Handles the presentation (cards, colors, layout).

This approach makes your AI apps more robust, predictable, and easier to style than standard open-ended chat interfaces.

## Architecture

```
src/
├── App.tsx                          # Orchestrates AI calls & JSON parsing
├── components/
    └── tambo/
        ├── StructuredOutputCards.tsx # Renders JSON as UI cards
        ├── ActionButtons.tsx         # User input controls
        └── TextInputPanel.tsx        # Styled textarea
```

## How It Works

1. **App.tsx** wraps the application in `TamboProvider`
2. **Component Registration**: Registers `AITextOutput` generative component
3. **Tool Registration**: Registers three interactive tools:
   - `explain_text` - Provides detailed explanations
   - `summarize_text` - Creates concise summaries
   - `simplify_text` - Simplifies complex text
4. **User Flow**: 
   - User enters text
   - Clicks an action button
   - Tambo processes the request using the registered tool
   - AI output appears in the output panel

## Customization

### Add New Actions

Edit `src/App.tsx` to register new tools:

```tsx
registerTool({
  name: 'your_tool_name',
  description: 'What this tool does',
  parameters: z.object({
    text: z.string().describe('The input text'),
  }),
  execute: async ({ text }) => {
    setSelectedAction('your_action');
    return `Processing: ${text}`;
  },
});
```

Update `src/components/tambo/ActionButtons.tsx` to add the button UI.

### Customize Styling

Modify `tailwind.config.js` or edit component styles directly. All components use Tailwind CSS classes.

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Learn More

- [Tambo Documentation](https://tambo.co/docs)
- [Tambo React SDK](https://tambo.co/docs/react-sdk)
- [Showcase Examples](https://showcase.tambo.co)

## License

MIT
