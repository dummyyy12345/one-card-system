export type Messages = Record<string, Record<string, string>>;

/** Preserve translated values while falling back for missing namespace keys. */
export function mergeMessages(base: Messages, translated: Messages): Messages {
  const result: Messages = { ...base };
  for (const [namespace, values] of Object.entries(translated)) {
    result[namespace] = { ...base[namespace], ...values };
  }
  return result;
}
