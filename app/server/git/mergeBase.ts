import { git } from "./git";

/** The best common ancestor of two commits. */
export async function mergeBase(
  dir: string,
  a: string,
  b: string,
): Promise<string> {
  const stdout = await git(["merge-base", a, b], dir);
  return stdout.trim();
}
