const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!e2e/**",
    "!playwright.config.ts",
    "!tailwind.config.ts",
  ],
  coverageThreshold: {
    global: { statements: 59, lines: 59, functions: 58 },
    "./components/": { statements: 50 },
  },
});
