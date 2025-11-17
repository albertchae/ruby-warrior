import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  root: "src",
  build: {
    minify: false,
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        share: resolve(__dirname, "src/share.html"),
      },
    },
  },
});
