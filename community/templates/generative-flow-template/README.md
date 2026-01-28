# Generative Flow Template

A starter template for building **Generative Workerflows** with [Tambo](https://tambo.ai) and [React Flow](https://reactflow.dev).

This template gives you a completely styled, drag-and-drop canvas where the AI can:
1.  **Generate complete workflows** based on natural language requests.
2.  **Configure nodes** with dynamic forms.
3.  **Manage state** using Zustand.
4.  **Edit the graph** visually or conversationally.

## Features

- 🌌 **Galactic UI**: Pre-styled with a deep space theme using `oklch` colors.
- 🤖 **Generative Canvas**: `FlowCanvas` component is registered with Tambo, allowing the AI to build graphs.
- ⚙️ **Dynamic Configuration**: `NodeConfig` component allows the AI to generate settings forms for any node type on the fly.
- 🧠 **Smart Context**: Includes a `generate_workflow` tool to help the AI plan complex graphs before rendering.

## Getting Started

1.  **Clone details**:
    ```bash
    npx create-next-app -e https://github.com/tambo-ai/tambo/tree/main/community/templates/generative-flow-template my-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment**:
    Rename `example.env.local` to `.env.local` and add your API key:
    ```bash
    NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
    ```

4.  **Run logic**:
    ```bash
    npm run dev
    ```

## Customization

### Adding New Node Types
1.  Edit `src/store/flow-store.ts` to define default nodes or state logic.
2.  Edit `src/components/flow/custom-node.tsx` to change how nodes look.

### Registering More Tools
Edit `src/lib/tambo.ts` to add more tools (like specific API integrations) that the AI can use to fetch data for your nodes.

## License

MIT
