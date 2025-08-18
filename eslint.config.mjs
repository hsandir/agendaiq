import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Existing TypeScript safety rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      
      // CRITICAL: Ban dangerous type casting patterns that cause syntax errors
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never"
        }
      ],
      
      // Additional type safety enforcement
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/restrict-template-expressions": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      
      // Ban specific dangerous patterns
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression[typeAnnotation.typeName.name='Record'][typeAnnotation.typeParameters.params.0.literal.value='string'][typeAnnotation.typeParameters.params.1.typeName.name='unknown']",
          message: "BANNED: 'as Record<string, unknown>' type casting is dangerous and causes syntax errors. Use proper TypeScript types instead."
        },
        {
          selector: "TSAsExpression[typeAnnotation.typeName.name='Record'] ~ TSAsExpression",
          message: "BANNED: Multiple chained type assertions like 'as Record<string, unknown> as X' are dangerous and cause syntax errors."
        },
        {
          selector: "TSAsExpression[typeAnnotation.typeName.name='unknown']",
          message: "BANNED: 'as unknown' type casting should be avoided. Use proper type guards or type-safe alternatives."
        }
      ]
    }
  }
];

export default eslintConfig;
