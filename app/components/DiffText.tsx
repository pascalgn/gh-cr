import type { CSSProperties, ReactNode } from "react";

import type { DiffRow } from "../diffRows";
import { Fragment } from "react";

import { diffRows, windowRows } from "../diffRows";
import type { LineRange } from "../types";

import "./DiffText.css";

interface DiffTextProps {
  diff: string;
  /** When set, only rows inside this range are rendered. */
  window?: LineRange | null;
  /** Enables a gutter button that starts a comment on a new-side line. */
  onAddComment?: (line: number) => void;
  /** New-side line the comment form is open on, if any. */
  formLine?: number | null;
  /** The form itself, rendered directly under `formLine`. */
  form?: ReactNode;
}

const CLASS_NAME: Record<DiffRow["kind"], string> = {
  meta: "diffText-meta",
  add: "diffText-add",
  del: "diffText-del",
  context: "diffText-context",
  none: "diffText-context",
};

/** Width of a line-number column, in characters, for the highest number shown. */
function gutterWidth(rows: DiffRow[]): string {
  const highest = rows.reduce(
    (max, row) => Math.max(max, row.oldLine ?? 0, row.newLine ?? 0),
    0,
  );
  return `${Math.max(2, String(highest).length) + 2}ch`;
}

/** Renders a unified diff as raw, lightly coloured, horizontally scrollable text. */
export function DiffText({
  diff,
  window,
  onAddComment,
  formLine,
  form,
}: DiffTextProps) {
  const all = diffRows(diff);
  const rows =
    window == null
      ? all
      : windowRows(all, window.side, window.startLine, window.endLine);

  return (
    <pre
      className="diffText"
      style={{ "--diff-num-width": gutterWidth(rows) } as CSSProperties}
    >
      {rows.map((row, index) => (
        <Fragment key={index}>
          <span className={`diffText-line ${CLASS_NAME[row.kind]}`}>
            <span className="diffText-gutter">
              {onAddComment === undefined || row.newLine === null ? null : (
                <button
                  type="button"
                  className="diffText-add-comment"
                  aria-label={`Comment on line ${row.newLine}`}
                  title={`Comment on line ${row.newLine}`}
                  onClick={() => onAddComment(row.newLine ?? 0)}
                >
                  +
                </button>
              )}
              <span className="diffText-num">{row.oldLine ?? ""}</span>
              <span className="diffText-num">{row.newLine ?? ""}</span>
            </span>
            <span className="diffText-code">
              {row.text === "" ? " " : row.text}
            </span>
          </span>
          {form !== undefined &&
          row.newLine !== null &&
          row.newLine === formLine ? (
            <span className="diffText-form">{form}</span>
          ) : null}
        </Fragment>
      ))}
    </pre>
  );
}
