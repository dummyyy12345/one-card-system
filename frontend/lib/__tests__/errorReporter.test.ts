import { reportError } from "../errorReporter";

it("records only safe HTTP metadata without logging response payloads", () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  try {
    reportError("device.delete", {
      response: {
        status: 503,
        headers: { "x-request-id": "a".repeat(32) },
        data: { error: "student 42 is private", password: "private-value" },
      },
    });
    const entry = JSON.parse(consoleError.mock.calls[0][0]);
    expect(entry).toEqual({
      context: "device.delete",
      kind: "http",
      status: 503,
      requestId: "a".repeat(32),
      timestamp: expect.any(String),
    });
    expect(consoleError.mock.calls[0][0]).not.toContain("private-value");
    expect(consoleError.mock.calls[0][0]).not.toContain("student 42");
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
        status: 500,
        data: { error: "student 42 is private", password: "private-value" },
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
      kind: "http",
      status: 500,
      timestamp: expect.any(String),
    });
    expect(body).not.toContain("private-value");
    expect(body).not.toContain("student 42");
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

it("does not log exception messages or malformed request IDs", () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  try {
    reportError("access.check", new Error("card 1234 is private"));
    reportError("access.check", {
      response: { status: 500, headers: { "x-request-id": "student-1234" } },
    });
    const first = JSON.parse(consoleError.mock.calls[0][0]);
    const second = JSON.parse(consoleError.mock.calls[1][0]);
    expect(first.kind).toBe("exception");
    expect(first).not.toHaveProperty("message");
    expect(second).not.toHaveProperty("requestId");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("1234");
  } finally {
    consoleError.mockRestore();
  }
});

it("continues reporting when response headers cannot be read", () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  try {
    expect(() =>
      reportError("access.check", {
        response: {
          status: 502,
          headers: {
            get: () => {
              throw new Error("private header details");
            },
          },
        },
      })
    ).not.toThrow();
    expect(JSON.parse(consoleError.mock.calls[0][0])).toMatchObject({
      context: "access.check",
      kind: "http",
      status: 502,
    });
  } finally {
    consoleError.mockRestore();
  }
});
