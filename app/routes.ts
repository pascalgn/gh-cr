import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("threads/:threadId/resolution", "routes/threadResolution.ts"),
  route("threads/:threadId/reply", "routes/threadReply.ts"),
  route("pr/:owner/:repo/:number", "routes/pullRequest.tsx", [
    index("routes/pullRequestDiff.tsx"),
    route("comments", "routes/pullRequestComments.tsx"),
    route("comments/:threadId", "routes/pullRequestThread.tsx"),
    route("file-diff", "routes/fileDiff.ts"),
    route("new-comment", "routes/newComment.ts"),
  ]),
] satisfies RouteConfig;
