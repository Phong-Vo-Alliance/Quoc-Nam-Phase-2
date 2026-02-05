import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { initializeSignalR } from "./lib/signalr";
import "./index.css";
import "./styles/globals.css";
import App from "./App";

// Initialize SignalR with QueryClient for auto-refetch on reconnection
initializeSignalR(queryClient);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
