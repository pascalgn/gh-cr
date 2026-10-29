import { describe, expect, it } from "vitest";

import { mapLineThroughDiff } from "./mapLineThroughDiff";

/** Lines 1-3 unchanged, 4-5 replaced by one line, 6-7 unchanged. */
const diff = [
  "@@ -1,7 +1,6 @@",
  " one",
  " two",
  " three",
  "-four",
  "-five",
  "+merged",
  " six",
  " seven",
].join("\n");

describe("mapLineThroughDiff", () => {
  it("maps a surviving line to itself", () => {
    expect(mapLineThroughDiff(diff, 2)).toBe(2);
  });

  it("maps a replaced line to where its replacement sits", () => {
    expect(mapLineThroughDiff(diff, 4)).toBe(4);
  });

  it("shifts lines after a hunk by the size change", () => {
    expect(mapLineThroughDiff(diff, 6)).toBe(5);
    expect(mapLineThroughDiff(diff, 7)).toBe(6);
  });

  it("leaves lines before the first hunk alone", () => {
    const later = ["@@ -10,2 +10,3 @@", " a", "+added", " b"].join("\n");
    expect(mapLineThroughDiff(later, 3)).toBe(3);
  });

  it("accumulates the shift across several hunks", () => {
    const two = [
      "@@ -1,2 +1,3 @@",
      " a",
      "+extra",
      " b",
      "@@ -10,2 +11,2 @@",
      " c",
      " d",
    ].join("\n");
    expect(mapLineThroughDiff(two, 10)).toBe(11);
  });

  it("returns null for an empty diff", () => {
    expect(mapLineThroughDiff("", 5)).toBeNull();
  });

  it("ignores the file header lines", () => {
    const withHeader = [
      "diff --git a/a.ts b/a.ts",
      "index 111..222 100644",
      "--- a/a.ts",
      "+++ b/a.ts",
      "@@ -1,2 +1,2 @@",
      "-old",
      "+new",
      " tail",
    ].join("\n");
    expect(mapLineThroughDiff(withHeader, 1)).toBe(1);
    expect(mapLineThroughDiff(withHeader, 2)).toBe(2);
  });
});
