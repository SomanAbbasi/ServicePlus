import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tanstackStart(), nitro(), react(), tailwindcss(), tsConfigPaths()],
  server: {
    host: true,
    port: 3000,
  },
});
