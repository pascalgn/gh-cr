import type { PullRequest } from "../../types";
import { getDatabase } from "./connection";
import { pullRequestColumns, toPullRequest } from "./rows";
import type { PullRequestRow } from "./rows";

/** The tracked pull request with this owner/repo/number, or null when untracked. */
export function getPullRequest(
  owner: string,
  repo: string,
  number: number,
): PullRequest | null {
  const row = getDatabase()
    .prepare(
      `SELECT ${pullRequestColumns}
       FROM pull_requests pr
       JOIN repos r ON r.id = pr.repo_id
       WHERE r.owner = ? AND r.name = ? AND pr.number = ?`,
    )
    .get(owner, repo, number) as PullRequestRow | undefined;
  return row === undefined ? null : toPullRequest(row);
}
