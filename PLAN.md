# Implementation Plan

Plan for a first working version of gh-cr per [SPEC.md](./SPEC.md). Goal: get the full
loop (track → refresh → view diff → view comments with their current context) running
end to end, **read-only**. Writes come after.

## Decisions taken (deviations from SPEC noted)

| Topic          | Decision                                                                                                   | Note                                                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git access     | Shell out to the `git` CLI via a thin `server/git/*` wrapper                                               | **Deviates from SPEC** (nodegit). nodegit's latest release targets Node ≤20 and will not build on the local Node 24. The CLI also gives us three-dot diffs, rename detection and `blame` for free. The wrapper keeps it swappable. |
| Backend        | No separate service. One React Router (framework mode) app; loaders/actions import `app/server/*` directly | Single process, shared types, no API schema to maintain.                                                                                                                                                                           |
| v1 scope       | Read-only                                                                                                  | No comment creation / reply / resolve yet.                                                                                                                                                                                         |
| Diff rendering | Raw unified diff text in a `<pre>`, light +/−/@@ coloring                                                  | No two-column split view. The gutter is sticky, so numbers stay put while long lines scroll sideways.                                                                                                                              |
| DB             | `better-sqlite3`, hand-written SQL, one `schema.ts` string applied on boot                                 | Synchronous API fits loaders well. The schema is inlined as a TS string rather than a `.sql` file because vite does not emit the `.sql` into `build/server/`.                                                                      |
| GitHub API     | `@octokit/graphql` for PR + review threads, `@octokit/rest` only if needed                                 | Thread resolution state (`isResolved`) exists **only** in GraphQL, and we want that field from day one.                                                                                                                            |
| Auth           | `GITHUB_TOKEN` env, falling back to `gh auth token`                                                        | `gh` is already authenticated locally. Token is never persisted.                                                                                                                                                                   |

## Storage layout

