import {
  Anchor,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Form, NavLink, Outlet, useNavigation } from "react-router";

import { RelativeTime } from "../components/RelativeTime";
import { StateBadge } from "../components/StateBadge";
import { getPullRequest } from "../server/db/getPullRequest";
import { refreshPullRequest } from "../server/refreshPullRequest";
import type { Route } from "./+types/pullRequest";

import "./pullRequest.css";

export function loader({ params }: Route.LoaderArgs) {
  const number = Number(params.number);
  const pullRequest = Number.isInteger(number)
    ? getPullRequest(params.owner, params.repo, number)
    : null;
  if (pullRequest === null) {
    throw new Response("Pull request not tracked", { status: 404 });
  }
  return { pullRequest };
}

export async function action({ params }: Route.ActionArgs) {
  const number = Number(params.number);
  if (!Number.isInteger(number)) {
    throw new Response("Not a pull request number", { status: 400 });
  }
  await refreshPullRequest(params.owner, params.repo, number);
  return { ok: true };
}

export default function PullRequest({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { pullRequest } = loaderData;
  const navigation = useNavigation();
  const isRefreshing =
    navigation.state !== "idle" && navigation.formMethod === "POST";
  const base = `/pr/${params.owner}/${params.repo}/${params.number}`;

  return (
    <Container size="xl" py="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4}>
            <Title order={2}>{pullRequest.title}</Title>
            <Group gap="sm">
              <Anchor
                href={pullRequest.htmlUrl}
                target="_blank"
                rel="noreferrer"
                size="sm"
              >
                {pullRequest.owner}/{pullRequest.name}#{pullRequest.number}
              </Anchor>
              <StateBadge state={pullRequest.state} />
              <Text size="sm" c="dimmed">
                by {pullRequest.author}
              </Text>
              <Text size="sm" c="dimmed">
                refreshed <RelativeTime value={pullRequest.refreshedAt} />
              </Text>
            </Group>
          </Stack>
          <Form method="post">
            <Button type="submit" variant="default" loading={isRefreshing}>
              Refresh
            </Button>
          </Form>
        </Group>

        <nav className="prTabs">
          <NavLink to={base} end className="prTabs-link">
            Diff
          </NavLink>
          <NavLink to={`${base}/comments`} className="prTabs-link">
            Comments
          </NavLink>
        </nav>

        <Outlet />
      </Stack>
    </Container>
  );
}
