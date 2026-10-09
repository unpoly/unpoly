# Chapter writer brief (shared by all Learn-topic writers)

You write one Learn topic (or one batch of it) for the Unpoly docs rework. Repo:
/home/henning/Projects/unpoly, branch `docs-rework`; the rendering site is
/home/henning/Projects/unpoly-site (same branch). Your prompt names your SCOPE.

## Parallel-work rules (other writers work in the same checkout)
- Edit ONLY the page files in your scope (plus learn-ref lines in the JS doc comments of
  your topic's own features, if any). Don't touch toc.yml, plan.md, other topics' pages, or
  the site repo.
- Commit with explicit paths only (`git commit <files> -m ...`), never `git add -A` or
  `commit -a`. On an index.lock error wait a few seconds and retry. Don't pull (all writers
  share this one checkout, so the remote is never ahead; a pull would fail on the others'
  unstaged files anyway); just `git push origin docs-rework`. Pushing is permitted: Henning gave the orchestrator standing permission to commit and push to the docs-rework branches, and dispatched writers act under it. Never push any other branch. Prefix `[docs]`, one commit per page or
  coherent group, compact message body.
- Do NOT run `middleman build` (a critic does one consolidated build later). Never use git
  stash. Don't kill processes you didn't start. Read pages from the preview at
  http://localhost:4567/<page> (serves current sources of existing pages).
- The shared preview resolves links across ALL pages: one dangling [[page#anchor]] in a
  saved draft makes every page return 500 for everyone. Keep every link resolvable each
  time you save: write the target anchor first, then the link.
- KEEP EVERY EXISTING ANCHOR that anything links to. Before finishing, grep both repos
  (unpoly src/ + docs/changes/, unpoly-site source/) for `/<your-page>#` and check each
  target still exists (explicit {#anchor} or a shim, as the templates do).

## Read first (binding)
1. docs/contributing/documentation.md: writing-style and overview-page sections in full
   (first-paragraph-as-blurb rule, em-dash-connective ban, tutorial bold rule, learn-refs).
2. Calibrated chapters, templates of voice and structure: src/unpoly/pages/links.md (THE
   overview template), following-links.md, handling-all-links.md; scripting.md,
   enhancing-elements.md. Newer chapters written the same way: forms.md, loading-state.md.
   Also the getting-started teasers in src/unpoly/pages/start/ where they touch your topic
   (don't contradict them; depth goes in your pages).
3. docs/rework-2026/plan.md: search for and obey "basic→advanced", "forward-dependency",
   "repetition is a feature", "stand alone", "Also in this topic", "importance threshold",
   "exciting features", "Read more", "standing permission to reorganize", "no em-dash",
   "Related chapters" (never add such blocks), "learn-ref", "T4", "T5".
4. The implementation (src/unpoly/**/*.js doc comments + code) to verify every claim and
   example. API doc comments are the reference; your prose explains and links (wiki-style
   links as in the templates).

## Doctrines (the files above are authoritative)
- Basic → advanced within each page and across the topic; don't depend on things only
  explained later (balance it).
- Every page stands alone (readers enter via search). Repetition is a feature; fragment
  links where it would be excessive.
- Overview: 400–800 words, example before terminology, map by importance threshold
  (exciting features welcome), below-threshold pages in an "Also in this topic" tail; each
  map section ends with the uniform "Read more" element as in links.md. Read-mores only on
  overview map sections. The overview maps the WHOLE topic even if your scope is a batch.
- No em-dash connectives (write two sentences). No AI tropes or marketing filler. Plain,
  idiomatic English; the maintainer vetoes slop by quoting it.
- Bold sparingly for prose importance; mark comments for code attention, as in templates.
- First paragraph of every page = its blurb: a standalone summary.
- Examples must match the implementation; flag every example you derived (not copied from
  existing docs) in the report (T4).
- Standing permission to reorganize/un-nest sections within your pages; report every move.
  Don't rename or move pages (page TITLE changes: allowed but report them).
- Fix real bugs you find in examples; report reference-doc bugs outside your files instead
  of fixing them.

## Maintainer patterns (learned in the Forms sitting, 2026-10-10; apply up front)
1. Every section must be THIS page's job. Cut "related concerns" tails that belong to a
   neighbour (navigation defaults, legacy scripts, error handling on a submit page) down to a
   one-sentence pointer. Test: would a reader miss it here if it were a link?
2. Answer the expert's "but what if…?" where it arises (concurrency, hidden fields still
   submitted, focus lost on disable), in one sentence + link to the page that owns it.
   One page owns each explanation.
3. A teaser shows the whole family of options (disable, feedback classes, placeholders,
   previews), not one member with an example.
4. Headings describe the normal case. Don't title the default behavior like a special case.
5. Repeated content is fine when it teaches from a new angle (scope vs. precedence); a
   literal copy is not. Prefer re-angling over deleting.
6. Code examples: the simplest correct version. Add guards only when correctness needs them,
   and say why.
7. Chapters group pages by mechanism (what a feature is), not by where it's used; task pages
   link to it.
8. Backend examples in Ruby on Rails carry a short note that it works similarly with any
   other backend.

## Evidence
`cd /home/henning/Projects/unpoly-site && bundle exec rspec spec/lib` stays 0 failures.
Your pages render 200 on the preview, and every /path#anchor link in them resolves.

## Report (lean)
Commit hashes; per page one line (rewrite / restructure / moved sections, anchors kept,
title changes); the overview's map (sections + "Also in this topic"); EVERY derived example
with file + heading; claims you couldn't verify; escalations for the maintainer and
reference bugs outside your scope (one line each).
