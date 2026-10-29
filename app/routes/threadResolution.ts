import { data } from "react-router";

import { setReviewThreadResolved } from "../server/db/setReviewThreadResolved";
import { setThreadResolution } from "../server/github/setThreadResolution";
import type { Route } from "./+types/threadResolution";

export interface ThreadResolutionResult {
  isResolved?: boolean;
  error?: string;
}

/**
 * Resolves or unresolves one review thread. Writes go straight to GitHub, then
 * the local copy is updated so the page reflects the change without a refresh.
 */
export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const resolved = formData.get("resolved") === "true";
  try {
    const isResolved = await setThreadResolution(params.threadId, resolved);
    setReviewThreadResolved(params.threadId, isResolved);
    return { isResolved } satisfies ThreadResolutionResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown GitHub error.";
    return data({ error: message } satisfies ThreadResolutionResult, {
      status: 502,
    });
  }
}
