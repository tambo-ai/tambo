"use client";
import React from "react";
import { TodoItem } from "../model/todo-item";

export interface TodoItemCardProps {
  item: TodoItem;
}
export const TodoItemCard: React.FC<TodoItemCardProps> = ({ item }) => {
  console.log("item:");
  console.log(item);
  // TODO: openAI json mode only supports strings.
  // Right now all of your types need to be strings.
  // And you need to convert them to the correct type before using them.
  // i.e. datetime, boolean, number, etc.
  // In a future version we will handle this inside hydra
  // convert your types to strings, and then convert them to the correct type
  // before returning them to the client.

  const [todoItem, setTodoItem] = React.useState<TodoItem>(item);

  return (
    <div
      className={`flex items-center p-4 border rounded-lg text-black ${
        todoItem.isDone ? "bg-green-100" : "bg-white"
      } shadow-sm`}
    >
      <input
        type="checkbox"
        checked={todoItem.isDone}
        className="mr-4"
        onChange={() => setTodoItem({ ...todoItem, isDone: !todoItem.isDone })}
      />
      <div>
        <h2
          className={`text-lg font-semibold ${
            todoItem.isDone ? "line-through" : ""
          }`}
        >
          {item.title}
        </h2>
        <span
          className={`text-sm ${
            todoItem.isDone ? "text-green-600" : "text-gray-600"
          }`}
        >
          {todoItem.isDone ? "Completed" : "Pending"}
        </span>
      </div>
    </div>
  );
};
