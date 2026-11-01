/** Record an error category and correlation fields, never raw response text. */
export function reportError(context: string, error: unknown): void {
  const response =
    error && typeof error === "object" && "response" in error
      ? (error.response as
          { status?: unknown; headers?: Record<string, unknown> } | undefined)
      : undefined;
  const status =
    typeof response?.status === "number" &&
    Number.isInteger(response.status) &&
    response.status >= 100 &&
    response.status <= 599
      ? response.status
      : undefined;
  const headers = response?.headers;
  let rawRequestId: unknown;
  try {
    rawRequestId =
      headers && typeof headers.get === "function"
        ? headers.get("x-request-id")
        : headers?.["x-request-id"];
  } catch {
    // A malformed response object must not interrupt the original operation.
  }
  const requestId =
    typeof rawRequestId === "string" && /^[a-f0-9]{32}$/.test(rawRequestId)
      ? rawRequestId
      : undefined;
  const entry = {
    context,
    kind: response ? "http" : error instanceof Error ? "exception" : "unknown",
    ...(status !== undefined && { status }),
    ...(requestId && { requestId }),
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(entry));

  const endpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_URL;
  if (!endpoint || typeof window === "undefined") return;

  try {
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      credentials: "omit",
      keepalive: true,
    }).catch(() => {
      // Reporting must never disrupt the user's current action.
    });
  } catch {
    // A missing or invalid browser fetch implementation is also nonfatal.
  }
}
