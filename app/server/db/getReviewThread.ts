import type { ReviewThreadWithComments } from "../../types";
import { getDatabase } from "./connection";
import { toReviewComment, toReviewThread } from "./rows";
import type { ReviewCommentRow, ReviewThreadRow } from "./rows";

/** One review thread with its comments, or null when no such thread is stored. */
export function getReviewThread(
  threadId: string,
): ReviewThreadWithComments | null {
  const database = getDatabase();
  const row = database
    .prepare(`SELECT * FROM review_threads WHERE id = ?`)
    .get(threadId) as ReviewThreadRow | undefined;
  if (row === undefined) {
    return null;
  }
  const commentRows = database
    .prepare(
      `SELECT * FROM review_comments
       WHERE thread_id = ?
       ORDER BY created_at ASC, id ASC`,
    )
    .all(threadId) as ReviewCommentRow[];
  return { ...toReviewThread(row), comments: commentRows.map(toReviewComment) };
}
