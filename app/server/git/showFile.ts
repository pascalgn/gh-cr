import { git } from "./git";

const missingPattern =
  /does not exist|exists on disk, but not in|no such path/i;

/** The contents of a path at a commit, or null when the path is not there. */
export async function showFile(
  dir: string,
  sha: string,
  path: string,
): Promise<string | null> {
  try {
    return await git(["show", `${sha}:${path}`], dir);
  } catch (error) {
    if (error instanceof Error && missingPattern.test(error.message)) {
      return null;
    }
    throw error;
  }
}
