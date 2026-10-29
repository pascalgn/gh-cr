import { githubClient } from "./client";

interface MutationResponse {
  resolveReviewThread?: { thread: { id: string; isResolved: boolean } | null };
  unresolveReviewThread?: {
    thread: { id: string; isResolved: boolean } | null;
  };
}

const RESOLVE = `
  mutation ResolveReviewThread($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
`;

const UNRESOLVE = `
  mutation UnresolveReviewThread($threadId: ID!) {
    unresolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
`;

/**
 * Resolves or unresolves a review thread on GitHub, returning the state GitHub
 * reports afterwards. Resolving needs write access to the repository.
 */
export async function setThreadResolution(
  threadId: string,
  resolved: boolean,
): Promise<boolean> {
  const response = await githubClient()<MutationResponse>(
    resolved ? RESOLVE : UNRESOLVE,
    { threadId },
  );
  const thread =
    response.resolveReviewThread?.thread ??
    response.unresolveReviewThread?.thread;
  return thread === null || thread === undefined ? resolved : thread.isResolved;
}
