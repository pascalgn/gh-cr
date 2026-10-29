import { git } from "./git";

/** One rename made by a commit, as git reported it. */
export interface Rename {
  from: string;
  to: string;
}

/**
 * Every rename made between two commits, oldest first.
 *
 * Deliberately per-commit rather than a single `diff --name-status -M` of the
 * endpoints: a file that is renamed and then heavily edited drifts below git's
 * similarity threshold, so the end-to-end diff reports a delete plus an add
 * and the trail is lost. Each individual rename is still obvious, so the
 * renames are collected commit by commit and chained together afterwards.
 */
export async function renamesBetween(
  dir: string,
  fromSha: string,
  toSha: string,
): Promise<Rename[]> {
  const stdout = await git(
    [
      "log",
      "--reverse",
      "--diff-filter=R",
      "-M",
      "-z",
      "--name-status",
      "--format=",
      `${fromSha}..${toSha}`,
    ],
    dir,
  ).catch(() => "");
  const fields = stdout.split("\0").filter((field) => field !== "");
  const renames: Rename[] = [];
  for (let index = 0; index + 2 < fields.length + 1; index += 3) {
    const [code, from, to] = fields.slice(index, index + 3);
    if (code?.startsWith("R") && from !== undefined && to !== undefined) {
      renames.push({ from, to });
    }
  }
  return renames;
}
