export const newProjectSteps = [
  {
    number: "01",
    title: "Create a new project",
    description: "Create a new project using our template.",
    code: "npm create tambo-app my-app",
    path: "~/",
    isCode: false,
    language: "bash",
  },
  {
    number: "02",
    title: "Navigate to project directory",
    description: "Change into your project directory.",
    code: "cd my-app",
    path: "~/",
    isCode: false,
    language: "bash",
  },
  {
    number: "03",
    title: "Initialize tambo",
    description: "Initialize tambo in your project.",
    code: "npx tambo init",
    path: "~/my-app",
    isCode: false,
    language: "bash",
  },
  {
    number: "04",
    title: "Start development server",
    description: "Start your development server.",
    code: "npm run dev",
    path: "~/my-app",
    isCode: false,
    language: "bash",
  },
  {
    number: "05",
    title: "Add components (optional)",
    description: "Add additional components as needed.",
    code: "npx tambo add form",
    path: "~/my-app",
    isCode: false,
    language: "bash",
  },
];

export const existingProjectSteps = [
  {
    number: "01",
    title: "Install tambo-ai",
    description:
      "Run the full-send command to setup your project. This command will setup your project, get an API key, and install components.",
    code: "npx tambo full-send",
    path: "~/your-project",
    isCode: false,
  },
  {
    number: "02",
    title: "Add TamboProvider",
    description:
      "Update your layout.tsx file. Wrap your app with TamboProvider to enable tambo features.",
    path: "~/your-project/src/app/layout.tsx",
    code: `"use client";
  
  import { TamboProvider } from "@tambo-ai/react";
  
  export default function RootLayout({ children }) {
    return (
      <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}>
        {children}
      </TamboProvider>
    );
  }`,
    isCode: true,
    language: "tsx",
  },
  {
    number: "03",
    title: "Add MessageThreadFull",
    description:
      "Import and use the chat component. Add a complete chat interface to your application.",
    path: "~/your-project/src/app/page.tsx",
    code: `import { MessageThreadFull } from "@/components/tambo/message-thread-full";
  
  export default function Home() {
    return (
      <main>
        <MessageThreadFull />
      </main>
    );
  }`,
    isCode: true,
    language: "tsx",
  },
  {
    number: "04",
    title: "Register Components",
    description:
      "Register your components with Tambo. Register your components with Tambo to make them available for AI-driven rendering.",
    path: "~/your-project/src/app/layout.tsx",
    code: `"use client";
  
  import { TamboProvider } from "@tambo-ai/react";
  import { z } from "zod/v3";
  import { MyComponent } from "@/components/MyComponent";
  
  // Define component props schema
  const MyComponentProps = z.object({
    title: z.string(),
    data: z.array(z.number())
  });
  
  const components = [
    {
      name: "MyComponent",
      description: "Displays data in my component",
      component: MyComponent,
      propsSchema: MyComponentProps,
    }
  ];
  
  export default function RootLayout({ children }) {
    return (
      <TamboProvider 
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
        components={components}
      >
        {children}
      </TamboProvider>
    );
  }`,
    isCode: true,
    language: "tsx",
  },
];

// For backward compatibility
export const steps = existingProjectSteps;
