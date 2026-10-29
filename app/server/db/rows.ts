import type {
  DiffSide,
  PullRequest,
  PullRequestState,
  ReviewComment,
  ReviewThread,
} from "../../types";

/** A `pull_requests` row joined with its `repos` row. */
export interface PullRequestRow {
  id: number;
  repo_id: number;
  owner: string;
  name: string;
  number: number;
  title: string;
  state: string;
  author: string;
  base_ref: string;
  base_sha: string;
  head_sha: string;
  merge_base_sha: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  refreshed_at: string | null;
}

/** A `review_threads` row. */
export interface ReviewThreadRow {
  id: string;
  pull_request_id: number;
  path: string;
  original_line: number | null;
  original_start_line: number | null;
  diff_side: string;
  is_resolved: number;
  is_outdated: number;
}

/** A `review_comments` row. */
export interface ReviewCommentRow {
  id: string;
  thread_id: string;
  author: string;
  body: string;
  diff_hunk: string;
  original_commit_sha: string;
  created_at: string;
  url: string;
}

/** The column list shared by every pull request query. */
export const pullRequestColumns = `
  pr.id AS id,
  pr.repo_id AS repo_id,
  r.owner AS owner,
  r.name AS name,
  pr.number AS number,
  pr.title AS title,
  pr.state AS state,
  pr.author AS author,
  pr.base_ref AS base_ref,
  pr.base_sha AS base_sha,
  pr.head_sha AS head_sha,
  pr.merge_base_sha AS merge_base_sha,
  pr.html_url AS html_url,
  pr.created_at AS created_at,
  pr.updated_at AS updated_at,
  pr.refreshed_at AS refreshed_at
`;

/** Maps a joined pull request row onto the domain type. */
export function toPullRequest(row: PullRequestRow): PullRequest {
  return {
    id: row.id,
    repoId: row.repo_id,
    owner: row.owner,
    name: row.name,
    number: row.number,
    title: row.title,
    state: row.state as PullRequestState,
    author: row.author,
    baseRef: row.base_ref,
    baseSha: row.base_sha,
    headSha: row.head_sha,
    mergeBaseSha: row.merge_base_sha,
    htmlUrl: row.html_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    refreshedAt: row.refreshed_at,
  };
}

/** Maps a review thread row onto the domain type. */
export function toReviewThread(row: ReviewThreadRow): ReviewThread {
  return {
    id: row.id,
    pullRequestId: row.pull_request_id,
    path: row.path,
    originalLine: row.original_line,
    originalStartLine: row.original_start_line,
    diffSide: row.diff_side as DiffSide,
    isResolved: row.is_resolved !== 0,
    isOutdated: row.is_outdated !== 0,
  };
}

/** Maps a review comment row onto the domain type. */
export function toReviewComment(row: ReviewCommentRow): ReviewComment {
  return {
    id: row.id,
    threadId: row.thread_id,
    author: row.author,
    body: row.body,
    diffHunk: row.diff_hunk,
    originalCommitSha: row.original_commit_sha,
    createdAt: row.created_at,
    url: row.url,
  };
}
