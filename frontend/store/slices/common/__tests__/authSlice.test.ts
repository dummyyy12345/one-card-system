import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { toast } from "sonner";
import reducer, {
  clearAuthUser,
  handleLogin,
  handleLogout,
  setError,
  setLoading,
} from "../authSlice";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const user = { ID: 4, role: { role_name: "Admin" } };
const credentials = { email: "ada@example.com", password: "test-password" };
beforeEach(() => jest.clearAllMocks());

it("logs in, clears the user on logout, and routes to the login page", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockResolvedValueOnce({
    data: { data: user },
  });
  const router = { push: jest.fn() };
  const store = configureStore({ reducer });
  const login = await store.dispatch(
    handleLogin({ data: credentials, router })
  );
  expect(handleLogin.fulfilled.match(login)).toBe(true);
  expect(store.getState().isAuthenticated).toBe(true);
  expect(store.getState().user?.ID).toBe(4);
  expect(router.push).toHaveBeenCalledWith("/en/admin");

  await store.dispatch(handleLogout({ router, languagePrefix: "en" }));
  expect(store.getState().isAuthenticated).toBe(false);
  expect(router.push).toHaveBeenLastCalledWith("/en/login");
  expect(toast.success).toHaveBeenCalledWith("Logged out successfully");
});

it("handles login failures and local state resets", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "invalid credentials" } },
  });
  const store = configureStore({ reducer });
  store.dispatch(setLoading(true));
  expect(store.getState().isLoading).toBe(true);
  store.dispatch(setError("try again"));
  expect(store.getState().error).toBe("try again");
  const action = await store.dispatch(
    handleLogin({ data: credentials, router: { push: jest.fn() } })
  );
  expect(handleLogin.rejected.match(action)).toBe(true);
  expect(store.getState().error).toBe("invalid credentials");
  expect(toast.error).toHaveBeenCalledWith("invalid credentials");
  expect(reportError).toHaveBeenCalledWith(
    "auth.login",
    expect.objectContaining({
      response: { data: { error: "invalid credentials" } },
    })
  );
  store.dispatch(clearAuthUser());
  expect(store.getState().error).toBeNull();
});
