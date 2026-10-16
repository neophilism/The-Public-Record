import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The shared registry suite uses Node's built-in test runner, not Vitest.
    exclude: [...configDefaults.exclude, 'registry/**/*.test.mjs'],
  },
});
