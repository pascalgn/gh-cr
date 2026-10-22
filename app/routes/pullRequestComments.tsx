import { Group, Stack, Text } from "@mantine/core";
import { Link, useSearchParams } from "react-router";
import type { ShouldRevalidateFunctionArgs } from "react-router";

import { Panel } from "../components/Panel";
import { ReviewThreadView } from "../components/ReviewThreadView";
import { ThreadBadges } from "../components/ThreadBadges";
import { ThreadFilters } from "../components/ThreadFilters";
import { threadLabel } from "../components/threadLabel";
import { anchorThreads } from "../server/anchorThreads";
import { getPullRequest } from "../server/db/getPullRequest";
import { listReviewThreads } from "../server/db/listReviewThreads";
import type { Route } from "./+types/pullRequestComments";

export async function loader({ params }: Route.LoaderArgs) {
  const number = Number(params.number);
  const pullRequest = Number.isInteger(number)
    ? getPullRequest(params.owner, params.repo, number)
    : null;
  if (pullRequest === null) {
    throw new Response("Pull request not tracked", { status: 404 });
  }
  const threads = listReviewThreads(pullRequest.id);
  const anchored = await anchorThreads(pullRequest, threads);
  // Only the anchored hunk is rendered here, so the full per-file diffs stay
  // on the server rather than being serialised once per thread.
  return {
    anchored: anchored.map(({ thread, anchor }) => ({ thread, anchor })),
  };
}

/**
 * Filters live in the URL but are applied in the browser, so toggling one must
 * not re-run the loader's git diffs.
 */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname && formMethod === undefined
    ? false
    : defaultShouldRevalidate;
}

export default function PullRequestComments({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { anchored } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const base = `/pr/${params.owner}/${params.repo}/${params.number}`;

  const showResolved = searchParams.get("resolved") !== "hide";
  const selectedAuthors = searchParams.getAll("author");

  const rootAuthor = (thread: (typeof anchored)[number]["thread"]) =>
    thread.comments[0]?.author ?? "";
  const authors = [...new Set(anchored.map(({ thread }) => rootAuthor(thread)))]
    .filter((author) => author !== "")
    .sort((a, b) => a.localeCompare(b));

  const visible = anchored.filter(
    ({ thread }) =>
      (showResolved || !thread.isResolved) &&
      (selectedAuthors.length === 0 ||
        selectedAuthors.includes(rootAuthor(thread))),
  );

  const applyFilters = (next: { showResolved: boolean; authors: string[] }) => {
    const params = new URLSearchParams();
    if (!next.showResolved) {
      params.set("resolved", "hide");
    }
    for (const author of next.authors) {
      params.append("author", author);
    }
    setSearchParams(params, { replace: true, preventScrollReset: true });
  };

  return (
    <Stack gap="md">
      <ThreadFilters
        authors={authors}
        selectedAuthors={selectedAuthors}
        showResolved={showResolved}
        shown={visible.length}
        total={anchored.length}
        onChange={applyFilters}
      />

      {anchored.length === 0 ? (
        <Text c="dimmed" size="sm">
          No review comments on this pull request yet.
        </Text>
      ) : visible.length === 0 ? (
        <Text c="dimmed" size="sm">
          No comments match the current filters.
        </Text>
      ) : (
        visible.map(({ thread, anchor }) => (
          <Panel
            key={thread.id}
            title={
              <Link
                to={`${base}/comments/${encodeURIComponent(thread.id)}`}
                className="panel-pathLink"
              >
                {threadLabel(thread)}
              </Link>
            }
            actions={
              <Group gap="xs">
                <ThreadBadges thread={thread} />
                <Text size="xs" c="dimmed">
                  {thread.comments.length}{" "}
                  {thread.comments.length === 1 ? "comment" : "comments"}
                </Text>
              </Group>
            }
          >
            <ReviewThreadView thread={thread} anchor={anchor} />
          </Panel>
        ))
      )}
    </Stack>
  );
}
