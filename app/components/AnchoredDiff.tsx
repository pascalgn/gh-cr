import { Button, Group, Loader, Text } from "@mantine/core";
import { useState } from "react";
import { useFetcher, useParams } from "react-router";

import { CommentableDiff } from "./CommentableDiff";
import { FileDiffButton } from "./FileDiffButton";
import type { AnchorResult, AnchorStatus, LineRange } from "../types";

/** Lines shown either side of a match that could not be corroborated. */
const UNCONFIRMED_CONTEXT = 10;

const MISSING_MESSAGE: Partial<Record<AnchorStatus, string>> = {
  "not-in-diff": "This code is no longer part of the diff.",
  "file-not-in-diff": "This file is unchanged in the current diff.",
};

interface AnchoredDiffProps {
  anchor: AnchorResult;
  /** The file this thread is on, for the wider views of it. */
  path: string;
}

/**
 * The slice of the current diff a comment was anchored to, with that file's
 * whole diff one toggle away and the complete file one click further.
 */
export function AnchoredDiff({ anchor, path }: AnchoredDiffProps) {
  const [showFull, setShowFull] = useState(false);
  const fetcher = useFetcher<{ diff: string }>();
  const { owner, repo, number } = useParams();

  const toggle = () => {
    if (fetcher.data === undefined && fetcher.state === "idle") {
      fetcher.load(
        `/pr/${owner}/${repo}/${number}/file-diff?path=${encodeURIComponent(path)}`,
      );
    }
    setShowFull(!showFull);
  };

  // A corroborated match is trimmed to the section, ending at the matched
  // line just as the original does. An uncorroborated one still centres on
  // the match, but with room either side: we are less sure which line is
  // meant, so the surrounding code is the evidence. Showing the whole hunk
  // instead is no kindness when the hunk is an entire new file — the reader
  // just gets the top of the file and has to go hunting.
  const section: LineRange | null =
    anchor.line === null
      ? null
      : anchor.confirmed
        ? {
            side: anchor.side,
            startLine: anchor.startLine ?? anchor.line,
            endLine: anchor.line,
          }
        : {
            side: anchor.side,
            startLine: Math.max(1, anchor.line - UNCONFIRMED_CONTEXT),
            endLine: anchor.line + UNCONFIRMED_CONTEXT,
          };

  return anchor.hunk === null ? (
    <Group gap="sm" p="sm" wrap="wrap">
      <Text c="dimmed" size="sm">
        {MISSING_MESSAGE[anchor.status] ??
          "The current diff for this comment could not be located."}
      </Text>
      {/* "file-not-in-diff" means there is no diff at all, so offer nothing. */}
      {anchor.status === "file-not-in-diff" ? null : (
        <FileDiffButton path={path} label="Show full file diff" />
      )}
    </Group>
  ) : (
    <>
      {anchor.line === null ? null : (
        <Text c="dimmed" size="xs" px="sm" pt="sm">
          {anchor.via === "content"
            ? `Matched by content at line ${anchor.line}.`
            : `This code was rewritten; placed at line ${anchor.line} by following the file's changes.`}
        </Text>
      )}
      {showFull && fetcher.data === undefined ? (
        <Group p="sm">
          <Loader size="xs" />
        </Group>
      ) : (
        <CommentableDiff
          diff={showFull ? (fetcher.data?.diff ?? "") : anchor.hunk.text}
          window={showFull ? null : section}
          path={path}
        />
      )}
      <Group gap="xs" p="xs">
        <Button variant="subtle" size="xs" onClick={toggle}>
          {showFull ? "Show less" : "Show full diff"}
        </Button>
        <FileDiffButton
          path={path}
          label="Show full file diff"
          variant="subtle"
        />
      </Group>
    </>
  );
}
