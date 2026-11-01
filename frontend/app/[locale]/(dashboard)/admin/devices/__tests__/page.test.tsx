import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch } from "react-redux";
import { handleFetchDevice } from "@/store/slices/adminSlice/device";
import DevicesPage from "../page";

jest.mock("react-redux", () => ({ useDispatch: jest.fn() }));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock("@/store/slices/adminSlice/device", () => ({
  handleFetchDevice: jest.fn(() => ({ type: "device/fetch" })),
}));
jest.mock(
  "../_components/CreateDevice",
  () =>
    function MockCreateDevice() {
      return <div>Device form</div>;
    }
);
jest.mock(
  "../_components/DeviceList",
  () =>
    function MockDeviceList({ searchTerm }: { searchTerm: string }) {
      return <output data-testid="device-filter">{searchTerm}</output>;
    }
);

const dispatch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
});

it("passes the typed location filter to the device list", () => {
  render(<DevicesPage />);
  fireEvent.change(screen.getByRole("textbox", { name: "searchbylocation" }), {
    target: { value: "library" },
  });
  expect(screen.getByTestId("device-filter")).toHaveTextContent("library");
  expect(
    screen.getByRole("button", { name: "createdevice" })
  ).toBeInTheDocument();
});

it("refreshes devices through a keyboard-accessible button", () => {
  render(<DevicesPage />);
  fireEvent.click(screen.getByRole("button", { name: "refreshdevices" }));
  expect(handleFetchDevice).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({ type: "device/fetch" });
});
