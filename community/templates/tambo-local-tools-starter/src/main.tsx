import { TamboProvider } from "@tambo-ai/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { components, tools } from "./lib/tambo";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_API_KEY}
      tools={tools}
      components={components}
    >
      <App />
    </TamboProvider>
  </React.StrictMode>,
);
