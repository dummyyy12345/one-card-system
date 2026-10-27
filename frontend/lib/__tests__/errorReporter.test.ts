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

it("forwards only the structured entry when an error collector is configured", async () => {
  const originalEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_URL;
  const originalFetch = global.fetch;
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const fetchMock = jest.fn().mockResolvedValue({ ok: true });
  process.env.NEXT_PUBLIC_ERROR_REPORTING_URL =
    "https://errors.example.com/collect";
  global.fetch = fetchMock;

  try {
    reportError("device.delete", {
      response: {
        data: { error: "device offline", password: "private-value" },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://errors.example.com/collect",
      expect.objectContaining({
        method: "POST",
        credentials: "omit",
      })
    );
    const body = fetchMock.mock.calls[0][1].body;
    expect(JSON.parse(body)).toEqual({
      context: "device.delete",
      message: "device offline",
      timestamp: expect.any(String),
    });
    expect(body).not.toContain("private-value");
  } finally {
    if (originalEndpoint === undefined) {
      delete process.env.NEXT_PUBLIC_ERROR_REPORTING_URL;
    } else {
      process.env.NEXT_PUBLIC_ERROR_REPORTING_URL = originalEndpoint;
    }
    global.fetch = originalFetch;
    consoleError.mockRestore();
  }
});
