import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// base "./" para que la carpeta dist funcione en cualquier hosting o subcarpeta
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 5174 },
  build: {
    rollupOptions: {
      input: {
        web: resolve(import.meta.dirname, "index.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
      },
    },
  },
});
