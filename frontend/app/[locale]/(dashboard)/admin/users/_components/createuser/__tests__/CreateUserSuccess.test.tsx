import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  handleFetchUser,
  handleSendEmail,
} from "@/store/slices/adminSlice/user";
import CreateUserSuccess from "../CreateUserSuccess";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@/store/slices/adminSlice/user", () => ({
  handleFetchUser: jest.fn((payload) => ({ type: "user/fetch", payload })),
  handleSendEmail: jest.fn((payload) => ({ type: "user/email", payload })),
  removeCurrentUser: jest.fn(() => ({ type: "user/clear" })),
  removeSendEmailSuccess: jest.fn(() => ({ type: "user/clearEmail" })),
}));
jest.mock("@/store/slices/adminSlice/userpermission", () => ({
  resetUserPermissionState: jest.fn(() => ({ type: "permission/clear" })),
}));
jest.mock("@/components/ui/dialog", () => ({
  DialogClose: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}));
jest.mock(
  "../CreateUserFooter",
  () =>
    function MockFooter() {
      return <div>Footer</div>;
    }
);

const dispatch = jest.fn();
const user = {
  ID: 7,
  first_name: "Ada",
  father_name: "Lovelace",
  grand_father_name: "Byron",
  email: "ada@example.com",
  password: "temporary-secret",
  role_id: 2,
  role: { role_name: "Registrar" },
};

function renderSuccess(overrides: Record<string, unknown> = {}) {
  (useSelector as unknown as jest.Mock).mockImplementation(
    (select: (state: unknown) => unknown) =>
      select({
        user: {
          user,
          sendEmailLoading: false,
          sendEmailSuccess: false,
          sendEmailError: null,
          ...overrides,
        },
        userPermission: {
          userPermissions: [{ permission: { description: "Manage cards" } }],
        },
      })
  );
  return render(<CreateUserSuccess />);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
});

it("sends the created user's temporary credentials and permissions", () => {
  renderSuccess();
  fireEvent.click(screen.getByRole("button", { name: "sendemail" }));
  expect(handleSendEmail).toHaveBeenCalledWith({
    name: "Ada Lovelace Byron",
    email: "ada@example.com",
    subject: "Password for your account",
    password: "temporary-secret",
    role: "Registrar",
    roledescription: ["Manage cards"],
  });
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: "user/email" })
  );
});

it("blocks email without a user and shows a delivery error", () => {
  renderSuccess({ user: null, sendEmailError: "SMTP unavailable" });
  expect(screen.getByRole("button", { name: "sendemail" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("SMTP unavailable");
});

it("reports clipboard success only after writing the password", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  renderSuccess();
  fireEvent.click(screen.getByRole("button", { name: "temporary-secret" }));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith("temporary-secret")
  );
  expect(toast.success).toHaveBeenCalledWith("passwordcopied");
});

it("reports clipboard failure and clears state after confirmed delivery", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) },
  });
  const view = renderSuccess();
  fireEvent.click(screen.getByRole("button", { name: "temporary-secret" }));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("passwordcopyfailed")
  );

  view.unmount();
  renderSuccess({ sendEmailSuccess: true });
  fireEvent.click(screen.getByRole("button", { name: "ok" }));
  expect(handleFetchUser).toHaveBeenCalledWith({
    role_id: 2,
    page: 1,
    limit: 10,
    name: "",
  });
  expect(dispatch).toHaveBeenCalledWith({ type: "user/clear" });
  expect(dispatch).toHaveBeenCalledWith({ type: "permission/clear" });
  expect(dispatch).toHaveBeenCalledWith({ type: "user/clearEmail" });
});
