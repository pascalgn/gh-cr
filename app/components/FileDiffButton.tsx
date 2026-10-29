import { Button, Loader, Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useFetcher, useParams } from "react-router";

import { CommentableDiff } from "./CommentableDiff";
import { HighlightedFile } from "./HighlightedFile";
import { addedFileContent } from "../addedFileContent";

interface FileDiffButtonProps {
  path: string;
  label?: string;
  variant?: string;
}

/** Opens the whole base...head diff of one file, fetched the first time it is opened. */
export function FileDiffButton({
  path,
  label = "View full file diff",
  variant = "default",
}: FileDiffButtonProps) {
  const fetcher = useFetcher<{ diff: string }>();
  const [isOpen, modal] = useDisclosure(false);
  const { owner, repo, number } = useParams();

  const open = () => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      fetcher.load(
        `/pr/${owner}/${repo}/${number}/file-diff?whole=1&path=${encodeURIComponent(path)}`,
      );
    }
    modal.open();
  };

  return (
    <>
      <Button variant={variant} size="xs" onClick={open}>
        {label}
      </Button>
      <Modal opened={isOpen} onClose={modal.close} title={path} size="90%">
        {fetcher.data === undefined ? (
          <Loader size="sm" />
        ) : fetcher.data.diff.trim() === "" ? (
          <Text c="dimmed" size="sm">
            This file is unchanged between the base and the head of this pull
            request.
          </Text>
        ) : (
          (() => {
            // A file the pull request adds has no "before", so a column of
            // plus signs says nothing. Show it as what it is: a source file.
            const added = addedFileContent(fetcher.data.diff);
            return added === null ? (
              <CommentableDiff diff={fetcher.data.diff} path={path} />
            ) : (
              <HighlightedFile code={added} path={path} />
            );
          })()
        )}
      </Modal>
    </>
  );
}
