/**
 * Languages the highlighter is built with; anything else renders unhighlighted.
 * Must stay in step with the grammar imports in `shikiAdapter.ts`: naming a
 * language here that is not loaded there would make the highlighter throw.
 *
 * The set is deliberately lean — every grammar is weight in the bundle, and a
 * few (C++ at 778K, Ruby at 259K) cost more than they are worth here. Adding
 * one back is a line in each of the two files.
 */
export const HIGHLIGHT_LANGUAGES = [
  "bash",
  "css",
  "go",
  "html",
  "java",
  "javascript",
  "json",
  "kotlin",
  "markdown",
  "python",
  "rust",
  "scss",
  "sql",
  "tsx",
  "typescript",
  "xml",
  "yaml",
];

const BY_EXTENSION: Record<string, string> = {
  bash: "bash",
  css: "css",
  go: "go",
  htm: "html",
  html: "html",
  java: "java",
  js: "javascript",
  json: "json",
  jsx: "tsx",
  kt: "kotlin",
  kts: "kotlin",
  md: "markdown",
  mjs: "javascript",
  py: "python",
  rs: "rust",
  scss: "scss",
  sh: "bash",
  sql: "sql",
  ts: "typescript",
  tsx: "tsx",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
};

/** The highlighter's name for a path's language, or undefined if unsupported. */
export function highlightLanguage(path: string): string | undefined {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension];
}
