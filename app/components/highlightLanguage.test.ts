import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { HIGHLIGHT_LANGUAGES, highlightLanguage } from "./highlightLanguage";

/**
 * The grammars shiki is actually built with. Read from the source rather than
 * imported, so the check cannot be satisfied by the list agreeing with itself.
 */
const imported = [
  ...readFileSync(
    new URL("./shikiAdapter.ts", import.meta.url),
    "utf8",
  ).matchAll(/@shikijs\/langs\/([a-z0-9]+)/g),
].map((match) => match[1]);

describe("highlightLanguage", () => {
  it("maps extensions to a language", () => {
    expect(highlightLanguage("src/Main.java")).toBe("java");
    expect(highlightLanguage("app/routes/home.tsx")).toBe("tsx");
    expect(highlightLanguage("README.md")).toBe("markdown");
  });

  it("ignores case and leading path", () => {
    expect(highlightLanguage("a/b/C.TS")).toBe("typescript");
  });

  it("returns undefined for an unknown or missing extension", () => {
    expect(highlightLanguage("Makefile")).toBeUndefined();
    expect(highlightLanguage("notes.unknownext")).toBeUndefined();
  });

  it("declares exactly the grammars the highlighter loads", () => {
    expect([...HIGHLIGHT_LANGUAGES].sort()).toEqual([...imported].sort());
  });

  it("never maps an extension to a grammar that is not loaded", () => {
    // Naming an unloaded language is a runtime throw inside shiki, so this is
    // the check that keeps the two files honest.
    const extensions = [
      "ts",
      "tsx",
      "js",
      "jsx",
      "mjs",
      "json",
      "css",
      "scss",
      "html",
      "htm",
      "md",
      "yaml",
      "yml",
      "xml",
      "sql",
      "sh",
      "bash",
      "py",
      "go",
      "rs",
      "java",
      "kt",
      "kts",
    ];
    for (const extension of extensions) {
      const language = highlightLanguage(`file.${extension}`);
      if (language !== undefined) {
        expect(imported).toContain(language);
      }
    }
  });
});
