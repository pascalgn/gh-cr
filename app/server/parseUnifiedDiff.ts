import type { DiffHunk } from "../types";

const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

interface PartialHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  body: string[];
}

/** An omitted count, as in `@@ -1 +1 @@`, means a single line. */
function count(group: string | undefined): number {
  return group === undefined ? 1 : Number(group);
}

/** Splits the unified diff of a single file into its `@@ ... @@` hunks. */
export function parseUnifiedDiff(diff: string): DiffHunk[] {
  const partials: PartialHunk[] = [];
  let active: PartialHunk | null = null;

  for (const line of diff.split("\n")) {
    const match = HUNK_HEADER.exec(line);
    if (match) {
      active = {
        header: line,
        oldStart: Number(match[1]),
        oldLines: count(match[2]),
        newStart: Number(match[3]),
        newLines: count(match[4]),
        body: [],
      };
      partials.push(active);
    } else if (line.startsWith("diff --git ")) {
      active = null;
    } else if (active) {
      active.body.push(line);
    }
  }

  return partials.map(
    ({ header, oldStart, oldLines, newStart, newLines, body }) => ({
      header,
      oldStart,
      oldLines,
      newStart,
      newLines,
      text: [header, ...body].join("\n").replace(/\n+$/, ""),
    }),
  );
}
