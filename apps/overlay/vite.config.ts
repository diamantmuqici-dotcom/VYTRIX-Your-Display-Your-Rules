import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 1421, strictPort: false },
  build: { outDir: "dist", target: "es2022", emptyOutDir: true },
});
