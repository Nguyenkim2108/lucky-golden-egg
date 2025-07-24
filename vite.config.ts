/// <reference types="node" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Cấu hình Vite cho frontend (React)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./client/src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("./attached_assets"),
    },
  },
  root: "./client",
  base: "/", // QUAN TRỌNG: giúp fix đường dẫn tương đối khi deploy
  build: {
    outDir: path.resolve("./dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-slot", "@radix-ui/react-icons"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    hmr: true,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});