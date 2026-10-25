import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "sonner";
import reducer, {
  handleDeleteUser,
  handleFetchUser,
  UserRecieved,
} from "../user";

jest.mock("axios");
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
  (axios as jest.MockedFunction<typeof axios>).mockRejectedValueOnce({
    response: { data: { error: "permission denied" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleDeleteUser({ id: 4 }));

  expect(handleDeleteUser.rejected.match(action)).toBe(true);
  expect(store.getState().isUserError).toBe("permission denied");
  expect(toast.error).toHaveBeenCalledWith("permission denied");
});
