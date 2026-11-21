import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";


export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@vytrix/design-system": fileURLToPath(new URL("../../packages/design-system/src/index.ts", import.meta.url)),
      "@vytrix/shared-types": fileURLToPath(new URL("../../packages/shared-types/src/index.ts", import.meta.url)),
      "@vytrix/validation": fileURLToPath(new URL("../../packages/validation/src/index.ts", import.meta.url)),
      "@vytrix/preset-format": fileURLToPath(new URL("../../packages/preset-format/src/index.ts", import.meta.url)),
      "@vytrix/config": fileURLToPath(new URL("../../packages/config/src/index.ts", import.meta.url)),
      "@vytrix/game-database": fileURLToPath(new URL("../../packages/game-database/src/index.ts", import.meta.url)),
    },
  },
  server: {
    port: 1420,
    strictPort: false,
    // Cargo locks vytrix.exe while Tauri compiles; watching target/ crashes Vite with EBUSY.
    watch: { ignored: ["**/src-tauri/target/**"] },
  },
  build: {
    outDir: "dist",
    target: "es2022",
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        overlay: fileURLToPath(new URL("./overlay.html", import.meta.url)),
      },
    },
  },
});
