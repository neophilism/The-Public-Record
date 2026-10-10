import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {ignores:[".next/**","node_modules/**","coverage/**","next-env.d.ts"]},
  {
    files:["**/*.ts","**/*.tsx"],
    languageOptions:{parser:tsParser,parserOptions:{ecmaFeatures:{jsx:true},sourceType:"module"}},
    plugins:{"@typescript-eslint":tsPlugin},
    rules:{...tsPlugin.configs.recommended.rules}
  }
];
