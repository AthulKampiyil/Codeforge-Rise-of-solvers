/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    globals: true,
    environment: "jsdom",
    // jsdom's default origin is `about:blank`, which is opaque and makes
    // localStorage throw. client.js keeps both tokens there, so the test
    // origin has to be pinned explicitly rather than left to the default.
    environmentOptions: { jsdom: { url: "http://localhost:5173" } },
    setupFiles: ["./src/test/setup.js"],
  },
});

