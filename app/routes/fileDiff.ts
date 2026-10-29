import { getPullRequest } from "../server/db/getPullRequest";
import { diffFile, WHOLE_FILE_CONTEXT } from "../server/git/diffFile";
import { ensureRepo } from "../server/git/ensureRepo";
import type { Route } from "./+types/fileDiff";

/**
 * The full base...head diff of one file, loaded on demand so the comment list
 * does not have to ship every file's diff up front.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  // "whole" is the complete file with nothing elided; without it, an ordinary
  // diff of that file — every hunk, but only the usual context around them.
  const whole = url.searchParams.get("whole") === "1";
  if (path === null || path === "") {
    throw new Response("Missing path", { status: 400 });
  }
  const number = Number(params.number);
  const pullRequest = Number.isInteger(number)
    ? getPullRequest(params.owner, params.repo, number)
    : null;
  if (pullRequest === null) {
    throw new Response("Pull request not tracked", { status: 404 });
  }
  const dir = await ensureRepo(pullRequest.owner, pullRequest.name);
  return {
    diff: await diffFile(
      dir,
      pullRequest.mergeBaseSha,
      pullRequest.headSha,
      path,
      whole ? WHOLE_FILE_CONTEXT : undefined,
    ),
  };
}
