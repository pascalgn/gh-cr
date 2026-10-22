/** Owner, repository and number identifying one pull request. */
export interface PullRequestRef {
  owner: string;
  repo: string;
  number: number;
}

const segment = "[A-Za-z0-9._-]+";
const urlPattern = new RegExp(
  `^(?:https?://)?(?:www\\.)?github\\.com/(${segment})/(${segment})/pull/(\\d+)(?:[/?#].*)?$`,
);
const shorthandPattern = new RegExp(`^(${segment})/(${segment})#(\\d+)$`);

/** Parses `https://github.com/o/r/pull/123` or `o/r#123`, null when neither matches. */
export function parsePullRequestInput(input: string): PullRequestRef | null {
  const trimmed = input.trim();
  const match = urlPattern.exec(trimmed) ?? shorthandPattern.exec(trimmed);
  return match === null
    ? null
    : { owner: match[1], repo: match[2], number: Number(match[3]) };
}
