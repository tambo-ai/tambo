import { TamboProvider } from "@tambo-ai/react";
import { tools } from "./lib/tambo.js";
import { BookmarkList } from "./components/tambo/BookmarkList.js";
import { BookmarkListSchema } from "./components/tambo/BookmarkList.js";
import { StatsCard, StatsCardSchema } from "./components/tambo/StatsCard.js";
import { Chat } from "./components/Chat.js";

const apiKey = import.meta.env.VITE_TAMBO_API_KEY;

const components = [
  {
    name: "BookmarkList",
    description:
      "Displays a list of bookmarks with their URLs, descriptions, and tags in a responsive card grid",
    component: BookmarkList,
    propsSchema: BookmarkListSchema,
  },
  {
    name: "StatsCard",
    description:
      "Displays a single statistic with title, value, optional percentage change, and color variant. Perfect for showing metrics and KPIs",
    component: StatsCard,
    propsSchema: StatsCardSchema,
  },
];

function App() {
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <h1 className="text-3xl mb-4">Configuration Required</h1>
        <p className="text-muted-foreground">
          Please set VITE_TAMBO_API_KEY in your .env file
        </p>
      </div>
    );
  }

  return (
    <TamboProvider apiKey={apiKey} components={components} tools={tools}>
      <Chat />
    </TamboProvider>
  );
}

export default App;
