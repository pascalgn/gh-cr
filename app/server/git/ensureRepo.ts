import { existsSync, mkdirSync } from "node:fs";
import { ensureDataDirs, repoDir } from "../paths";
import { git } from "./git";

/** Returns the bare repo directory for a GitHub repo, creating it when missing. */
export async function ensureRepo(owner: string, name: string): Promise<string> {
  ensureDataDirs();
  const dir = repoDir(owner, name);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    await git(["init", "--bare", "--quiet", dir]);
  }
  return dir;
}
