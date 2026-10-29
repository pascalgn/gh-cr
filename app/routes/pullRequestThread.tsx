import { Group, Stack } from "@mantine/core";
import { Link } from "react-router";

import { FileDiffButton } from "../components/FileDiffButton";
import { Panel } from "../components/Panel";
import { ReviewThreadView } from "../components/ReviewThreadView";
import { ThreadBadges } from "../components/ThreadBadges";
import { ThreadResolveButton } from "../components/ThreadResolveButton";
import { threadLabel } from "../components/threadLabel";
import { anchorThreads } from "../server/anchorThreads";
import { getPullRequest } from "../server/db/getPullRequest";
import { getReviewThread } from "../server/db/getReviewThread";
import type { Route } from "./+types/pullRequestThread";

export async function loader({ params }: Route.LoaderArgs) {
  const number = Number(params.number);
  const pullRequest = Number.isInteger(number)
    ? getPullRequest(params.owner, params.repo, number)
    : null;
  if (pullRequest === null) {
    throw new Response("Pull request not tracked", { status: 404 });
  }
  const thread = getReviewThread(params.threadId);
  if (thread === null) {
    throw new Response("Review thread not found", { status: 404 });
  }
  const [anchored] = await anchorThreads(pullRequest, [thread]);
  // The full file diff is fetched on demand by FileDiffButton instead.
  return {
    thread: anchored.thread,
    anchor: anchored.anchor,
    originalDiff: anchored.originalDiff,
    currentPath: anchored.currentPath,
    headSha: pullRequest.headSha,
  };
}

export default function PullRequestThread({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { thread, anchor, originalDiff, currentPath, headSha } = loaderData;
  const base = `/pr/${params.owner}/${params.repo}/${params.number}`;

  return (
    <Stack gap="md">
      <Link to={`${base}/comments`}>← All comments</Link>

      <Panel
        title={<span className="panel-pathLink">{threadLabel(thread)}</span>}
        actions={
          <Group gap="xs">
            <ThreadBadges thread={thread} />
            <ThreadResolveButton thread={thread} />
            <FileDiffButton path={currentPath} />
          </Group>
        }
      >
        <ReviewThreadView
          thread={thread}
          anchor={anchor}
          originalDiff={originalDiff}
          currentPath={currentPath}
          headSha={headSha}
        />
      </Panel>
    </Stack>
  );
}
