import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { handleLogout } from "@/store/slices/common/authSlice";
import LogoutButton from "../Logout";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock("react-redux", () => ({ useDispatch: jest.fn() }));
jest.mock("@/store/slices/common/authSlice", () => ({
  handleLogout: jest.fn(),
}));

it("only dispatches logout after the user confirms", () => {
  const dispatch = jest.fn();
  const router = { push: jest.fn() };
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
  (useRouter as jest.Mock).mockReturnValue(router);
  (usePathname as jest.Mock).mockReturnValue("/en/admin/users");
  (handleLogout as unknown as jest.Mock).mockReturnValue({
    type: "auth/logout",
  });

  render(<LogoutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Log out" }));
  expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(dispatch).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Log out" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(handleLogout).toHaveBeenCalledWith({ router, languagePrefix: "en" });
  expect(dispatch).toHaveBeenCalledWith({ type: "auth/logout" });
});
