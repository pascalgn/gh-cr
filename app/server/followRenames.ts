import type { Rename } from "./git/renamesBetween";

/**
 * Where a path ended up after a sequence of renames, applied in order. A file
 * renamed more than once is followed the whole way.
 */
export function followRenames(renames: Rename[], path: string): string {
  return renames.reduce(
    (current, rename) => (rename.from === current ? rename.to : current),
    path,
  );
}
