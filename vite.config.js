import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// For GitHub Pages: set VITE_BASE_PATH to your repo name, e.g. '/NearNest/'
// For local dev, use '/' (default)
const base = process.env.VITE_BASE_PATH || "/";
export default defineConfig({
    plugins: [react()],
    base,
});
