import { describe, expect, it } from "vitest";
import { parseUnifiedDiff } from "./parseUnifiedDiff";

const twoHunks = `diff --git a/app/total.ts b/app/total.ts
index 1a2b3c4..5d6e7f8 100644
--- a/app/total.ts
+++ b/app/total.ts
@@ -1,4 +1,5 @@
 import { rate } from "./rate";
+import { round } from "./round";
 
 export function total(items: Item[]) {
   const subtotal = sum(items);
@@ -10,6 +11,6 @@ export function total(items: Item[]) {
   const tax = subtotal * rate;
-  return subtotal + tax;
+  return round(subtotal + tax);
 }
`;

const omittedCounts = `--- a/VERSION
+++ b/VERSION
@@ -1 +1 @@
-1.2.0
+1.3.0
`;

const addedFile = `diff --git a/app/round.ts b/app/round.ts
new file mode 100644
index 0000000..9f8e7d6
--- /dev/null
+++ b/app/round.ts
@@ -0,0 +1,3 @@
+export function round(value: number) {
+  return Math.round(value * 100) / 100;
+}
`;

const deletedFile = `diff --git a/app/legacy.ts b/app/legacy.ts
deleted file mode 100644
index 9f8e7d6..0000000
--- a/app/legacy.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export function legacy() {
-  return null;
-}
`;

const preambleOnly = `diff --git a/app/renamed.ts b/app/moved.ts
similarity index 100%
rename from app/renamed.ts
rename to app/moved.ts
`;

describe("parseUnifiedDiff", () => {
  it("splits a multi-hunk diff and ignores the preamble", () => {
    const hunks = parseUnifiedDiff(twoHunks);

    expect(hunks).toHaveLength(2);
    expect(hunks[0].header).toBe("@@ -1,4 +1,5 @@");
    expect(hunks[0].oldStart).toBe(1);
    expect(hunks[0].oldLines).toBe(4);
    expect(hunks[0].newStart).toBe(1);
    expect(hunks[0].newLines).toBe(5);
    expect(hunks[1].header).toBe(
      "@@ -10,6 +11,6 @@ export function total(items: Item[]) {",
    );
    expect(hunks[1].oldStart).toBe(10);
    expect(hunks[1].oldLines).toBe(6);
    expect(hunks[1].newStart).toBe(11);
    expect(hunks[1].newLines).toBe(6);
  });

  it("keeps the header plus the body verbatim, without a trailing newline", () => {
    const [first, second] = parseUnifiedDiff(twoHunks);

    expect(first.text).toBe(
      [
        "@@ -1,4 +1,5 @@",
        ' import { rate } from "./rate";',
        '+import { round } from "./round";',
        " ",
        " export function total(items: Item[]) {",
        "   const subtotal = sum(items);",
      ].join("\n"),
    );
    expect(second.text.endsWith("}")).toBe(true);
    expect(second.text.split("\n")[0]).toBe(second.header);
  });

  it("treats an omitted line count as a single line", () => {
    const hunks = parseUnifiedDiff(omittedCounts);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].oldStart).toBe(1);
    expect(hunks[0].oldLines).toBe(1);
    expect(hunks[0].newStart).toBe(1);
    expect(hunks[0].newLines).toBe(1);
    expect(hunks[0].text).toBe("@@ -1 +1 @@\n-1.2.0\n+1.3.0");
  });

  it("parses an added-file diff", () => {
    const hunks = parseUnifiedDiff(addedFile);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].oldStart).toBe(0);
    expect(hunks[0].oldLines).toBe(0);
    expect(hunks[0].newStart).toBe(1);
    expect(hunks[0].newLines).toBe(3);
    expect(hunks[0].text.split("\n")).toHaveLength(4);
  });

  it("parses a deleted-file diff as covering no new-side lines", () => {
    const hunks = parseUnifiedDiff(deletedFile);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].oldStart).toBe(1);
    expect(hunks[0].oldLines).toBe(3);
    expect(hunks[0].newStart).toBe(0);
    expect(hunks[0].newLines).toBe(0);
  });

  it("parses an old-side count omitted from the header", () => {
    const hunks = parseUnifiedDiff(`--- a/app/one.ts
+++ b/app/one.ts
@@ -7 +7,3 @@ context
-const value = 1;
+const value = 2;
+const extra = 3;
`);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].oldStart).toBe(7);
    expect(hunks[0].oldLines).toBe(1);
    expect(hunks[0].newStart).toBe(7);
    expect(hunks[0].newLines).toBe(3);
  });

  it("returns no hunks for empty or preamble-only input", () => {
    expect(parseUnifiedDiff("")).toEqual([]);
    expect(parseUnifiedDiff(preambleOnly)).toEqual([]);
  });
});
