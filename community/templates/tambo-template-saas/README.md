# Tambo SaaS Template

A production-ready SaaS UI starter template powered by Tambo AI. This template provides a clean, professional foundation for building AI-powered SaaS dashboards and applications.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Tambo AI** - Generative UI SDK for AI-driven components
- **Zod** - Schema validation for component props
- **Lucide React** - Icon library

## Features

- Professional SaaS layout with navigation bar and collapsible sidebar
- Three pre-built pages: Landing, Dashboard, and Settings
- Integrated Tambo AI chat interface for dynamic component generation
- Pre-configured Tambo components with Zod schemas:
  - MetricCard - Display KPIs with trend indicators
  - BarChart - Visualize data comparisons
  - DataTable - Show tabular data
- Dark mode support with system preference detection
- Fully responsive design
- TypeScript strict mode enabled
- Clean, minimal aesthetic suitable for production

## Folder Structure

```
tambo-template-saas/
├── app/
│   ├── layout.tsx              # Root layout with navbar
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles and design tokens
│   └── (dashboard)/
│       ├── layout.tsx          # Dashboard layout with sidebar
│       ├── dashboard/
│       │   └── page.tsx        # Main dashboard with Tambo chat
│       └── settings/
│           └── page.tsx        # Settings page
├── components/
│   ├── Navbar.tsx              # Top navigation bar
│   ├── Sidebar.tsx             # Collapsible sidebar navigation
│   ├── DashboardCard.tsx       # Metric card component
│   └── TamboChat.tsx           # AI chat interface
├── tambo/
│   ├── components.tsx          # Tambo component registry
│   └── TamboWrapper.tsx        # TamboProvider configuration
├── public/                     # Static assets
├── package.json
├── tsconfig.json
└── .env.example                # Environment variable template
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Tambo API key (get one at [tambo.co](https://tambo.co) or run self-hosted)

### Installation

1. Clone or copy this template to your project directory

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your Tambo API key:

```bash
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Intended Use Cases

This template is designed for:

- SaaS dashboard prototypes
- Admin panels with AI assistance
- Analytics dashboards with natural language queries
- Hackathon projects requiring quick SaaS UI scaffolding
- Learning Tambo AI integration patterns

## Hackathon Relevance

This template is optimized for hackathon development:

- Quick setup with minimal configuration
- Professional design out of the box
- Pre-configured Tambo integration with example components
- Type-safe development experience
- Easy to extend with additional components

## Why Tambo

Tambo is a Generative UI SDK that allows AI to dynamically select and render React components based on natural language conversations. Instead of building static dashboards, Tambo enables:

- **Dynamic UI Generation** - AI chooses which components to display based on user requests
- **Natural Language Interaction** - Users can ask questions like "Show me revenue metrics" and get relevant visualizations
- **Type-Safe Integration** - Zod schemas ensure AI-generated props are valid
- **Component Registration** - Register your components once, and AI handles the rest

Learn more at [docs.tambo.co](https://docs.tambo.co)

## Extending the Template

### Adding New Tambo Components

1. Create your component in `tambo/components.tsx`
2. Define a Zod schema for its props
3. Add it to the `tamboComponents` array

```typescript
const myComponentSchema = z.object({
  title: z.string().describe("Component title"),
  // ... other props
});

function MyComponent({ title }: { title: string }) {
  return <div>{title}</div>;
}

// Add to tamboComponents array
{
  name: "MyComponent",
  description: "What this component does and when to use it",
  component: MyComponent,
  propsSchema: myComponentSchema,
}
```

### Adding New Pages

Create new pages in the `app/(dashboard)/` directory to include them in the dashboard layout with sidebar navigation.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

Built for the Tambo community. Contributions welcome.
