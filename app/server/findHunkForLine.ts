import type { DiffHunk, DiffSide } from "../types";

/**
 * The hunk covering `line` on `side`: `[oldStart, oldStart + oldLines)` for LEFT,
 * `[newStart, newStart + newLines)` for RIGHT.
 */
export function findHunkForLine(
  hunks: DiffHunk[],
  line: number,
  side: DiffSide,
): DiffHunk | null {
  return (
    hunks.find((hunk) => {
      const start = side === "LEFT" ? hunk.oldStart : hunk.newStart;
      const lines = side === "LEFT" ? hunk.oldLines : hunk.newLines;
      return line >= start && line < start + lines;
    }) ?? null
  );
}
