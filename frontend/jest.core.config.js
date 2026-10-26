const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  collectCoverageFrom: [
    "store/slices/adminSlice/device.ts",
    "store/slices/adminSlice/user.ts",
    "store/slices/adminSlice/role.ts",
    "store/slices/adminSlice/permission.ts",
    "store/slices/registrarSlice/students.ts",
    "**/StudentForm.tsx",
    "components/ui/chart.tsx",
    "**/UserList.tsx",
  ],
  coverageThreshold: {
    global: { statements: 50, lines: 50, functions: 50 },
    "./store/slices/adminSlice/role.ts": { statements: 50 },
    "./store/slices/adminSlice/permission.ts": { statements: 50 },
    "./components/ui/chart.tsx": { statements: 50 },
    "./app/[locale]/(dashboard)/admin/users/_compnents/UserList.tsx": {
      statements: 50,
    },
  },
});
