import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { handleFetchStudents } from "@/store/slices/registrarSlice/students";
import StudentsPage from "../page";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/en/registrar/students",
  useRouter: jest.fn(),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock("@/store/slices/registrarSlice/students", () => ({
  handleFetchStudents: jest.fn((payload) => ({
    type: "students/fetch",
    payload,
  })),
}));
jest.mock(
  "@/app/[locale]/(dashboard)/registrar/_components/SelectLimit",
  () =>
    function MockSelectLimit({
      setLimit,
    }: {
      setLimit: (value: number) => void;
    }) {
      return <button onClick={() => setLimit(20)}>Show 20</button>;
    }
);
jest.mock(
  "@/app/[locale]/(dashboard)/registrar/_components/StatusFilter",
  () =>
    function MockStatusFilter({
      setStatus,
    }: {
      setStatus: (value: string) => void;
    }) {
      return (
        <button onClick={() => setStatus("Inactive")}>Inactive only</button>
      );
    }
);
jest.mock(
  "@/components/inputs/CustomDebounceSearch",
  () =>
    function MockSearch({ onChange }: { onChange: (value: string) => void }) {
      return (
        <input
          aria-label="Search by name"
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }
);
jest.mock(
  "../_components/StudentsList",
  () =>
    function MockStudentsList({
      page,
      setPage,
    }: {
      page: number;
      setPage: (value: number) => void;
    }) {
      return (
        <div>
          <span>Page {page}</span>
          <button onClick={() => setPage(2)}>Page two</button>
        </div>
      );
    }
);

const dispatch = jest.fn();
const push = jest.fn();

function renderPage(isGetStudentLoading = false) {
  (useSelector as unknown as jest.Mock).mockImplementation(
    (select: (state: unknown) => unknown) =>
      select({ student: { isGetStudentLoading } })
  );
  return render(<StudentsPage />);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
  (useRouter as jest.Mock).mockReturnValue({ push });
});

it("refreshes with the current search, status, and page size", () => {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Show 20" }));
  fireEvent.click(screen.getByRole("button", { name: "Inactive only" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Search by name" }), {
    target: { value: "Ada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "refreshstudents" }));
  expect(handleFetchStudents).toHaveBeenCalledWith({
    page: 1,
    limit: 20,
    name: "Ada",
    status: "Inactive",
  });
  expect(dispatch).toHaveBeenCalledWith({
    type: "students/fetch",
    payload: { page: 1, limit: 20, name: "Ada", status: "Inactive" },
  });
});

it("resets pagination before refresh and opens the student form", () => {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Page two" }));
  expect(screen.getByText("Page 2")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "refreshstudents" }));
  expect(screen.getByText("Page 1")).toBeInTheDocument();
  expect(handleFetchStudents).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "addstudent" }));
  expect(push).toHaveBeenCalledWith("/en/registrar/students/form");
});

it("disables refresh while students are loading", () => {
  renderPage(true);
  expect(
    screen.getByRole("button", { name: "refreshstudents" })
  ).toBeDisabled();
});
