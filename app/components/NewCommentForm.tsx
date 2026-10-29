import { Button, Group, Text, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { useFetcher, useParams } from "react-router";

import type { NewCommentResult } from "../routes/newComment";

interface NewCommentFormProps {
  path: string;
  line: number;
  onClose: () => void;
}

/** Starts a new review thread on one line. */
export function NewCommentForm({ path, line, onClose }: NewCommentFormProps) {
  const fetcher = useFetcher<NewCommentResult>();
  const { owner, repo, number } = useParams();
  const [body, setBody] = useState("");
  const posting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.posted === true) {
      onClose();
    }
  }, [fetcher.data, onClose]);

  return (
    <fetcher.Form
      method="post"
      action={`/pr/${owner}/${repo}/${number}/new-comment`}
    >
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="line" value={line} />
      <Text size="xs" c="dimmed" mb={4}>
        New comment on line {line}
      </Text>
      <Textarea
        name="body"
        value={body}
        onChange={(event) => setBody(event.currentTarget.value)}
        placeholder="Leave a comment…"
        autosize
        minRows={3}
        maxRows={14}
        disabled={posting}
        autoFocus
      />
      <Group gap="sm" mt="xs">
        <Button
          type="submit"
          size="xs"
          loading={posting}
          disabled={body.trim() === ""}
        >
          Comment
        </Button>
        <Button variant="subtle" size="xs" onClick={onClose} disabled={posting}>
          Cancel
        </Button>
        {fetcher.data?.error === undefined ? null : (
          <Text size="xs" c="red">
            {fetcher.data.error}
          </Text>
        )}
      </Group>
    </fetcher.Form>
  );
}
