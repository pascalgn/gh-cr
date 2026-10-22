import {
  Alert,
  Button,
  Container,
  Group,
  Stack,
  Table,
  Text,
  Title,
  TextInput,
} from "@mantine/core";
import { Form, Link, data, redirect, useNavigation } from "react-router";

import { Panel } from "../components/Panel";
import { RelativeTime } from "../components/RelativeTime";
import { StateBadge } from "../components/StateBadge";
import { listPullRequests } from "../server/db/listPullRequests";
import { parsePullRequestInput } from "../server/parsePullRequestInput";
import { refreshPullRequest } from "../server/refreshPullRequest";
import type { Route } from "./+types/home";

export function meta() {
  return [{ title: "gh-cr" }];
}

export function loader() {
  return { pullRequests: listPullRequests() };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const input = String(formData.get("url") ?? "").trim();
  const target = parsePullRequestInput(input);
  if (target === null) {
    return data(
      {
        error:
          "Expected https://github.com/owner/repo/pull/123 or owner/repo#123.",
      },
      { status: 400 },
    );
  }
  await refreshPullRequest(target.owner, target.repo, target.number);
  return redirect(`/pr/${target.owner}/${target.repo}/${target.number}`);
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isTracking =
    navigation.state !== "idle" && navigation.formMethod === "POST";

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1}>gh-cr</Title>

        <Panel title="Track a pull request">
          <Form method="post">
            <Stack gap="sm">
              <Group align="flex-end" gap="sm" wrap="nowrap">
                <TextInput
                  name="url"
                  label="Pull request"
                  placeholder="https://github.com/owner/repo/pull/123 or owner/repo#123"
                  style={{ flex: 1 }}
                  required
                />
                <Button type="submit" loading={isTracking}>
                  Track
                </Button>
              </Group>
              {actionData === undefined ? null : (
                <Alert color="red" title="Could not track that">
                  {actionData.error}
                </Alert>
              )}
            </Stack>
          </Form>
        </Panel>

        <Panel title="Tracked pull requests">
          {loaderData.pullRequests.length === 0 ? (
            <Text c="dimmed" size="sm">
              Nothing tracked yet. Paste a pull request URL above to get
              started.
            </Text>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Pull request</Table.Th>
                  <Table.Th>State</Table.Th>
                  <Table.Th>Last refreshed</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loaderData.pullRequests.map((pullRequest) => (
                  <Table.Tr key={pullRequest.id}>
                    <Table.Td>
                      <Link
                        to={`/pr/${pullRequest.owner}/${pullRequest.name}/${pullRequest.number}`}
                      >
                        {pullRequest.title}
                      </Link>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {pullRequest.owner}/{pullRequest.name}#
                        {pullRequest.number}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <StateBadge state={pullRequest.state} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        <RelativeTime value={pullRequest.refreshedAt} />
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Panel>
      </Stack>
    </Container>
  );
}
