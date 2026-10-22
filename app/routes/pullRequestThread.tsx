import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router";

import { DiffText } from "../components/DiffText";
import { Panel } from "../components/Panel";
import { ReviewThreadView } from "../components/ReviewThreadView";
import { ThreadBadges } from "../components/ThreadBadges";
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
  return anchored;
}

export default function PullRequestThread({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { thread, diff, anchor } = loaderData;
  const [isModalOpen, modal] = useDisclosure(false);
  const base = `/pr/${params.owner}/${params.repo}/${params.number}`;

  return (
    <Stack gap="md">
      <Link to={`${base}/comments`}>← All comments</Link>

      <Panel
        title={<span className="panel-pathLink">{threadLabel(thread)}</span>}
        actions={
          <Group gap="xs">
            <ThreadBadges thread={thread} />
            <Button variant="default" size="xs" onClick={modal.open}>
              View full file diff
            </Button>
          </Group>
        }
      >
        <ReviewThreadView thread={thread} anchor={anchor} />
      </Panel>

      <Modal
        opened={isModalOpen}
        onClose={modal.close}
        title={thread.path}
        size="90%"
      >
        {diff.trim() === "" ? (
          <Text c="dimmed" size="sm">
            This file is unchanged between the base and the head of this pull
            request.
          </Text>
        ) : (
          <DiffText diff={diff} />
        )}
      </Modal>
    </Stack>
  );
}
