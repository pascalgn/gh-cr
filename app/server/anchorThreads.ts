import { anchorComment } from "./anchorComment";
import { diffFile } from "./git/diffFile";
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
  /** The whole current diff of the thread's file, base...head. */
  diff: string;
  /** The diff fragment GitHub captured when the comment was written. */
  diffHunk: string;
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
  const sidesByPath = new Map<string, Set<DiffSide>>();
  for (const thread of threads) {
    const sides = sidesByPath.get(thread.path) ?? new Set<DiffSide>();
    sides.add(thread.diffSide);
    sidesByPath.set(thread.path, sides);
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

  return threads.map((thread) => {
    const file = files.get(thread.path) ?? EMPTY_FILE_STATE;
    const diffHunk = thread.comments[0]?.diffHunk ?? "";
    return {
      thread,
      diff: file.diff,
      diffHunk,
      anchor: anchorComment({
        line: thread.line,
        startLine: thread.startLine,
        originalLine: thread.originalLine,
        originalStartLine: thread.originalStartLine,
        diffSide: thread.diffSide,
        diff: file.diff,
        sideFileContent:
          thread.diffSide === "LEFT"
            ? file.baseFileContent
            : file.headFileContent,
        diffHunk,
      }),
    };
  });
}
