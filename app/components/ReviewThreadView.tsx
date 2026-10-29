import { Stack, Text } from "@mantine/core";

import { AnchoredDiff } from "./AnchoredDiff";
import { Comment } from "./Comment";
import { OriginalDiff } from "./OriginalDiff";
import { ReplyForm } from "./ReplyForm";
import { SectionLabel } from "./SectionLabel";
import { originalRange } from "../originalRange";
import type { AnchorResult, ReviewThreadWithComments } from "../types";

import "./ReviewThreadView.css";

interface ReviewThreadViewProps {
  thread: ReviewThreadWithComments;
  anchor: AnchorResult;
  /** The file's diff at the commit the first comment was written on. */
  originalDiff: string;
  /** Where the file lives at head, which a rename may have moved. */
  currentPath: string;
  /** Head of the pull request, to date the current diff. */
  headSha: string;
}

/** Enough of a sha to recognise, or nothing when we were given none. */
function shortSha(sha: string): string {
  return sha === "" ? "" : sha.slice(0, 7);
}

/**
 * A review thread in reading order: the comment with the code it was written
 * against, then any replies, then the same code as it looks today.
 */
export function ReviewThreadView({
  thread,
  anchor,
  originalDiff,
  currentPath,
  headSha,
}: ReviewThreadViewProps) {
  const [comment, ...replies] = thread.comments;
  const diffHunk = comment?.diffHunk ?? "";

  // The section the comment is about, numbered against the commit it was
  // written on, which is what the original diff is trimmed to.
  const original = originalRange(thread);

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
            <SectionLabel>
              Original context
              {comment === undefined ||
              shortSha(comment.originalCommitSha) === ""
                ? null
                : ` · as of ${shortSha(comment.originalCommitSha)}`}
            </SectionLabel>
          </div>
          <OriginalDiff
            originalDiff={originalDiff}
            diffHunk={diffHunk}
            range={original}
            path={thread.path}
          />
        </div>
      </div>

      <div className="reviewThread-replies">
        {replies.length === 0 ? null : (
          <>
            <SectionLabel>
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </SectionLabel>
            <Stack gap="sm" mt="xs">
              {replies.map((reply) => (
                <Comment key={reply.id} comment={reply} />
              ))}
            </Stack>
          </>
        )}
        <ReplyForm threadId={thread.id} />
      </div>

      <div className="reviewThread-current">
        <div className="reviewThread-diffLabel">
          <SectionLabel>
            Current diff
            {shortSha(headSha) === "" ? null : ` · as of ${shortSha(headSha)}`}
          </SectionLabel>
        </div>
        {currentPath === thread.path ? null : (
          <Text c="dimmed" size="xs" px="sm" pt="sm">
            Renamed since this comment; now {currentPath}.
          </Text>
        )}
        <AnchoredDiff anchor={anchor} path={currentPath} />
      </div>
    </Stack>
  );
}
