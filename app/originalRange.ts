import type { LineRange, ReviewThread } from "./types";

/**
 * Lines of leading context treated as the commented section when GitHub reports
 * no start line, i.e. for a single-line comment.
 */
export const SINGLE_LINE_CONTEXT = 5;

/**
 * The lines a thread is about, in the diff it was originally written against.
 * A multi-line comment gives its range directly; a single-line one is widened
 * to the lines leading up to it, which is the context that makes it readable.
 */
export function originalRange(thread: ReviewThread): LineRange | null {
  const { originalLine, originalStartLine, diffSide } = thread;
  return originalLine === null
    ? null
    : {
        side: diffSide,
        startLine:
          originalStartLine ?? Math.max(1, originalLine - SINGLE_LINE_CONTEXT),
        endLine: originalLine,
      };
}
