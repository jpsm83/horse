import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
