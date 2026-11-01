import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { handleCreateUserPermission } from "@/store/slices/adminSlice/userpermission";
import AdditionalInformationForm from "../AdditionalInformationForm";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("../CreateUserFooter", () => ({
  __esModule: true,
  default: () => <div>Footer</div>,
}));
jest.mock("@/store/slices/adminSlice/rolepermission", () => ({
  handleFetchPermissionForSpecificRole: jest.fn(() => ({ type: "role/fetch" })),
}));
jest.mock("@/store/slices/adminSlice/userpermission", () => ({
  handleFetchUserPermission: jest.fn(() => ({ type: "userPermission/fetch" })),
  handleCreateUserPermission: jest.fn(() => ({
    type: "userPermission/create",
  })),
}));
jest.mock("@/store/slices/adminSlice/device", () => ({
  handleFetchDevice: jest.fn(() => ({ type: "device/fetch" })),
}));
jest.mock("@/store/slices/adminSlice/user", () => ({
  increareCurrentPage: jest.fn(() => ({ type: "user/next" })),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub;

const dispatch = jest.fn();
const state = {
  user: { user: { ID: 7, role_id: 3 } },
  rolePermission: {
    rolePermissions: [
      {
        permission_id: 1,
        permission: { permissions_name: "read_students", description: "Read" },
      },
      {
        permission_id: 2,
        permission: { permissions_name: "edit_students", description: "Edit" },
      },
    ],
    isRolePermissionLoading: false,
    isRolePermissionError: null,
  },
  userPermission: {
    userPermissions: [{ permission_id: 1 }],
    isUserPermissionCreateLoading: false,
    isUserPermissionLoading: false,
    isUserPermissionError: null,
  },
  device: { devices: [], isDeviceLoading: false },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useDispatch).mockReturnValue(dispatch);
  jest.mocked(useSelector).mockImplementation((selector) => selector(state));
});

it("keeps assigned permissions and submits a newly selected permission", async () => {
  render(<AdditionalInformationForm />);
  expect(dispatch).toHaveBeenCalledTimes(3);
  expect(screen.getByRole("checkbox", { name: "READ_STUDENTS" })).toBeChecked();
  fireEvent.click(screen.getByText("EDIT_STUDENTS"));
  expect(screen.getByRole("checkbox", { name: "EDIT_STUDENTS" })).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "assign" }));
  await waitFor(() =>
    expect(handleCreateUserPermission).toHaveBeenCalledWith({
      user_id: 7,
      permission_ids: [1, 2],
    })
  );
});

it("shows the role permission error without offering assignment", () => {
  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      ...state,
      rolePermission: {
        ...state.rolePermission,
        isRolePermissionError: "Permission service unavailable",
      },
    })
  );
  render(<AdditionalInformationForm />);
  expect(
    screen.getByText("Permission service unavailable")
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "assign" })
  ).not.toBeInTheDocument();
});
