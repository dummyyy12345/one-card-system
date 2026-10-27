import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { toast } from "sonner";
import reducer, {
  handleCreateUserPermission,
  handleFetchUserPermission,
  handleUpdateUserPermission,
  ReceivedWhileFetchUserPermission,
  resetUserPermissionState,
} from "../userpermission";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const permission = {
  ID: 5,
  user_id: 4,
  permission_id: 2,
} as ReceivedWhileFetchUserPermission;
const input = { user_id: 4, permission_ids: [2] };
beforeEach(() => jest.clearAllMocks());

it("creates, fetches, updates and resets user permissions", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>)
    .mockResolvedValueOnce({ data: { data: [permission] } })
    .mockResolvedValueOnce({ data: { data: [permission] } })
    .mockResolvedValueOnce({ data: { data: [] } });
  const store = configureStore({ reducer });
  expect(
    handleCreateUserPermission.fulfilled.match(
      await store.dispatch(handleCreateUserPermission(input))
    )
  ).toBe(true);
  expect(store.getState().userPermissions).toEqual([permission]);
  expect(
    handleFetchUserPermission.fulfilled.match(
      await store.dispatch(handleFetchUserPermission(4))
    )
  ).toBe(true);
  expect(
    handleUpdateUserPermission.fulfilled.match(
      await store.dispatch(
        handleUpdateUserPermission({ user_id: 4, permission_ids: [] })
      )
    )
  ).toBe(true);
  expect(store.getState().userPermissions).toEqual([]);
  store.dispatch(resetUserPermissionState());
  expect(store.getState().isUserPermissionError).toBeNull();
  expect(apiClient).toHaveBeenLastCalledWith(
    expect.objectContaining({
      method: "PATCH",
      url: "/api/v1/admin/updateuserpermission",
    })
  );
});

it("preserves a rejected API message", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "permission denied" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleCreateUserPermission(input));
  expect(handleCreateUserPermission.rejected.match(action)).toBe(true);
  expect(store.getState().isUserPermissionError).toBe("permission denied");
  expect(toast.error).toHaveBeenCalledWith("permission denied");
  expect(reportError).toHaveBeenCalledWith(
    "userPermission.create",
    expect.objectContaining({
      response: { data: { error: "permission denied" } },
    })
  );
});
