import { githubToken } from "../github/githubToken";
import { git } from "./git";

/** Where a commit fetched by sha is pinned, so a later gc cannot drop it. */
function commitRef(sha: string): string {
  return `refs/gh-cr/commits/${sha}`;
}

async function hasCommit(dir: string, sha: string): Promise<boolean> {
  return git(["cat-file", "-e", `${sha}^{commit}`], dir).then(
    () => true,
    () => false,
  );
}

/**
 * Makes sure every given commit is present locally AND pinned by a ref.
 *
 * A commit a force-push orphaned is unreachable from any ref, so it is both
 * absent from a fresh clone and prunable by gc once fetched. GitHub still
 * serves such a commit when asked for by full sha, which is what lets us
 * rebuild the diff a comment was written against; the ref keeps it around.
 */
export async function ensureCommits(
  dir: string,
  owner: string,
  name: string,
  shas: string[],
): Promise<void> {
  const wanted = [...new Set(shas.filter((sha) => sha !== ""))];
  const url = `https://x-access-token:${githubToken()}@github.com/${owner}/${name}.git`;

  for (const sha of wanted) {
    if (await hasCommit(dir, commitRef(sha))) {
      continue;
    }
    // Present already (an ordinary ancestor of head, say): just pin it. A
    // commit GitHub has since dropped simply fails, and the caller falls back
    // to the fragment GitHub captured on the comment.
    await (
      (await hasCommit(dir, sha))
        ? git(["update-ref", commitRef(sha), sha], dir)
        : git(
            ["fetch", "--no-tags", "--force", url, `${sha}:${commitRef(sha)}`],
            dir,
          )
    ).catch(() => "");
  }
}
