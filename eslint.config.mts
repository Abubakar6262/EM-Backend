import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // ✅ ESLint recommended rules
  js.configs.recommended,

  // ✅ TypeScript recommended rules
  ...tseslint.configs.recommended,

  // ✅ Prettier (disable conflicting rules)
  prettier,

  {
    files: ["src/**/*.ts"],
    ignores: ["dist/**"], // 👈 ignore compiled output
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.node, // Allow Node.js globals (process, __dirname, etc.)
      },
    },
    rules: {
      // General best practices
      "no-var": "error",
      "prefer-const": "error",

      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      // Import rules (can add more later if needed)
      "import/prefer-default-export": "off",
      "import/extensions": "off",
    },
  }
);