Paths come from the [`env-paths`](https://www.npmjs.com/package/env-paths) package with
the Node suffix disabled — `envPaths("gh-cr", { suffix: "" })` — so nothing is written
into the project directory:

```
<envPaths.data>/              # ~/Library/Application Support/gh-cr on macOS
  gh-cr.sqlite
  repos/<owner>__<repo>.git   # ONE bare repo per GitHub repo, shared by all its PRs
```

Fetching into the bare repo (token passed as a one-off URL arg, not stored as a remote):

```
git fetch <https://x-access-token:TOKEN@github.com/o/r.git> \
  +refs/pull/<n>/head:refs/gh-cr/<n>/head \
  +refs/heads/<base>:refs/gh-cr/<base>
```

Force refspecs (`+`) — the local repo is not authoritative, force pushes just overwrite.

## Data model

```sql
repos(id, owner, name)                                   -- UNIQUE(owner, name)
pull_requests(id, repo_id, number, title, state, author,
              base_ref, base_sha, head_sha, merge_base_sha,
              html_url, created_at, updated_at, refreshed_at)   -- UNIQUE(repo_id, number)
review_threads(id TEXT PK,      -- GraphQL node id
               pr_id, path, line, original_line, start_line,
               diff_side, is_resolved, is_outdated)
review_comments(id TEXT PK,     -- GraphQL node id
                thread_id, author, body, diff_hunk,
                original_commit_sha, created_at, url)
```

Refresh is a single transaction: upsert the PR row, then delete + reinsert all of its
threads and comments. Idempotent, no merge logic to get wrong.

## Refresh

Refresh is per-PR: the button on a PR page syncs **only that PR** (one GraphQL query plus
one `git fetch` of its two refs). That is a bounded amount of work regardless of how many
PRs are tracked, so it runs synchronously in the route action — no job queue.

## The interesting part: anchoring a comment to the current diff

For the comment detail view we need "the chunk of the _current_ diff this comment is
about". v1 heuristic, in order:

1. Current diff for the file: `git diff -U3 <merge_base_sha> <head_sha> -- <path>`.
2. **Thread still anchored** (`line` is not null — GitHub resolved it against head):
   pick the hunk whose new-side range covers `line`. Done.
3. **Thread outdated** (`line` is null): take the anchor line text — the last line of
   `diff_hunk`, minus its `+`/`-`/` ` marker — and look for it in the head version of
   the file (`git show <head_sha>:<path>`), in three passes, stopping at the first hit:
   exact match → substring containment → character-bigram Dice similarity ≥ 0.6. Of the
   candidate lines, pick the one closest to `original_line`, then find the hunk covering
   it. Exact matching alone was tried first and is far too brittle on real PRs: an
   appended ` (for example, ...)` or a `[suffix](#suffix)` → `suffix` rewording is enough
   to lose a comment that a human matches at a glance.
4. **No hunk covers it**: say so explicitly ("no longer part of the diff") and offer the
   full-file-diff modal.

The "original diff" section below it needs no computation — GitHub hands us `diff_hunk`
verbatim.

GitHub reports a comment's position as a _range on a side_, but only the original
pair is used: `originalStartLine`/`originalLine`, numbered against the commit the
comment was written on, plus `diffSide` (`RIGHT` indexes the head file, `LEFT` the base
file). The head-side `line`/`startLine` are deliberately not fetched at all — they are
null for outdated threads anyway, and ignoring them leaves one code path instead of
two: the current diff is **always** located by matching content, never by trusting a
line number.

A file renamed after a comment was written no longer exists under the path the
comment names, which would make its current diff look empty. The path is followed
forward with `git log --diff-filter=R -M` over the range from the comment's own commit
to head, chaining each rename in turn. Per-commit rather than one `diff -M` of the
endpoints on purpose: a file renamed and then heavily edited drifts below git's
similarity threshold, so the end-to-end diff reports a delete plus an add and the trail
is lost — while each individual rename stays obvious.

The commented _section_ is therefore:

- `originalStartLine` set → exactly that range;
- `originalStartLine` null (a single-line comment) → `originalLine` and the five lines
  before it, which is the context that makes a one-line comment readable.

The original diff is not GitHub's captured `diffHunk` — that fragment is truncated at
the commented line, so it can never show what came after it. Instead the real diff is
rebuilt locally from `originalCommitSha`: `git diff $(merge-base base <sha>) <sha> --
<path>`. Refresh pins every such commit under `refs/gh-cr/commits/<sha>`, fetching it by
full sha when a force-push has orphaned it — GitHub still serves those, and the ref
keeps gc from pruning them. The captured fragment stays as the fallback for a commit
GitHub no longer has. The rebuilt diff is trimmed to the section, with a toggle
showing that file's whole diff, and a modal showing the complete file with no
unchanged lines elided. The current diff shows the matched hunk — unless the match is
_corroborated_, in which case it is trimmed to end at the matched line, exactly as
the original section ends at `originalLine`.

When the commented code was not merely moved but rewritten, content matching has nothing
to work with — at the extreme the anchor line is a bare `}`. The fallback is positional:
the file's content at the comment's commit is diffed against its content at head, and
the original line is followed through git's own alignment of the two versions. A line
that survived maps to itself; one that was replaced maps to where its replacement sits.

Corroboration compares the matched line and up to five lines after it against the lines
that followed the comment in its original diff. One matching line is not proof — the
same line occurs in many places — so only when the lines after it line up too is the
match tight enough to hide the surrounding context. When they do not, the section is still centred on the match
but widened by ten lines either side: an uncertain anchor is exactly when the reader
needs surrounding context to judge for themselves, while showing the whole hunk is no
help when the hunk is an entire added file.

## Routes

```
/                                             home: tracked PR list + add form (action)
/pr/:owner/:repo/:number                      layout: header, Refresh action, view tabs
  index                                       diff view: file tree (left) + raw diffs
  comments                                    comments view: each thread + its current-diff chunk
  comments/:threadId                          detail: comment, current chunk, original chunk
                                              ?file=<path> → full file diff in a Modal
```

Add-form input accepts both `https://github.com/o/r/pull/123` and `o/r#123`.

## File layout

```
app/
  root.tsx  routes.ts
  routes/           one file per route above
  components/       Button, Panel, Box, DiffView, FileTree, CommentCard
  server/
    paths.ts                                         (env-paths, no suffix)
    refreshPullRequest.ts                            (GitHub + git, one transaction)
    anchorComment.ts                                 (heuristic above) + unit tests
    parseUnifiedDiff.ts, findHunkForLine.ts          (pure diff slicing) + unit tests
    db/             connection.ts, schema.ts, rows.ts, and the query files
    github/         client.ts, fetchPullRequest.ts   (GraphQL query + types)
    git/            gitRepo.ts (exec wrapper), fetchRefs.ts, diffFile.ts, showFile.ts
```

## Milestones

1. **Scaffold** — `create-react-router` + TS + Mantine + prettier, `env-paths` data dir
   created on boot.
2. **Data layer** — sqlite schema, octokit GraphQL fetch, git fetch. CLI-less check:
   track a PR from the home form and see rows land in the DB.
3. **Diff view** — merge-base + `git diff --name-status` for the tree, raw per-file diff.
4. **Comments view** — thread list, each with its `diff_hunk`.
5. **Detail view + anchoring** — the heuristic, plus the full-file-diff modal.
6. **Polish** — refresh state/spinner, last-refreshed timestamps, empty/error states.

## Explicitly out of scope for v1

Pending reviews — comments post standalone, one at a time — issue-level
(non-code) comments, syntax
highlighting, split diff view, multi-user or multi-token, review/approval state,
per-commit diff ranges (v1 always diffs base…head, as SPEC requires).
