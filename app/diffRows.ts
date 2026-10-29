import type { DiffSide } from "./types";

/** What a diff line is, which also decides the line numbers it consumes. */
type LineKind = "meta" | "add" | "del" | "context" | "none";

const CLASS_NAME: Record<LineKind, string> = {
  meta: "diffText-meta",
  add: "diffText-add",
  del: "diffText-del",
  context: "diffText-context",
  none: "diffText-context",
};

function lineKind(line: string): LineKind {
  return line.startsWith("@@") ||
    line.startsWith("diff ") ||
    line.startsWith("index ") ||
    line.startsWith("+++") ||
    line.startsWith("---") ||
    line.startsWith("new file") ||
    line.startsWith("deleted file") ||
    line.startsWith("rename ") ||
    line.startsWith("similarity ")
    ? "meta"
    : line.startsWith("\\")
      ? "none"
      : line.startsWith("+")
        ? "add"
        : line.startsWith("-")
          ? "del"
          : "context";
}

/** The old- and new-side starts of a `@@ -a,b +c,d @@` header, if it is one. */
function hunkStarts(line: string): { old: number; new: number } | null {
  const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
  return match === null
    ? null
    : { old: Number(match[1]), new: Number(match[2]) };
}

export interface DiffRow {
  text: string;
  kind: LineKind;
  /** Line number on the old side, null when the row has none. */
  oldLine: number | null;
  /** Line number on the new side, null when the row has none. */
  newLine: number | null;
}

/** Walks a unified diff, tracking the old- and new-side line counters. */
export function diffRows(diff: string): DiffRow[] {
  let oldLine: number | null = null;
  let newLine: number | null = null;

  return diff
    .replace(/\n$/, "")
    .split("\n")
    .map((text) => {
      const kind = lineKind(text);
      if (kind === "meta") {
        const starts = hunkStarts(text);
        if (starts !== null) {
          oldLine = starts.old;
          newLine = starts.new;
        }
        return { text, kind, oldLine: null, newLine: null };
      }
      if (kind === "none") {
        return { text, kind, oldLine: null, newLine: null };
      }
      const row: DiffRow = {
        text,
        kind,
        oldLine: kind === "add" ? null : oldLine,
        newLine: kind === "del" ? null : newLine,
      };
      if (kind !== "add" && oldLine !== null) {
        oldLine += 1;
      }
      if (kind !== "del" && newLine !== null) {
        newLine += 1;
      }
      return row;
    });
}

/** Keeps only the rows falling inside a window of line numbers on one side. */
export function windowRows(
  rows: DiffRow[],
  side: DiffSide,
  startLine: number,
  endLine: number,
): DiffRow[] {
  let inside = false;
  return rows.filter((row) => {
    const line = side === "LEFT" ? row.oldLine : row.newLine;
    if (line !== null) {
      inside = line >= startLine && line <= endLine;
    }
    // Rows with no number on this side (a deletion seen from the new side, say)
    // belong wherever the last numbered row put us.
    return inside;
  });
}
