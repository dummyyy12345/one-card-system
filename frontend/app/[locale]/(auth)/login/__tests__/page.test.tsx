import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import LoginPage from "../page";

const dispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
  (useSelector as unknown as jest.Mock).mockImplementation(
    (select: (state: unknown) => unknown) =>
      select({ auth: { isLoading: false, error: null } })
  );
});

it("prevents an invalid login and shows validation errors", async () => {
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText("email"), {
    target: { value: "not-an-email" },
  });
  fireEvent.change(screen.getByLabelText("password"), {
    target: { value: "short" },
  });
  fireEvent.click(screen.getByRole("button", { name: "login" }));

  expect(await screen.findByText("invalidemail")).toBeInTheDocument();
  expect(screen.getByText("passwordminlength")).toBeInTheDocument();
  expect(dispatch).not.toHaveBeenCalled();
});

it("submits valid credentials and lets a keyboard user show or hide the password", async () => {
  render(<LoginPage />);
  const password = screen.getByLabelText("password");
  expect(password).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "showpassword" }));
  expect(password).toHaveAttribute("type", "text");
  expect(screen.getByRole("button", { name: "hidepassword" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  fireEvent.click(screen.getByRole("button", { name: "hidepassword" }));
  expect(password).toHaveAttribute("type", "password");

  fireEvent.change(screen.getByLabelText("email"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(password, { target: { value: "secret123" } });
  fireEvent.click(screen.getByRole("button", { name: "login" }));
  await waitFor(() =>
    expect(dispatch).toHaveBeenCalledWith(expect.any(Function))
  );
});

it("shows a login error and disables duplicate submission while loading", () => {
  (useSelector as unknown as jest.Mock).mockImplementation(
    (select: (state: unknown) => unknown) =>
      select({ auth: { isLoading: true, error: "Invalid credentials" } })
  );
  render(<LoginPage />);
  expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "login" })).toBeDisabled();
});
