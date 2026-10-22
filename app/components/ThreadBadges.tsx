import { Badge } from "@mantine/core";

import type { ReviewThread } from "../types";

/** The resolved/outdated state and diff side of a review thread. */
export function ThreadBadges({ thread }: { thread: ReviewThread }) {
  return (
    <>
      {thread.diffSide === "LEFT" ? (
        <Badge
          color="orange"
          variant="light"
          size="sm"
          title="This thread is on the old (deleted) side of the diff."
        >
          old side
        </Badge>
      ) : null}
      {thread.isResolved ? (
        <Badge color="violet" variant="light" size="sm">
          resolved
        </Badge>
      ) : null}
      {thread.isOutdated ? (
        <Badge color="gray" variant="light" size="sm">
          outdated
        </Badge>
      ) : null}
    </>
  );
}
