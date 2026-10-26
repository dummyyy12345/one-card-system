import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "sonner";
import reducer, {
  handleCreateUserPermission,
  handleFetchUserPermission,
  handleUpdateUserPermission,
  ReceivedWhileFetchUserPermission,
  resetUserPermissionState,
} from "../userpermission";

jest.mock("axios");
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
  (axios as jest.MockedFunction<typeof axios>)
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
  expect(axios).toHaveBeenLastCalledWith(
    expect.objectContaining({ method: "PATCH", withCredentials: true })
  );
});

it("preserves a rejected API message", async () => {
  (axios as jest.MockedFunction<typeof axios>).mockRejectedValueOnce({
    response: { data: { error: "permission denied" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleCreateUserPermission(input));
  expect(handleCreateUserPermission.rejected.match(action)).toBe(true);
  expect(store.getState().isUserPermissionError).toBe("permission denied");
  expect(toast.error).toHaveBeenCalledWith("permission denied");
});
