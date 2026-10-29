import { describe, expect, it } from "vitest";

import { confirmsAnchor } from "./confirmsAnchor";

/** The comment was written on line 300 of this diff. */
const original = [
  "@@ -298,6 +298,6 @@",
  " line 298",
  " line 299",
  "+const value = compute()",
  "+return value",
  "+}",
  " tail",
].join("\n");

/** The same code, now starting five lines lower. */
function current(...tail: string[]): string {
  return ["@@ -300,9 +303,9 @@", " line 303", " line 304", ...tail].join("\n");
}

const moved = current("+const value = compute()", "+return value", "+}");

describe("confirmsAnchor", () => {
  it("confirms when the lines after the match also match", () => {
    expect(confirmsAnchor(original, moved, "RIGHT", 300, 305)).toBe(true);
  });

  it("rejects a match whose following lines differ", () => {
    const diverged = current(
      "+const value = compute()",
      "+return somethingElse",
      "+}",
    );
    expect(confirmsAnchor(original, diverged, "RIGHT", 300, 305)).toBe(false);
  });

  it("rejects a coincidental one-line match with nothing to corroborate it", () => {
    const lonely = current("+const value = compute()");
    expect(confirmsAnchor(original, lonely, "RIGHT", 300, 305)).toBe(false);
  });

  it("rejects when there is no original diff to compare against", () => {
    expect(confirmsAnchor("", moved, "RIGHT", 300, 305)).toBe(false);
  });

  it("rejects when the thread has no original line", () => {
    expect(confirmsAnchor(original, moved, "RIGHT", null, 305)).toBe(false);
  });

  it("ignores lines before the anchor on either side", () => {
    // 298 and 299 differ from 303 and 304, yet the comparison starts at the
    // anchor, so the match still stands.
    expect(confirmsAnchor(original, moved, "RIGHT", 300, 305)).toBe(true);
  });

  it("compares the old side for a LEFT thread", () => {
    const left = ["@@ -300,3 +300,3 @@", "-gone one", "-gone two"].join("\n");
    expect(confirmsAnchor(left, left, "LEFT", 300, 300)).toBe(true);
    expect(confirmsAnchor(left, left, "RIGHT", 300, 300)).toBe(false);
  });
});
