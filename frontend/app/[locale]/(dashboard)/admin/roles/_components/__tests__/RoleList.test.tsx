import { render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import RoleList from "../RoleList";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/en/admin/roles",
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("../AddRole", () => ({
  __esModule: true,
  default: () => <div>Edit role form</div>,
}));

const dispatch = jest.fn();
const roles = [
  { ID: 1, role_name: "Registrar", description: "Manage students" },
  { ID: 2, role_name: "Gate Staff", description: "Check access cards" },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useDispatch).mockReturnValue(dispatch);
  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      role: {
        roles,
        isRoleError: null,
        isRoleLoading: false,
        isRoleDeleteLoading: false,
        isRoleDeleteSuccess: false,
      },
    })
  );
});

it("filters displayed roles by name without changing the stored list", () => {
  const { rerender } = render(<RoleList searchTerm="registrar" />);
  expect(screen.getByText("Registrar")).toBeInTheDocument();
  expect(screen.queryByText("Gate Staff")).not.toBeInTheDocument();

  rerender(<RoleList searchTerm="" />);
  expect(screen.getByText("Registrar")).toBeInTheDocument();
  expect(screen.getByText("Gate Staff")).toBeInTheDocument();
});

it("shows an empty result when there are no roles", () => {
  jest
    .mocked(useSelector)
    .mockImplementation((selector) =>
      selector({ role: { roles: [], isRoleLoading: false } })
    );
  render(<RoleList searchTerm="" />);
  expect(screen.getByText("norolefound")).toBeInTheDocument();
});
