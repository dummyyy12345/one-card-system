import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { toast } from "sonner";
import reducer, {
  DataRecievedWhileFetchStudents,
  DataSendToCreateStudent,
  handleCreateStudent,
  handleFetchStudents,
  handleGetDashboardInformationForStudent,
  handleGetSingleStudent,
  handleUpdateStudent,
  handleUpdateStudentCard,
  handleUpdateStudentPhoto,
  SexType,
  StatusType,
  StudentRecieved,
} from "../students";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const student = { ID: 9, student_id: "ST9" } as StudentRecieved;
const request = { page: 2, limit: 10, status: "Active" };
const response: DataRecievedWhileFetchStudents = {
  currentPage: 2,
  totalPages: 3,
  totalStudents: 21,
  data: [student],
};
const createInput: DataSendToCreateStudent = {
  student_id: "ST9",
  first_name: "Ada",
  father_name: "Lovelace",
  grand_father_name: "Byron",
  email: "ada@example.com",
  phone: "0912345678",
  sex: SexType.Female,
  date_of_birth: new Date("2000-01-01"),
  program: "Math",
  section: "A",
  year: 1,
  semester: 1,
  religion: "",
  library_id: null,
  cafeteria_id: null,
  dormitory_id: null,
  registered_by_id: null,
  status: StatusType.Active,
  is_manually_add: true,
};

beforeEach(() => jest.clearAllMocks());

it("tracks fetch state and uses the API's totalStudents field", () => {
  const pending = reducer(
    undefined,
    handleFetchStudents.pending("fetch", request)
  );
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
  (apiClient as jest.MockedFunction<typeof apiClient>).mockResolvedValueOnce({
    data: response,
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleFetchStudents(request));

  expect(handleFetchStudents.fulfilled.match(action)).toBe(true);
  expect(store.getState().totalStudents).toBe(21);
  expect(apiClient).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "GET",
      params: expect.objectContaining({ page: 2, limit: 10, status: "Active" }),
    })
  );
});

it("keeps the API error available to the page", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "service unavailable" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleFetchStudents(request));

  expect(handleFetchStudents.rejected.match(action)).toBe(true);
  expect(store.getState().isGetStudentError).toBe("service unavailable");
  expect(toast.error).toHaveBeenCalledWith("service unavailable");
});

it("creates a student and exposes the returned record", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockResolvedValueOnce({
    data: { data: student },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleCreateStudent(createInput));

  expect(handleCreateStudent.fulfilled.match(action)).toBe(true);
  expect(store.getState().student).toEqual(student);
  expect(store.getState().isCreateStudentLoading).toBe(false);
  expect(toast.success).toHaveBeenCalledWith("Student created successfully");
  expect(apiClient).toHaveBeenCalledWith(
    expect.objectContaining({ method: "POST", data: createInput })
  );
});

it("preserves a create failure for the form", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
    response: { data: { error: "duplicate student ID" } },
  });
  const store = configureStore({ reducer });
  const action = await store.dispatch(handleCreateStudent(createInput));

  expect(handleCreateStudent.rejected.match(action)).toBe(true);
  expect(store.getState().student).toBeNull();
  expect(store.getState().isCreateStudentError).toBe("duplicate student ID");
});

it("loads a single student and updates the card without logging the payload", async () => {
  (apiClient as jest.MockedFunction<typeof apiClient>)
    .mockResolvedValueOnce({ data: { data: student } })
    .mockResolvedValueOnce({
      data: { data: { ...student, card_number: "12345678" } },
    });
  const store = configureStore({ reducer });
  const loaded = await store.dispatch(handleGetSingleStudent({ id: 9 }));
  expect(handleGetSingleStudent.fulfilled.match(loaded)).toBe(true);
  expect(store.getState().student?.ID).toBe(9);

  const updateInput = {
    ...createInput,
    ID: 9,
    card_number: "12345678",
    photo: "",
    library_id: 0,
    cafeteria_id: 0,
    dormitory_id: 0,
    registered_by_id: 0,
    status: StatusType.Active,
  };
  const updated = await store.dispatch(handleUpdateStudentCard(updateInput));
  expect(handleUpdateStudentCard.fulfilled.match(updated)).toBe(true);
  expect(store.getState().student?.card_number).toBe("12345678");
  expect(apiClient).toHaveBeenLastCalledWith(
    expect.objectContaining({ method: "PATCH", data: updateInput })
  );
});

it("updates student details and photo through distinct endpoints", async () => {
  const updatedStudent = { ...student, first_name: "Grace" };
  (apiClient as jest.MockedFunction<typeof apiClient>)
    .mockResolvedValueOnce({ data: { data: updatedStudent } })
    .mockResolvedValueOnce({
      data: { data: { ...updatedStudent, photo: "image" } },
    });
  const store = configureStore({ reducer });
  const details = await store.dispatch(
    handleUpdateStudent({ ...createInput, id: 9 })
  );
  expect(handleUpdateStudent.fulfilled.match(details)).toBe(true);
  expect(store.getState().student?.first_name).toBe("Grace");

  const photoInput = {
    ...createInput,
    ID: 9,
    card_number: "12345678",
    photo: "image",
    library_id: 0,
    cafeteria_id: 0,
    dormitory_id: 0,
    registered_by_id: 0,
    status: StatusType.Active,
  };
  const photo = await store.dispatch(handleUpdateStudentPhoto(photoInput));
  expect(handleUpdateStudentPhoto.fulfilled.match(photo)).toBe(true);
  expect(store.getState().student?.photo).toBe("image");
  expect(apiClient).toHaveBeenLastCalledWith(
    expect.objectContaining({ url: "/api/v1/registrar/student/photo/9" })
  );
});

it("loads dashboard totals and clears them after a failure", async () => {
  const dashboard = {
    totalStudents: 21,
    studentsByCategory: [{ category: "Active", count: 21 }],
  };
  (apiClient as jest.MockedFunction<typeof apiClient>)
    .mockResolvedValueOnce({ data: dashboard })
    .mockRejectedValueOnce({
      response: { data: { error: "dashboard offline" } },
    });
  const store = configureStore({ reducer });

  const success = await store.dispatch(
    handleGetDashboardInformationForStudent()
  );
  expect(handleGetDashboardInformationForStudent.fulfilled.match(success)).toBe(
    true
  );
  expect(store.getState().studentDataForDashboard).toEqual(dashboard);

  const failure = await store.dispatch(
    handleGetDashboardInformationForStudent()
  );
  expect(handleGetDashboardInformationForStudent.rejected.match(failure)).toBe(
    true
  );
  expect(store.getState().studentDataForDashboard).toBeNull();
  expect(store.getState().isGetStudentForDashboardError).toBe(
    "dashboard offline"
  );
});
