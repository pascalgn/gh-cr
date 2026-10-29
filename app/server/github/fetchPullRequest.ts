import type { DiffSide, PullRequestState } from "../../types";
import { githubClient } from "./client";

/** One review comment as GitHub returns it. */
export interface FetchedReviewComment {
  id: string;
  author: string;
  body: string;
  diffHunk: string;
  originalCommitSha: string;
  createdAt: string;
  url: string;
}

/** One review thread as GitHub returns it, with its comments. */
export interface FetchedReviewThread {
  id: string;
  path: string;
  originalLine: number | null;
  originalStartLine: number | null;
  diffSide: DiffSide;
  isResolved: boolean;
  isOutdated: boolean;
  comments: FetchedReviewComment[];
}

/** A pull request's current state on GitHub, as one refresh sees it. */
export interface FetchedPullRequest {
  number: number;
  title: string;
  state: PullRequestState;
  author: string;
  baseRef: string;
  baseSha: string;
  headSha: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  threads: FetchedReviewThread[];
}

interface GraphqlAuthor {
  login: string;
}

interface GraphqlResponse {
  repository: {
    pullRequest: {
      number: number;
      title: string;
      state: PullRequestState;
      author: GraphqlAuthor | null;
      baseRefName: string;
      baseRefOid: string;
      headRefOid: string;
      url: string;
      createdAt: string;
      updatedAt: string;
      reviewThreads: {
        nodes: {
          id: string;
          isResolved: boolean;
          isOutdated: boolean;
          path: string;
          originalLine: number | null;
          originalStartLine: number | null;
          diffSide: DiffSide;
          comments: {
            nodes: {
              id: string;
              author: GraphqlAuthor | null;
              body: string;
              diffHunk: string;
              originalCommit: { oid: string } | null;
              createdAt: string;
              url: string;
            }[];
          };
        }[];
      };
    } | null;
  } | null;
}

// v1 does not paginate: the first 100 threads and the first 50 comments per thread
// are all we fetch. Large PRs will be truncated until pagination is added.
const query = `
  query PullRequest($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        number
        title
        state
        author { login }
        baseRefName
        baseRefOid
        headRefOid
        url
        createdAt
        updatedAt
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            isOutdated
            path
            originalLine
            originalStartLine
            diffSide
            comments(first: 50) {
              nodes {
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
        }
      }
    }
  }
`;

/** Fetches a pull request and its review threads from the GitHub GraphQL API. */
export async function fetchPullRequest(
  owner: string,
  repo: string,
  number: number,
): Promise<FetchedPullRequest> {
  const response = await githubClient()<GraphqlResponse>(query, {
    owner,
    repo,
    number,
  });
  const pullRequest = response.repository?.pullRequest;
  if (pullRequest === null || pullRequest === undefined) {
    throw new Error(`No such pull request: ${owner}/${repo}#${number}`);
  }
  return {
    number: pullRequest.number,
    title: pullRequest.title,
    state: pullRequest.state,
    author: login(pullRequest.author),
    baseRef: pullRequest.baseRefName,
    baseSha: pullRequest.baseRefOid,
    headSha: pullRequest.headRefOid,
    htmlUrl: pullRequest.url,
    createdAt: pullRequest.createdAt,
    updatedAt: pullRequest.updatedAt,
    threads: pullRequest.reviewThreads.nodes.map((thread) => ({
      id: thread.id,
      path: thread.path,
      originalLine: thread.originalLine,
      originalStartLine: thread.originalStartLine,
      diffSide: thread.diffSide,
      isResolved: thread.isResolved,
      isOutdated: thread.isOutdated,
      comments: thread.comments.nodes.map((comment) => ({
        id: comment.id,
        author: login(comment.author),
        body: comment.body,
        diffHunk: comment.diffHunk,
        originalCommitSha: comment.originalCommit?.oid ?? "",
        createdAt: comment.createdAt,
        url: comment.url,
      })),
    })),
  };
}

function login(author: GraphqlAuthor | null): string {
  return author?.login ?? "ghost";
}
