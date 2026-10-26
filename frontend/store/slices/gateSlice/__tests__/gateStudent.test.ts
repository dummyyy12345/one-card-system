import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "sonner";
import reducer, {
  handleGetSingleStudent,
  StudentRecieved,
} from "../gateStudent";

jest.mock("axios");
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const student = { ID: 9, student_id: "ST9" } as StudentRecieved;
beforeEach(() => jest.clearAllMocks());

it("loads the selected student from the registrar API", async () => {
  (axios as jest.MockedFunction<typeof axios>).mockResolvedValueOnce({
    data: { data: student },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleGetSingleStudent({ id: 9 }));
  expect(handleGetSingleStudent.fulfilled.match(action)).toBe(true);
  expect(store.getState().student).toEqual(student);
  expect(store.getState().isStudentLoading).toBe(false);
  expect(axios).toHaveBeenCalledWith(
    expect.objectContaining({
      url: expect.stringContaining("/student/9"),
      method: "GET",
      withCredentials: true,
    })
  );
});

it("keeps an API error visible to the gate page", async () => {
  (axios as jest.MockedFunction<typeof axios>).mockRejectedValueOnce({
    response: { data: { error: "student not found" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleGetSingleStudent({ id: 404 }));
  expect(handleGetSingleStudent.rejected.match(action)).toBe(true);
  expect(store.getState().student).toBeNull();
  expect(store.getState().isStudentError).toBe("student not found");
  expect(toast.error).toHaveBeenCalledWith("student not found");
});
