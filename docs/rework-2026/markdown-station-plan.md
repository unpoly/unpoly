# Markdown station — decision log

Decisions for the "Markdown representation of Learn and API content" station, settled with
Henning on 2026-10-07. Inputs: Henning's brief (`~/Documents/Unpoly/2026-10-07 Unpoly
Skill.md`), `markdown-station-research.md` and `markdown-station-handoff.md`. Where this
log and the research disagree, this log wins.

Work happens in paired worktrees under `~/Projects/md-station/` (branch `docs-rework-md`
in both repos). The orchestrator folds a summary into `plan.md` at merge time.


## Amendments to the brief

- **Name:** the skill is `unpoly-docs`.
- **Changelog:** `/changes` gets a hub and one `.md` page per version, plus
  `/changes/upgrading`. The site converts all versions; the skill ships 2.x and 3.x only.
  Search down-weights changelog pages by kind.
- **Support:** `/support` is converted for the web. The skill only points to
  `https://unpoly.com/support.md` from SKILL.md (prices go stale).
- **Search tokenizer:** split at whitespace, then strip punctuation from token ends;
  keep `.`, `-`, `:`, `$` inside tokens (`up.render`, `[up-target]` → `up-target`).
  Additionally index the parts (`up.layer` → `up`, `layer`) so plain-English queries
  still match. A fixed query set with expected top results is part of the search tests.
- **Converter registry:** every element signature (tag + classes) in converted content
  has a rule: keep, drop, unwrap or custom. An unknown signature fails the build, as does
  raw HTML left in the output. A dropped element covers all its descendants. Runs over
  all pages at build time, plus a spec over the parser fixtures.


## Decisions

### Producing the Markdown

- **Generation (item 4):** each page gets a `.md` twin registered as a Middleman page. Its
  template renders the HTML sibling with `layout: false` and runs the converter. Layout
  elements can't leak in by construction; the preview serves `.md` URLs.
  - Verified 2026-10-07 with a throwaway probe: nested rendering works in preview and
    build (the sitemap lock is a re-entrant Monitor held only during lookup), 20
    concurrent preview requests all returned 200, and twins for all 654 doc pages built
    correctly. Build time went from 39 s to 58 s, before adding the converter.
- **Navigation in `.md` pages (item 3):** a context line from the breadcrumb
  (`_JavaScript function in [up.fragment](…)_`), links to the root index and the
  closest area hub, prev/next where available. Dropped: both TOCs, Edit and MD buttons,
  other chrome.
- **Root index (3.1, 8):** a new `/index.md`, generated from `site_sections` and the TOC
  (same data as the narrow menu): a lead paragraph from an existing summary, the
  sections with Learn chapters and API modules, a line pointing to the docs for older
  majors. `/llms.txt` serves the same content. The landing page is not converted.
