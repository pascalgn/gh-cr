import { Stack, Text } from "@mantine/core";

import { DiffText } from "./DiffText";
import type { AnchorResult, AnchorStatus, LineRange } from "../types";

const MISSING_MESSAGE: Partial<Record<AnchorStatus, string>> = {
  "not-in-diff": "This code is no longer part of the diff.",
  "file-not-in-diff": "This file is unchanged in the current diff.",
};

interface AnchoredDiffProps {
  anchor: AnchorResult;
  /** Lines to mark as the commented range within the anchored hunk. */
  highlight?: LineRange | null;
}

/** Renders the slice of the current diff a comment was anchored to. */
export function AnchoredDiff({ anchor, highlight }: AnchoredDiffProps) {
  return anchor.hunk === null ? (
    <Text c="dimmed" size="sm" p="sm">
      {MISSING_MESSAGE[anchor.status] ??
        "The current diff for this comment could not be located."}
    </Text>
  ) : (
    <Stack gap={0}>
      {anchor.status === "relocated" ? (
        <Text c="dimmed" size="xs" px="sm" pt="sm">
          This thread is outdated; the chunk below was matched by content
          {anchor.line === null ? "" : ` at line ${anchor.line}`}.
        </Text>
      ) : null}
      <DiffText diff={anchor.hunk.text} highlight={highlight} />
    </Stack>
  );
}
