# Markdown station — session hand-off

Hand-off for a dedicated Opus session that aligns and implements the "Markdown
representation of Learn and API content" station with Henning. Written 2026-10-07 by
the docs-rework orchestrator session.

## Your mission

Read, in this order:

1. `/home/henning/Documents/Unpoly/2026-10-07 Unpoly Skill.md` — Henning's original
   brief (goals, approaches, the skill stretch goal).
2. `docs/rework-2026/markdown-station-research.md` — the completed research: approach
   comparison (X1 recommended), access paths with a draft .htaccess snippet, link
   strategy, the skill sketch, distribution channels, and **16 numbered decisions**
   that Henning has read and wants to align on. The converter prototype is next to it
   (`markdown-station-converter-prototype.rb`); richer prototypes (all 626 pages
   converted, a Middleman test app, the adapted BM25 search script) lived in the
   research agent's scratchpad and are regenerable from the report's instructions.
3. `docs/rework-2026/plan.md` — skim for context: the rework's state, working
   agreements, and the calibration doctrines (style rules matter if you touch
   reader-visible text).

Then: walk Henning through plan changes and the open decisions (he prefers ONE item
at a time, with context, lettered options and a stated lean), spec the station, and
implement on his go.

## Working arrangements (agreed with Henning)

- **Paired worktrees + branches, never the main checkouts.** You will change BOTH
  repos (Henning's word); the docs-rework orchestration owns both main checkouts
  (`/home/henning/Projects/unpoly` and `.../unpoly-site`, branch docs-rework) and the
  :4567 preview. Create sibling worktrees under one parent, named EXACTLY like the
  originals — unpoly-site finds the framework through a committed symlink
  (`vendor/unpoly-local -> ../../unpoly`), which then resolves to your unpoly worktree
  by itself:
  ```
  mkdir ~/Projects/md-station
  git -C ~/Projects/unpoly      worktree add ~/Projects/md-station/unpoly      -b docs-rework-md
  git -C ~/Projects/unpoly-site worktree add ~/Projects/md-station/unpoly-site -b docs-rework-md
  ```
  Work only in the worktrees, both repos.
- **Your own preview port** (e.g. 4568) from the worktree. Never restart :4567.
- **Commits and pushes:** Henning's standing permission covers committing and pushing
  to docs-rework-based branches in both repos. Repo conventions: unpoly-site has plain
  subjects; unpoly prefixes `[docs]`. Quality bar: every batch gets a fresh-eyes
  review by a non-builder agent before push.
- **Decision log:** keep yours in `docs/rework-2026/markdown-station-plan.md` on your
  branch. Do NOT edit `docs/rework-2026/plan.md` — it belongs to the orchestrator
  session, which folds in a summary at merge time.
- **Merge:** when the station ships, coordinate the merge into docs-rework (BOTH
  repos) with Henning; the orchestrator session can take it from there. Until then,
  regularly merge docs-rework INTO docs-rework-md in both worktrees — the content and
  styling tracks move daily.
- A new `unpoly/unpoly-skills` repo is part of the stretch goal; creating it on GitHub
  is an ask-first action (Henning's word).

## Known coupling to watch

- The site evolves under you: the docs-rework branch receives content and styling
  commits while you work. Rebase/merge docs-rework into your branch regularly; the
  converter depends on template class names, so a template change upstream can break
  your transforms (the research recommends a build check for exactly this).
- Two incidental live-site fixes already shipped on docs-rework (Edit-link %0A,
  trailing-slash https) — they are NOT part of your station. Two ops items are with
  Henning (nginx proxy_redirect; stale deployed .htaccess).
