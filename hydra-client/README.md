<p align="center">
  <img src="https://raw.githubusercontent.com/michaelmagan/hydraai/main/github-hydra-ai.png" alt="Hydra AI Logo" width="200">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hydra-ai"><img src="https://img.shields.io/npm/v/hydra-ai.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/hydra-ai"><img src="https://img.shields.io/npm/dm/hydra-ai.svg" alt="npm downloads"></a>
  <a href="https://github.com/michaelmagan/hydraai/blob/main/LICENSE"><img src="https://img.shields.io/github/license/michaelmagan/hydraai.svg" alt="license"></a>
  <a href="https://github.com/michaelmagan/hydraai/commits/main"><img src="https://img.shields.io/github/last-commit/michaelmagan/hydraai.svg" alt="GitHub last commit"></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
  <a href="https://github.com/michaelmagan/hydraai/stargazers"><img src="https://img.shields.io/github/stars/michaelmagan/hydraai.svg?style=social" alt="GitHub stars"></a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/2501fd99-f768-43f5-96cc-d113c4f95903" alt="Hydra AI Demo" width="600">
</p>

# Hydra AI

A framework for creating context-aware UI in React apps. Register your components, and let Hydra decide when to show them and how to hydrate them with the right props and context.

## Getting Started

1. **Install the package**

   ```shell
   npm i hydra-ai
   ```

2. **Initialize HydraClient**

   Create a new instance of `HydraClient`. You can use a `hydraApiKey`, and the HydraClient will make requests to the Hydra API:

   ```typescript
   import { HydraClient } from "hydra-ai";

   const hydra = new HydraClient({ hydraApiKey: "key-here" });
   ```

   Or, you can self-host hydra on your own backend using the `hydra-ai-backend` package. In that case, you'll want to add a reference to functions that satisfy the `getComponentChoice` and `hydrateComponentWithToolResponse` parameters, where your function calls your backend:

   ```typescript
   import { HydraClient } from "hydra-ai";

   const hydra = new HydraClient({
     getComponentChoice: myComponentChoiceFunction,
     hydrateComponentWithToolResponse: myHydrateFunction,
   });
   ```

3. **Register Components**
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

   const hydra = new HydraClient({ hydraApiKey: "my-key" });

   hydra.registerComponent(
     "TodoItem",
     "A card representing a todo item",
     TodoItemCard,
     {
       item: "{id: string; title: string; isDone: boolean}",
     }
   );

   hydra.registerComponent("TodoList", "A list of todo items", TodoList, {
     todoItems: "{id: string; title: string; isDone: boolean}[]",
   });

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
     const [dynamicComponent, setDynamicComponent] =
       useState<ReactElement | null>(null);
     const [message, setMessage] = useState<string>("");

     const fetchComponent = async (userMessage: string) => {
       const { component, message } = await hydra.generateComponent(
         userMessage
       );
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
