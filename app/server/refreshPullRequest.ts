import type { PullRequest } from "../types";
import { saveRefreshedPullRequest } from "./db/saveRefreshedPullRequest";
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
