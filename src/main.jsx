// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";

// ✅ Import Mirage from startMirage.js
import { makeServer } from "./mocks/startMirage.js";

// Start Mirage in dev and also on Netlify preview/production
if (
  import.meta.env.DEV ||
  window.location.host.endsWith("netlify.app")
) {
  makeServer({ environment: "production" });
}

const client = new QueryClient();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
