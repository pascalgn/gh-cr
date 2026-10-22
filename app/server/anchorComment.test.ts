import { describe, expect, it } from "vitest";
import { anchorComment } from "./anchorComment";

/** The line `  return subtotal + tax;` is what the review comment was written against. */
const ANCHOR = "  return subtotal + tax;";

/** The fragment GitHub captured back when the comment was made on line 47. */
const originalDiffHunk = `@@ -41,6 +44,7 @@ export function total(items: Item[]) {
   // filler 45
   // filler 46
+  return subtotal + tax;`;

/** Current base...head diff: one hunk around line 12, one around line 49. */
const currentDiff = `diff --git a/app/total.ts b/app/total.ts
index 1a2b3c4..5d6e7f8 100644
--- a/app/total.ts
+++ b/app/total.ts
@@ -8,6 +9,7 @@ import { rate } from "./rate";
   // filler 9
   // filler 10
   // filler 11
+  // filler 12
   // filler 13
   // filler 14
@@ -43,7 +45,8 @@ export function total(items: Item[]) {
   // filler 45
   // filler 46
   // filler 47
   // filler 48
+  return subtotal + tax;
   // filler 50
   // filler 51
`;

/** A 60-line file with `ANCHOR` on each of `lines` and numbered filler everywhere else. */
function headFileWithAnchorAt(...lines: number[]): string {
  return Array.from({ length: 60 }, (_, index) =>
    lines.includes(index + 1) ? ANCHOR : `  // filler ${index + 1}`,
  ).join("\n");
}

