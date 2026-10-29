import { diffFile } from "./diffFile";
import { mergeBase } from "./mergeBase";

/**
 * The diff of one file as it stood at a given commit of the pull request,
 * against where that commit forked from the base. This is what the author saw
 * when they wrote a comment on it.
 */
export async function diffFileAtCommit(
  dir: string,
  baseSha: string,
  commitSha: string,
  path: string,
): Promise<string> {
  const forkPoint = await mergeBase(dir, baseSha, commitSha).catch(() => "");
  return forkPoint === ""
    ? ""
    : diffFile(dir, forkPoint, commitSha, path).catch(() => "");
}
