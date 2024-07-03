import AddTodoItemForm from "../components/add-todo-form";
import { TodoItemCard } from "../components/todo-item";
import TodoList from "../components/todo-list";

export const Info = () => {
  return (
    <div className="w-full flex flex-col justify-center">
      <h1 className="text-2xl ">HydraAI ToDo Demo</h1>
      <p className="p-4">
        This is a demo that shows how Hydra lets you register components and
        lets AI choose from them and hydrate their props when needed.
      </p>
      <p className="p-4">
        After each user message we ask hydra to generate one of the components
        based on the conversation. The idea is to let Hydra decide when a user
        wants to see a certain feature and provide it, rather than hardcoding
        the layout of components and the flow of UX as with a usual app.
      </p>

      <p className="p-4">Here are the components Hydra knows about:</p>

      <ul className="p-4">
        <li>TodoItemCard</li>
        <TodoItemCard
          item={{
            id: "1",
            title: "Some Todo",
            isDone: false,
          }}
        />
        <li>TodoList</li>

        <TodoList
          todoItems={[
            {
              id: "1",
              title: "Some Todo",
              isDone: false,
            },
            {
              id: "2",
              title: "Another Todo",
              isDone: false,
            },
          ]}
        />

        <li>AddTodoItemForm</li>
        <AddTodoItemForm onAdd={() => {}} />
      </ul>

      <p className="p-4">
        Note: Currently Hydra will try to respond with one of the components
        every message, even if it would not normally make sense to show one.
      </p>
    </div>
  );
};