describe("anchorComment", () => {
  it("reports the file is not in the diff when the diff is empty", () => {
    expect(
      anchorComment({
        line: 47,
        startLine: null,
        originalLine: 47,
        originalStartLine: null,
        diffSide: "RIGHT",
        diff: "",
        sideFileContent: headFileWithAnchorAt(47),
        diffHunk: originalDiffHunk,
      }),
    ).toEqual({
      status: "file-not-in-diff",
      hunk: null,
      line: null,
      startLine: null,
      side: "RIGHT",
    });
  });

  it("anchors a still-anchored thread to the hunk covering its line", () => {
    const result = anchorComment({
      line: 12,
      startLine: null,
      originalLine: 12,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("anchored");
    expect(result.line).toBe(12);
    expect(result.hunk?.header).toBe(
      '@@ -8,6 +9,7 @@ import { rate } from "./rate";',
    );
  });

  it("relocates an outdated thread from line 47 to line 49", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 47,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(49);
    expect(result.hunk?.header).toBe(
      "@@ -43,7 +45,8 @@ export function total(items: Item[]) {",
    );
    expect(result.hunk?.text).toContain(ANCHOR);
  });

  it("picks the occurrence nearest to the original line when the text repeats", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 47,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(12, 49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(49);
  });

  it("prefers the occurrence nearest the top when there is no original line", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: null,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(12, 49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(12);
  });

  it("falls through to relocation when the anchored line is outside every hunk", () => {
    const result = anchorComment({
      line: 30,
      startLine: null,
      originalLine: 47,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(49);
  });

  it("reports not-in-diff when the anchor text is gone from the head file", () => {
    expect(
      anchorComment({
        line: null,
        startLine: null,
        originalLine: 47,
        originalStartLine: null,
        diffSide: "RIGHT",
        diff: currentDiff,
        sideFileContent: headFileWithAnchorAt(),
        diffHunk: originalDiffHunk,
      }),
    ).toEqual({
      status: "not-in-diff",
      hunk: null,
      line: null,
      startLine: null,
      side: "RIGHT",
    });
  });

  it("reports not-in-diff when the anchor text survives outside every hunk", () => {
    expect(
      anchorComment({
        line: null,
        startLine: null,
        originalLine: 47,
        originalStartLine: null,
        diffSide: "RIGHT",
        diff: currentDiff,
        sideFileContent: headFileWithAnchorAt(30),
        diffHunk: originalDiffHunk,
      }),
    ).toEqual({
      status: "not-in-diff",
      hunk: null,
      line: null,
      startLine: null,
      side: "RIGHT",
    });
  });

  it("reports not-in-diff when the file no longer exists at head", () => {
    expect(
      anchorComment({
        line: null,
        startLine: null,
        originalLine: 47,
        originalStartLine: null,
        diffSide: "RIGHT",
        diff: currentDiff,
        sideFileContent: null,
        diffHunk: originalDiffHunk,
      }),
    ).toEqual({
      status: "not-in-diff",
      hunk: null,
      line: null,
      startLine: null,
      side: "RIGHT",
    });
  });

  it("reports not-in-diff when the anchor line is blank", () => {
    expect(
      anchorComment({
        line: null,
        startLine: null,
        originalLine: 47,
        originalStartLine: null,
        diffSide: "RIGHT",
        diff: currentDiff,
        sideFileContent: headFileWithAnchorAt(49),
        diffHunk:
          "@@ -41,6 +44,7 @@ export function total(items: Item[]) {\n+   \n",
      }),
    ).toEqual({
      status: "not-in-diff",
      hunk: null,
      line: null,
      startLine: null,
      side: "RIGHT",
    });
  });

  it("matches the anchor text ignoring trailing whitespace", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 47,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49).replace(ANCHOR, `${ANCHOR}   `),
      diffHunk: `${originalDiffHunk}  `,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(49);
  });
});

/**
 * Shapes taken from sindresorhus/env-paths#16, where every thread is outdated and
 * the commented line survives at head in a slightly different form.
 */
describe("anchorComment relocation of changed lines", () => {
  const windowsConfigLine =
    "- Windows: `%APPDATA%\\MyApp-nodejs\\Config` (for example, `C:\\Users\\USERNAME\\AppData\\Roaming\\MyApp-nodejs\\Config`)";

  /** readme.md at head, with the commented line extended and pushed down to line 72. */
  const extendedHeadFile = [
    ...Array.from({ length: 68 }, (_, index) => `readme line ${index + 1}`),
    "Example locations (with the default `nodejs` [suffix](#suffix)):",
    "",
    "- macOS: `~/Library/Preferences/MyApp-nodejs`",
    windowsConfigLine,
    "- Linux: `~/.config/MyApp-nodejs`",
  ].join("\n");

  const extendedDiff = `diff --git a/readme.md b/readme.md
index 1111111..2222222 100644
--- a/readme.md
+++ b/readme.md
@@ -62,8 +62,12 @@ Directory for config files.
 Example locations (with the default \`nodejs\` [suffix](#suffix)):
 
 - macOS: \`~/Library/Preferences/MyApp-nodejs\`
+${windowsConfigLine}
 - Linux: \`~/.config/MyApp-nodejs\`
`;

  const extendedDiffHunk = `@@ -60,6 +60,12 @@ Directory for data files.
 
 Directory for config files.
 
+- Windows: \`%APPDATA%\\MyApp-nodejs\\Config\``;

  it("relocates when the commented line was extended (anchor is a substring)", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 66,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: extendedDiff,
      sideFileContent: extendedHeadFile,
      diffHunk: extendedDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(72);
    expect(result.hunk?.header).toBe(
      "@@ -62,8 +62,12 @@ Directory for config files.",
    );
  });

  /** index.d.ts at head: the doc line repeats verbatim for every path getter. */
  const rewordedHeadFile = Array.from({ length: 70 }, (_, index) =>
    [17, 28, 39, 50, 61].includes(index + 1)
      ? "\t\tExample locations (with the default `nodejs` suffix):"
      : `\t\t// index.d.ts line ${index + 1}`,
  ).join("\n");

  const rewordedDiff = `diff --git a/index.d.ts b/index.d.ts
index 3333333..4444444 100644
--- a/index.d.ts
+++ b/index.d.ts
@@ -13,26 +13,56 @@ declare namespace envPaths {
 		readonly data: string;
 
+		Example locations (with the default \`nodejs\` suffix):
 		readonly config: string;
`;

  const rewordedDiffHunk = `@@ -55,6 +58,10 @@ declare namespace envPaths {
 		*/
+		Example locations (with the default \`nodejs\` [suffix](#suffix)):`;

  it("relocates a reworded line to the occurrence nearest the original line", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 61,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: rewordedDiff,
      sideFileContent: rewordedHeadFile,
      diffHunk: rewordedDiffHunk,
    });

    expect(result.status).toBe("relocated");
    // Lines 17, 28, 39, 50 and 61 are identical and all inside the hunk, so only
    // the distance to the original line can pick the right one.
    expect(result.line).toBe(61);
  });

  it("picks a different identical occurrence when the original line moves", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 29,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: rewordedDiff,
      sideFileContent: rewordedHeadFile,
      diffHunk: rewordedDiffHunk,
    });

    expect(result.line).toBe(28);
  });

  it("does not match a short boilerplate anchor against unrelated lines", () => {
    const boilerplateHeadFile = [
      'import envPaths from "env-paths";',
      "",
      "function configure() {",
      '\tconst paths = envPaths("MyApp", {suffix: ""});',
      "\treturn {",
      "\t\tconfig: paths.config,",
      "\t};",
      "}",
    ].join("\n");

    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 6,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: `--- a/configure.ts
+++ b/configure.ts
@@ -1,6 +1,8 @@
 function configure() {
+\tconst paths = envPaths("MyApp", {suffix: ""});
 }
`,
      sideFileContent: boilerplateHeadFile,
      diffHunk: `@@ -4,4 +4,6 @@ function configure() {
 \treturn {
 \t\tconfig: paths.config,
+  });`,
    });

    expect(result).toEqual({
      status: "not-in-diff",
      hunk: null,
      line: null,
      startLine: null,
      side: "RIGHT",
    });
  });
});

