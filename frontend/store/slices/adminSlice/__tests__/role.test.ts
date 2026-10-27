import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { toast } from "sonner";
import reducer, {
  handleCreateRole,
  handleDeleteRole,
  handleFetchRole,
  handleUpdateRole,
  resetRoleCreateSuccess,
  resetRoleDeleteSuccess,
  resetRoleUpdateSuccess,
  RoleRecieved,
} from "../role";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const role = {
  ID: 3,
  role_name: "Admin",
  description: "Manage users",
  CreatedAt: "2026-01-01",
  UpdatedAt: "2026-01-01",
  DeletedAt: null,
} as unknown as RoleRecieved;

beforeEach(() => jest.clearAllMocks());

it("tracks loading, records and success resets across role requests", async () => {
  const mockClient = apiClient as jest.MockedFunction<typeof apiClient>;
  mockClient
    .mockResolvedValueOnce({ data: { data: [role] } })
    .mockResolvedValueOnce({ data: { data: role } })
    .mockResolvedValueOnce({
      data: { data: { ...role, description: "Updated" } },
    })
    .mockResolvedValueOnce({ data: { data: role } });
  const store = configureStore({ reducer });

  expect(
    handleFetchRole.fulfilled.match(await store.dispatch(handleFetchRole()))
  ).toBe(true);
  expect(store.getState().roles).toEqual([role]);

  const input = { role_name: "Admin", description: "Manage users" };
  expect(
    handleCreateRole.fulfilled.match(
      await store.dispatch(handleCreateRole(input))
    )
  ).toBe(true);
  expect(store.getState().isRoleCreateSuccess).toBe(true);
  store.dispatch(resetRoleCreateSuccess());
  expect(store.getState().isRoleCreateSuccess).toBe(false);

  expect(
    handleUpdateRole.fulfilled.match(
      await store.dispatch(handleUpdateRole({ ...input, id: 3 }))
    )
  ).toBe(true);
  expect(store.getState().roles[0].description).toBe("Updated");
  expect(store.getState().isRoleUpdateLoading).toBe(false);
  expect(store.getState().isRoleUpdateSuccess).toBe(true);
  store.dispatch(resetRoleUpdateSuccess());
  expect(store.getState().isRoleUpdateSuccess).toBe(false);

  expect(
    handleDeleteRole.fulfilled.match(
      await store.dispatch(handleDeleteRole({ id: 3 }))
    )
  ).toBe(true);
  expect(store.getState().roles).toEqual([]);
  expect(store.getState().isRoleDeleteSuccess).toBe(true);
  store.dispatch(resetRoleDeleteSuccess());
  expect(store.getState().isRoleDeleteSuccess).toBe(false);
  expect(mockClient).toHaveBeenCalledWith(
    expect.objectContaining({ method: "PATCH", url: "/api/v1/admin/roles/3" })
  );
});

it("uses update loading and keeps API failures visible", async () => {
  const pending = reducer(
    undefined,
    handleUpdateRole.pending("update", {
      id: 3,
      role_name: "Admin",
      description: "New",
    })
  );
  expect(pending.isRoleUpdateLoading).toBe(true);
  expect(pending.isRoleCreateLoading).toBe(false);

  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "role in use" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleDeleteRole({ id: 3 }));
  expect(handleDeleteRole.rejected.match(action)).toBe(true);
  expect(store.getState().isRoleError).toBe("role in use");
  expect(toast.error).toHaveBeenCalledWith("role in use");
  expect(reportError).toHaveBeenCalledWith(
    "role.delete",
    expect.objectContaining({ response: { data: { error: "role in use" } } })
  );
});
