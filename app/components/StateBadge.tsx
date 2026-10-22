import { Badge } from "@mantine/core";

import type { PullRequestState } from "../types";

interface StateBadgeProps {
  state: PullRequestState;
}

const COLOR: Record<PullRequestState, string> = {
  OPEN: "green",
  MERGED: "violet",
  CLOSED: "red",
};

/** The open/merged/closed state of a pull request. */
export function StateBadge({ state }: StateBadgeProps) {
  return (
    <Badge color={COLOR[state]} variant="light">
      {state.toLowerCase()}
    </Badge>
  );
}
