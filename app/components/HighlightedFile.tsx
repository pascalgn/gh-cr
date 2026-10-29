import { useHighlight } from "@mantine/code-highlight";
import { useComputedColorScheme } from "@mantine/core";
import type { CSSProperties } from "react";
import { Fragment, useState } from "react";

import { highlightLanguage } from "./highlightLanguage";
import { NewCommentForm } from "./NewCommentForm";

import "./DiffText.css";

interface HighlightedFileProps {
  /** The file's contents, numbered from line 1. */
  code: string;
  /** The file's path at head, for the language and for anchoring comments. */
  path: string;
}

/**
 * A whole file as syntax-highlighted source, with the same line-number gutter
 * and comment button the diffs have.
 *
 * A file the pull request adds outright is shown this way rather than as a
 * column of `+` signs — but it is still reviewable, so the gutter has to work
 * exactly as it does elsewhere.
 */
export function HighlightedFile({ code, path }: HighlightedFileProps) {
  const highlight = useHighlight();
  const colorScheme = useComputedColorScheme("light");
  const [formLine, setFormLine] = useState<number | null>(null);

  const { highlightedCode, isHighlighted } = highlight({
    code,
    language: highlightLanguage(path),
    colorScheme,
  });

  // Shiki emits one `<span class="line">` per source line, newline-separated,
  // and escapes the code itself. Before it has loaded, the adapter hands back
  // the plain text unchanged, which is rendered as text instead.
  const lines = (isHighlighted ? highlightedCode : code).split("\n");
  const width = `${Math.max(2, String(lines.length).length)}ch`;

  return (
    <pre
      className="diffText"
      style={{ "--diff-num-width": width } as CSSProperties}
    >
      {lines.map((line, index) => {
        const number = index + 1;
        return (
          <Fragment key={index}>
            <span className="diffText-line diffText-context">
              <span className="diffText-gutter">
                <button
                  type="button"
                  className="diffText-add-comment"
                  aria-label={`Comment on line ${number}`}
                  title={`Comment on line ${number}`}
                  onClick={() => setFormLine(number)}
                >
                  +
                </button>
                <span className="diffText-num">{number}</span>
              </span>
              {isHighlighted ? (
                <span
                  className="diffText-code"
                  dangerouslySetInnerHTML={{ __html: line === "" ? " " : line }}
                />
              ) : (
                <span className="diffText-code">
                  {line === "" ? " " : line}
                </span>
              )}
            </span>
            {formLine === number ? (
              <span className="diffText-form">
                <NewCommentForm
                  path={path}
                  line={number}
                  onClose={() => setFormLine(null)}
                />
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </pre>
  );
}
