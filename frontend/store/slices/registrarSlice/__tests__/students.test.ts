import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "sonner";
import reducer, {
  DataRecievedWhileFetchStudents,
  handleFetchStudents,
  StudentRecieved,
} from "../students";

jest.mock("axios");
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const student = { ID: 9, student_id: "ST9" } as StudentRecieved;
const request = { page: 2, limit: 10, status: "Active" };
const response: DataRecievedWhileFetchStudents = {
  currentPage: 2,
  totalPages: 3,
  totalStudents: 21,
  data: [student],
};

beforeEach(() => jest.clearAllMocks());

it("tracks fetch state and uses the API's totalStudents field", () => {
  const pending = reducer(undefined, handleFetchStudents.pending("fetch", request));
  expect(pending.isGetStudentLoading).toBe(true);

  const fulfilled = reducer(
    pending,
    handleFetchStudents.fulfilled(response, "fetch", request)
  );
  expect(fulfilled.students).toEqual([student]);
  expect(fulfilled.currentPage).toBe(2);
  expect(fulfilled.totalStudents).toBe(21);
  expect(fulfilled.isGetStudentLoading).toBe(false);

  const rejected = reducer(
    pending,
    handleFetchStudents.rejected(new Error("offline"), "fetch", request)
  );
  expect(rejected.isGetStudentLoading).toBe(false);
  expect(rejected.isGetStudentError).toBe("offline");
});

it("fetches students with the requested filters", async () => {
  (axios as jest.MockedFunction<typeof axios>).mockResolvedValueOnce({ data: response });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleFetchStudents(request));

  expect(handleFetchStudents.fulfilled.match(action)).toBe(true);
  expect(store.getState().totalStudents).toBe(21);
  expect(axios).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "GET",
      params: expect.objectContaining({ page: 2, limit: 10, status: "Active" }),
      withCredentials: true,
    })
  );
});

it("keeps the API error available to the page", async () => {
  (axios as jest.MockedFunction<typeof axios>).mockRejectedValueOnce({
    response: { data: { error: "service unavailable" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleFetchStudents(request));

  expect(handleFetchStudents.rejected.match(action)).toBe(true);
  expect(store.getState().isGetStudentError).toBe("service unavailable");
  expect(toast.error).toHaveBeenCalledWith("service unavailable");
});
