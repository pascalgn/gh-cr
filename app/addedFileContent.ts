/**
 * The contents of a file that this diff adds outright, or null when the diff
 * is anything else. A wholly new file has no "before" to compare against, so
 * showing it as a column of `+` signs is noise — it is just a file.
 */
export function addedFileContent(diff: string): string | null {
  if (!/^new file mode /m.test(diff)) {
    return null;
  }
  const lines = diff.split("\n");
  const start = lines.findIndex((line) => line.startsWith("@@"));
  // The content is numbered from line 1, which is what lets the viewer show
  // line numbers and anchor comments. A hunk starting anywhere else is not
  // the whole file, so fall back to rendering it as a diff.
  if (start === -1 || !/^@@ -0,0 \+1(,|\s)/.test(lines[start])) {
    return null;
  }
  const body = lines
    .slice(start + 1)
    .filter((line) => !line.startsWith("\\") && line !== "");
  return body.every((line) => line.startsWith("+"))
    ? body.map((line) => line.slice(1)).join("\n")
    : null;
}
