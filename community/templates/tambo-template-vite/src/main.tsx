import React from "react";
import ReactDOM from "react-dom/client";
import { TamboProvider } from "@tambo-ai/react";

import App from "./App";
import { tamboApiKey } from "./lib/tambo";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TamboProvider apiKey={tamboApiKey} components={[]} tools={[]}>
      <App />
    </TamboProvider>
  </React.StrictMode>
);
