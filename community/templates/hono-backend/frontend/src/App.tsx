import { TamboProvider } from "@tambo-ai/react";
import { tools } from "./lib/tambo.js";
import { BookmarkList } from "./components/tambo/BookmarkList.js";
import { BookmarkListSchema } from "./components/tambo/BookmarkList.js";
import { Chat } from "./components/Chat.js";

const apiKey = import.meta.env.VITE_TAMBO_API_KEY;

if (!apiKey) {
  console.warn(
    "Tambo API key not found. Please set VITE_TAMBO_API_KEY in your .env file.",
  );
}

const components = [
  {
    name: "BookmarkList",
    description:
      "Displays a list of bookmarks with their URLs, descriptions, and tags",
    component: BookmarkList,
    propsSchema: BookmarkListSchema,
  },
];

function App() {
  if (!apiKey) {
    return (
      <div className="app">
        <div className="app-error">
          <h1>Configuration Required</h1>
          <p>Please set VITE_TAMBO_API_KEY in your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <TamboProvider apiKey={apiKey} components={components} tools={tools}>
      <div className="app">
        <main className="app-main">
          <Chat />
        </main>
      </div>
    </TamboProvider>
  );
}

export default App;
