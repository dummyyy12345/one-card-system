import { fireEvent, render, screen } from "@testing-library/react";
import useEmblaCarousel from "embla-carousel-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../carousel";

jest.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedCarousel = useEmblaCarousel as unknown as jest.Mock;

function makeApi(canScrollPrev = false, canScrollNext = true) {
  return {
    canScrollPrev: jest.fn(() => canScrollPrev),
    canScrollNext: jest.fn(() => canScrollNext),
    scrollPrev: jest.fn(),
    scrollNext: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };
}

beforeEach(() => mockedCarousel.mockReset());

it("moves through horizontal slides using buttons and keyboard", () => {
  const api = makeApi(true, true);
  const setApi = jest.fn();
  mockedCarousel.mockReturnValue([jest.fn(), api]);

  const { unmount } = render(
    <Carousel setApi={setApi}>
      <CarouselContent>
        <CarouselItem>First</CarouselItem>
        <CarouselItem>Second</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );

  expect(setApi).toHaveBeenCalledWith(api);
  expect(api.on).toHaveBeenCalledWith("select", expect.any(Function));
  expect(api.on).toHaveBeenCalledWith("reInit", expect.any(Function));
  expect(screen.getAllByRole("group")[0]).toHaveAttribute(
    "aria-roledescription",
    "slide"
  );
  fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
  fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
  fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
  fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowLeft" });
  expect(api.scrollNext).toHaveBeenCalledTimes(2);
  expect(api.scrollPrev).toHaveBeenCalledTimes(2);

  unmount();
  expect(api.off).toHaveBeenCalledWith("select", expect.any(Function));
  expect(api.off).toHaveBeenCalledWith("reInit", expect.any(Function));
});

it("disables unavailable navigation and styles vertical slides", () => {
  const api = makeApi(false, false);
  mockedCarousel.mockReturnValue([jest.fn(), api]);
  render(
    <Carousel orientation="vertical">
      <CarouselContent data-testid="slides">
        <CarouselItem data-testid="slide">First</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );

  expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
  expect(screen.getByTestId("slides")).toHaveClass("flex-col");
  expect(screen.getByTestId("slide")).toHaveClass("pt-4");
});
