import type { AnchorResult, DiffSide } from "../types";
import { diceCoefficient } from "./diceCoefficient";
import { findHunkForLine } from "./findHunkForLine";
import { parseUnifiedDiff } from "./parseUnifiedDiff";

export interface AnchorCommentOptions {
  /** Last line of the range in the current head, null when outdated. */
  line: number | null;
  /** First line of the range in the current head. Null means same as `line`. */
  startLine: number | null;
  /** Last line of the range as originally written. */
  originalLine: number | null;
  /** First line of the original range. Null means same as `originalLine`. */
  originalStartLine: number | null;
  /** Which side of the diff the line numbers index. */
  diffSide: DiffSide;
  /** Current unified diff of the file, base...head. Empty when unchanged. */
  diff: string;
  /** The file as it exists on the thread's own side: head for RIGHT, merge-base for LEFT. */
  sideFileContent: string | null;
  /** The diff fragment GitHub captured when the comment was written. */
  diffHunk: string;
}

/** Shortest overlap, in non-whitespace characters, that may count as containment. */
const MIN_CONTAINMENT_CHARACTERS = 8;

/** Lowest Dice similarity still considered the same line of code. */
const FUZZY_THRESHOLD = 0.6;

/** Score window around the best fuzzy match, within which position decides. */
const FUZZY_EPSILON = 0.01;

/** The "no longer part of the diff" outcome, fresh each time so callers may keep it. */
function notInDiff(side: DiffSide): AnchorResult {
  return {
    status: "not-in-diff",
    hunk: null,
    line: null,
    startLine: null,
    side,
  };
}

/** The commented-on source line: the last line of the captured diff fragment, unmarked. */
function anchorText(diffHunk: string): string {
  const lines = diffHunk.split("\n");
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  const last = lines[lines.length - 1] ?? "";
  return (/^[+\- ]/.test(last) ? last.slice(1) : last).trimEnd();
}

/** The 1-based numbers of the lines the predicate accepts. */
function lineNumbersWhere(
  lines: string[],
  predicate: (line: string, index: number) => boolean,
): number[] {
  const matches: number[] = [];
  lines.forEach((line, index) => {
    if (predicate(line, index)) {
      matches.push(index + 1);
    }
  });
  return matches;
}

/** Lines identical to the anchor, ignoring trailing whitespace. */
function exactMatches(lines: string[], anchor: string): number[] {
  return lineNumbersWhere(lines, (line) => line.trimEnd() === anchor);
}

/**
 * Lines that contain the anchor or are contained by it — the shape left behind when
 * a line is extended or trimmed. Short, boilerplate lines are excluded: they would
 * otherwise be contained by half the file.
 */
function containmentMatches(lines: string[], anchor: string): number[] {
  const needle = anchor.trim();
  return lineNumbersWhere(lines, (line) => {
    const candidate = line.trim();
    const [shorter, longer] =
      needle.length <= candidate.length
        ? [needle, candidate]
        : [candidate, needle];
    return (
      shorter.replace(/\s/g, "").length >= MIN_CONTAINMENT_CHARACTERS &&
      longer.includes(shorter)
    );
  });
}

/**
 * Lines scoring closest to the anchor by bigram similarity — the shape left behind
 * when a line is reworded. Only the best-scoring lines are returned, and only when
 * that score clears the threshold, so position never outvotes similarity.
 */
function fuzzyMatches(lines: string[], anchor: string): number[] {
  const needle = anchor.trim();
  const scores = lines.map((line) => diceCoefficient(needle, line.trim()));
  const best = Math.max(0, ...scores);
  return best < FUZZY_THRESHOLD
    ? []
    : lineNumbersWhere(
        lines,
        (_line, index) => scores[index] >= best - FUZZY_EPSILON,
      );
}

/** The line number closest to `near`, ties resolving toward the top of the file. */
function nearest(lineNumbers: number[], near: number | null): number | null {
  const target = near ?? 1;
  return lineNumbers.reduce<number | null>(
    (best, lineNumber) =>
      best === null || Math.abs(lineNumber - target) < Math.abs(best - target)
        ? lineNumber
        : best,
    null,
  );
}

/**
 * Where the commented line most likely lives in the file as it now stands on the
 * thread's side: exact match first, then containment, then fuzzy similarity,
 * stopping at the first stage that hits.
 */
function relocatedLine(
  sideFileContent: string,
  anchor: string,
  originalLine: number | null,
): number | null {
  const lines = sideFileContent.split("\n");
  for (const stage of [exactMatches, containmentMatches, fuzzyMatches]) {
    const match = nearest(stage(lines, anchor), originalLine);
    if (match !== null) {
      return match;
    }
  }
  return null;
}

/**
 * The start of a relocated range: the matched line pushed back by however many
 * lines the original range spanned, never above it nor before the first line.
 */
function relocatedStartLine(
  matchedLine: number,
  originalLine: number | null,
  originalStartLine: number | null,
): number {
  const span = (originalLine ?? 0) - (originalStartLine ?? originalLine ?? 0);
  return Math.min(matchedLine, Math.max(1, matchedLine - span));
}

/** Finds the hunk of the current diff a review thread refers to, relocating it when outdated. */
export function anchorComment(options: AnchorCommentOptions): AnchorResult {
  const {
    line,
    startLine,
    originalLine,
    originalStartLine,
    diffSide,
    diff,
    sideFileContent,
    diffHunk,
  } = options;

  if (diff.trim() === "") {
    return {
      status: "file-not-in-diff",
      hunk: null,
      line: null,
      startLine: null,
      side: diffSide,
    };
  }

  const hunks = parseUnifiedDiff(diff);

  if (line !== null) {
    const hunk = findHunkForLine(hunks, line, diffSide);
    if (hunk !== null) {
      return {
        status: "anchored",
        hunk,
        line,
        startLine: startLine ?? line,
        side: diffSide,
      };
    }
  }

  const anchor = anchorText(diffHunk);
  if (anchor === "" || sideFileContent === null) {
    return notInDiff(diffSide);
  }

  const relocated = relocatedLine(sideFileContent, anchor, originalLine);
  if (relocated === null) {
    return notInDiff(diffSide);
  }

  const hunk = findHunkForLine(hunks, relocated, diffSide);
  return hunk === null
    ? notInDiff(diffSide)
    : {
        status: "relocated",
        hunk,
        line: relocated,
        startLine: relocatedStartLine(
          relocated,
          originalLine,
          originalStartLine,
        ),
        side: diffSide,
      };
}
