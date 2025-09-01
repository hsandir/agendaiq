import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Global ignore patterns (FAZ 2: Modern ESLint exclusions)
  {
    ignores: [
      // Node modules (explicit)
      "**/node_modules/**/*",
      
      // Claude Code & Internal Tools
      ".claude/**/*",
      ".internal/**/*", 
      ".agent-backups/**/*",
      ".manual-backups/**/*",
      
      // Build & Development Artifacts
      ".next/**/*",
      ".vercel/**/*",
      ".swc/**/*",
      "coverage/**/*",
      "dist/**/*",
      "build/**/*",
      
      // Backup & Archive Directories
      "backups/**/*", 
      "backup-v2-files/**/*",
      ".v2-backup/**/*",
      "trash/**/*",
      ".trash/**/*",
      
      // Test directories and files (MAJOR OPTIMIZATION)
      "**/__tests__/**/*",
      "**/tests/**/*", 
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.test.js",
      "**/*.test.jsx",
      "**/*.spec.ts",
      "**/*.spec.tsx", 
      "**/*.spec.js",
      "**/*.spec.jsx",
      "__mocks__/**/*",
      
      // Validation server (separate project)
      "validation-server/**/*",
      
      // Database and migration files
      "prisma/migrations/**/*",
      "**/migrations/**/*",
      
      // Temporary and log files
      "**/*.log",
      "**/*.tmp",
      "performance-*.json",
      "filelock.json",
      "**/temp/**/*",
      "**/tmp/**/*",
      
      // Scripts directory (all utility/test scripts)
      "scripts/**/*",
      
      // Root level temporary scripts (comprehensive)
      "api_performance_test.js",
      "bulk-fix-eslint.js", 
      "comprehensive-syntax-fix.js",
      "debug-public-routes.js",
      "final-eslint-fix.js",
      "final-syntax-fix.js",
      "fix-*.js",
      "test-*.js",
      "*-test.js", 
      "*test*.js",
      "zero-degradation-system.js",
      "validate-and-fix.js",
      "check_*.js",
      "setup_*.js",
      "update_*.js", 
      "restore-*.js",
      "interface-*.js",
      "jsx-*.js",
      "quick-*.js",
      "*-fix.js",
      "*_prod_*.js",
      "*_local_*.js",
      
      // Config and setup files
      "eslint.config.mjs",
      "jest.config*.js",
      "jest.setup.js",
      "playwright.config.ts",
      "tsconfig*.json",
      "*.backup",
      "production-error-analysis.json",
      ".env*",
      
      // Documentation and static files (if not needed for linting)
      "public/**/*",
      "docs/**/*",
      "*.md"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Basic TypeScript safety rules (more lenient for production)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn", 
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      
      // Style preferences (non-blocking)
      "@typescript-eslint/consistent-type-assertions": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      
      // Only ban truly dangerous patterns (syntax breaking)
      "no-restricted-syntax": [
        "error", 
        {
          selector: "TSAsExpression[typeAnnotation.typeName.name='Record'] ~ TSAsExpression",
          message: "CRITICAL: Multiple chained type assertions cause syntax errors."
        }
      ],
      
      // Disable some overly strict rules for development
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
  }
];

export default eslintConfig;
