import { execFileSync } from "node:child_process";

let token: string | null = null;

/** The GitHub token, from `GITHUB_TOKEN` or else from `gh auth token`. */
export function githubToken(): string {
  if (token === null) {
    const fromEnvironment = process.env.GITHUB_TOKEN?.trim();
    token =
      fromEnvironment !== undefined && fromEnvironment !== ""
        ? fromEnvironment
        : tokenFromGhCli();
  }
  return token;
}

function tokenFromGhCli(): string {
  let output: string;
  try {
    output = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "No GitHub token available: set GITHUB_TOKEN or run `gh auth login`.",
    );
  }
  const trimmed = output.trim();
  if (trimmed === "") {
    throw new Error(
      "No GitHub token available: `gh auth token` returned nothing, set GITHUB_TOKEN or run `gh auth login`.",
    );
  }
  return trimmed;
}
