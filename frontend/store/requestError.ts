import { reportError } from "@/lib/errorReporter";
import { toast } from "sonner";

/** Return the user-facing API error while reporting only a structured event. */
export function reportRequestError(
  context: string,
  error: unknown,
  fallback: string
): string {
  reportError(context, error);
  const response =
    error && typeof error === "object" && "response" in error
      ? (error.response as { data?: { error?: unknown } } | undefined)
      : undefined;
  const message =
    typeof response?.data?.error === "string" && response.data.error.trim()
      ? response.data.error
      : fallback;
  toast.error(message);
  return message;
}
