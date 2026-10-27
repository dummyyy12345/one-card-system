/** Record a small, structured error without forwarding the original response. */
export function reportError(context: string, error: unknown): void {
  const responseMessage =
    error && typeof error === "object" && "response" in error
      ? (error.response as { data?: { error?: unknown } } | undefined)?.data
          ?.error
      : undefined;
  const message =
    typeof responseMessage === "string"
      ? responseMessage
      : error instanceof Error
        ? error.message
        : "Unknown error";
  const entry = { context, message, timestamp: new Date().toISOString() };
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
