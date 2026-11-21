import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { host: true, port: 1422, strictPort: false },
  build: { outDir: "dist", target: "es2022", emptyOutDir: true },
});
