import { HydraClient } from "hydra-ai-asdfasdfasd";
import AddTodoItemForm from "./components/add-todo-form";
import { TodoItemCard } from "./components/todo-item";
import TodoList from "./components/todo-list";

const hydra = new HydraClient("gpt-4o", "openai");

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
