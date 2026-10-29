import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CommentBody } from "./CommentBody";

function render(body: string): string {
  return renderToStaticMarkup(<CommentBody body={body} />);
}

describe("CommentBody", () => {
  it("renders markdown emphasis and code", () => {
    const html = render("**bold** and `code`");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<code>code</code>");
  });

  it("renders GitHub-flavoured extras: tables, strikethrough, task lists", () => {
    expect(render("| a | b |\n| - | - |\n| 1 | 2 |")).toContain("<table>");
    expect(render("~~gone~~")).toContain("<del>gone</del>");
    expect(render("- [x] done")).toContain('type="checkbox"');
  });

  it("renders a fenced suggestion block as code, not as literal backticks", () => {
    const html = render("```suggestion\nconst a = 1\n```");
    expect(html).toContain("<pre>");
    expect(html).toContain("language-suggestion");
    expect(html).not.toContain("```");
  });

  it("renders a raw img tag, which GitHub allows in comments", () => {
    const html = render('<img src="https://example.com/a.png" alt="shot">');
    expect(html).toContain("<img");
    expect(html).toContain('src="https://example.com/a.png"');
    expect(html).toContain('alt="shot"');
  });

  it("renders a markdown image too", () => {
    expect(render("![shot](https://example.com/a.png)")).toContain("<img");
  });

  it("keeps the img but strips its event handler", () => {
    const html = render(
      '<img src="https://example.com/a.png" onerror="alert(1)">',
    );
    expect(html).toContain("<img");
    expect(html).not.toMatch(/onerror=["']/);
  });

  it("drops a script tag entirely", () => {
    const html = render("<script>alert(1)</script>");
    expect(html).not.toContain("<script");
  });

  it("drops an inline event handler on any element", () => {
    const html = render('<div onclick="alert(1)">hi</div>');
    expect(html).not.toMatch(/onclick=["']/);
  });

  it("refuses a javascript: image source", () => {
    const html = render('<img src="javascript:alert(1)">');
    expect(html).not.toContain("javascript:alert");
  });

  it("drops an iframe", () => {
    expect(render('<iframe src="https://example.com"></iframe>')).not.toContain(
      "<iframe",
    );
  });

  it("does not follow a javascript: link", () => {
    const html = render("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:alert");
  });

  it("opens links away from the app", () => {
    const html = render("[docs](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noreferrer");
  });

  it("does not leak react-markdown internals into the DOM", () => {
    expect(render("[docs](https://example.com)")).not.toContain("node=");
  });

  it("keeps plain prose intact", () => {
    expect(render("just a sentence")).toContain("just a sentence");
  });
});
