import { render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import RegistrarDashboard from "../RegistrarDashboard";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("@/components/registrarDashboard/Card", () => ({
  __esModule: true,
  default: ({ label, amount }: { label: string; amount: string }) => (
    <div data-testid="category-card">{`${label}: ${amount}`}</div>
  ),
}));
jest.mock("@/components/registrarDashboard/BarGraph", () => ({
  BarGraph: ({
    chartData,
  }: {
    chartData: { name: string; total: number }[];
  }) => <div data-testid="bar-data">{JSON.stringify(chartData)}</div>,
}));
jest.mock("@/components/registrarDashboard/RadarGraph", () => ({
  RadarGraph: ({ pieData }: { pieData: { name: string }[] }) => (
    <div data-testid="radar-data">{JSON.stringify(pieData)}</div>
  ),
}));

const dispatch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useDispatch).mockReturnValue(dispatch);
});

it("shows a loading state while requesting the dashboard", () => {
  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      student: {
        studentDataForDashboard: null,
        isGetStudentForDashboardLoading: true,
      },
    })
  );
  render(<RegistrarDashboard />);
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId("category-card")).not.toBeInTheDocument();
});

it("turns student categories into counts and chart data", () => {
  jest.mocked(useSelector).mockImplementation((selector) =>
    selector({
      student: {
        studentDataForDashboard: {
          studentsByCategory: [
            { category: "Active Students", count: 12 },
            { category: "Inactive Students", count: 3 },
            { category: "Students with Cards", count: 10 },
            { category: "Students without Cards", count: 5 },
          ],
        },
        isGetStudentForDashboardLoading: false,
      },
    })
  );
  render(<RegistrarDashboard />);
  expect(screen.getAllByTestId("category-card")).toHaveLength(4);
  expect(screen.getByText("activestudents: 12")).toBeInTheDocument();
  expect(screen.getByText("studentswithoutcards: 5")).toBeInTheDocument();
  expect(screen.getByTestId("bar-data")).toHaveTextContent('"name":"Active"');
  expect(screen.getByTestId("bar-data")).toHaveTextContent('"total":12');
  expect(screen.getByTestId("radar-data")).toHaveTextContent(
    '"name":"Without Cards"'
  );
});
