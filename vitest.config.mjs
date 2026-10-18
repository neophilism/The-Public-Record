import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    // The shared registry suite uses Node's built-in test runner, not Vitest.
    exclude: [...configDefaults.exclude, 'registry/**/*.test.mjs'],
  },
});
