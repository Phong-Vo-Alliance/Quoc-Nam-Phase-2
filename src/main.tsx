import "./lib/domTranslatePatch";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { initializeSignalR } from "./lib/signalr";
import { applyBrandTheme } from "./config/brand.config";
import "./index.css";
import "./styles/globals.css";
import App from "./App";

// Áp dụng theme brand (màu, logo, favicon, title) theo VITE_BRAND
applyBrandTheme();

// Expose build info via console: type _M in browser console
declare const __APP_BUILD_VERSION__: string;
declare const __APP_BUILD_DATE__: string;

Object.defineProperty(window, "_M", {
  get() {
    console.table({
      AppBuildVersion: __APP_BUILD_VERSION__,
      AppBuildDate: __APP_BUILD_DATE__,
    });
    return {
      AppBuildVersion: __APP_BUILD_VERSION__,
      AppBuildDate: __APP_BUILD_DATE__,
    };
  },
});

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
