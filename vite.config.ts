import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    // The preview proxy serves the sandbox under a long e2b.app hostname that
    // vite does not see during boot, so allow all hosts explicitly.
    host: "0.0.0.0",
    allowedHosts: true,
    strictPort: false,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
    strictPort: false,
  },
});
