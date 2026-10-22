import envPaths from "env-paths";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const paths = envPaths("gh-cr", { suffix: "" });

/** Root directory for all gh-cr state, e.g. ~/Library/Application Support/gh-cr. */
export const dataDir = paths.data;

/** Path of the sqlite database file. */
export const databaseFile = join(dataDir, "gh-cr.sqlite");

/** Directory holding one bare git repo per tracked GitHub repo. */
export const reposDir = join(dataDir, "repos");

/** Path of the bare git repo shared by all PRs of one GitHub repo. */
export function repoDir(owner: string, name: string): string {
  return join(reposDir, `${owner}__${name}.git`);
}

/** Creates the data directories if they do not exist yet. */
export function ensureDataDirs(): void {
  mkdirSync(reposDir, { recursive: true });
}
