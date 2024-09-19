# Hydra AI

A framework for creating context-aware UI in React apps. Register your components, and let Hydra decide when to show them and how to hydrate them with the right props and context.

## Getting Started

1. **Install the package**

   ```shell
   npm i hydra-ai
   ```

2. **Set up your API key environment variable**

   In a file called `.env.local` add your API key for the AI provider you want to use:

   ```
   OPENAI_API_KEY=<your openai api key>
   # Or for other providers:
   # ANTHROPIC_API_KEY=<your anthropic api key>
   # COHERE_API_KEY=<your cohere api key>
   # GEMINI_API_KEY=<your gemini api key>
   # GROQ_API_KEY=<your groq api key>
   # MISTRAL_API_KEY=<your mistral api key>
   # OPENROUTER_API_KEY=<your openrouter api key>
   ```

   This will be used by the HydraClient to make requests to the chosen AI provider.

3. **Initialize HydraClient and Register Components**

   Create a new instance of `HydraClient`, specifying the model and provider:

   ```typescript
   import { HydraClient } from "hydra-ai";

   const hydra = new HydraClient("gpt-4o", "openai");
   ```

   Use the `registerComponent` method to create a list of components that Hydra can choose from. The method signature is:

   ```typescript
   hydra.registerComponent(
     name,
     description,
     component,
     propsDefinition,
     contextTools
   );
   ```

   - `name`: A unique name for the component.
   - `description`: A description of the component for Hydra to understand when to use it.
   - `component`: The actual React component.
   - `propsDefinition`: An object defining each available prop and its type.
   - `contextTools`: (optional) An array of functions that Hydra can call to gather extra data (e.g., fetching items from an API) when hydrating the component. Find information on how to define contextTools [here.](/package/docs/context-tools.md)

   Here's an example:

   ```typescript
   // hydra-client.ts

   import { HydraClient } from "hydra-ai";
   import TodoItemCard from "./components/todo-item";
   import TodoList from "./components/todo-list";
   import AddTodoItemForm from "./components/add-todo-form";

   const hydra = new HydraClient("gpt-4o", "openai");

   hydra.registerComponent(
     "TodoItem",
     "A card representing a todo item",
     TodoItemCard,
     {
       item: "{id: string; title: string; isDone: boolean}",
     }
   );

   hydra.registerComponent(
     "TodoList",
     "A list of todo items",
     TodoList,
     {
       todoItems: "{id: string; title: string; isDone: boolean}[]",
     }
   );

   hydra.registerComponent(
     "AddTodoItemForm",
     "A form to add a new todo item",
     AddTodoItemForm,
     {}
   );

   export default hydra;
   ```

4. **Have Hydra Pick and Hydrate Components Based on Context**

   To have Hydra use one of the registered components, you can call `generateComponent`:

   ```typescript
   const { component, message } = await hydra.generateComponent(userMessage);
   ```

   Here's an example that fetches a component dynamically and renders it:

   ```typescript
   "use client";

   import { ReactElement, useEffect, useState } from "react";
   import hydra from "./hydra-client";

   export default function Home() {
     const [dynamicComponent, setDynamicComponent] = useState<ReactElement | null>(null);
     const [message, setMessage] = useState<string>("");

     const fetchComponent = async (userMessage: string) => {
       const { component, message } = await hydra.generateComponent(userMessage);
       setDynamicComponent(component);
       setMessage(message);
     };

     useEffect(() => {
       fetchComponent("Show me my todo list");
     }, []);

     return (
       <main className="flex min-h-screen flex-col items-center justify-center">
         {message && <p>{message}</p>}
         {dynamicComponent}
       </main>
     );
   }
   ```

   If you've registered a weather-related component, Hydra will choose it based on the message and display it in the app. If you included a `contextTool` with that weather component, Hydra will handle requesting the correct data before filling in the component.

## Report a bug or Request a feature

Make a GitHub issue [here.](https://github.com/michaelmagan/hydraai/issues/new)
