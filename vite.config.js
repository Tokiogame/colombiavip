import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// base "/": la web tiene páginas en subcarpetas (/novedades/…) y sus archivos se piden desde la raíz
export default defineConfig({
  base: "/",
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
