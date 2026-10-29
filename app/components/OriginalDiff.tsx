import { Button, Group, Text } from "@mantine/core";
import { useState } from "react";

import { DiffText } from "./DiffText";
import { diffRows, windowRows } from "../diffRows";
import { FileDiffButton } from "./FileDiffButton";
import type { LineRange } from "../types";

interface OriginalDiffProps {
  /**
   * The file's real diff at the commit the comment was written on, rebuilt from
   * the local repo. Empty when that commit could not be obtained.
   */
  originalDiff: string;
  /** GitHub's captured fragment, used only when the real diff is unavailable. */
  diffHunk: string;
  /** The lines the comment is about, or null when GitHub reported no position. */
  range: LineRange | null;
  /** The file the thread is on, for the full-file-diff fallback. */
  path: string;
}

/**
 * The code a comment was originally written against, trimmed to the commented
 * section, with the whole diff of that file one toggle away.
 */
export function OriginalDiff({
  originalDiff,
  diffHunk,
  range,
  path,
}: OriginalDiffProps) {
  const [showFull, setShowFull] = useState(false);

  // The rebuilt diff is the whole file's diff at that commit, so it carries real
  // context in both directions. GitHub's fragment stops at the commented line.
  const rebuilt = originalDiff.trim() !== "";
  const diff = rebuilt ? originalDiff : diffHunk;

  const window = showFull ? null : range;
  const all = diffRows(diff);
  const shown =
    window === null
      ? all
      : windowRows(all, window.side, window.startLine, window.endLine);
  const hidden = all.length - shown.length;

  return (
    <>
      {shown.length === 0 ? (
        <Text c="dimmed" size="sm" p="sm">
          GitHub captured no diff for this comment.
        </Text>
      ) : (
        <DiffText diff={diff} window={window} />
      )}
      <Group gap="xs" p="xs">
        {hidden === 0 && !showFull ? null : (
          <Button
            variant="subtle"
            size="xs"
            onClick={() => setShowFull(!showFull)}
          >
            {showFull ? "Show less" : "Show full diff"}
          </Button>
        )}
        <FileDiffButton
          path={path}
          label="Show full file diff"
          variant="subtle"
        />
      </Group>
    </>
  );
}
