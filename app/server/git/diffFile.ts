import { git } from "./git";

/** The raw unified diff of one path between two commits. */
export async function diffFile(
  dir: string,
  baseSha: string,
  headSha: string,
  path: string,
): Promise<string> {
  return git(["diff", "-U3", "-M", baseSha, headSha, "--", path], dir);
}
