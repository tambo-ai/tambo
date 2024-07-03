"use client";
import React, { useState } from "react";
import { TodoItem } from "../model/todo-item";

export interface TodoItemCardProps {
  item: TodoItem;
  onToggle?: (id: string) => void;
}
export const TodoItemCard: React.FC<TodoItemCardProps> = ({
  item,
  onToggle,
}) => {
  const [todoItem, setTodoItem] = useState<TodoItem>(item);
  const [isEditing, setIsEditing] = useState(false);

  const handleToggle = () => {
    setTodoItem({ ...todoItem, isDone: !todoItem.isDone });
    onToggle && onToggle(todoItem.id);
  };
  return (
    <div className="flex flex-col items-center p-4 m-2 rounded-lg text-black bg-white shadow-sm">
      <div className="flex items-center w-full">
        <input
          type="checkbox"
          checked={todoItem.isDone}
          className="mr-4"
          onChange={handleToggle}
        />
        <div className="flex-grow">
          <h2
            className={`text-lg font-semibold ${
              todoItem.isDone ? "line-through" : ""
            }`}
          >
            {todoItem.title}
          </h2>
          <span
            className={`text-sm ${
              todoItem.isDone ? "text-green-600" : "text-gray-600"
            }`}
          >
            {todoItem.isDone ? "Completed" : "Not Done"}
          </span>
        </div>
      </div>
    </div>
  );
};
