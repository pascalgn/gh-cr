import { git } from "./git";

/**
 * The diff between one file at one commit and another file at another commit.
 * Used to line up a file's old and new versions when a comment's code was
 * rewritten rather than moved.
 */
export async function diffBlobs(
  dir: string,
  fromSha: string,
  fromPath: string,
  toSha: string,
  toPath: string,
): Promise<string> {
  return git(
    ["diff", `${fromSha}:${fromPath}`, `${toSha}:${toPath}`],
    dir,
  ).catch(() => "");
}
