import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { handleFetchRole } from "@/store/slices/adminSlice/role";
import { handleFetchUser } from "@/store/slices/adminSlice/user";
import UsersPage from "../page";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock("@/store/slices/adminSlice/role", () => ({
  handleFetchRole: jest.fn(() => ({ type: "role/fetch" })),
}));
jest.mock("@/store/slices/adminSlice/user", () => ({
  handleFetchUser: jest.fn((payload) => ({ type: "user/fetch", payload })),
}));
jest.mock(
  "@/app/[locale]/(dashboard)/admin/users/_compnents/AddUser",
  () =>
    function MockAddUser() {
      return <div>Add user dialog</div>;
    }
);
jest.mock(
  "@/app/[locale]/(dashboard)/admin/users/_compnents/UserList",
  () =>
    function MockUserList({ name, limit }: { name: string; limit: number }) {
      return <div data-testid="user-list">{`${name}:${limit}`}</div>;
    }
);
jest.mock(
  "@/app/[locale]/(dashboard)/admin/_components/SelectLimit",
  () =>
    function MockSelectLimit({
      setLimit,
    }: {
      setLimit: (limit: number) => void;
    }) {
      return <button onClick={() => setLimit(20)}>Show 20</button>;
    }
);
jest.mock(
  "@/components/inputs/customSelectWithOutLable",
  () =>
    function MockRoleSelect() {
      return <div>Role selector</div>;
    }
);
jest.mock(
  "@/components/inputs/CustomDebounceSearch",
  () =>
    function MockSearch({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value: string) => void;
    }) {
      return (
        <input
          aria-label="Search by name"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }
);

const dispatch = jest.fn();

function renderPage(isRoleLoading = false) {
  (useSelector as unknown as jest.Mock).mockImplementation(
    (select: (state: unknown) => unknown) =>
      select({
        role: {
          roles: [{ ID: 2, role_name: "Registrar", description: "Registrar" }],
          isRoleLoading,
        },
      })
  );
  return render(<UsersPage />);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
});

it("loads roles and refreshes the selected user list", () => {
  renderPage();
  expect(handleFetchRole).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({ type: "role/fetch" });
  fireEvent.click(screen.getByRole("button", { name: "refreshusers" }));
  expect(handleFetchUser).toHaveBeenCalledWith({
    role_id: 1,
    page: 1,
    limit: 10,
    name: "",
  });
  expect(
    screen.getByRole("button", { name: "createuser" })
  ).toBeInTheDocument();
});

it("uses the current search and page size when refreshing", () => {
  renderPage();
  fireEvent.change(screen.getByRole("textbox", { name: "Search by name" }), {
    target: { value: "Ada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Show 20" }));
  expect(screen.getByTestId("user-list")).toHaveTextContent("Ada:20");
  fireEvent.click(screen.getByRole("button", { name: "refreshusers" }));
  expect(handleFetchUser).toHaveBeenCalledWith({
    role_id: 1,
    page: 1,
    limit: 20,
    name: "Ada",
  });
});

it("shows loading placeholders while roles are fetched", () => {
  const { container } = renderPage(true);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
    0
  );
  expect(
    screen.queryByRole("button", { name: "refreshusers" })
  ).not.toBeInTheDocument();
});