describe("anchorComment line ranges", () => {
  it("keeps the whole range of a still-anchored multi-line thread", () => {
    const result = anchorComment({
      line: 12,
      startLine: 10,
      originalLine: 12,
      originalStartLine: 10,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("anchored");
    expect(result.startLine).toBe(10);
    expect(result.line).toBe(12);
    expect(result.side).toBe("RIGHT");
  });

  it("treats a null start line as a single-line range", () => {
    const anchored = anchorComment({
      line: 12,
      startLine: null,
      originalLine: 12,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });
    const relocated = anchorComment({
      line: null,
      startLine: null,
      originalLine: 47,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    expect(anchored.startLine).toBe(anchored.line);
    expect(relocated.status).toBe("relocated");
    expect(relocated.startLine).toBe(49);
    expect(relocated.line).toBe(49);
  });

  it("preserves the original span when relocating a multi-line thread", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 47,
      originalStartLine: 45,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    // The anchor text matched line 49, and the original range spanned 45..47,
    // so the reconstructed range is the same two lines back from the match.
    expect(result.status).toBe("relocated");
    expect(result.startLine).toBe(47);
    expect(result.line).toBe(49);
  });

  it("clamps a reconstructed start that would fall before the first line", () => {
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 60,
      originalStartLine: 1,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(12),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(12);
    expect(result.startLine).toBe(1);
  });
});

describe("anchorComment on the old side", () => {
  /** Old-side line 8 is inside `@@ -8,6`, but outside the new-side range `+9,7`. */
  it("anchors a LEFT thread against the hunk's old-side range", () => {
    const result = anchorComment({
      line: 8,
      startLine: null,
      originalLine: 8,
      originalStartLine: null,
      diffSide: "LEFT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("anchored");
    expect(result.line).toBe(8);
    expect(result.startLine).toBe(8);
    expect(result.side).toBe("LEFT");
  });

  it("does not anchor the same line on the RIGHT side", () => {
    const result = anchorComment({
      line: 8,
      startLine: null,
      originalLine: 8,
      originalStartLine: null,
      diffSide: "RIGHT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(49),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(49);
  });

  it("relocates a LEFT thread inside the base file and the old-side range", () => {
    // Line 44 of the base file is covered by `@@ -43,7` but by no new-side range.
    const result = anchorComment({
      line: null,
      startLine: null,
      originalLine: 44,
      originalStartLine: null,
      diffSide: "LEFT",
      diff: currentDiff,
      sideFileContent: headFileWithAnchorAt(44),
      diffHunk: originalDiffHunk,
    });

    expect(result.status).toBe("relocated");
    expect(result.line).toBe(44);
    expect(result.side).toBe("LEFT");
  });
});
