import type { PullRequest } from "../types";
import { saveRefreshedPullRequest } from "./db/saveRefreshedPullRequest";
import { ensureCommits } from "./git/ensureCommits";
import { ensureRepo } from "./git/ensureRepo";
import { fetchPullRequestRefs } from "./git/fetchPullRequestRefs";
import { git } from "./git/git";
import { mergeBase } from "./git/mergeBase";
import { fetchPullRequest } from "./github/fetchPullRequest";

/** Syncs one pull request from GitHub into the local database and bare repo. */
export async function refreshPullRequest(
  owner: string,
  repo: string,
  number: number,
): Promise<PullRequest> {
  const fetched = await fetchPullRequest(owner, repo, number);
  const dir = await ensureRepo(owner, repo);
  await fetchPullRequestRefs(dir, owner, repo, number, fetched.baseRef);
  const headSha = await revParse(dir, `refs/gh-cr/${number}/head`);
  const baseSha = await revParse(dir, `refs/gh-cr/${number}/base`);
  const mergeBaseSha = await mergeBase(dir, baseSha, headSha);
  // Fetch the commits the comments were written on while we are on the network,
  // so that rebuilding their original diffs later stays a local operation.
  await ensureCommits(
    dir,
    owner,
    repo,
    fetched.threads.flatMap((thread) =>
      thread.comments.map((comment) => comment.originalCommitSha),
    ),
  );
  return saveRefreshedPullRequest({
    owner,
    name: repo,
    number: fetched.number,
    title: fetched.title,
    state: fetched.state,
    author: fetched.author,
    baseRef: fetched.baseRef,
    baseSha,
    headSha,
    mergeBaseSha,
    htmlUrl: fetched.htmlUrl,
    createdAt: fetched.createdAt,
    updatedAt: fetched.updatedAt,
    threads: fetched.threads,
  });
}

async function revParse(dir: string, ref: string): Promise<string> {
  const stdout = await git(["rev-parse", ref], dir);
  return stdout.trim();
}
