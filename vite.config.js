import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  base: "./",
  build: {
    target: "es2018"
  },
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"]
    })
  ]
});