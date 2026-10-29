/** The full sqlite schema, applied on every database open (all statements are idempotent). */
export const schema = `
CREATE TABLE IF NOT EXISTS repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (owner, name)
);

CREATE TABLE IF NOT EXISTS pull_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL REFERENCES repos (id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  author TEXT NOT NULL,
  base_ref TEXT NOT NULL,
  base_sha TEXT NOT NULL,
  head_sha TEXT NOT NULL,
  merge_base_sha TEXT NOT NULL,
  html_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  refreshed_at TEXT,
  UNIQUE (repo_id, number)
);

CREATE TABLE IF NOT EXISTS review_threads (
  id TEXT PRIMARY KEY,
  pull_request_id INTEGER NOT NULL REFERENCES pull_requests (id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  original_line INTEGER,
  original_start_line INTEGER,
  diff_side TEXT NOT NULL,
  is_resolved INTEGER NOT NULL,
  is_outdated INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS review_threads_pull_request_id
  ON review_threads (pull_request_id);

CREATE TABLE IF NOT EXISTS review_comments (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES review_threads (id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  diff_hunk TEXT NOT NULL,
  original_commit_sha TEXT NOT NULL,
  created_at TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS review_comments_thread_id
  ON review_comments (thread_id);
`;
