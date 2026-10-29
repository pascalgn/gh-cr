import { useState } from "react";

import { DiffText } from "./DiffText";
import { NewCommentForm } from "./NewCommentForm";
import type { LineRange } from "../types";

interface CommentableDiffProps {
  diff: string;
  /**
   * File to comment on, as it is named at head — a comment is anchored to the
   * pull request's head commit, so a pre-rename path would be rejected.
   */
  path: string;
  /** When set, only rows inside this range are rendered. */
  window?: LineRange | null;
}

/** A diff whose lines can each be commented on, like GitHub's `+` gutter. */
export function CommentableDiff({ diff, path, window }: CommentableDiffProps) {
  const [line, setLine] = useState<number | null>(null);

  return (
    <DiffText
      diff={diff}
      window={window}
      onAddComment={setLine}
      formLine={line}
      form={
        line === null ? undefined : (
          <NewCommentForm
            path={path}
            line={line}
            onClose={() => setLine(null)}
          />
        )
      }
    />
  );
}
