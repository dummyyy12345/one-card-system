import { reportError } from "../errorReporter";

it("records a structured error without logging response payloads", () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  try {
    reportError("device.delete", {
      response: {
        data: { error: "device offline", password: "private-value" },
      },
    });
    const entry = JSON.parse(consoleError.mock.calls[0][0]);
    expect(entry).toEqual({
      context: "device.delete",
      message: "device offline",
      timestamp: expect.any(String),
    });
    expect(consoleError.mock.calls[0][0]).not.toContain("private-value");
  } finally {
    consoleError.mockRestore();
  }
});
