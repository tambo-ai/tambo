# AI Analytics Dashboard (Tambo Starter Template)

A production-ready starter template demonstrating how to build AI-powered analytics dashboards using Tambo's Generative UI SDK. This template transforms natural language queries into dynamic visualizations, interactive tables, and KPI summaries—without hardcoded dashboard layouts.

## Demo

![AI Analytics Dashboard Screenshot](https://github.com/user-attachments/assets/YOUR_SCREENSHOT_URL_HERE)

**Video Demo:** [Watch the demo video](https://github.com/user-attachments/assets/YOUR_VIDEO_URL_HERE)

## Overview

Traditional analytics dashboards require developers to manually create every chart, table, and filter combination users might need. This template solves that problem by using Tambo to generate analytics UI on-demand based on natural language queries.

Users upload their CSV data and ask questions in plain English. The AI selects and renders appropriate components—bar charts, line graphs, pie charts, data tables, summary cards, or interactive filters—based on the query. The result is a conversational analytics experience where the dashboard adapts to user intent rather than forcing users into predefined views.

## Why Tambo?

Traditional dashboards are rigid. Adding a new visualization requires code changes, deployments, and often, waiting for developers. Business users can't explore data freely—they're limited to whatever charts were built ahead of time.

Tambo's Generative UI architecture changes this by:

- **Dynamic Component Selection**: The AI chooses the right visualization type (bar chart, pie chart, table, etc.) based on the user's question.
- **Type-Safe Component Rendering**: Zod schemas ensure the AI generates valid props for each React component.
- **Persistent, Interactable UI**: Components like filter panels maintain state across conversation turns, enabling progressive data exploration.
- **Natural Language as the Primary Interface**: Users describe what they want to see; the AI builds it.

This template demonstrates how Tambo bridges the gap between conversational AI and production-quality React components.

## Features

- **Natural Language Analytics Queries** - Ask questions like "Show revenue by region" or "Compare last 3 months" and get instant visualizations
- **AI-Generated Charts** - Bar charts, line graphs, and pie charts rendered dynamically using Recharts
- **Interactive Data Tables** - Display filtered, sorted tabular data on demand
- **KPI Summary Cards** - Highlight key metrics with professional summary components
- **Persistent Filter Panels** - AI can create stateful filter components that persist across multiple messages
- **CSV Upload Support** - Upload your own business data (Excel-compatible)
- **Client-Side Only** - No backend required; all processing happens in the browser
- **Type-Safe** - Full TypeScript and Zod schema validation throughout
- **Responsive Design** - Clean, modern UI built with Tailwind CSS

## Example Prompts

Try these queries to explore the dashboard capabilities:

- **Regional Analysis**: "Show revenue by region"
- **Time-Based Trends**: "Compare revenue over the last 3 months"
- **Top Performers**: "What are the top 5 products by revenue?"
- **Category Breakdown**: "Show me electronics sales as a pie chart"
- **Geographic Filtering**: "Only show data for North America"
- **Combined Queries**: "Give me a revenue summary for Europe with a bar chart by category"
- **Table Views**: "Show all transactions from December in a table"
- **Text-Only Summaries**: "Summarize total sales without any charts"

The AI will select appropriate component types (charts, tables, summaries, filters) based on your request.

## Using Your Own Data (CSV Upload)

This template requires CSV data upload to function. No mock data is included.

### CSV Upload

1. Click the upload area at the top of the dashboard
2. Select a CSV file from your computer
3. The dashboard will automatically populate with your data
4. All analytics queries and AI responses will use your uploaded dataset

### Required CSV Format

Your CSV file must include these columns:

| Column     | Type   | Description      | Example         |
| ---------- | ------ | ---------------- | --------------- |
| `date`     | string | Transaction date | `2025-10-01`    |
| `region`   | string | Sales region     | `North America` |
| `category` | string | Product category | `Electronics`   |
| `product`  | string | Product name     | `Laptop Pro`    |
| `revenue`  | number | Revenue amount   | `125000`        |

**Example CSV:**

```csv
date,region,category,product,revenue
2025-10-01,North America,Electronics,Laptop Pro,125000
2025-10-01,Europe,Electronics,Laptop Pro,98000
2025-10-02,Asia,Furniture,Office Chair,45000
```

### Excel Files

If you have data in Excel (.xlsx):

1. Open your Excel file
2. Click **File → Save As**
3. Choose **CSV (Comma delimited) (\*.csv)** as the file type
4. Save and upload the CSV file

**Note:** Uploaded data is not persisted. Refreshing the page will clear your data and require re-upload.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **@tambo-ai/react** - Tambo Generative UI SDK
- **Recharts** - Chart visualizations
- **Zod** - Schema validation
- **PapaParse** - CSV parsing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Tambo API key (get one at [tambo.ai](https://tambo.ai))

### Installation

1. Clone this template or copy the directory:

```bash
cd community/templates/tambo-ai-analytics-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
VITE_TAMBO_API_KEY=your_actual_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser to the URL shown (typically `http://localhost:5173`)

6. **Upload your CSV data** - The dashboard requires you to upload a CSV file before you can analyze data.

### Building for Production

```bash
npm run build
npm run preview
```

## What This Template Demonstrates

This template showcases core Tambo capabilities:

1. **Generative UI Architecture** - Components are rendered dynamically based on AI decisions, not hardcoded layouts
2. **Component Registration** - Shows how to register both simple generative components and complex stateful components with `withInteractable`
3. **Schema-Driven Validation** - Uses Zod schemas to ensure type-safe props between AI and React components
4. **Persistent State Management** - Demonstrates components that maintain state across conversation turns (e.g., filter panels)
5. **Natural Language as Primary Interface** - The entire dashboard is controlled through conversational queries
6. **Multi-Component Responses** - AI can render multiple components in a single response (charts + summaries + tables)
7. **Context Helpers** - Shows how to expose application data to the AI for intelligent query answering

## Template Structure

```
tambo-ai-analytics-dashboard/
├── src/
│   ├── components/           # React components
│   │   ├── DataUploader.tsx  # CSV upload component
│   │   ├── Graph.tsx         # Chart visualization (bar, line, pie)
│   │   ├── SummaryCard.tsx   # KPI summary card
│   │   ├── DataTable.tsx     # Tabular data display
│   │   ├── FiltersPanel.tsx  # Interactive filters (stateful)
│   │   └── tambo/            # Tambo-specific components (auto-synced)
│   ├── data/
│   │   └── sales.ts          # TypeScript types
│   ├── tambo/
│   │   └── components.ts     # Tambo component registration
│   ├── App.tsx               # Main application
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind styles
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Notes

- **No API Keys Included**: You must provide your own Tambo API key via environment variables
- **Client-Side Only**: All data processing happens in the browser—no backend server required
- **Template Purpose**: This is a starter template for learning and extending, not a production-ready application
- **Data Privacy**: Uploaded CSV data is processed entirely in the browser and sent to Tambo's API for query processing

---

**License**: MIT

For more information about Tambo, visit [tambo.ai](https://tambo.ai) or check the [Tambo documentation](https://docs.tambo.ai).

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

6. **Upload your CSV data** - The dashboard requires you to upload a CSV file before you can analyze data. See the "Using Your Own Data" section below.

## Using Your Own Data

The dashboard **requires** uploading a CSV file to function. No mock data is included.

### CSV Upload

1. Click the upload area at the top of the dashboard
2. Select a CSV file from your computer
3. The dashboard will automatically update to display your data
4. All analytics and AI chat will operate on your uploaded data

### Required CSV Format

Your CSV file must include these columns:

| Column     | Type   | Description      | Example         |
| ---------- | ------ | ---------------- | --------------- |
| `date`     | string | Transaction date | `2025-10-01`    |
| `region`   | string | Sales region     | `North America` |
| `category` | string | Product category | `Electronics`   |
| `product`  | string | Product name     | `Laptop Pro`    |
| `revenue`  | number | Revenue amount   | `125000`        |

**Example CSV:**

```csv
date,region,category,product,revenue
2025-10-01,North America,Electronics,Laptop Pro,125000
2025-10-01,Europe,Electronics,Laptop Pro,98000
2025-10-02,Asia,Electronics,Smartphone X,156000
```

### Excel Files

If you have data in Excel (.xlsx):

1. Open your Excel file
2. Click **File → Save As**
3. Choose **CSV (Comma delimited) (\*.csv)** as the file type
4. Save and upload the CSV file

### Data Validation

The uploader validates your CSV file and will display helpful error messages if:

- Required columns are missing
- Data types are incorrect
- The file is empty or malformed

If some rows fail validation, valid rows will still be imported (with a warning in the console).

**Note:** Uploaded data is not persisted. Refreshing the page will clear your data and you'll need to upload again.

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
