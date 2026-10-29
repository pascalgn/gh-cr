import { anchorComment } from "./anchorComment";
import { diffFile } from "./git/diffFile";
import { diffBlobs } from "./git/diffBlobs";
import { diffFileAtCommit } from "./git/diffFileAtCommit";
import { followRenames } from "./followRenames";
import { renamesBetween } from "./git/renamesBetween";
import { ensureRepo } from "./git/ensureRepo";
import { showFile } from "./git/showFile";
import type {
  AnchorResult,
  DiffSide,
  PullRequest,
  ReviewThreadWithComments,
} from "../types";

export interface AnchoredThread {
  thread: ReviewThreadWithComments;
  /**
   * Where the thread's file lives at head. Differs from `thread.path` when the
   * file was renamed after the comment was written.
   */
  currentPath: string;
  /** The whole current diff of the thread's file, base...head. */
  diff: string;
  /** The diff fragment GitHub captured when the comment was written. */
  diffHunk: string;
  /**
   * The file's real diff at the commit the comment was written on. Empty when
   * that commit could not be obtained, in which case `diffHunk` is all we have.
   */
  originalDiff: string;
  anchor: AnchorResult;
}

interface FileState {
  diff: string;
  /** The file at head, read only when some thread on it is a RIGHT thread. */
  headFileContent: string | null;
  /** The file at the merge base, read only when some thread on it is a LEFT thread. */
  baseFileContent: string | null;
}

const EMPTY_FILE_STATE: FileState = {
  diff: "",
  headFileContent: null,
  baseFileContent: null,
};

/** Reads one path's diff plus only those sides its threads actually anchor to. */
async function readFileState(
  dir: string,
  pullRequest: PullRequest,
  path: string,
  sides: Set<DiffSide>,
): Promise<FileState> {
  const [diff, headFileContent, baseFileContent] = await Promise.all([
    diffFile(dir, pullRequest.mergeBaseSha, pullRequest.headSha, path),
    sides.has("RIGHT") ? showFile(dir, pullRequest.headSha, path) : null,
    sides.has("LEFT") ? showFile(dir, pullRequest.mergeBaseSha, path) : null,
  ]);
  return { diff, headFileContent, baseFileContent };
}

/** Anchors threads to the current diff, reading each distinct file only once. */
export async function anchorThreads(
  pullRequest: PullRequest,
  threads: ReviewThreadWithComments[],
): Promise<AnchoredThread[]> {
  const dir = await ensureRepo(pullRequest.owner, pullRequest.name);

  // A file renamed since a comment was written no longer exists under the path
  // the comment names, which would make its diff look empty. Follow the
  // renames made between the comment's own commit and head.
  const commitShas = [
    ...new Set(
      threads
        .map((thread) => thread.comments[0]?.originalCommitSha ?? "")
        .filter((sha) => sha !== ""),
    ),
  ];
  const renamesByCommit = new Map(
    await Promise.all(
      commitShas.map(
        async (sha) =>
          [sha, await renamesBetween(dir, sha, pullRequest.headSha)] as const,
      ),
    ),
  );
  const currentPathOf = (thread: ReviewThreadWithComments): string =>
    followRenames(
      renamesByCommit.get(thread.comments[0]?.originalCommitSha ?? "") ?? [],
      thread.path,
    );

  const sidesByPath = new Map<string, Set<DiffSide>>();
  for (const thread of threads) {
    const path = currentPathOf(thread);
    const sides = sidesByPath.get(path) ?? new Set<DiffSide>();
    sides.add(thread.diffSide);
    sidesByPath.set(path, sides);
  }

  const files = new Map<string, FileState>(
    await Promise.all(
      [...sidesByPath].map(
        async ([path, sides]): Promise<[string, FileState]> => [
          path,
          await readFileState(dir, pullRequest, path, sides),
        ],
      ),
    ),
  );

  // The original diff is keyed by commit as well as path: two threads on the
  // same file may have been written against different pushes.
  const originalDiffs = new Map<string, string>();
  // The file's old version against its new one, which is what lets a comment
  // be placed by position when its code was rewritten.
  const positionDiffs = new Map<string, string>();
  await Promise.all(
    [
      ...new Set(
        threads.flatMap((thread) =>
          thread.comments[0] === undefined
            ? []
            : [`${thread.comments[0].originalCommitSha}\u0000${thread.path}`],
        ),
      ),
    ].map(async (key) => {
      const [sha, path] = key.split("\u0000");
      originalDiffs.set(
        key,
        sha === ""
          ? ""
          : await diffFileAtCommit(dir, pullRequest.baseSha, sha, path),
      );
    }),
  );
  await Promise.all(
    threads.map(async (thread) => {
      const sha = thread.comments[0]?.originalCommitSha ?? "";
      const currentPath = currentPathOf(thread);
      const key = `${sha}\u0000${thread.path}\u0000${currentPath}`;
      if (sha === "" || positionDiffs.has(key)) {
        return;
      }
      positionDiffs.set(
        key,
        await diffBlobs(
          dir,
          sha,
          thread.path,
          pullRequest.headSha,
          currentPath,
        ),
      );
    }),
  );

  return threads.map((thread) => {
    const currentPath = currentPathOf(thread);
    const file = files.get(currentPath) ?? EMPTY_FILE_STATE;
    const diffHunk = thread.comments[0]?.diffHunk ?? "";
    const originalCommitSha = thread.comments[0]?.originalCommitSha ?? "";
    return {
      thread,
      currentPath,
      diff: file.diff,
      diffHunk,
      originalDiff:
        originalDiffs.get(`${originalCommitSha}\u0000${thread.path}`) ?? "",
      anchor: anchorComment({
        originalLine: thread.originalLine,
        originalStartLine: thread.originalStartLine,
        diffSide: thread.diffSide,
        diff: file.diff,
        originalDiff:
          originalDiffs.get(`${originalCommitSha}\u0000${thread.path}`) ?? "",
        positionDiff:
          positionDiffs.get(
            `${originalCommitSha}\u0000${thread.path}\u0000${currentPath}`,
          ) ?? "",
        sideFileContent:
          thread.diffSide === "LEFT"
            ? file.baseFileContent
            : file.headFileContent,
        diffHunk,
      }),
    };
  });
}
