import { data } from "react-router";

import { insertReviewComment } from "../server/db/insertReviewComment";
import { addThreadReply } from "../server/github/addThreadReply";
import type { Route } from "./+types/threadReply";

export interface ThreadReplyResult {
  posted?: boolean;
  error?: string;
}

/**
 * Replies to one review thread. The reply goes straight to GitHub, and the
 * comment it returns is stored locally so the page shows it immediately.
 */
export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const body = String(formData.get("body") ?? "").trim();
  if (body === "") {
    return data(
      { error: "A reply cannot be empty." } satisfies ThreadReplyResult,
      { status: 400 },
    );
  }
  try {
    insertReviewComment(await addThreadReply(params.threadId, body));
    return { posted: true } satisfies ThreadReplyResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown GitHub error.";
    return data({ error: message } satisfies ThreadReplyResult, {
      status: 502,
    });
  }
}
