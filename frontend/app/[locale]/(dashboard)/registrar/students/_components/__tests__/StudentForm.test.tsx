import { fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import StudentForm from "../StudentForm";
import {
  StatusType,
  StudentRecieved,
} from "@/store/slices/registrarSlice/students";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      student: {
        isUpdateStudentCardLoading: false,
        isUpdateStudentPhotoLoading: false,
        isCreateStudentLoading: false,
        isUpdateStudentLoading: false,
      },
    }),
}));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));
jest.mock("@/components/inputs/customInputWithLabel", () => () => null);
jest.mock("@/components/inputs/customSelectWithLabel", () => () => null);
jest.mock("@/components/inputs/customDatePicker", () => () => null);
jest.mock("react-webcam", () => {
  const React = require("react");
  return React.forwardRef(function MockWebcam() {
    return <div data-testid="webcam" />;
  });
});

const student = {
  ID: 1,
  status: StatusType.Active,
  photo: "",
  is_manually_add: true,
} as StudentRecieved;

beforeEach(() => {
  jest.clearAllMocks();
});

it("rejects a card number shorter than eight digits", () => {
  render(<StudentForm student={student} />);
  fireEvent.change(screen.getByLabelText("cardnumber"), {
    target: { value: "1234567" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(toast.error).toHaveBeenCalledWith("Card number must be 8 digits");
  expect(mockDispatch).not.toHaveBeenCalled();
});

it("requires an image before saving a photograph", async () => {
  render(<StudentForm student={student} />);
  fireEvent.click(screen.getByRole("button", { name: "Take a picture" }));
  fireEvent.click(await screen.findByRole("button", { name: "Save Image" }));
  expect(toast.error).toHaveBeenCalledWith("Image is required");
  expect(mockDispatch).not.toHaveBeenCalled();
});
