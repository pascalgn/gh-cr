import type { ReviewThreadWithComments } from "../../types";
import { getDatabase } from "./connection";
import { toReviewComment, toReviewThread } from "./rows";
import type { ReviewCommentRow, ReviewThreadRow } from "./rows";

/** All review threads of a pull request, comments nested, ordered by path then line. */
export function listReviewThreads(
  pullRequestId: number,
): ReviewThreadWithComments[] {
  const database = getDatabase();
  const threadRows = database
    .prepare(
      `SELECT * FROM review_threads
       WHERE pull_request_id = ?
       ORDER BY path ASC, COALESCE(line, original_line, 0) ASC, id ASC`,
    )
    .all(pullRequestId) as ReviewThreadRow[];
  const commentRows = database
    .prepare(
      `SELECT c.* FROM review_comments c
       JOIN review_threads t ON t.id = c.thread_id
       WHERE t.pull_request_id = ?
       ORDER BY c.created_at ASC, c.id ASC`,
    )
    .all(pullRequestId) as ReviewCommentRow[];
  return threadRows.map((row) => ({
    ...toReviewThread(row),
    comments: commentRows
      .filter((comment) => comment.thread_id === row.id)
      .map(toReviewComment),
  }));
}
