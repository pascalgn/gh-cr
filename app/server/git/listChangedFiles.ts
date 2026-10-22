import type { ChangedFile, FileChangeStatus } from "../../types";
import { git } from "./git";

/** The files that differ between two commits, with rename detection. */
export async function listChangedFiles(
  dir: string,
  baseSha: string,
  headSha: string,
): Promise<ChangedFile[]> {
  const stdout = await git(
    ["diff", "--name-status", "-M", "-z", baseSha, headSha],
    dir,
  );
  const fields = stdout.split("\0").filter((field) => field !== "");
  const files: ChangedFile[] = [];
  let index = 0;
  while (index < fields.length) {
    const code = fields[index];
    index += 1;
    // Renames and copies are reported as `R100`/`C75` followed by two paths.
    const isTwoPath = code.startsWith("R") || code.startsWith("C");
    const first = fields[index];
    index += 1;
    const second = isTwoPath ? fields[index] : undefined;
    if (isTwoPath) {
      index += 1;
    }
    if (first === undefined) {
      break;
    }
    files.push(
      isTwoPath && second !== undefined
        ? {
            path: second,
            previousPath: code.startsWith("R") ? first : null,
            status: code.startsWith("R") ? "renamed" : "added",
          }
        : { path: first, previousPath: null, status: statusOf(code) },
    );
  }
  return files;
}

function statusOf(code: string): FileChangeStatus {
  return code.startsWith("A")
    ? "added"
    : code.startsWith("D")
      ? "removed"
      : "modified";
}
