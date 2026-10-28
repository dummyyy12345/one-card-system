import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import CustomDebounceSearch from "../CustomDebounceSearch";
import CustomInputWithLabel from "../customInputWithLabel";

function InputForm() {
  const form = useForm({ defaultValues: { email: "" } });

  return (
    <FormProvider {...form}>
      <CustomInputWithLabel
        fieldTitle="Email"
        nameInSchema="email"
        placeholder="Email address"
      />
    </FormProvider>
  );
}

afterEach(() => {
  jest.useRealTimers();
});

it("updates a controlled input through react-hook-form", () => {
  render(<InputForm />);

  const input = screen.getByLabelText("Email");
  fireEvent.change(input, { target: { value: "ada@example.com" } });

  expect(input).toHaveValue("ada@example.com");
  expect(screen.getByPlaceholderText("Email address")).toBe(input);
});

it("debounces search changes", () => {
  jest.useFakeTimers();
  const onChange = jest.fn();
  render(
    <CustomDebounceSearch
      value=""
      onChange={onChange}
      delay={300}
      placeholder="Find a student"
    />
  );

  const input = screen.getByPlaceholderText("Find a student");
  fireEvent.change(input, { target: { value: "Ada" } });

  expect(onChange).not.toHaveBeenCalled();
  jest.advanceTimersByTime(299);
  expect(onChange).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(onChange).toHaveBeenCalledWith("Ada");
});
