import { Stack, Text } from "@mantine/core";

import { AnchoredDiff } from "./AnchoredDiff";
import { Comment } from "./Comment";
import { DiffText } from "./DiffText";
import { SectionLabel } from "./SectionLabel";
import type {
  AnchorResult,
  LineRange,
  ReviewThreadWithComments,
} from "../types";

import "./ReviewThreadView.css";

interface ReviewThreadViewProps {
  thread: ReviewThreadWithComments;
  anchor: AnchorResult;
}

/**
 * A review thread in reading order: the comment with the code it was written
 * against, then any replies, then the same code as it looks today.
 */
export function ReviewThreadView({ thread, anchor }: ReviewThreadViewProps) {
  const [comment, ...replies] = thread.comments;
  const diffHunk = comment?.diffHunk ?? "";

  // The two diffs are numbered against different commits, so each gets the
  // range recorded for it: the original one for the captured hunk, the
  // re-anchored one for the hunk cut out of the current diff.
  const originalHighlight: LineRange | null =
    thread.originalLine === null
      ? null
      : {
          side: thread.diffSide,
          startLine: thread.originalStartLine ?? thread.originalLine,
          endLine: thread.originalLine,
        };
  const currentHighlight: LineRange | null =
    anchor.line === null
      ? null
      : {
          side: anchor.side,
          startLine: anchor.startLine ?? anchor.line,
          endLine: anchor.line,
        };

  return (
    <Stack gap="lg" className="reviewThread">
      <div className="reviewThread-primary">
        <div className="reviewThread-primaryComment">
          {comment === undefined ? (
            <Text size="sm" c="dimmed">
              This thread has no comments.
            </Text>
          ) : (
            <Comment comment={comment} />
          )}
        </div>
        <div className="reviewThread-primaryDiff">
          <div className="reviewThread-diffLabel">
            <SectionLabel>Original context</SectionLabel>
          </div>
          {diffHunk.trim() === "" ? (
            <Text size="sm" c="dimmed" p="sm">
              GitHub captured no diff for this comment.
            </Text>
          ) : (
            <DiffText diff={diffHunk} highlight={originalHighlight} />
          )}
        </div>
      </div>

      {replies.length === 0 ? null : (
        <div className="reviewThread-replies">
          <SectionLabel>
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </SectionLabel>
          <Stack gap="sm" mt="xs">
            {replies.map((reply) => (
              <Comment key={reply.id} comment={reply} />
            ))}
          </Stack>
        </div>
      )}

      <div className="reviewThread-current">
        <div className="reviewThread-diffLabel">
          <SectionLabel>Current diff</SectionLabel>
        </div>
        <AnchoredDiff anchor={anchor} highlight={currentHighlight} />
      </div>
    </Stack>
  );
}
