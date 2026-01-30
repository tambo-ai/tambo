# AI-Controlled Inventory Template

A high-quality starter template for building **AI-Driven State Mutation** apps with Tambo, Astro, and Prisma.

![TechnoStore AI](https://placehold.co/1200x600/e2e8f0/475569?text=AI-Controlled+Inventory)

## 🚀 The Concept: "Tambo Control"

This template demonstrates the **State Lifting Pattern** for Generative UI.
Instead of the AI hallucinating UI components, it acts as a "Tambo Controller" that mutates your real database. The UI then reacts to these state changes in real-time.

**The Loop:**

1.  User Intent: _"Add a gaming mouse"_
2.  AI Tool: Calls `POST /api/products`
3.  State Sync: Tool returns the fresh list
4.  UI Update: React grid re-renders instantly

This aligns with Tambo’s model where tools perform deterministic work and the UI remains authoritative.

## Features

- **Framework**: Astro v5 + React (Islands Architecture)
- **Database**: Prisma ORM with SQLite (Zero-config)
- **AI Integration**: Tambo SDK (`@tambo-ai/react`)
- **Tools Included**:
  - `addProduct`: Create inventory with natural language.
  - `updateProduct`: Name-based updates with tolerant matching.
  - `deleteProduct`: Remove items by name.
  - `searchProducts`: Server-side filtering by category/price.
- **Voice Input**: Uses Tambo’s voice hooks for speech-to-text input.
- **Design**: "Flight Log" sidebar aesthetic with high-fidelity UI.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp example.env.local .env.local
# Edit .env.local and add your TAMBO_API_KEY from https://tambo.co/dashboard
```

### 3. Initialize Database

Create migration and seed initial data:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:4321

## Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx  # Main Logic (State Sync + Voice)
│   └── ProductGrid.tsx    # Pure Presentational Component
├── pages/
│   ├── index.astro        # Layout Entry
│   └── api/
│       ├── products.ts    # CRUD API (Server-Side)
│       └── search.ts      # Search Endpoint (Server-Side)
└── tools/                 # AI State Mutators
    ├── addProduct.ts
    ├── updateProduct.ts
    ├── deleteProduct.ts
    └── searchProducts.ts
```

## Template Guidelines (Checked)

- **Minimalism**: Single-page, no auth, no routing complexity.
- **Real Integration**: All actions persist to SQLite via Prisma.
- **Quality**: Polished reference branding ("TechnoStore") for demonstration purposes.
- **DX**: Zero manual setup steps (just `npm install` & `prisma db push`).

## What This Template Is (and Isn’t)

**This is:**

- A starter demonstrating AI-driven CRUD via tools
- A reference for state lifting with Generative UI
- A foundation to build real inventory or admin systems
