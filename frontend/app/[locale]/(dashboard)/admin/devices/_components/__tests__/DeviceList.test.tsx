import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import DeviceList from "../DeviceList";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock(
  "../CreateDevice",
  () =>
    function MockCreateDevice() {
      return <div>Device editor</div>;
    }
);

const dispatch = jest.fn();
const devices = [
  {
    ID: 4,
    name: "North gate",
    serial_number: "SN-4",
    ip_address: "192.0.2.4",
    port: 80,
    location: "Gate",
  },
  {
    ID: 5,
    name: "South library",
    serial_number: "SN-5",
    ip_address: "192.0.2.5",
    port: 80,
    location: "Library",
  },
];

function renderList(
  overrides: Record<string, unknown> = {},
  searchTerm?: string
) {
  (useSelector as unknown as jest.Mock).mockImplementation(
    (select: (state: unknown) => unknown) =>
      select({
        device: {
          devices,
          isDeviceError: null,
          isDeviceLoading: false,
          isDeviceDeleteLoading: false,
          ...overrides,
        },
      })
  );
  return render(<DeviceList searchTerm={searchTerm} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
});

it("filters devices immediately when the location search changes", () => {
  const view = renderList({}, "gate");
  expect(screen.getByText("North gate")).toBeInTheDocument();
  expect(screen.queryByText("South library")).not.toBeInTheDocument();

  view.rerender(<DeviceList searchTerm="library" />);
  expect(screen.getByText("South library")).toBeInTheDocument();
  expect(screen.queryByText("North gate")).not.toBeInTheDocument();
});

it("opens a named delete confirmation and dispatches once", () => {
  renderList();
  fireEvent.click(screen.getByRole("button", { name: "Delete North gate" }));
  expect(screen.getByText(/suretodelete/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "confirm" }));
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
});

it("shows an API error and disables repeated deletion while pending", () => {
  renderList({
    isDeviceError: "Device service unavailable",
    isDeviceDeleteLoading: true,
  });
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Device service unavailable"
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete North gate" }));
  expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled();
});
