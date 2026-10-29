/** Shared domain types used by both the server modules and the UI. */

export interface Repo {
  id: number;
  owner: string;
  name: string;
}

export type PullRequestState = "OPEN" | "CLOSED" | "MERGED";

export interface PullRequest {
  id: number;
  repoId: number;
  owner: string;
  name: string;
  number: number;
  title: string;
  state: PullRequestState;
  author: string;
  baseRef: string;
  baseSha: string;
  headSha: string;
  mergeBaseSha: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp of the last successful refresh, null if never refreshed. */
  refreshedAt: string | null;
}

export type DiffSide = "LEFT" | "RIGHT";

export interface ReviewThread {
  /** GraphQL node id. */
  id: string;
  pullRequestId: number;
  path: string;
  /** Last line of the range, at the commit the thread was written against. */
  originalLine: number | null;
  /**
   * First line of the original range. Null for a single-line comment, in which
   * case the commented section is taken as the lines leading up to
   * `originalLine` — see `originalRange`.
   */
  originalStartLine: number | null;
  /** RIGHT anchors to the head file, LEFT to the base file. */
  diffSide: DiffSide;
  isResolved: boolean;
  isOutdated: boolean;
}

/** A span of lines on one side of a diff, e.g. the lines a comment is about. */
export interface LineRange {
  side: DiffSide;
  startLine: number;
  endLine: number;
}

export interface ReviewComment {
  /** GraphQL node id. */
  id: string;
  threadId: string;
  author: string;
  body: string;
  /** The unified diff fragment GitHub captured when the comment was written. */
  diffHunk: string;
  originalCommitSha: string;
  createdAt: string;
  url: string;
}

export interface ReviewThreadWithComments extends ReviewThread {
  comments: ReviewComment[];
}

/** One file's entry in the base...head diff. */
export type FileChangeStatus = "added" | "modified" | "removed" | "renamed";

export interface ChangedFile {
  path: string;
  /** Previous path, set only when status is "renamed". */
  previousPath: string | null;
  status: FileChangeStatus;
}

/** A single `@@ ... @@` hunk sliced out of a unified diff. */
export interface DiffHunk {
  /** The `@@ -a,b +c,d @@` header line. */
  header: string;
  /** First line number on the old side. */
  oldStart: number;
  /** Number of old-side lines the hunk covers. */
  oldLines: number;
  /** First line number on the new side. */
  newStart: number;
  /** Number of new-side lines the hunk covers. */
  newLines: number;
  /** Header plus body, verbatim, ready to render as raw text. */
  text: string;
}

/**
 * Why the anchoring heuristic produced (or failed to produce) a hunk. The
 * current diff is always located by matching content, never by trusting a line
 * number GitHub reported against head.
 */
export type AnchorStatus = "matched" | "not-in-diff" | "file-not-in-diff";

export interface AnchorResult {
  status: AnchorStatus;
  /** The slice of the current diff this thread is about, null when not found. */
  hunk: DiffHunk | null;
  /** Last line the thread was matched to, on `side`. Null when not found. */
  line: number | null;
  /** First line of the matched section, always at or before `line`. */
  startLine: number | null;
  /** Which side of the diff `line`/`startLine` index. */
  side: DiffSide;
  /**
   * How the line was found: by matching the commented code's text, or by
   * following git's alignment of the file's old and new versions when the
   * code was rewritten past recognition.
   */
  via: "content" | "position";
  /**
   * Whether the lines following the match also match those that followed the
   * comment originally. Only then is the match tight enough to trim the
   * current diff down to the section, rather than showing the whole hunk.
   */
  confirmed: boolean;
}
