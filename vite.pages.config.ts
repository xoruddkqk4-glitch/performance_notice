import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "gh-pages-src",
  publicDir: "../public",
  base: "/performance_notice/",
  plugins: [react()],
  build: {
    outDir: "../gh-pages",
    emptyOutDir: true,
  },
});
