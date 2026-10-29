import type { ReviewThread } from "../types";

/**
 * Titles a thread as `path:line`, or `path:start-end` when the comment spans
 * several lines. Positions come from the diff the thread was written against,
 * which is the only position GitHub reports for an outdated thread.
 */
export function threadLabel(thread: ReviewThread): string {
  const { originalLine, originalStartLine, path } = thread;
  return originalLine === null
    ? path
    : originalStartLine === null || originalStartLine === originalLine
      ? `${path}:${originalLine}`
      : `${path}:${originalStartLine}-${originalLine}`;
}