- **Links (item 5):**
  - Web `.md`: fully qualified URLs on a configurable base URL (`https://unpoly.com` in
    production builds, the preview's own host and port in development). This replaces
    the two hard-coded `https://unpoly.com` places (`config.rb` `fully_qualify_url`,
    `Documentable#guide_url`).
  - Skill: document-relative paths when the target is part of the skill, otherwise an
    absolute unpoly.com URL.
  - Everywhere: rewrite a link to `.md` only when the target has a known twin (checked
    in the sitemap); otherwise keep it extension-less. Anchors are kept.
  - One converter with pluggable link resolvers serves both.

### Serving it

- **Content negotiation (item 2):** an extension-less request gets the `.md` twin only
  when `text/markdown` is the first media type in `Accept` and not `q=0`. Otherwise HTML.
  Implemented with mod_rewrite (MultiViews and type maps were rejected). Ops question
  still open: does the nginx in front of Apache cache?
- **Promotion (item 10):**
  - `<link rel="alternate" type="text/markdown">` on every page (Unpoly updates it on
    navigation). `llms.txt` as an alternate only on the root page.
  - A visible MD button left of "Edit page", with a descriptive `title`.
  - A section on the install page (`src/unpoly/pages/install.md`, owned by the content
    track, so coordinate) with one clear recommended path: one install command and one
    `AGENTS.md`/`CLAUDE.md` line. `.md` URLs and `llms.txt` only as alternatives.
  - A mention in the unpoly repo's README and a changelog entry.
  - Not doing: HTTP `Link:` headers, a landing page mention, Claude's relevance
    suggestions (they only work for admin-allowlisted marketplaces).

### The skill

- **Where it's built (item 6):** in unpoly-site, as Middleman pages and proxies with
  templates and static files under `source/skills/`, using the same twin template with
  the skill's link resolver. `middleman build` writes it to `build/skills/unpoly-docs/`,
  and the preview serves it.
  - Build tooling is Ruby. `search.py` (adapted from makandra-cards' Bundle search) and
    its Python unit tests also live in unpoly-site; unpoly-site CI gets a Python step.
    Converter, resolvers, registry and front matter get RSpec specs. Output checks
    (links resolve, no collisions, under 1000 files, valid front matter) are stdlib Ruby.
- **Layout (item 7):** `references/api/`, `references/learn/`, `references/changes/`,
  flat below. This is the future URL shape (`/api/…`, `/learn/…`), so the skill stays
  stable across the deferred URL move. Staged index: SKILL.md lists Learn chapters and
  API modules; module pages list their features; search is the other way in.
- **Filenames (item 13):** lowercase, `[a-z0-9-]` only, `$` → `dollar-`
  (`up-dollar-compiler`), plus a kind suffix from a fixed map (`-selector` for
  selectors, `-module`, `-class`, `-event`, …). No suffix for pages (Learn, `@page`,
  changelog). Two pages mapping to one filename fail the build. The real name stays in
  front matter and is what search indexes.
- **Distribution (items 9, 11, 12, 14, 15):** unpoly.com is the only channel for v1.
  - `npx skills add https://unpoly.com` via `/.well-known/agent-skills/index.json` and a
    tarball (`SKILL.md` at the archive root).
  - Claude Code: `/plugin marketplace add https://unpoly.com/<path>/marketplace.json`,
    then `/plugin install unpoly@unpoly`. The marketplace entry uses an `archive`
    source (a zip, plugin root at the top, skill at `skills/unpoly-docs/`).
  - `index.json` and `marketplace.json` are generated from SKILL.md's front matter, so
    name and description exist once.
  - Both routes carry a version stamp. The marketplace entry's `version` must change on
    every release (users only update when it changes). SKILL.md's front matter carries
    the same stamp and the documented Unpoly version.
  - Deploy only the archives and their indexes: `config/deploy.rb` excludes `skills/**`
    via capistrano-middleman's `exclude_patterns`. The build keeps the unpacked skill.
  - Build output stays repo-ready (`skills/unpoly-docs/` plus `marketplace.json`). The
    `unpoly/unpoly-skills` repo and a `publish-skill` script are deferred until a
    channel requires a repo (e.g. Cursor Marketplace).
  - Later: an application to Anthropic's community marketplace once the skill has
    settled. No Gemini manifest.
  - Verified 2026-10-07 by Henning with a 680-file test bundle: `npx skills add <url>`
    and the Claude marketplace URL + archive route both installed correctly. Updates
    were not tested.
- **Names (items 1, 15.1):** marketplace `unpoly`, plugin `unpoly`, skill `unpoly-docs`.
  In Claude Code the skill shows as `/unpoly:unpoly-docs`.


## Open for detailed alignment

To settle with `/agree-on-everything`:

- Converter rules: parameter format, magic comments (`mark:`, `result:`, `chip:`,
  `label:`), embeds (diagram text alternatives), API hub group rows.
- Front matter fields for web and skill files.
- The full kind-suffix map, and the exact form of the version stamp.
- How the base URL is configured in development and production.
- `.md` twins for redirected old slugs (migrate redirects).
- `.htaccess`: `AddType`, `Vary: Accept`, `X-Robots-Tag: noindex` for `.md`.
- The URL path for `marketplace.json` and the zip.
- SKILL.md content and the search script adaptation.
- Where the Python tests live, and where the ranking tests run.
- MD button placement on the hubs, and its title wording.
- Install-page section wording, coordinated with the content track.


## Setup notes

- The unpoly worktree has no `dist/` of its own; it was copied from the main checkout
  for the probe. A build watcher for the worktree is needed before real work.
- capistrano-middleman deletes `build/` after a deploy, so nothing may rely on a build
  left behind by a deploy.
