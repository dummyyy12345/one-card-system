import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import Copyright from "../Copyright";
import LoadingOverlay from "../LoadingOverlay";
import MaxWidthWrapper from "../MaxSizeWrapper";
import RouteDisplay from "../RouteDisplay";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

const mockedUsePathname = usePathname as jest.MockedFunction<
  typeof usePathname
>;
const mockedUseSelector = useSelector as jest.MockedFunction<
  typeof useSelector
>;

beforeEach(() => {
  jest.clearAllMocks();
});

it("renders the loading overlay", () => {
  const { container } = render(<LoadingOverlay />);

  expect(container.querySelector(".overlay")).toBeInTheDocument();
  expect(container.querySelector("svg")).toBeInTheDocument();
});

it("combines the default and custom wrapper classes", () => {
  render(
    <MaxWidthWrapper className="custom-width">
      <span>Content</span>
    </MaxWidthWrapper>
  );

  const wrapper = screen.getByText("Content").parentElement;
  expect(wrapper).toHaveClass("max-w-screen-2xl", "custom-width");
});

it("renders copyright information", () => {
  render(<Copyright name="One Card" text="Campus access control" />);

  expect(screen.getByText(/One Card/)).toHaveTextContent(
    `©${new Date().getFullYear()} One Card.`
  );
  expect(screen.getByText("Campus access control")).toBeInTheDocument();
});

it("shows the current role and route segment", () => {
  mockedUsePathname.mockReturnValue("/en/admin/devices");
  mockedUseSelector.mockImplementation((selector) =>
    selector({
      auth: { user: { role: { role_name: "Admin" } } },
    } as never)
  );

  render(<RouteDisplay />);

  expect(screen.getByText("Admin / devices")).toBeInTheDocument();
});
