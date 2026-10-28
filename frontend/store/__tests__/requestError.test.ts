import { getRequestErrorMessage, reportRequestError } from "../requestError";
import { reportError } from "@/lib/errorReporter";
import { toast } from "sonner";

jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

it("uses a non-empty API error and falls back for unknown errors", () => {
  expect(
    getRequestErrorMessage(
      { response: { data: { error: "service unavailable" } } },
      "Request failed"
    )
  ).toBe("service unavailable");
  expect(
    getRequestErrorMessage(
      { response: { data: { error: "  " } } },
      "Request failed"
    )
  ).toBe("Request failed");
  expect(getRequestErrorMessage(new Error("offline"), "Request failed")).toBe(
    "Request failed"
  );
});

it("reports and displays the same safe request message", () => {
  const message = reportRequestError(
    "student.fetch",
    { response: { data: { error: "offline" } } },
    "Request failed"
  );

  expect(message).toBe("offline");
  expect(reportError).toHaveBeenCalledWith("student.fetch", {
    response: { data: { error: "offline" } },
  });
  expect(toast.error).toHaveBeenCalledWith("offline");
});
