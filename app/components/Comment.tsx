import { Anchor, Group, Text } from "@mantine/core";

import { CommentBody } from "./CommentBody";
import { RelativeTime } from "./RelativeTime";
import type { ReviewComment } from "../types";

import "./Comment.css";

/** A single review comment: author, time, link to GitHub, and plain-text body. */
export function Comment({ comment }: { comment: ReviewComment }) {
  return (
    <div className="comment">
      <Group gap="xs" justify="space-between" wrap="nowrap">
        <Group gap="xs">
          <Text size="sm" fw={600}>
            {comment.author}
          </Text>
          <Text size="sm" c="dimmed">
            <RelativeTime value={comment.createdAt} />
          </Text>
        </Group>
        <Anchor href={comment.url} target="_blank" rel="noreferrer" size="xs">
          on GitHub
        </Anchor>
      </Group>
      <CommentBody body={comment.body} />
    </div>
  );
}
