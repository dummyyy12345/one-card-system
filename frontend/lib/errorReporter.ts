/** A single place to connect client errors to monitoring in the future. */
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
  console.error(
    JSON.stringify({
      context,
      message,
      timestamp: new Date().toISOString(),
    })
  );
}
