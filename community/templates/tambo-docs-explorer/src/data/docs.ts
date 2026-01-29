/**
 * @file docs.ts
 * @description Sample documentation data for React hooks
 *
 * This file contains example documentation entries for common React hooks.
 * In a real application, this could be fetched from an API or loaded from markdown files.
 */

export interface DocEntry {
  title: string;
  code: string;
  explanation: string;
  category: string;
  relatedTopics: string[];
  language: string;
}

export const docs: DocEntry[] = [
  {
    title: "useState",
    code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
    explanation:
      "useState is a Hook that lets you add state to functional components. It returns an array with two values: the current state and a function to update it. The state persists between re-renders.",
    category: "State Management",
    relatedTopics: ["useReducer", "useContext", "useRef"],
    language: "typescript",
  },
  {
    title: "useEffect",
    code: `import { useEffect, useState } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // This runs after render
    fetchData().then(setData);

    // Cleanup function (optional)
    return () => {
      // Cleanup code here
    };
  }, []); // Empty array means run once

  return <div>{data}</div>;
}`,
    explanation:
      "useEffect lets you perform side effects in functional components. It runs after every render by default, but you can control when it runs using the dependency array. Common uses include data fetching, subscriptions, and manually changing the DOM.",
    category: "Side Effects",
    relatedTopics: ["useLayoutEffect", "useState", "useCallback"],
    language: "typescript",
  },
  {
    title: "useContext",
    code: `import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  
  return (
    <button className={theme}>
      I'm {theme} themed!
    </button>
  );
}

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedButton />
    </ThemeContext.Provider>
  );
}`,
    explanation:
      "useContext lets you read and subscribe to context from your component. Context provides a way to pass data through the component tree without having to pass props down manually at every level. It's perfect for themes, user data, or any global state.",
    category: "State Management",
    relatedTopics: ["useState", "useReducer", "Context API"],
    language: "typescript",
  },
  {
    title: "useRef",
    code: `import { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input on mount
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}`,
    explanation:
      "useRef returns a mutable ref object whose .current property is initialized to the passed argument. The returned object will persist for the full lifetime of the component. It's commonly used to access DOM elements or store mutable values that don't cause re-renders when updated.",
    category: "Refs",
    relatedTopics: ["useState", "useImperativeHandle", "forwardRef"],
    language: "typescript",
  },
  {
    title: "useCallback",
    code: `import { useCallback, useState } from 'react';

function ParentComponent() {
  const [count, setCount] = useState(0);

  // This function is memoized
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // Dependencies array

  return <ChildComponent onClick={handleClick} />;
}`,
    explanation:
      "useCallback returns a memoized callback function. It's useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders. The callback will only change if one of the dependencies has changed.",
    category: "Performance",
    relatedTopics: ["useMemo", "React.memo", "useEffect"],
    language: "typescript",
  },
  {
    title: "useMemo",
    code: `import { useMemo, useState } from 'react';

function ExpensiveComponent({ items }) {
  const [filter, setFilter] = useState('');

  // Memoize expensive calculation
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.includes(filter)
    );
  }, [items, filter]);

  return <div>{filteredItems.map(...)}</div>;
}`,
    explanation:
      "useMemo returns a memoized value. It will only recompute the memoized value when one of the dependencies has changed. This optimization helps to avoid expensive calculations on every render. Use it for computationally expensive operations.",
    category: "Performance",
    relatedTopics: ["useCallback", "React.memo", "useState"],
    language: "typescript",
  },
];
