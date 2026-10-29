/**
 * Where a line of the old file ended up in the new one, following git's own
 * alignment of the two versions.
 *
 * Content matching cannot help when the commented code was rewritten — at the
 * extreme the anchor line is a bare `}`, which carries no identity at all.
 * Git has already worked out how the two files line up, so the position is
 * read off that: a line that survived maps to itself, and a line that was
 * replaced maps to where its replacement now sits.
 */
export function mapLineThroughDiff(
  diff: string,
  oldLine: number,
): number | null {
  if (diff.trim() === "") {
    return null;
  }
  let old: number | null = null;
  let next = 0;
  let delta = 0;

  for (const line of diff.split("\n")) {
    const header = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (header !== null) {
      const hunkOld = Number(header[1]);
      // Everything between the previous hunk and this one is unchanged, so a
      // line falling there just shifts by the running delta.
      if (oldLine < hunkOld) {
        return oldLine + delta;
      }
      old = hunkOld;
      next = Number(header[2]);
      continue;
    }
    if (
      old === null ||
      line.startsWith("diff ") ||
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ") ||
      line.startsWith("\\")
    ) {
      continue;
    }
    if (line.startsWith("+")) {
      next += 1;
      continue;
    }
    if (line.startsWith("-")) {
      if (old === oldLine) {
        // Replaced or deleted: point at where it now sits.
        return next;
      }
      old += 1;
      delta -= 1;
      continue;
    }
    if (old === oldLine) {
      return next;
    }
    old += 1;
    next += 1;
  }
  return oldLine + delta;
}
