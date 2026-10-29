import { Button, Group, Text, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import type { ThreadReplyResult } from "../routes/threadReply";

import "./ReplyForm.css";

/** Posts a reply to one review thread. */
export function ReplyForm({ threadId }: { threadId: string }) {
  const fetcher = useFetcher<ThreadReplyResult>();
  const [body, setBody] = useState("");
  const posting = fetcher.state !== "idle";

  // Clear the box once GitHub has the reply, but keep the text on failure so
  // nothing a person typed is thrown away.
  useEffect(() => {
    if (fetcher.data?.posted === true) {
      setBody("");
    }
  }, [fetcher.data]);

  return (
    <fetcher.Form
      method="post"
      action={`/threads/${encodeURIComponent(threadId)}/reply`}
      className="replyForm"
    >
      <Textarea
        name="body"
        value={body}
        onChange={(event) => setBody(event.currentTarget.value)}
        placeholder="Reply…"
        autosize
        minRows={2}
        maxRows={12}
        disabled={posting}
      />
      <Group gap="sm" mt="xs">
        <Button
          type="submit"
          size="xs"
          loading={posting}
          disabled={body.trim() === ""}
        >
          Reply
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
