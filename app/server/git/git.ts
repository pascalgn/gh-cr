import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** 64 MiB — large enough for the diff of a sizeable file. */
const maxBuffer = 64 * 1024 * 1024;

/** Matches anything that looks like a GitHub token or a URL carrying credentials. */
const secretPattern =
  /(https?:\/\/)[^@\s/]*:?[^@\s/]*@|gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+/g;

/** Replaces anything token-shaped with a placeholder, so it never reaches an error message. */
function redactSecrets(text: string): string {
  return text.replace(secretPattern, (match, scheme: string | undefined) => {
    return scheme === undefined ? "***" : `${scheme}***@`;
  });
}

/** Runs `git` with these arguments and returns its stdout. */
export async function git(args: string[], cwd?: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, maxBuffer });
    return stdout;
  } catch (error) {
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error
        ? String((error as { stderr: unknown }).stderr)
        : "";
    throw new Error(
      redactSecrets(
        `git ${args.join(" ")} failed${cwd === undefined ? "" : ` in ${cwd}`}: ${stderr.trim() || String(error)}`,
      ),
    );
  }
}
