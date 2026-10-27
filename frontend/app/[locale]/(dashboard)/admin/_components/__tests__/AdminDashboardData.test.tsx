import { render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import AdminDashboardData from "../AdminDashboardData";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("@/store/slices/adminSlice/user", () => ({
  handleGetDashboardInformation: jest.fn(() => ({ type: "user/dashboard" })),
}));
jest.mock("@/components/adminDashboard/Card", () => ({
  __esModule: true,
  default: ({ label, amount }: { label: string; amount: string }) => (
    <div data-testid="metric">{`${label}: ${amount}`}</div>
  ),
}));
jest.mock("@/components/adminDashboard/BarGraph", () => ({
  BarGraph: ({
    chartData,
  }: {
    chartData: { name: string; total: number }[];
  }) => <div data-testid="bar-data">{JSON.stringify(chartData)}</div>,
}));
jest.mock("@/components/adminDashboard/RadarGraph", () => ({
  RadarGraph: ({ pieData }: { pieData: { name: string }[] }) => (
    <div data-testid="radar-data">{JSON.stringify(pieData)}</div>
  ),
}));

const dispatch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useDispatch).mockReturnValue(dispatch);
});

it("shows dashboard metrics and role distribution from the store", () => {
  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      user: {
        isUserLoading: false,
        userDashboardData: {
          totalUsers: 12,
          totalRoles: 3,
          totalPermissions: 8,
          totalDevices: 2,
          usersByRole: [{ role_name: "Gate Staff", count: 5 }],
        },
      },
    })
  );
  render(<AdminDashboardData />);
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(screen.getAllByTestId("metric")).toHaveLength(4);
  expect(screen.getByText("totalusers: 12")).toBeInTheDocument();
  expect(screen.getByText("totaldevices: 2")).toBeInTheDocument();
  expect(screen.getByTestId("bar-data")).toHaveTextContent(
    '"name":"Gate Staff"'
  );
  expect(screen.getByTestId("radar-data")).toHaveTextContent('"total":5');
});

it("keeps metrics hidden while dashboard data is loading", () => {
  jest
    .mocked(useSelector)
    .mockImplementation((selector) =>
      selector({ user: { isUserLoading: true, userDashboardData: null } })
    );
  render(<AdminDashboardData />);
  expect(screen.queryByTestId("metric")).not.toBeInTheDocument();
});
