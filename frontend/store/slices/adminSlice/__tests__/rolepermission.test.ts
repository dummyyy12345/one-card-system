import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { toast } from "sonner";
import reducer, {
  handleFetchPermissionForSpecificRole,
  handleUpdateRolePermissionByRoleId,
  RolePermissionRecieved,
} from "../rolepermission";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const permission = {
  ID: 2,
  role_id: 1,
  permission_id: 3,
} as RolePermissionRecieved;
beforeEach(() => jest.clearAllMocks());

it("loads and updates the permissions for a role", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>)
    .mockResolvedValueOnce({ data: { data: [permission] } })
    .mockResolvedValueOnce({ data: { data: [] } });
  const store = configureStore({ reducer });
  expect(
    handleFetchPermissionForSpecificRole.fulfilled.match(
      await store.dispatch(handleFetchPermissionForSpecificRole({ role_id: 1 }))
    )
  ).toBe(true);
  expect(store.getState().rolePermissions).toEqual([permission]);
  expect(
    handleUpdateRolePermissionByRoleId.fulfilled.match(
      await store.dispatch(
        handleUpdateRolePermissionByRoleId({ role_id: 1, permission_ids: [] })
      )
    )
  ).toBe(true);
  expect(store.getState().rolePermissions).toEqual([]);
  expect(apiClient).toHaveBeenLastCalledWith(
    expect.objectContaining({
      method: "PATCH",
      data: { role_id: 1, permission_ids: [] },
    })
  );
});

it("keeps a failed update visible", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "forbidden" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(
    handleUpdateRolePermissionByRoleId({ role_id: 1, permission_ids: [3] })
  );
  expect(handleUpdateRolePermissionByRoleId.rejected.match(action)).toBe(true);
  expect(store.getState().isRolePermissionError).toBe("forbidden");
  expect(store.getState().isRolePermissionUpdateLoading).toBe(false);
  expect(toast.error).toHaveBeenCalledWith("forbidden");
  expect(reportError).toHaveBeenCalledWith(
    "rolePermission.update",
    expect.objectContaining({ response: { data: { error: "forbidden" } } })
  );
});
