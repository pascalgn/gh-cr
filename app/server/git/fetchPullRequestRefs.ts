import { githubToken } from "../github/githubToken";
import { git } from "./git";

/** Fetches a PR's head and base into `refs/gh-cr/<number>/{head,base}` of the bare repo. */
export async function fetchPullRequestRefs(
  dir: string,
  owner: string,
  name: string,
  number: number,
  baseRef: string,
): Promise<void> {
  // The token travels in a one-off URL argument and is never stored as a remote.
  const url = `https://x-access-token:${githubToken()}@github.com/${owner}/${name}.git`;
  await git(
    [
      "fetch",
      "--force",
      "--quiet",
      url,
      `+refs/pull/${number}/head:refs/gh-cr/${number}/head`,
      `+refs/heads/${baseRef}:refs/gh-cr/${number}/base`,
    ],
    dir,
  );
}
