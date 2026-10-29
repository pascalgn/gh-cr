import { getDatabase } from "./connection";
import type { ReviewComment } from "../../types";

/**
 * Stores one comment locally, so a reply shows up without a full refresh.
 * Replacing on conflict keeps a later refresh of the same comment harmless.
 */
export function insertReviewComment(comment: ReviewComment): void {
  getDatabase()
    .prepare(
      `INSERT OR REPLACE INTO review_comments (
         id, thread_id, author, body, diff_hunk, original_commit_sha, created_at, url
       )
       VALUES (
         @id, @threadId, @author, @body, @diffHunk, @originalCommitSha, @createdAt, @url
       )`,
    )
    .run(comment);
}
