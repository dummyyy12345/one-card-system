import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { toast } from "sonner";
import reducer, {
  handleCreateUser,
  handleDeleteUser,
  handleFetchUser,
  handleSendEmail,
  handleUpdateUser,
  UserRecieved,
} from "../user";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const user = { ID: 4, email: "admin@example.com" } as UserRecieved;
const fetchRequest = { role_id: 2, page: 1, limit: 10 };

beforeEach(() => jest.clearAllMocks());

it("stores fetched users and pagination state", () => {
  const pending = reducer(
    undefined,
    handleFetchUser.pending("fetch", fetchRequest)
  );
  expect(pending.isUserLoading).toBe(true);

  const fulfilled = reducer(
    pending,
    handleFetchUser.fulfilled(
      { data: [user], currentPage: 1, totalPages: 2, totalUsers: 11 },
      "fetch",
      fetchRequest
    )
  );
  expect(fulfilled.users).toEqual([user]);
  expect(fulfilled.totalUsers).toBe(11);
  expect(fulfilled.isUserLoading).toBe(false);

  const rejected = reducer(
    pending,
    handleFetchUser.rejected(new Error("offline"), "fetch", fetchRequest)
  );
  expect(rejected.isUserError).toBe("offline");
});

it("keeps delete errors visible and removes a user only on success", () => {
  const withUser = reducer(
    undefined,
    handleFetchUser.fulfilled(
      { data: [user], currentPage: 1, totalPages: 1, totalUsers: 1 },
      "fetch",
      fetchRequest
    )
  );
  const pending = reducer(
    withUser,
    handleDeleteUser.pending("delete", { id: 4 })
  );
  const rejected = reducer(
    pending,
    handleDeleteUser.rejected(new Error("permission denied"), "delete", {
      id: 4,
    })
  );
  expect(rejected.users).toEqual([user]);
  expect(rejected.isUserError).toBe("permission denied");
  expect(rejected.isUserCreateLoading).toBe(false);

  const fulfilled = reducer(
    pending,
    handleDeleteUser.fulfilled({ data: user }, "delete", { id: 4 })
  );
  expect(fulfilled.users).toEqual([]);
  expect(fulfilled.isUserError).toBeNull();
});

it("reports a failed delete request to the page", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "permission denied" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleDeleteUser({ id: 4 }));

  expect(handleDeleteUser.rejected.match(action)).toBe(true);
  expect(store.getState().isUserError).toBe("permission denied");
  expect(toast.error).toHaveBeenCalledWith("permission denied");
});

it("creates and updates a user in the visible list", async () => {
  const createInput = {
    first_name: "Ada",
    father_name: "Lovelace",
    grand_father_name: "Byron",
    email: "ada@example.com",
    role_id: 2,
  };
  const updatedUser = { ...user, first_name: "Updated" };
  (apiClient as jest.MockedFunction<typeof apiClient>)
    .mockResolvedValueOnce({ data: { data: user } })
    .mockResolvedValueOnce({ data: { data: updatedUser } });
  const store = configureStore({ reducer });
  await store.dispatch(handleCreateUser(createInput));
  expect(store.getState().user).toEqual(user);
  expect(store.getState().currentPageUserCreate).toBe(2);

  store.dispatch(
    handleFetchUser.fulfilled(
      { data: [user], currentPage: 1, totalPages: 1, totalUsers: 1 },
      "fetch",
      fetchRequest
    )
  );
  const action = await store.dispatch(
    handleUpdateUser({ ...createInput, id: 4 })
  );
  expect(handleUpdateUser.fulfilled.match(action)).toBe(true);
  expect(store.getState().users).toEqual([updatedUser]);
  expect(store.getState().user).toEqual(updatedUser);
});

it("reports an email failure without logging the password", async () => {
  const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
  try {
    (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
      response: { data: { error: "SMTP unavailable" } },
    });
    const store = configureStore({ reducer });
    const action = await store.dispatch(
      handleSendEmail({
        email: "ada@example.com",
        subject: "Welcome",
        password: "private-password",
        role: "Admin",
        roledescription: [],
        name: "Ada",
      })
    );
    expect(handleSendEmail.rejected.match(action)).toBe(true);
    expect(store.getState().sendEmailError).toBe("Send email failed");
    expect(toast.error).toHaveBeenCalledWith("SMTP unavailable");
    expect(consoleLog).not.toHaveBeenCalled();
  } finally {
    consoleLog.mockRestore();
  }
});
