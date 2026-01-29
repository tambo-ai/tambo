# AI Analytics Dashboard

A production-ready starter template demonstrating Tambo's Generative UI SDK for building AI-powered analytics dashboards. This template shows how to transform natural language queries into dynamic visualizations and interactive data exploration tools.

## Overview

This template creates a conversational analytics dashboard for small business data. Users can ask questions in plain English, and the AI generates appropriate visualizations, summaries, and tables to answer their queries. The dashboard demonstrates the full power of Tambo's component-based architecture with both generative and stateful interactive components.

## Features

- **Natural Language Queries** - Ask questions like "Show revenue by region" or "Compare last 3 months"
- **Dynamic Visualizations** - Automatically generates bar charts, line charts, and pie charts using Recharts
- **KPI Summaries** - Display key metrics in clean, professional summary cards
- **Tabular Data** - Render detailed data tables with sorting and filtering
- **Persistent Filters** - Interactive filters panel with state that persists across conversation turns
- **Responsive Design** - Clean, modern UI built with Tailwind CSS
- **Type-Safe** - Full TypeScript support with Zod schema validation
- **Mock Dataset** - Includes sample sales data for immediate testing

## What This Template Demonstrates

### Tambo SDK Capabilities

1. **Component Registration** - Shows how to register both simple generative components and complex interactable components with persistent state
2. **Schema Validation** - Uses Zod to ensure type safety between AI-generated props and React components
3. **State Management** - Demonstrates `withInteractable` for components that maintain state across messages
4. **System Prompts** - Includes a well-crafted system prompt that guides the AI to make smart visualization choices
5. **Multi-Component Responses** - AI can render multiple components in a single response

### React Best Practices

- Functional components with TypeScript
- Proper separation of concerns (UI, data, configuration)
- Clean component architecture
- Accessible form controls
- Responsive layouts with Tailwind

## Example Prompts

Try these queries to explore the dashboard:

- **Regional Analysis**: "Show revenue by region"
- **Time Series**: "Compare revenue over the last 3 months"
- **Top Performers**: "What are the top 5 products by revenue?"
- **Category Breakdown**: "Show me electronics sales"
- **Geographic Focus**: "Only show data for India"
- **Combined Queries**: "Show revenue by category with a summary of total sales"

## Project Structure

```
tambo-ai-analytics-dashboard/
├── src/
│   ├── components/         # React components
│   │   ├── Graph.tsx       # Chart visualization (bar, line, pie)
│   │   ├── SummaryCard.tsx # KPI summary card
│   │   ├── DataTable.tsx   # Tabular data display
│   │   └── FiltersPanel.tsx # Interactive filters (stateful)
│   ├── data/
│   │   └── sales.ts        # Mock sales dataset
│   ├── tambo/
│   │   └── components.ts   # Tambo component registration
│   ├── App.tsx             # Main application
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind styles
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Tambo API key (get one at [tambo.ai](https://tambo.ai))

### Installation

1. Clone or download this template:

```bash
cd tambo-ai-analytics-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Configure your Tambo API key:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
VITE_TAMBO_API_KEY=your_actual_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser to the URL shown (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
npm run preview
```

## Customizing the Template

### Adding New Components

1. Create a new component in `src/components/`
2. Define a Zod schema for its props
3. Register it in `src/tambo/components.ts`
4. Update the system prompt to tell the AI when to use it

### Modifying the Dataset

Edit `src/data/sales.ts` to use your own data structure. Remember to update:

- Component prop schemas if data shape changes
- System prompt to reflect new data fields
- Example prompts in the UI

### Styling

This template uses Tailwind CSS. Customize the theme in `tailwind.config.ts` and update CSS variables in `src/index.css`.

## Technical Details

### Dependencies

- **@tambo-ai/react** - Tambo's React SDK for Generative UI
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Composable charting library
- **Zod** - Schema validation

### Key Files

- **src/tambo/components.ts** - Central registry for all Tambo components, schemas, and system prompt
- **src/App.tsx** - Main application with TamboProvider and chat interface
- **src/components/FiltersPanel.tsx** - Example of a stateful interactable component

## License

MIT

## Contributing

This is a community template. Contributions, improvements, and bug fixes are welcome! Please follow Tambo's contribution guidelines when submitting changes.

## Support

- [Tambo Documentation](https://tambo.ai/docs)
- [Tambo Discord Community](https://discord.gg/tambo)
- [GitHub Issues](https://github.com/tambo-ai/tambo/issues)

---

Built with ❤️ using [Tambo AI](https://tambo.ai)
