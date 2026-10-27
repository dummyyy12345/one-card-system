import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { handleFetchStudents } from "@/store/slices/registrarSlice/students";
import StudentsList from "../StudentsList";

const push = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/en/registrar/students",
  useRouter: () => ({ push }),
}));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("@/store/slices/registrarSlice/students", () => ({
  handleFetchStudents: jest.fn(() => ({ type: "students/fetch" })),
}));
jest.mock("../StudentsDisplayLoading", () => ({
  __esModule: true,
  default: () => <div>Loading students</div>,
}));
jest.mock("@/components/access/StudentSyncStatus", () => ({
  __esModule: true,
  default: ({ studentId }: { studentId: number }) => (
    <span>{`Sync ${studentId}`}</span>
  ),
}));

const dispatch = jest.fn();
const student = {
  ID: 12,
  student_id: "ST-12",
  first_name: "Ada",
  father_name: "Lovelace",
  grand_father_name: "Byron",
  phone: "123",
  card_number: "CARD-12",
  sex: "Female",
  program: "Science",
  semester: 1,
  section: "A",
  religion: "",
  status: "Active",
};
const state = {
  student: {
    students: [student],
    isGetStudentLoading: false,
    isGetStudentError: null,
    currentPage: 3,
    totalPages: 5,
    totalStudents: 50,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useDispatch).mockReturnValue(dispatch);
  jest.mocked(useSelector).mockImplementation((selector) => selector(state));
});

it("requests the selected page and lets a registrar navigate students", () => {
  const setPage = jest.fn();
  render(
    <StudentsList
      page={3}
      limit={10}
      name="Ada"
      status="Active"
      setPage={setPage}
    />
  );
  expect(handleFetchStudents).toHaveBeenCalledWith({
    page: 3,
    limit: 10,
    name: "Ada",
    status: "Active",
  });
  expect(screen.getByText("ST-12")).toBeInTheDocument();
  expect(screen.getByText("Sync 12")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Edit ST-12" }));
  expect(push).toHaveBeenCalledWith(
    "/en/registrar/students/form/?studentId=12"
  );
  fireEvent.click(screen.getByRole("link", { name: "4" }));
  fireEvent.click(screen.getByRole("link", { name: "Go to previous page" }));
  fireEvent.click(screen.getByRole("link", { name: "Go to next page" }));
  expect(setPage.mock.calls).toEqual([[4], [2], [4]]);
});

it("shows loading and empty states without student records", () => {
  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      student: { ...state.student, isGetStudentLoading: true, students: [] },
    })
  );
  const { rerender } = render(
    <StudentsList page={1} limit={10} status="Active" setPage={jest.fn()} />
  );
  expect(screen.getByText("Loading students")).toBeInTheDocument();

  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      student: { ...state.student, isGetStudentLoading: false, students: [] },
    })
  );
  rerender(
    <StudentsList page={1} limit={10} status="Active" setPage={jest.fn()} />
  );
  expect(screen.getByText("nouser")).toBeInTheDocument();
});
