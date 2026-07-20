module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  ignorePatterns: [
    "dist",
    "node_modules",
    ".eslintrc.cjs",
    // Generated / vendored code that is not hand-maintained.
    "src/components/ui/**",
    "src/stories/**",
    "src/tempobook/**",
    // Backend blueprint: server-only code, not part of the client build.
    "src/config/environment.ts",
    "src/services/realAuthService.ts",
    "src/services/realAgentService.ts",
    "src/services/realDatabaseService.ts",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh", "react-hooks"],
  rules: {
    ...require("eslint-plugin-react-hooks").configs.recommended.rules,
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    // Pragmatic settings for this prototype; tighten as the codebase matures.
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/ban-ts-comment": "off",
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
};
