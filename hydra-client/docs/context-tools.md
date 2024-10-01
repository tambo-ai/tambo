## Defining Context Tools

In Hydra, **context tools** allow Hydra to fetch additional data before rendering a component. This is useful when the component needs to be hydrated with data that is not yet available at render time (such as making API calls or querying databases.) Each context tool is defined by its metadata and a function that returns the required data.

### Structure of a Context Tool

A context tool consists of two parts:

- `getComponentContext` (any) => Promise< any >: A function that is called to retrieve the data required to hydrate the component.
- `definition`: Metadata that describes the tool, including its name, description, parameters, and their types. Everything that Hydra needs to call it correctly.

### Tool Definition

The `definition` property is an object of type `ComponentContextToolMetadata`. It contains the following fields:

- `name`: The name of the tool (string).
- `description`: A brief explanation of what the tool does (string).
- `parameters`: An array of parameter objects, where each parameter has:
  - `name`: The parameter’s name (string).
  - `type`: The parameter’s type (e.g., "string", "number", "array", "enum").
  - `description`: A description of the parameter (string).
  - `isRequired`: A boolean indicating if the parameter is required (boolean).
  - `items` (optional): If the parameter is of type "array", this describes the type of the array items (e.g., `{ type: "string" }`).
  - `enumValues` (optional): If the parameter is an enum, this contains an array of valid string values for the enum.

Here’s an example of how to define a context tool:

```typescript
import { ComponentContextTool, ComponentContextToolMetadata } from "hydra-ai";

// Define the tool's metadata
const fetchTodosMetadata: ComponentContextToolMetadata = {
  name: "fetchTodos",
  description: "Fetches a list of todos from an API for a given user.",
  parameters: [
    {
      name: "userId",
      type: "string",
      description: "The ID of the user for whom to fetch todos",
      isRequired: true,
    },
  ],
};

// Define the tool function
const fetchTodosTool: ComponentContextTool = {
  getComponentContext: someUserFetchingFunction,
  definition: fetchTodosMetadata,
};
```

### Registering Components with Context Tools

Once a context tool is defined, it can be associated with a component during the `registerComponent` call:

```typescript
import TodoList from "./components/TodoList";
import { fetchTodosTool } from "./context-tools/fetchTodos";

hydra.registerComponent(
  "TodoList",
  "Displays a list of todos",
  TodoList,
  {
    todoItems: "{ id: string; title: string; isDone: boolean }[]",
  },
  [fetchTodosTool] // Register the context tool for this component
);
```

### How Hydra Uses Context Tools

When Hydra generates a component, it determines if any of the registered context tools should be used to fetch additional data. If a tool is required, Hydra will call it, passing in the necessary parameters. The tool’s response will then be used to hydrate the component.

For example, when generating the `TodoList` component, Hydra might call the `fetchTodosTool` to retrieve the todo items based on the provided `userId`. Hydra will figure out how to use the response data when hydrating the props of the component.

These tool calls are actually performed on the client side of your application (or wherever your HydraClient instance lives.) The result is then passed back to the HydraBackend for use in props hydration.
