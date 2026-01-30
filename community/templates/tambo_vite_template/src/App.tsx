import { Routes, Route } from "react-router-dom";
import { TamboProvider } from "@tambo-ai/react";
import { components, tools } from "./lib/tambo";

import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import Interactables from "./pages/InteractablesPage";

export default function App() {
  return (
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_API_KEY}
      components={components}
      tools={tools}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/interactables" element={<Interactables />} />
      </Routes>
    </TamboProvider>
  );
}
