# TODO

## Goal

gh-cr is to become a small tool that shows a web UI to make it easier for humans to look
at a GitHub pull request changes, give comments, reply to comments, resolve comments with
a focus on code diff, especially the ability to view the code changes in time, i.e. when
new commits are pushed to a PR, be able to view the diffs related to each comment/file.

## Decisions

- UI: web UI with React and Mantine, TypeScript, normal CSS files, vite
- UI routing: React Router in framework mode
- Backend: TypeScript
- Data is not fetched from GH directly, instead there's a "Refresh" button which fetches
  all relevant data from GH and stores it in a SQLite DB, which the backend uses to serve
  all the data from (comments, commits, file diffs, etc.)

## Code style

- Backend and frontend use prettier code style
- Named exports, usually only 1 export per file, file same name as the export name
- Always use braces for blocks
- Prefer ternary operator for return expressions (no early return), where useful
- Use TS interface instead of type where possible

## Implemenation details

- Extract common components with high-level API (Button, Panel, Box) where needed
- Implement a useFetch hook that already does error handling and checking (most places
  will need that)

## Scenarios

### Track a PR

Paste `https://github.com/o/r/pull/123` or `o/r#123`, gh-cr fetches
everything and stores it. Home page lists tracked PRs with state and last refresh.

### Viewing PR

Opening a PR presents a way to switch between two views:

1. The diff view, which is a view very similar to the GH view, each file has a diff shown,
   there's a file tree on the left side and new comments can be given.
2. The comments view, where each comment is listed in its own section and the context
   (i.e. the diff) of the comment is shown along with it.

There's also a "Refresh" button.

### Refresh a PR

When refresh is clicked, data is synced from GH into the local sqlite db. Every time there's a new
commit or a force-push in the GH PR, that is recorded in our local DB. And the important thing is
that for each file (each comment belongs to exactly 1 file) we can calculate _all_ the diffs that
have been created over time, e.g. when force pushing, adding new commits, etc. these actions can
all lead to new file diffs. The important thing is to filter out unneeded/duplicate diffs, so if
the user force-pushes the PR, but doesn't really change any code, then we don't need to have 2
separate file diffs (because the diffs are identical)

### Detail view comment

Opening a comment of a PR shows the comment at the top, together with the diff that the
comment was originally given to. Below it, are all the diffs that have been added over
time to the PR. The first section is the diff (to base branch) as it is right now, i.e.
the latest version of the PR.
