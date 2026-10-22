import type { PullRequest } from "../../types";
import { getDatabase } from "./connection";
import { pullRequestColumns, toPullRequest } from "./rows";
import type { PullRequestRow } from "./rows";

/** All tracked pull requests, most recently updated first. */
export function listPullRequests(): PullRequest[] {
  const rows = getDatabase()
    .prepare(
      `SELECT ${pullRequestColumns}
       FROM pull_requests pr
       JOIN repos r ON r.id = pr.repo_id
       ORDER BY pr.updated_at DESC`,
    )
    .all() as PullRequestRow[];
  return rows.map(toPullRequest);
}
