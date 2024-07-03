import { useState } from "react";
import { TodoItem } from "../model/todo-item";
import { updateTodoItems } from "../services/todo-service";
import { TodoItemCard } from "./todo-item";

export interface TodoListProps {
  todoItems: TodoItem[];
}

export default function TodoList({ todoItems }: TodoListProps) {
  const [items, setItems] = useState<TodoItem[]>(todoItems);

  const handleItemToggle = (id: string) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, isDone: !item.isDone };
      }
      return item;
    });
    setItems(updatedItems);
    updateTodoItems(updatedItems);
  };

  return (
    <div className="flex flex-col justify-center">
      {items.map((item) => (
        <TodoItemCard key={item.id} item={item} onToggle={handleItemToggle} />
      ))}
    </div>
  );
}
