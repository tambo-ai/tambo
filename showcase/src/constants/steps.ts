export const steps = [
  {
    number: "01",
    title: "Install tambo-ai",
    description: "Run the full-send command to setup your project",
    code: "npx tambo full-send",
    path: "~/your-project",
    isCode: false,
    details:
      "This command will setup your project, get an API key, and install components",
  },
  {
    number: "02",
    title: "Add TamboProvider",
    description: "Update your layout.tsx file",
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
    details: "Wrap your app with TamboProvider to enable tambo features",
  },
  {
    number: "03",
    title: "Add MessageThreadFull",
    description: "Import and use the chat component",
    path: "~/your-project/src/app/page.tsx",
    code: `import { MessageThreadFull } from "@/components/ui/message-thread-full";
  
  export default function Home() {
    return (
      <main>
        <MessageThreadFull />
      </main>
    );
  }`,
    isCode: true,
    language: "tsx",
    details: "Add a complete chat interface to your application",
  },
  {
    number: "04",
    title: "Register Components",
    description: "Register your components with Tambo",
    path: "~/your-project/src/app/layout.tsx",
    code: `"use client";
  
  import { TamboProvider } from "@tambo-ai/react";
  import { z } from "zod";
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
    details:
      "Register your components with Tambo to make them available for AI-driven rendering",
  },
];
