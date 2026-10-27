import apiClient from "../apiClient";

it("uses the shared JSON and cookie defaults for API calls", () => {
  expect(apiClient.defaults.withCredentials).toBe(true);
  expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  expect(apiClient.defaults.baseURL).toBe(
    process.env.NEXT_PUBLIC_API_SERVER_URL
  );
});
