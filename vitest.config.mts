import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 60 },
      include: ["src/lib/domain/**/*.ts", "src/lib/ai/**/*.ts"],
      exclude: ["src/lib/ai/gemini.ts", "src/lib/ai/schemas.ts"],
    },
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});
