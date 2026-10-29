import { Button, Group, Text } from "@mantine/core";
import { useFetcher } from "react-router";

import type { ThreadResolutionResult } from "../routes/threadResolution";
import type { ReviewThread } from "../types";

/** Resolves or unresolves a thread on GitHub, reflecting the pending state. */
export function ThreadResolveButton({ thread }: { thread: ReviewThread }) {
  const fetcher = useFetcher<ThreadResolutionResult>();
  const submitting = fetcher.state !== "idle";
  // While in flight, show the state we are moving to rather than the stale one.
  const target = submitting
    ? fetcher.formData?.get("resolved") === "true"
    : !thread.isResolved;

  return (
    <Group gap="xs" wrap="nowrap">
      {fetcher.data?.error === undefined ? null : (
        <Text size="xs" c="red" title={fetcher.data.error}>
          Failed
        </Text>
      )}
      <fetcher.Form
        method="post"
        action={`/threads/${encodeURIComponent(thread.id)}/resolution`}
      >
        <input type="hidden" name="resolved" value={String(target)} />
        <Button type="submit" size="xs" variant="default" loading={submitting}>
          {target === true ? "Resolve" : "Unresolve"}
        </Button>
      </fetcher.Form>
    </Group>
  );
}
