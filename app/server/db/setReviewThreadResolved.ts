import { getDatabase } from "./connection";

/** Mirrors a thread's resolved state locally, so the UI needs no full refresh. */
export function setReviewThreadResolved(
  threadId: string,
  resolved: boolean,
): void {
  getDatabase()
    .prepare("UPDATE review_threads SET is_resolved = ? WHERE id = ?")
    .run(resolved ? 1 : 0, threadId);
}
