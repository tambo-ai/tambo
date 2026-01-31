AI Dashboard Assistant - Tambo UI Starter

A minimal Next.js + Tambo AI starter for building AI-powered dashboards where users generate UI components using natural language.
This template focuses on clean Tambo integration, typed components, and real-time UI rendering.

What This Template Does

This project demonstrates how to:

Use Tambo AI to generate UI components from natural language

Render dashboards dynamically inside a Next.js App Router project

Define strict, schema-driven components that AI can safely render

Build interactive dashboards without hardcoding UI layouts

This is a starter, not a showcase. It’s meant to be extended.

Features

AI-driven UI generation using Tambo

Real-time component rendering

Typed, schema-validated components

Clean Next.js App Router setup

Tailwind-based responsive layout

Simple, readable component architecture

Prerequisites

You’ll need:

Node.js 18+

npm

A Tambo AI API key

Getting Started
1. Clone the Repository
git clone 
cd nextjs-tambo-ui-starter
npm install

2. Environment Variables

Create a .env.local file in the root:

NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here

3. Run the App
npm run dev


Open http://localhost:3000 to view the dashboard.

Project Structure
src/
├── app/
│   ├── api/chat/route.ts      # Tambo AI chat endpoint
│   ├── client-providers.tsx   # Tambo provider setup
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main dashboard page
│
└── components/
    └── tambo/
        ├── Dashboard.tsx      # Main AI dashboard UI
        ├── DataTable.tsx      # Tabular data component
        ├── MetricCard.tsx     # Metric display component
        ├── StatusBadge.tsx    # Status indicator component
        ├── ComponentParser.tsx# Maps AI output to components
        └── index.ts           # Component registry

How It Works

User types a natural language prompt

Prompt is sent to /api/chat

Tambo AI responds with structured component instructions

ComponentParser validates props using Zod

Matching UI components render in real time

No layout logic is hardcoded.

Usage Examples

Try prompts like:

Compare Kaushalendra vs Meenakshi expenses, savings, burn rate, and financial risk

Show a dashboard for Kaushalendra using https://github.com/Kaushalendra-Marcus data to highlight performance and impact

Create a sales metrics dashboard

Display system health status

The AI chooses the correct components automatically.

Built-in Components
DataTable

Use for comparisons, reports, and lists.

Typical use cases:

Expense comparisons

Payment reports

User activity summaries

MetricCard

Use for single metrics with trends.

Typical use cases:

Sales KPIs

Revenue metrics

Growth indicators

StatusBadge

Use for status and alerts.

Typical use cases:

System health

Payment states

Operational alerts

Adding Custom Components

Create a new component in src/components/tambo/

Define a strict Zod schema for props

Export the component in this format:

export const YourComponent = {
  name: "YourComponent",
  description: "Used to display ...",
  component: YourComponentFunction,
  propsSchema: YourComponentSchema,
};


Register it in components/tambo/index.ts

Tambo requires explicit schemas. No passthrough props.

Troubleshooting
Component Not Rendering

Check the AI response structure in /api/chat/route.ts

Verify the component is registered in index.ts

Ensure Zod schemas are strict

API Key Issues

Confirm .env.local exists

Restart the dev server after changes

Validation Errors

Avoid .passthrough() in Zod schemas

Define all expected props explicitly

Deployment
Vercel (Recommended)

Push the repo to GitHub

Import into Vercel

Add NEXT_PUBLIC_TAMBO_API_KEY as an environment variable

Deploy

Self-Hosted
npm run build
npm run start

License

MIT License
See LICENSE for details.

Contributing

Fork the repo

Create a feature branch

Keep the template minimal and clean

Open a pull request with a clear description