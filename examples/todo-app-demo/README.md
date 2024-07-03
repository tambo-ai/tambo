# Hydra-AI Todo App Demo

In this demo NextJS app, we showcase how the `hydra-ai` package can be used to create a Todo application where the AI chooses between different pre-built React components and hydrates them dynamically within a chatbox.

After each User message hydra will try to respond with one of the registered components.

The app uses several components that can be found under `/src/app/components` to display information in a way that makes sense based on the context.

## Usage

### Steps

1. **Add your OpenAI Key**

Create a file called `.env.local` under `/src/`.

Add your OpenAI Key, like:

```bash
OPENAI_API_KEY=<your key>
```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## About

Under `src/app/hydra-client.ts` we initialize Hydra and register the components we want Hydra to know about:

```jsx
const hydra = new HydraClient();

hydra.registerComponent("TodoItem", TodoItemCard, {
  item: "{id: string; title: string; isDone: boolean}",
});

hydra.registerComponent("TodoList", TodoList, {
  todoItems: "{id: string; title: string; isDone: boolean}[]",
});

hydra.registerComponent("AddTodoItemForm", AddTodoItemForm, {});

export default hydra;
```

and in the chatbox `src/app/dynamic-chatbox/dynamic-chatbox.tsx` we use Hydra to generate components, passing it any context it should have:

```jsx
const response = await hydra.generateComponent(
  `my list of todo items is ${JSON.stringify(getTodoItems())}, 
       and previous messages are ${JSON.stringify(
         messageHistory
       )} latest message: ${message}`
);
```

Behind the scenes, the `hydra-ai` package sets up a NextJS server action that HydraClient calls so that interaction with AI happens server-side.

## Report a bug or Request a feature

Make a GitHub issue [here.](https://github.com/michaelmagan/hydraai/issues/new)
