import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import {
  handleDeleteUser,
  handleFetchUser,
} from "@/store/slices/adminSlice/user";
import UserList from "../UserList";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock("@/store/slices/adminSlice/user", () => ({
  handleFetchUser: jest.fn((payload) => ({ type: "user/fetch", payload })),
  handleDeleteUser: jest.fn((payload) => ({ type: "user/delete", payload })),
}));
jest.mock(
  "../AddUser",
  () =>
    function MockAddUser() {
      return <div>User editor</div>;
    }
);
jest.mock(
  "../userdetails/UserDetails",
  () =>
    function MockUserDetails() {
      return <div>User details</div>;
    }
);

const dispatch = jest.fn();
const setPage = jest.fn();
const user = {
  ID: 7,
  first_name: "Ada",
  father_name: "Lovelace",
  grand_father_name: "Byron",
  email: "ada@example.com",
};

function renderList(overrides: Record<string, unknown> = {}) {
  (useSelector as unknown as jest.Mock).mockImplementation(
    (select: (state: unknown) => unknown) =>
      select({
        user: {
          users: [user],
          isUserError: null,
          isUserLoading: false,
          isUserDeleteLoading: false,
          currentPage: 2,
          totalPages: 3,
          ...overrides,
        },
      })
  );
  return render(
    <UserList role_id={2} page={2} limit={10} name="Ada" setPage={setPage} />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
});

it("shows loading placeholders while fetching users", () => {
  const { container } = renderList({ isUserLoading: true });
  expect(dispatch).toHaveBeenCalledWith({
    type: "user/fetch",
    payload: { role_id: 2, page: 2, limit: 10, name: "Ada" },
  });
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
    0
  );
  expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
});

it("shows an empty message when no users match", () => {
  renderList({ users: [] });
  expect(screen.getByText("nouser")).toBeInTheDocument();
});

it("loads the selected page and changes pagination without fragment navigation", () => {
  renderList();
  expect(handleFetchUser).toHaveBeenCalledWith({
    role_id: 2,
    page: 2,
    limit: 10,
    name: "Ada",
  });
  expect(screen.getByText("ada@example.com")).toBeInTheDocument();

  const next = screen.getByRole("link", { name: "Go to next page" });
  expect(fireEvent.click(next)).toBe(false);
  expect(setPage).toHaveBeenCalledWith(3);
  fireEvent.click(screen.getByRole("link", { name: "Go to previous page" }));
  expect(setPage).toHaveBeenCalledWith(1);
});

it("deletes the selected user and blocks repeat confirmation while pending", () => {
  const view = renderList();
  fireEvent.click(screen.getByRole("button", { name: "delete" }));
  fireEvent.click(screen.getByRole("button", { name: "confirm" }));
  expect(handleDeleteUser).toHaveBeenCalledWith({ id: 7 });
  expect(dispatch).toHaveBeenCalledWith({
    type: "user/delete",
    payload: { id: 7 },
  });

  view.unmount();
  renderList({ isUserDeleteLoading: true });
  fireEvent.click(screen.getByRole("button", { name: "delete" }));
  expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled();
});

it("shows a fetch error when the list is empty", () => {
  renderList({ users: [], isUserError: "User service unavailable" });
  expect(screen.getByRole("alert")).toHaveTextContent(
    "User service unavailable"
  );
});
