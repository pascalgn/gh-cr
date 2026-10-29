import { MantineProvider } from "@mantine/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HighlightedFile } from "./HighlightedFile";

function render(code: string, path = "src/a.ts"): string {
  return renderToStaticMarkup(
    <MantineProvider>
      <HighlightedFile code={code} path={path} />
    </MantineProvider>,
  );
}

const code = ["const a = 1", "", "export default a"].join("\n");

describe("HighlightedFile", () => {
  it("numbers every line from one", () => {
    const html = render(code);
    const numbers = [
      ...html.matchAll(/<span class="diffText-num">(\d+)<\/span>/g),
    ].map((match) => match[1]);
    expect(numbers).toEqual(["1", "2", "3"]);
  });

  it("gives every line a comment button", () => {
    const html = render(code);
    const labels = [
      ...html.matchAll(/aria-label="Comment on line (\d+)"/g),
    ].map((match) => match[1]);
    expect(labels).toEqual(["1", "2", "3"]);
  });

  it("keeps blank lines as their own numbered row", () => {
    expect(render("a\n\nb")).toContain('<span class="diffText-num">2</span>');
  });

  it("escapes code when the highlighter has not loaded", () => {
    // Server-side there is no shiki context, so the adapter returns plain
    // text; it must be rendered as text, never as markup.
    const html = render('<img src=x onerror="alert(1)">');
    expect(html).not.toMatch(/<img/);
    expect(html).toContain("&lt;img");
  });

  it("renders the gutter markup the diffs use, so styling is shared", () => {
    const html = render("a");
    expect(html).toContain('class="diffText"');
    expect(html).toContain('class="diffText-gutter"');
    expect(html).toContain('class="diffText-code"');
  });
});
