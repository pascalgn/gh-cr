import { githubToken } from "./githubToken";

export interface AddReviewCommentInput {
  owner: string;
  repo: string;
  number: number;
  /** Commit the comment is anchored to: the pull request's current head. */
  commitSha: string;
  path: string;
  /** Line in the file at that commit. */
  line: number;
  body: string;
}

/**
 * Starts a new review thread on one line.
 *
 * This is the REST endpoint rather than GraphQL: the GraphQL mutation for
 * review threads hangs off a review, and we deliberately post standalone
 * comments rather than opening a pending review.
 */
export async function addReviewComment(
  input: AddReviewCommentInput,
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${input.owner}/${input.repo}/pulls/${input.number}/comments`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `token ${githubToken()}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({
        body: input.body,
        commit_id: input.commitSha,
        path: input.path,
        line: input.line,
        side: "RIGHT",
      }),
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `GitHub rejected the comment (${response.status}): ${summarise(detail)}`,
    );
  }
}

/** The message out of a GitHub error body, falling back to the raw text. */
function summarise(body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      message?: string;
      errors?: { message?: string }[];
    };
    const errors = (parsed.errors ?? [])
      .map((error) => error.message)
      .filter((message): message is string => message !== undefined);
    return [parsed.message, ...errors].filter(Boolean).join(" — ");
  } catch {
    return body.slice(0, 200);
  }
}
