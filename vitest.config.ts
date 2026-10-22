import { defineConfig } from "vitest/config";

// Deliberately standalone: vite.config.ts loads the React Router plugin, which
// needs the full route module graph and has no business running in unit tests.
export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
