const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  collectCoverageFrom: [
    "store/slices/adminSlice/device.ts",
    "store/slices/adminSlice/user.ts",
    "store/slices/registrarSlice/students.ts",
    "**/StudentForm.tsx",
  ],
  coverageThreshold: {
    global: { statements: 50, lines: 50, functions: 50 },
  },
});
