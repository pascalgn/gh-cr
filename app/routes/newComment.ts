import { data } from "react-router";

import { getPullRequest } from "../server/db/getPullRequest";
import { addReviewComment } from "../server/github/addReviewComment";
import { refreshPullRequest } from "../server/refreshPullRequest";
import type { Route } from "./+types/newComment";

export interface NewCommentResult {
  posted?: boolean;
  error?: string;
}

/**
 * Starts a new review thread on one line of one file. Afterwards the pull
 * request is re-synced: GitHub assigns the thread its own id, which replying
 * and resolving both need, and only a refresh brings that back.
 */
export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const body = String(formData.get("body") ?? "").trim();
  const path = String(formData.get("path") ?? "");
  const line = Number(formData.get("line"));
  if (body === "" || path === "" || !Number.isInteger(line)) {
    return data(
      {
        error: "A comment needs a body, a file and a line.",
      } satisfies NewCommentResult,
      { status: 400 },
    );
  }
  const number = Number(params.number);
  const pullRequest = Number.isInteger(number)
    ? getPullRequest(params.owner, params.repo, number)
    : null;
  if (pullRequest === null) {
    throw new Response("Pull request not tracked", { status: 404 });
  }
  try {
    await addReviewComment({
      owner: params.owner,
      repo: params.repo,
      number,
      commitSha: pullRequest.headSha,
      path,
      line,
      body,
    });
    await refreshPullRequest(params.owner, params.repo, number);
    return { posted: true } satisfies NewCommentResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown GitHub error.";
    return data({ error: message } satisfies NewCommentResult, { status: 502 });
  }
}
