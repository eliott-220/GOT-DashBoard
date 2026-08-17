import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path only matters for the production build served from GitHub Pages
// (https://<user>.github.io/GOT-DashBoard/) — the dev server always runs at "/".
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/GOT-DashBoard/" : "/",
}));
