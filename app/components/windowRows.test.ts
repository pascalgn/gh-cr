import { describe, expect, it } from "vitest";

import { diffRows, windowRows } from "../diffRows";

/** Twenty context lines, numbered 1..20 on both sides. */
const diff = [
  "@@ -1,20 +1,20 @@",
  ...Array.from({ length: 20 }, (_, index) => ` line ${index + 1}`),
].join("\n");

function newLinesIn(startLine: number, endLine: number): number[] {
  return windowRows(diffRows(diff), "RIGHT", startLine, endLine)
    .map((row) => row.newLine)
    .filter((line): line is number => line !== null);
}

describe("windowRows", () => {
  it("keeps only the rows inside the window", () => {
    expect(newLinesIn(10, 11)).toEqual([10, 11]);
  });

  it("stops at the edges of the diff rather than inventing rows", () => {
    expect(newLinesIn(1, 100)).toHaveLength(20);
  });

  it("drops the hunk header, which belongs to no line", () => {
    const rows = windowRows(diffRows(diff), "RIGHT", 10, 11);
    expect(rows.some((row) => row.kind === "meta")).toBe(false);
  });

  it("keeps a deletion next to the window, which has no new-side number", () => {
    const withDeletion = [
      "@@ -1,4 +1,3 @@",
      " keep",
      "-gone",
      " after",
      " tail",
    ].join("\n");
    const rows = windowRows(diffRows(withDeletion), "RIGHT", 1, 2);
    expect(rows.map((row) => row.text)).toEqual([" keep", "-gone", " after"]);
  });
});
