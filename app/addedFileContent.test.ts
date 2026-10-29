import { describe, expect, it } from "vitest";

import { addedFileContent } from "./addedFileContent";

const added = [
  "diff --git a/src/new.ts b/src/new.ts",
  "new file mode 100644",
  "index 0000000..1c2d3e4",
  "--- /dev/null",
  "+++ b/src/new.ts",
  "@@ -0,0 +1,3 @@",
  "+export function greet() {",
  '+  return "hi"',
  "+}",
].join("\n");

const modified = [
  "diff --git a/src/old.ts b/src/old.ts",
  "index 1111111..2222222 100644",
  "--- a/src/old.ts",
  "+++ b/src/old.ts",
  "@@ -1,3 +1,3 @@",
  " export function greet() {",
  '-  return "hi"',
  '+  return "hello"',
  " }",
].join("\n");

describe("addedFileContent", () => {
  it("returns the file's contents, without the plus signs", () => {
    expect(addedFileContent(added)).toBe(
      ["export function greet() {", '  return "hi"', "}"].join("\n"),
    );
  });

  it("returns null for a modified file", () => {
    expect(addedFileContent(modified)).toBeNull();
  });

  it("returns null for a deleted file", () => {
    const deleted = [
      "diff --git a/src/old.ts b/src/old.ts",
      "deleted file mode 100644",
      "--- a/src/old.ts",
      "+++ /dev/null",
      "@@ -1,1 +0,0 @@",
      "-gone",
    ].join("\n");
    expect(addedFileContent(deleted)).toBeNull();
  });

  it("returns null for an empty diff", () => {
    expect(addedFileContent("")).toBeNull();
  });

  it("tolerates a missing trailing newline marker", () => {
    expect(addedFileContent(`${added}\n\\ No newline at end of file`)).toBe(
      ["export function greet() {", '  return "hi"', "}"].join("\n"),
    );
  });

  it("returns null when the hunk does not start at line 1", () => {
    const partial = [
      "diff --git a/a.ts b/a.ts",
      "new file mode 100644",
      "@@ -0,0 +5,2 @@",
      "+five",
      "+six",
    ].join("\n");
    expect(addedFileContent(partial)).toBeNull();
  });

  it("keeps a blank line inside the new file", () => {
    const withBlank = [
      "diff --git a/a.ts b/a.ts",
      "new file mode 100644",
      "@@ -0,0 +1,3 @@",
      "+one",
      "+",
      "+three",
    ].join("\n");
    expect(addedFileContent(withBlank)).toBe("one\n\nthree");
  });
});
