import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // AGENTS.md: no `any`, no console.logs left behind
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // `cn` must come from @/lib/utils, which teaches tailwind-merge our custom type scale.
      // (`shadcn add` generates `from "cn"` — fix the import after adding a component.)
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "cn",
              importNames: ["cn"],
              message: 'Import { cn } from "@/lib/utils" (it knows the custom text-* sizes).',
            },
          ],
        },
      ],
    },
  },
  {
    // Command-line scripts report progress on stdout
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },
  // Must be last: turns off ESLint rules that conflict with Prettier
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/types/database.ts"]),
]);

export default eslintConfig;
