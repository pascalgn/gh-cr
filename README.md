# gh-cr

A small local web UI for reviewing GitHub pull requests, with a focus on seeing code
comments **in the context of the current diff** — not just the diff they were written
against. See [SPEC.md](./SPEC.md) for the goal and [PLAN.md](./PLAN.md) for the
implementation plan.

## Requirements

- Node 22+ (developed on 24)
- `git` on PATH
- A GitHub token: either `GITHUB_TOKEN` in the environment, or an authenticated
  [`gh`](https://cli.github.com/) (`gh auth login`) — gh-cr falls back to `gh auth token`

## Usage

```sh
npm install
npm run dev
```

Open the printed URL, paste a PR (`https://github.com/o/r/pull/123` or `o/r#123`) and
hit Track.

## How it works

Nothing is fetched from GitHub while you browse. A **Refresh** on a PR page syncs that
one PR: its review threads go into a local sqlite DB, and its base and head refs are
fetched into a local bare git repo, which then serves every diff. All PRs of the same
GitHub repo share one bare repo. Local git state is never authoritative — force pushes
upstream simply overwrite it.

State lives outside the project, under the platform data dir
(`~/Library/Application Support/gh-cr` on macOS):

```
gh-cr.sqlite
repos/<owner>__<repo>.git
```

## Scripts

| Script                        | Does                       |
| ----------------------------- | -------------------------- |
| `npm run dev`                 | Dev server with HMR        |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck`           | Route typegen + `tsc`      |
| `npm test`                    | vitest                     |
| `npm run format`              | prettier                   |

## Status

v1 is **read-only**: track, refresh, diff view, comments view, and the comment detail
view with its anchoring heuristic. Writing comments, replying and resolving are not
implemented yet.
