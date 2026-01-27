import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppTamboProvider } from "./tambo/provider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppTamboProvider>
      <App />
    </AppTamboProvider>
  </React.StrictMode>,
);
