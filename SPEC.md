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
  all relevant data from GH and stores it in a local git repo, which the backend uses to serve
  all the git data from
- The other GH data (i.e. comments) are stored in a local sqlite DB

## Code style

- Backend and frontend use prettier code style
- Named exports, usually only 1 export per file, file same name as the export name
- Always use braces for blocks
- Prefer ternary operator for return expressions (no early return), where useful
- Use TS interface instead of type where possible
- Generally try to avoid too deep directory nesting for file layout

## Implemenation details

- Extract common components with high-level API (Button, Panel, Box) where needed
- Single-user scenario / 1 single GH API key
- Use react router loaders for data fetching
- Access to git repo via nodegit lib
- Multiple PRs for the same repo will use the same git repo in the background, so that we don't
  have to have duplicate repos for each PR

## Scenarios

### Track a PR

Paste `https://github.com/o/r/pull/123` or `o/r#123`, gh-cr fetches
everything and stores it. Home page lists tracked PRs with state and last refresh.

### Viewing PR

Opening a PR presents a way to switch between two views:

1. The diff view, which is a view very similar to the GH view, each file has a diff shown,
   there's a file tree on the left side and new comments can be given. The diff always shows
   the diff between current PR head and PR base.
2. The comments view, where each comment is listed in its own section and the context
   (i.e. the diff) of the comment is shown along with it.

There's also a "Refresh" button.

### Refresh a PR

When refresh is clicked, data is synced from GH into the local sqlite db. Also, the local git
repo is updated with the current state of the PR. The local git repo is not at all authorative,
so any force pushes etc. from the remote can simply overwrite the state in the local repo.

### Detail view comment

Opening a comment of a PR shows the comment at the top, then a section with the current diff
of the file, so from the latest state of the PR the file content, compared/diffed with the base
branch of the PR. The section tries to show only the diff that is relevant to the comment, so if
there was a comment on line 47, but in the latest version, due to rebase or something, the diff
is actually starting on line 49 or so, the program intelligently figures out that this chunk is
probably what the comment refers to and so shows only this.

Below this section, there's a section with the diff that the comment was originally given on,
i.e. the changes that were originally commented.

There's also a button to view the full file diff (to the base branch), which opens in a Modal
component.
