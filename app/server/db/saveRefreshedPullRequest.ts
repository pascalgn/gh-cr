import type { PullRequest, ReviewComment, ReviewThread } from "../../types";
import { getDatabase } from "./connection";
import { getPullRequest } from "./getPullRequest";

/** A thread as handed to {@link saveRefreshedPullRequest}, before the PR id is known. */
export interface RefreshedReviewThread extends Omit<
  ReviewThread,
  "pullRequestId"
> {
  comments: Omit<ReviewComment, "threadId">[];
}

/** Everything one refresh produced: the PR's current fields plus all of its threads. */
export interface RefreshedPullRequestData extends Omit<
  PullRequest,
  "id" | "repoId" | "refreshedAt"
> {
  threads: RefreshedReviewThread[];
}

/** Stores a refreshed pull request, replacing all of its threads and comments. */
export function saveRefreshedPullRequest(
  data: RefreshedPullRequestData,
): PullRequest {
  const database = getDatabase();
  const upsertRepo = database.prepare(
    `INSERT INTO repos (owner, name) VALUES (?, ?)
     ON CONFLICT (owner, name) DO UPDATE SET owner = excluded.owner
     RETURNING id`,
  );
  const upsertPullRequest = database.prepare(
    `INSERT INTO pull_requests (
       repo_id, number, title, state, author, base_ref, base_sha, head_sha,
       merge_base_sha, html_url, created_at, updated_at, refreshed_at
     )
     VALUES (
       @repoId, @number, @title, @state, @author, @baseRef, @baseSha, @headSha,
       @mergeBaseSha, @htmlUrl, @createdAt, @updatedAt, @refreshedAt
     )
     ON CONFLICT (repo_id, number) DO UPDATE SET
       title = excluded.title,
       state = excluded.state,
       author = excluded.author,
       base_ref = excluded.base_ref,
       base_sha = excluded.base_sha,
       head_sha = excluded.head_sha,
       merge_base_sha = excluded.merge_base_sha,
       html_url = excluded.html_url,
       created_at = excluded.created_at,
       updated_at = excluded.updated_at,
       refreshed_at = excluded.refreshed_at
     RETURNING id`,
  );
  const deleteThreads = database.prepare(
    `DELETE FROM review_threads WHERE pull_request_id = ?`,
  );
  const insertThread = database.prepare(
    `INSERT INTO review_threads (
       id, pull_request_id, path, original_line,
       original_start_line, diff_side, is_resolved, is_outdated
     )
     VALUES (
       @id, @pullRequestId, @path, @originalLine,
       @originalStartLine, @diffSide, @isResolved, @isOutdated
     )`,
  );
  const insertComment = database.prepare(
    `INSERT INTO review_comments (
       id, thread_id, author, body, diff_hunk, original_commit_sha, created_at, url
     )
     VALUES (
       @id, @threadId, @author, @body, @diffHunk, @originalCommitSha, @createdAt, @url
     )`,
  );

  const save = database.transaction((input: RefreshedPullRequestData) => {
    const repo = upsertRepo.get(input.owner, input.name) as { id: number };
    const pullRequest = upsertPullRequest.get({
      repoId: repo.id,
      number: input.number,
      title: input.title,
      state: input.state,
      author: input.author,
      baseRef: input.baseRef,
      baseSha: input.baseSha,
      headSha: input.headSha,
      mergeBaseSha: input.mergeBaseSha,
      htmlUrl: input.htmlUrl,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      refreshedAt: new Date().toISOString(),
    }) as { id: number };
    deleteThreads.run(pullRequest.id);
    for (const thread of input.threads) {
      insertThread.run({
        id: thread.id,
        pullRequestId: pullRequest.id,
        path: thread.path,
        originalLine: thread.originalLine,
        originalStartLine: thread.originalStartLine,
        diffSide: thread.diffSide,
        isResolved: thread.isResolved ? 1 : 0,
        isOutdated: thread.isOutdated ? 1 : 0,
      });
      for (const comment of thread.comments) {
        insertComment.run({
          id: comment.id,
          threadId: thread.id,
          author: comment.author,
          body: comment.body,
          diffHunk: comment.diffHunk,
          originalCommitSha: comment.originalCommitSha,
          createdAt: comment.createdAt,
          url: comment.url,
        });
      }
    }
  });

  save(data);
  const stored = getPullRequest(data.owner, data.name, data.number);
  if (stored === null) {
    throw new Error(
      `Pull request ${data.owner}/${data.name}#${data.number} vanished right after being saved`,
    );
  }
  return stored;
}
