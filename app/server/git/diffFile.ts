import { git } from "./git";

/** Context lines git shows around a change by default. */
const DEFAULT_CONTEXT = 3;

/**
 * Context lines that make `git diff` emit the file whole, rather than hunks
 * with the unchanged stretches elided.
 */
export const WHOLE_FILE_CONTEXT = 1_000_000;

/** The raw unified diff of one path between two commits. */
export async function diffFile(
  dir: string,
  baseSha: string,
  headSha: string,
  path: string,
  context: number = DEFAULT_CONTEXT,
): Promise<string> {
  return git(["diff", `-U${context}`, "-M", baseSha, headSha, "--", path], dir);
}
