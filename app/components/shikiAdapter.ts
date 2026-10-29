import { createShikiAdapter } from "@mantine/code-highlight";

/**
 * Shiki, built with only the grammars listed here.
 *
 * Importing `shiki` directly would pull in its whole bundled registry — every
 * language it ships, emacs-lisp and wolfram included — so the grammars are
 * named one by one instead. The JavaScript regex engine avoids the separate
 * WebAssembly payload the Oniguruma engine needs.
 */
async function loadShiki() {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, langs] =
    await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
      Promise.all([
        import("@shikijs/langs/bash"),
        import("@shikijs/langs/css"),
        import("@shikijs/langs/go"),
        import("@shikijs/langs/html"),
        import("@shikijs/langs/java"),
        import("@shikijs/langs/javascript"),
        import("@shikijs/langs/json"),
        import("@shikijs/langs/kotlin"),
        import("@shikijs/langs/markdown"),
        import("@shikijs/langs/python"),
        import("@shikijs/langs/rust"),
        import("@shikijs/langs/scss"),
        import("@shikijs/langs/sql"),
        import("@shikijs/langs/tsx"),
        import("@shikijs/langs/typescript"),
        import("@shikijs/langs/xml"),
        import("@shikijs/langs/yaml"),
      ]),
    ]);

  return createHighlighterCore({
    langs,
    themes: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
}

export const shikiAdapter = createShikiAdapter(loadShiki);
