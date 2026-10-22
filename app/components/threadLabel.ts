import type { ReviewThread } from "../types";

function formatRange(startLine: number | null, endLine: number): string {
  return startLine === null || startLine === endLine
    ? `${endLine}`
    : `${startLine}-${endLine}`;
}

/**
 * Titles a thread as `path:line`, or `path:start-end` when it spans several
 * lines. Outdated threads have no line at head, so they fall back to the
 * range the thread was originally written against.
 */
export function threadLabel(thread: ReviewThread): string {
  const range =
    thread.line !== null
      ? formatRange(thread.startLine, thread.line)
      : thread.originalLine !== null
        ? formatRange(thread.originalStartLine, thread.originalLine)
        : null;
  return range === null ? thread.path : `${thread.path}:${range}`;
}
