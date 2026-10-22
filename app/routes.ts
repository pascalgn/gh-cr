import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("pr/:owner/:repo/:number", "routes/pullRequest.tsx", [
    index("routes/pullRequestDiff.tsx"),
    route("comments", "routes/pullRequestComments.tsx"),
    route("comments/:threadId", "routes/pullRequestThread.tsx"),
  ]),
] satisfies RouteConfig;
