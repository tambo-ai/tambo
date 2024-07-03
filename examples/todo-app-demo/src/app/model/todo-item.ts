export interface TodoItem {
  id: string;
  title: string;
  isDone: boolean;
}

export const sampletodoItem: TodoItem = {
  id: "1",
  title: "todo",
  isDone: false,
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
    title: "Vacuum the living room",
    isDone: false,
  },
];

export const updateSampletodoItems = (items: TodoItem[]) => {
  sampletodoItems = items;
};
