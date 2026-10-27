import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import UserList from "../UserList";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/en/admin/users",
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock(
  "../userdetails/UserDetails",
  () =>
    function MockUserDetails() {
      return <div>User details</div>;
    }
);
jest.mock(
  "../AddUser",
  () =>
    function MockAddUser() {
      return <div>Edit user</div>;
    }
);

const dispatch = jest.fn();
const setPage = jest.fn();
const user = {
  ID: 4,
  first_name: "Ada",
  father_name: "Lovelace",
  grand_father_name: "Byron",
  email: "ada@example.com",
};

function renderList(overrides: Record<string, unknown> = {}) {
  (useSelector as unknown as jest.Mock).mockImplementation((selector) =>
    selector({
      user: {
        users: [user],
        isUserError: null,
        isUserLoading: false,
        isUserCreateLoading: false,
        currentPage: 1,
        totalPages: 3,
        totalUsers: 21,
        ...overrides,
      },
    })
  );
  return render(
    <UserList role_id={2} page={1} limit={10} setPage={setPage} name="Ada" />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
});

it("fetches users and shows a loading state", () => {
  const { container } = renderList({ isUserLoading: true });
  expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
    0
  );
  expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
});

it("shows an empty message when no users match", () => {
  renderList({ users: [] });
  expect(screen.getByText("nouser")).toBeInTheDocument();
});

it("renders the user table and changes pages", () => {
  renderList();
  expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  expect(screen.getByText("Ada")).toBeInTheDocument();
  fireEvent.click(screen.getByText("2"));
  expect(setPage).toHaveBeenCalledWith(2);
  fireEvent.click(screen.getByRole("button", { name: "delete" }));
  expect(screen.getByText(/suretodelete/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "confirm" }));
  expect(dispatch).toHaveBeenCalledTimes(2);
});
