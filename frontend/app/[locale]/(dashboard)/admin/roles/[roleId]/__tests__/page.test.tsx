import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { handleUpdateRolePermissionByRoleId } from "@/store/slices/adminSlice/rolepermission";
import RoleDetailPage from "../page";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useParams: () => ({ roleId: "3" }),
}));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("@/store/slices/adminSlice/permission", () => ({
  handleFetchPermissions: jest.fn(() => ({ type: "permission/fetch" })),
}));
jest.mock("@/store/slices/adminSlice/rolepermission", () => ({
  handleFetchPermissionForSpecificRole: jest.fn(() => ({
    type: "rolePermission/fetch",
  })),
  handleUpdateRolePermissionByRoleId: jest.fn(() => ({
    type: "rolePermission/update",
  })),
}));

const dispatch = jest.fn();
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub;

const initialState = {
  role: {
    roles: [{ ID: 3, role_name: "Registrar", description: "Manage students" }],
  },
  permission: {
    permissions: [
      { ID: 5, permissions_name: "read_students" },
      { ID: 6, permissions_name: "edit_students" },
    ],
    isPermissionLoading: false,
  },
  rolePermission: {
    rolePermissions: [{ permission_id: 5 }],
    isRolePermissionLoading: false,
    isRolePermissionUpdateLoading: false,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useDispatch).mockReturnValue(dispatch);
  jest
    .mocked(useSelector)
    .mockImplementation((selector) => selector(initialState));
});

it("filters permissions and saves the selected set for the current role", async () => {
  render(<RoleDetailPage />);
  expect(screen.getAllByText("Registrar")).toHaveLength(2);
  expect(screen.getByText("read_students")).toBeInTheDocument();
  expect(screen.getByText("edit_students")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("searchbyname"), {
    target: { value: "edit" },
  });
  expect(screen.queryByText("read_students")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "savechanges" }));

  await waitFor(() =>
    expect(handleUpdateRolePermissionByRoleId).toHaveBeenCalledWith({
      role_id: 3,
      permission_ids: [5, 6],
    })
  );
});

it("shows a loading state until permission requests finish", () => {
  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      ...initialState,
      permission: { ...initialState.permission, isPermissionLoading: true },
    })
  );
  render(<RoleDetailPage />);
  expect(screen.queryByText("edit_students")).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("searchbyname")).toBeInTheDocument();
});
