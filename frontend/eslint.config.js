import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import stylistic from "@stylistic/eslint-plugin";

export default [
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
      },
    },
    files: [
      "**/*.js",
      "**/*.jsx",
      "**/*.ts",
      "**/*.tsx",
    ],
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      react,
      "@stylistic": stylistic,
    }
  },
];
