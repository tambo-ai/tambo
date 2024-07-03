//A file where you might make requests to update TodoItems on the backend in a real app

import { TodoItem } from "../model/todo-item";

export const getTodoItems = () => {
  return sampletodoItems;
};

export const updateTodoItems = (items: TodoItem[]) => {
  sampletodoItems = items;
};

export let sampletodoItems: TodoItem[] = [
  {
    id: "1",
    title: "Do the laundry",
    isDone: false,
  },
  {
    id: "2",
    title: "Take out the trash",
    isDone: false,
  },
  {
    id: "3",
    title: "Wash the dishes",
    isDone: false,
  },
  {
    id: "4",
    title: "Clean the bathroom",
    isDone: false,
  },
  {
    id: "5",
    title: "Vacuum ",
    isDone: false,
  },
];
