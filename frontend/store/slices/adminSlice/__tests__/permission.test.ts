import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { toast } from "sonner";
import reducer, {
  handleCreatePermission,
  handleDeletePermission,
  handleFetchPermissions,
  handleUpdatePermission,
  PermissionRecieved,
  resetPermissionCreateSuccess,
  resetPermissionUpdateSuccess,
} from "../permission";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const permission = {
  ID: 7,
  permissions_name: "manage_students",
  description: "Manage students",
  CreatedAt: "2026-01-01",
  UpdatedAt: "2026-01-01",
  DeletedAt: null,
} as unknown as PermissionRecieved;

beforeEach(() => jest.clearAllMocks());

it("fetches, creates, updates and deletes permissions", async () => {
  const mockClient = apiClient as jest.MockedFunction<typeof apiClient>;
  mockClient
    .mockResolvedValueOnce({ data: { data: [permission] } })
    .mockResolvedValueOnce({ data: { data: permission } })
    .mockResolvedValueOnce({
      data: { data: { ...permission, description: "Updated" } },
    })
    .mockResolvedValueOnce({ data: { data: permission } });
  const store = configureStore({ reducer });

  expect(
    handleFetchPermissions.fulfilled.match(
      await store.dispatch(handleFetchPermissions())
    )
  ).toBe(true);
  expect(store.getState().permissions).toEqual([permission]);

  const input = {
    permissions_name: "manage_students",
    description: "Manage students",
  };
  expect(
    handleCreatePermission.fulfilled.match(
      await store.dispatch(handleCreatePermission(input))
    )
  ).toBe(true);
  expect(store.getState().isPermissionCreateSuccess).toBe(true);
  store.dispatch(resetPermissionCreateSuccess());
  expect(store.getState().isPermissionCreateSuccess).toBe(false);

  expect(
    handleUpdatePermission.fulfilled.match(
      await store.dispatch(handleUpdatePermission({ ...input, id: 7 }))
    )
  ).toBe(true);
  expect(store.getState().permissions[0].description).toBe("Updated");
  expect(store.getState().isPermissionUpdateSuccess).toBe(true);
  store.dispatch(resetPermissionUpdateSuccess());
  expect(store.getState().isPermissionUpdateSuccess).toBe(false);

  expect(
    handleDeletePermission.fulfilled.match(
      await store.dispatch(handleDeletePermission({ id: 7 }))
    )
  ).toBe(true);
  expect(store.getState().permissions).toEqual([]);
  expect(store.getState().isPermissionDeleteSuceess).toBe(true);
  expect(mockClient).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "DELETE",
      url: "/api/v1/admin/permissions/7",
    })
  );
});

it("uses update loading and shows the actual API error", async () => {
  const pending = reducer(
    undefined,
    handleUpdatePermission.pending("update", {
      id: 7,
      permissions_name: "manage_students",
      description: "New",
    })
  );
  expect(pending.isPermissionUpdateLoading).toBe(true);
  expect(pending.isPermissionCreateLoading).toBe(false);

  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "permission in use" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleDeletePermission({ id: 7 }));
  expect(handleDeletePermission.rejected.match(action)).toBe(true);
  expect(store.getState().isPermissionError).toBe("permission in use");
  expect(toast.error).toHaveBeenCalledWith("permission in use");
  expect(reportError).toHaveBeenCalledWith(
    "permission.delete",
    expect.objectContaining({
      response: { data: { error: "permission in use" } },
    })
  );
});
