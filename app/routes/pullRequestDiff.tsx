import { Alert, Paper, Stack, Text } from "@mantine/core";
import { useState } from "react";

import { DiffText } from "../components/DiffText";
import { FileTree } from "../components/FileTree";
import { Panel } from "../components/Panel";
import { getPullRequest } from "../server/db/getPullRequest";
import { diffFile } from "../server/git/diffFile";
import { ensureRepo } from "../server/git/ensureRepo";
import { listChangedFiles } from "../server/git/listChangedFiles";
import type { Route } from "./+types/pullRequestDiff";

import "./pullRequestDiff.css";

/** v1 loads every diff eagerly, so cap how many files we render. */
const FILE_LIMIT = 50;

function anchorId(path: string): string {
  return `file-${encodeURIComponent(path)}`;
}

export async function loader({ params }: Route.LoaderArgs) {
  const number = Number(params.number);
  const pullRequest = Number.isInteger(number)
    ? getPullRequest(params.owner, params.repo, number)
    : null;
  if (pullRequest === null) {
    throw new Response("Pull request not tracked", { status: 404 });
  }
  const dir = await ensureRepo(pullRequest.owner, pullRequest.name);
  const changedFiles = await listChangedFiles(
    dir,
    pullRequest.mergeBaseSha,
    pullRequest.headSha,
  );
  const files = changedFiles.slice(0, FILE_LIMIT);
  const diffs = await Promise.all(
    files.map(async (file) => ({
      path: file.path,
      diff: await diffFile(
        dir,
        pullRequest.mergeBaseSha,
        pullRequest.headSha,
        file.path,
      ),
    })),
  );
  return { files, diffs, totalFiles: changedFiles.length };
}

export default function PullRequestDiff({ loaderData }: Route.ComponentProps) {
  const { files, diffs, totalFiles } = loaderData;
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  function select(path: string) {
    setSelectedPath(path);
    document
      .getElementById(anchorId(path))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="prDiff">
      <Paper withBorder radius="md" p="xs" className="prDiff-tree">
        <FileTree files={files} selectedPath={selectedPath} onSelect={select} />
      </Paper>
      <Stack gap="md" className="prDiff-files">
        {totalFiles > files.length ? (
          <Alert color="yellow" title="Large pull request">
            Showing the first {files.length} of {totalFiles} changed files.
          </Alert>
        ) : null}
        {diffs.length === 0 ? (
          <Text c="dimmed" size="sm">
            This pull request changes no files.
          </Text>
        ) : (
          diffs.map((file) => (
            <Panel
              key={file.path}
              id={anchorId(file.path)}
              title={file.path}
              flush
            >
              {file.diff.trim() === "" ? (
                <Text c="dimmed" size="sm" p="sm">
                  No textual diff (binary or mode-only change).
                </Text>
              ) : (
                <DiffText diff={file.diff} />
              )}
            </Panel>
          ))
        )}
      </Stack>
    </div>
  );
}
