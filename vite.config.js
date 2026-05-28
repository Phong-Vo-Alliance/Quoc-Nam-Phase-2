import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";
import { vendorSyncPlugin } from "./vendor-sync-plugin.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vendorSyncPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
