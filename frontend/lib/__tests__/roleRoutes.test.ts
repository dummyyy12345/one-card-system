import { roleHomePath } from "../roleRoutes";

it("routes specialized staff to their dashboard pages", () => {
  expect(roleHomePath("Cafeteria", "en")).toBe("/en/cafe");
  expect(roleHomePath("Dormitory", "am")).toBe("/am/dormitory");
  expect(roleHomePath("Librarian", "en")).toBe("/en/librarian");
  expect(roleHomePath("Admin", "en")).toBe("/en/admin");
});
