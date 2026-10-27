import { fireEvent, render, screen } from "@testing-library/react";
import { Calendar } from "../calendar";

describe("Calendar", () => {
  it("renders the year dropdown and selects a date with DayPicker v10", () => {
    const onSelect = jest.fn();

    render(
      <Calendar
        mode="single"
        defaultMonth={new Date(2000, 0, 1)}
        startMonth={new Date(1900, 0)}
        endMonth={new Date(2010, 11)}
        captionLayout="dropdown"
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole("combobox", { name: /year/i })).toHaveValue("2000");
    fireEvent.click(
      screen.getByRole("button", { name: /january 15th, 2000/i })
    );
    expect(onSelect).toHaveBeenCalledWith(
      new Date(2000, 0, 15),
      new Date(2000, 0, 15),
      expect.any(Object),
      expect.any(Object)
    );
  });
});
