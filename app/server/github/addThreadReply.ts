import { githubClient } from "./client";
import type { ReviewComment } from "../../types";

interface MutationResponse {
  addPullRequestReviewThreadReply: {
    comment: {
      id: string;
      author: { login: string } | null;
      body: string;
      diffHunk: string;
      originalCommit: { oid: string } | null;
      createdAt: string;
      url: string;
    } | null;
  };
}

const REPLY = `
  mutation AddThreadReply($threadId: ID!, $body: String!) {
    addPullRequestReviewThreadReply(
      input: { pullRequestReviewThreadId: $threadId, body: $body }
    ) {
      comment {
        id
        author { login }
        body
        diffHunk
        originalCommit { oid }
        createdAt
        url
      }
    }
  }
`;

/** Posts a reply to a review thread, returning the comment GitHub created. */
export async function addThreadReply(
  threadId: string,
  body: string,
): Promise<ReviewComment> {
  const response = await githubClient()<MutationResponse>(REPLY, {
    threadId,
    body,
  });
  const comment = response.addPullRequestReviewThreadReply.comment;
  if (comment === null) {
    throw new Error("GitHub accepted the reply but returned no comment.");
  }
  return {
    id: comment.id,
    threadId,
    author: comment.author?.login ?? "ghost",
    body: comment.body,
    diffHunk: comment.diffHunk,
    originalCommitSha: comment.originalCommit?.oid ?? "",
    createdAt: comment.createdAt,
    url: comment.url,
  };
}
