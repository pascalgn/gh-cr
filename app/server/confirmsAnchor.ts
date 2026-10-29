import { diffRows } from "../diffRows";
import type { DiffSide } from "../types";

/** Compared lines needed before a match counts as corroborated. */
const MIN_COMPARED = 2;

/** Compared lines at most: the anchor line plus the five that follow it. */
const MAX_COMPARED = 6;

/** The numbered lines of a diff from `from` onward, in order, as raw text. */
function linesFrom(diff: string, side: DiffSide, from: number): string[] {
  return diffRows(diff)
    .filter((row) => {
      const line = side === "LEFT" ? row.oldLine : row.newLine;
      return line !== null && line >= from;
    })
    .map((row) => row.text.trimEnd())
    .slice(0, MAX_COMPARED);
}

/**
 * Whether the code following the match looks like the code that followed the
 * comment when it was written.
 *
 * Finding one matching line is not proof: the same line can occur in several
 * places. Comparing what comes after it is what distinguishes the real spot
 * from a coincidence, and only a corroborated match is tight enough to trim
 * the current diff down to it.
 */
export function confirmsAnchor(
  originalDiff: string,
  currentDiff: string,
  side: DiffSide,
  originalLine: number | null,
  matchedLine: number,
): boolean {
  if (originalLine === null) {
    return false;
  }
  const before = linesFrom(originalDiff, side, originalLine);
  const after = linesFrom(currentDiff, side, matchedLine);
  const compared = Math.min(before.length, after.length);
  return (
    compared >= MIN_COMPARED &&
    before.slice(0, compared).every((line, index) => line === after[index])
  );
}
