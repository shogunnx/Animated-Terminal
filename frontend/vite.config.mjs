import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: false,
    allowedHosts: [
      "tsv-terminal-1.preview.emergentagent.com",
      ".emergentagent.com",
      ".emergent.host",
      ".emergentcf.cloud",
      "localhost"
    ],
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
