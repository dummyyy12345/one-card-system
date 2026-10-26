import { render, screen } from "@testing-library/react";
import {
  ChartContainer,
  ChartLegendContent,
  ChartStyle,
  ChartTooltipContent,
} from "../chart";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-chart">{children}</div>
  ),
  Tooltip: () => null,
  Legend: () => null,
}));

const config = {
  visitors: { label: "Visitors", color: "#123456" },
};

it("renders configured chart colors for light and dark themes", () => {
  const { container } = render(<ChartStyle id="traffic" config={config} />);
  const css = container.querySelector("style")?.textContent;
  expect(css).toContain("[data-chart=traffic]");
  expect(css).toContain("--color-visitors: #123456");
  expect(css).toContain(".dark [data-chart=traffic]");
});

it("skips a style tag when the chart has no colors", () => {
  const { container } = render(
    <ChartStyle id="empty" config={{ visitors: { label: "Visitors" } }} />
  );
  expect(container.querySelector("style")).toBeNull();
});

it("shares chart configuration with a visible tooltip and legend", () => {
  const payload = [
    {
      dataKey: "visitors",
      name: "visitors",
      value: 1200,
      color: "#123456",
      payload: { fill: "#123456" },
    },
  ];
  render(
    <ChartContainer id="traffic" config={config}>
      <div>
        <ChartTooltipContent active payload={payload as never} />
        <ChartLegendContent payload={payload as never} />
      </div>
    </ChartContainer>
  );

  expect(screen.getByTestId("responsive-chart")).toBeInTheDocument();
  expect(screen.getAllByText("Visitors")).toHaveLength(3);
  expect(screen.getByText("1,200")).toBeInTheDocument();
});

it("hides an inactive tooltip and empty legend", () => {
  const { container } = render(
    <ChartContainer config={config}>
      <div>
        <ChartTooltipContent active={false} payload={[] as never} />
        <ChartLegendContent payload={[] as never} />
      </div>
    </ChartContainer>
  );
  expect(container.querySelector("[data-chart]")).toBeInTheDocument();
  expect(screen.queryByText("Visitors")).not.toBeInTheDocument();
});
