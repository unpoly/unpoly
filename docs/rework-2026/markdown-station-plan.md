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
- **Noticing unwanted output:** originally a strict converter registry (unknown elements
  and leaked raw HTML fail the build). REPLACED in detailed alignment (30.8): no registry;
  golden-file specs over representative fixture pages make every output change a
  reviewable diff. Layout elements can't leak anyway (twins render with `layout: false`).
  Raw HTML or pseudo-tags in the output are fine when a converter rule emits them on
  purpose. Dropping an element always drops its descendants.


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


## Detailed alignment (in progress)

Numbers refer to the `/agree-on-everything` decision table.

### Conversion approach (29, revises "Generation" above)

The `.md` twin still renders its HTML sibling without layout, but the converter is
**generic HTML → Markdown**. Guiderails (Henning):

- Only a few custom rules, and they must be generic (e.g. SVG → title + URL). No custom
  handlers for complex blocks such as parameter groups; they would need maintenance with
  every block change.
- The bar is "key information stays understandable for agents", not perfection.
- Missing semantics go into the HTML, **ARIA first**, so screen readers and the converter
  both benefit. Restructure markup only where ARIA can't help; new elements become BEM
  blocks. Global `h1`–`h4` styles exist, so prefer `role="heading"` over real heading tags
  that would need CSS resets.
- Toolkit, in order of preference: semantics/ARIA → generic rules → embedded HTML or
  made-up pseudo-tags (e.g. BEM block `param` → `<param>`, element `param--type` →
  `<param-type>`) → custom rules.
- Low-relevance elements are simply removed.

### Settled

- **1 twin-inclusion:** central list in `config.rb`. The doc-proxy loops register a twin
  next to each page; a short list names the plain pages (`/learn`, `/api`, `/changes`,
  `/changes/upgrading`, `/support`). Release proxies register twins too.
- **2 converter-home:** `Unpoly::Guide::HtmlToMarkdown` in `lib/unpoly/guide/`, used for
  web twins and the skill alike. Differences are injected: a link resolver
  (`WebLinks(base_url)` / `SkillLinks(file_map, from)`); front matter and page lists come
  from the calling template. A `RULES` hash maps CSS selectors to actions (a method name,
  or a lambda for edge cases). Failures are hard errors in builds and in the preview.
- **3 param-format:** dropped. Parameters get whatever generic conversion produces from
  the improved semantics (30.9 ff.).
- **11 media:** images → `![alt](https://unpoly.com/images/…)`; videos →
  `[Video: <description>](https://unpoly.com/images/….webm)`, description from
  `aria-label`, `title` or `<figcaption>`. The skill ships no media. The build fails when a
  content image lacks `alt` or a video lacks a description (today all 16 images and 4
  videos have one).
- **31 skip-marker:** a dedicated attribute for chrome humans use, now
  `data-markdown="ignore"` (see 33). `aria-hidden="true"` for decorative or duplicate
  content. Both dropped.
- **30.1 headings:** `h1`–`h6` and `[role="heading"][aria-level]` → `#`. A link target's
  `id` (the heading's own, or that of its `[anchor-link]` wrapper) is appended Kramdown
  style: `` #### `[options.target]` {#options.target} ``. `<a id>` only as a fallback for
  non-heading targets. SKILL.md and `/index.md` explain the convention in one line.
  (Docs have ~190 same-page and ~780 cross-page fragment links.)
- **30.2 aria-label links:** a link's `aria-label` always becomes its Markdown text.
- **30.3 navs:** `nav` and `[role="navigation"]` → literal `<nav aria-label="…">` blocks
  with a bullet list of links inside (blank lines around it); headings inside stay.
  `search.py` skips `<nav>` blocks when indexing (as Pagefind skips them via
  `data-pagefind-ignore`).
- **30.4 drop rules:** `[data-markdown="ignore"]`, `[aria-hidden="true"]`, `[hidden]`,
  `script`/`style`/`template`/`noscript`. No controls rule (the only control in content
  is the video play button, which converts to nothing).
- **30.8 noticing changes:** golden-file specs (see Amendments).
- **Marker map** (for the contributing docs, see 27):

  | Marker | Screen readers | Pagefind | Auto-TOC | Markdown |
  |---|---|---|---|---|
  | `data-pagefind-body` | – | indexes these pages | – | – |
  | `data-pagefind-ignore` | – | skips | – | – (agents want those blocks) |
  | `toc="false"` | – | – | skips heading | – |
  | `h2`–`h4` with `id` | headings | sub-results | lists | `#` + `{#id}` |
  | `role="heading" aria-level` | headings | – | – | `#` |
  | `aria-label` on links | name | – | – | link text |
  | `aria-hidden="true"` | hidden | indexed | – | dropped |
  | `data-markdown="ignore"` | read | indexed | – | dropped |
  | `data-markdown="chip"` | read | indexed | – | `(title or text)` |
  | `svg[role=img]` + title/desc | reads title/desc | – | – | "Diagram: …" |

  Pagefind sub-results only use real `h1`–`h6` with `id`; the auto-TOC only real heading
  tags with `id`. Neither needs `role="heading"` support.

- **Attribute naming:** `data-<scope>-ignore` for single-purpose switches:
  `data-pagefind-ignore` (unchanged), `data-toc-ignore` (replaces `toc="false"`),
  `data-toc-include` (replaces `toc="true"`, used 3× in `closing-overlays.md`).
- **33 markdown-roles** (supersedes 31's attribute): one attribute `data-markdown` with
  a small vocabulary. `ignore` drops the element and its contents. `chip` writes
  `(<title or text>)`, using `title` when present (kind badge "JS" with
  `title="JavaScript function"` → `(JavaScript function)`; visibility and optionality
  tags → `(deprecated)`, `(optional)`). New values only for real cases; no
  multi-attribute schemes.
- **30.5 svg-diagram:** `[Diagram: <title>](<HTML page URL>#<id>)` plus `<desc>` as a
  paragraph. The diagram's `<figure>` gets `id="fragment-updates-diagram"`. An
  `svg[role=img]` without a name or without an id (on itself or its figure) fails the
  build. Inline SVG stays on the site (webfont, palette colors, computed layout).
- **30.6:** non-SVG `[role="img"][aria-label]` → `(<label>)`.
- **30.7 magic comments:** remove `mark:` and `mark-line` comments. For `chip:` and
  `label:` remove only the directive prefix (`<!-- chip: foo -->` → `<!-- foo -->`).
  Keep `result:` unchanged.
- **30.9:** parameter signature gets `role="heading"`, `aria-level` 4 under titled
  parameter groups, 3 otherwise. No real `h4` (global heading styles). Parameter groups
  stay (outline for long lists). Optionality tags get `data-markdown="chip"`.
- **30.10 / 30.14 icons:** one helper `icon(name, label: nil)` (backed by
  `Unpoly::Guide::Icon` for `lib/`). Without label: `aria-hidden="true"`. With label:
  `role="img" aria-label=… title=…` → `(label)` in Markdown. All 18 `<i class="fa …">`
  usages switch to it; CSS pseudo-element icons stay.
- **30.11 types:** a `<span class="types--or"> | </span>` between type chips, visually
  hidden by default. During implementation, try showing the pipe in place of the
  separating borders; Henning decides visually from side-by-side screenshots.
- **30.12 reading nav:** `prev_link(page)` / `next_link(page)` helpers render the links
  (`aria-label="Previous: <title>"`, icons via `icon`) and record head links emitted as
  `<link rel="prev">` / `<link rel="next">`. All head links (incl. the Markdown
  alternate) go through one `head_link(rel:, href:, type: nil)` collector. The nav gets
  `aria-label="Reading order"`.
- **30.13:** `data-markdown="ignore"` on Edit link, MD button, parameter minitoc items,
  "Revision on GitHub" button. The in-text auto-TOC stays (agents peek at the first
  lines of long pages).
- **30.15 H1:** breadcrumb `data-markdown="ignore"` (the module is the closest hub
  linked by 9, and in front matter), subtitle `data-markdown="chip"` →
  `# up.render([target], [options]) (JavaScript function)`. Structure unchanged
  (Pagefind titles).
- **30.16 preview cards:** a container (`li`) with `[up-expand]`; title is
  `role="heading"` (level 3 under "Essentials"/"All features"), the link only on the
  signature, the kind badge after the signature in the DOM (CSS keeps its visual
  position) with `data-markdown="chip"`, summary as a paragraph.
- **30.17 admonitions:** generic conversion (`> #### Tip` + text). No GFM alerts.
  Decision 5 dropped.

### Settled, second pass (final; overrides earlier sections where they disagree)

Corrections to earlier entries:

- **30.15:** the module is NOT in the front matter (8.2B dropped it). After the
  breadcrumb's `data-markdown="ignore"`, the nav one-liner (9) is the only place a
  feature page names its module — which is why it links the module page, not `/api`.
- **Search:** the cards script is a donor of ideas and tests, not a spec. The new
  script is written for the Unpoly docs.
- The round-1 "description/area/kind in front matter" sketches are superseded by 8.2B.

Decisions:

- **4, 6, 7, 10:** covered by 30.7 (magic comments), 30.5 (embeds), generic conversion
  (hub rows), and 30.7 + highlighting classes (code fences: fence language from the
  existing `language-*` class).
- **8 front-matter (8.2B):** identical on web and skill; only what the body doesn't say
  in a fixed, trivially-extracted spot: `name` (bare symbol, API symbols only — powers
  the exact-name boost), `area` (API | Learn | Changes | Support — result badge),
  `visibility` (`deprecated` or `experimental`, absent when stable — rank down),
  `url` (canonical page URL — provenance), `released` (release pages only). NO title,
  kind, module, description, names. Search takes the title from the first `# ` line
  (chip stripped) and shows match-context snippets (8.1C). `names` is added only if
  the ranking-query tests cannot rank parameter queries without it (reopens 8).
- **9 nav-block (9C+):** one line between front matter and H1, a one-line `<nav>` so
  the search's nav-skip rule covers it (renderers show raw link syntax inside; fine):
  `<nav aria-label="Unpoly docs">[All docs](https://unpoly.com/index.md) · [up.fragment module](https://unpoly.com/up.fragment.md)</nav>`
  Closest hub: API feature → its module page (labelled "… module"); module/class/API
  page → `/api.md`; Learn → `/learn.md`; releases + upgrading → `/changes.md`;
  `/support` and hubs → root link only. Links go through the link resolver (relative in
  the skill; root link becomes `SKILL.md`).
- **12 base-url (12A):** `build?` → `https://unpoly.com` (env `BASE_URL` overrides);
  `server?` → derived per-request from the incoming host and port (4567 and 4568 both
  just work). Replaces the two hard-coded origins (`config.rb` `fully_qualify_url`,
  `Documentable#guide_url`).
- **13 redirect-twins (13C+):** one generic rule: a `.md` request whose file does not
  exist 301s to the path without `.md`. No retroactive redirect twins (no `.md` URL
  ever existed). Contributing-docs note: future page renames add `.md` twins of their
  redirects.
- **14 htaccess (14A):** `AddType text/markdown; charset=utf-8 .md`; 2A negotiation
  (Markdown FIRST in Accept, not q=0; `RewriteCond %{DOCUMENT_ROOT}/$1.md -f`); root
  `/` negotiates to `/index.md`; the 13C fallback; `Header merge Vary Accept` on
  text/html|markdown; `X-Robots-Tag: noindex` on `.md`. Placed after the trailing-slash
  redirect, before the index.html rewrite. `/llms.txt` is a second build output of the
  root index (served text/plain). Verification: the research's curl matrix against
  staging — deploy-day checklist, see Hand-offs.
- **15 nginx-cache:** answered — no upstream caching today. `Vary` ships as
  future-proofing; CDN note in the deploy checklist. Nothing gates negotiation.
- **16 md-button (16A+):** label `MD`, styled like the Edit link, left of Edit (features,
  interfaces) and left of the revision button (releases); standalone on every other
  twinned page (hubs, topic indexes, `/support`, `/changes`, upgrading — CSS places it
  where the button row sits on doc pages). NOT on the root page. Markup:
  `link_to 'MD', "#{path}.md", class: 'md-link', type: 'text/markdown', title: 'This page as Markdown — for agents and LLMs', 'data-markdown': 'ignore', 'data-pagefind-ignore': true`.
  The head `<link rel="alternate" type="text/markdown">` goes on every twinned page via
  the `head_link` collector (30.12).
- **17 root-index (17A+):** `/index.md` and `/llms.txt`, same bytes, llmstxt shape
  (H1, blockquote lead, `##` sections, one-line-described links), ONE level: Learn's
  chapters, API's modules (each with its one-sentence summary), then Changes and
  Support. The lead is hand-written copy in the generator template, ideas and tone from
  the new landing page ("The missing application layer for HTML", fragments not page
  loads, preserved state, one file / no build step, MIT). No V1/V2 links. Closing
  paragraphs (Henning's wording):
  "Unpoly is one JavaScript file with no build step, MIT-licensed." and
  "Fragment links point at the heading ending in `{#hash}`, e.g. `[label](/path#fragment)`
  points at `## Headline {#fragment}`." Final lead wording calibrated via Hand-offs.
- **18 skill-build-cost (18A):** skill pages always register; `SKIP_SKILL=1` skips them
  for quick local builds (precedent: SKIP_SEARCH_INDEX). Production builds always
  include the skill (the deploy ships the archives).
- **19 SKILL.md (19A+):** front matter `name: unpoly-docs`, trigger description:
  "Unpoly's complete documentation — all guides and API reference — as local Markdown
  files with a search script. Use when writing, reviewing or debugging anything that
  uses Unpoly: up-* HTML attributes, up.* JavaScript functions, up:* events, X-Up-*
  headers, or when upgrading an app to a newer Unpoly version."
  `metadata.unpoly_version` (documented version) and `metadata.build` (the 21A stamp).
  Body ~120 lines: what this is (from 17's lead); finding things (search first with
  usage + try-variations + OR semantics + --limit, grep fallback, then the staged
  index: embedded one-level index with relative links, module pages list every
  feature); conventions (≈5 lines: `{#hash}` anchors, sanitized filenames with real
  symbol in front-matter `name`, `url` = live page); version check (compare
  metadata.unpoly_version against the app's installed Unpoly via package.json /
  Gemfile.lock / up.version; on major mismatch tell the user and prefer the app's
  actual behavior); one support-pointer line to https://unpoly.com/support.md.
  Skill content scope (round 1): no 0.x/1.x release notes, no /support page copy.
- **20 kind-suffixes (20A, raw kinds):** suffix = the model's kind verbatim:
  `-selector -function -event -property -constructor -header -cookie`; interfaces
  `-module` / `-class`; pages (Learn, @page, changelog) no suffix. With 13F: lowercase,
  `[a-z0-9-]`, `$` → `dollar-` (`up-dollar-compiler-function.md`), `up:link:follow` →
  `up-link-follow-event.md`; filename collisions fail the build. Config objects are
  kind "property" (no special case).
- **21 version-stamp (21A, calver):** `YYYY.MMDD.HHMM` (UTC, computed once per build),
  e.g. `2026.1007.1430` — valid, strictly increasing semver. Written to
  marketplace.json `version` and SKILL.md `metadata.build`. `unpoly_version` stays a
  separate field.
- **22 archive-paths:** as verified with the test bundle:
  `/.well-known/agent-skills/index.json` + `unpoly-docs.tar.gz` (SKILL.md at archive
  root) and `/claude-plugins/marketplace.json` + `unpoly.zip` (plugin root at zip top,
  skill under `skills/unpoly-docs/`). All four written by an after_build hook (hard
  technical reason for living outside source/: they embed digests of build artifacts).
  marketplace.json content comes from SKILL.md front matter (name/description) + stamp
  + zip sha256; marketplace and plugin are both named `unpoly` (15.1 revised):
  install = `/plugin marketplace add https://unpoly.com/claude-plugins/marketplace.json`,
  then `/plugin install unpoly@unpoly`.
- **23 search script:** written fresh for Unpoly; stdlib-only Python ≥ 3.8; BM25 with
  field weights over front matter + body; tokenizer per Amendments (split at
  whitespace, strip edge punctuation, keep `.-:$` inside; compound parts as weak
  secondary tokens); exact-`name` boost; `visibility: deprecated` down-weight;
  changelog-kind down-weight; skips `<nav>` blocks (incl. the 9C+ one-liner) when
  indexing; match-context snippets; result paths skill-root-relative; cards-style
  XML-ish output (`<result score path><title><snippet>`). A fixed query set with
  expected top results (exact symbols + plain English) is part of the tests and is
  the arbiter for tokenizer/field tuning.
- **24 test-layout (24X, source-with-ignore):** `search.py`, `test_search.py` and the
  ranking-query fixtures live together in `source/skills/unpoly-docs/scripts/`; a
  `config.rb` `ignore` keeps test files out of the build, and an output check (25)
  fails the build if any `test_*` file reaches the skill output. A rake task runs the
  Python unit tests plus the ranking queries against a fresh build, wired into the
  same entry point as the RSpec suite and CI. Principle: the skill concern stays
  together under `source/skills/` unless technically impossible.
- **25 output-checks:** stdlib-Ruby build step, hard failures: every relative link in
  the skill resolves; no case-insensitive filename collisions; < 1000 files; front
  matter parses flat; no `:` or `$` in filenames; media descriptions present (11);
  no `test_*` files in the skill. Golden-file specs live in `spec/` as normal RSpec.
- **26 install-section (26A):** drafted by this station, landed by the content track at
  ship time (it owns `src/unpoly/pages/install.md`). ONE recommended path:
  `npx skills add https://unpoly.com` (also covers Claude Code, where it lands as a
  plain `/unpoly-docs` skill). Collapsed "other ways": the Claude marketplace route,
  and `.md` URLs + `/llms.txt` for agents without installs. Plus the trigger snippet
  for the project's AGENTS.md/CLAUDE.md: "When working with Unpoly (`up-*` attributes,
  `up.*` functions, `up:*` events), consult the unpoly-docs skill before guessing."
  No `extraKnownMarketplaces` material anywhere (dropped).
- **27 announce:** short section in the unpoly README; CHANGELOG entry for the next
  release; contributing-docs notes: the marker map (from "Settled" above), the
  `data-markdown` role vocabulary, ".md redirect twins on future renames". Drafts at
  implementation; Henning reviews wording before commit.
- **28 worktree-setup:** build `dist/` in the md-station unpoly worktree with unpoly's
  normal build (watcher while working); merge `docs-rework` into `docs-rework-md` in
  BOTH worktrees before starting and at least daily.
- **32 content-coordination (32A+):** mechanical edits in content-owned files (the three
  `{:toc="true"}` → `data-toc-include` renames in `closing-overlays.md`) are done by
  this station and listed in Hand-offs; prose for content-owned places (install
  section, root-index lead) goes to the content track as drafts; template/CSS conflicts
  are ours to resolve; visible-look changes (types pipe, card layout) get Henning's
  screenshot approval; THE ORCHESTRATOR MERGES our branch — this station never merges
  into docs-rework itself.


## Hand-offs

Kept current during implementation; Henning relays to the orchestrator session.

- **For the content track:**
  - Drafts in `markdown-station-drafts.md`: the install-page section (26A), the README
    section and the CHANGELOG entry (27). The root-index lead (17A+) is landed in
    `unpoly-site/source/root_index.txt.erb`; its wording is also in the drafts file.
  - Done on our branch: the three `{:toc="true"}` → `{:data-toc-include="true"}` renames
    in `closing-overlays.md`, and a "Markdown for agents" section in
    `docs/contributing/documentation.md` (marker map, `data-markdown` roles, the
    `.md` redirect on page renames). Wording review welcome.
  - New content rule the build enforces: every image needs alt text and every video an
    `aria-label` (an empty alt fails too, since Middleman's `image_tag` writes `alt=""`).
    Today's content passes; `/changes/upgrading`'s screenshot got alt text.
- **For the orchestrator:** merge of `docs-rework-md` into `docs-rework` (both repos) when
  the station ships. The unpoly-site merge touches templates the styling track also
  edits (`interface_template`, `_feature_preview`, `feature_template`, `_reading_nav`,
  `config.rb` helpers); conflicts there are ours to resolve.
- **Deploy-day checklist:**
  - Run the research's curl matrix against staging (negotiation, `.md` types, `Vary`,
    `X-Robots-Tag`, the `.md` → page 301, `/` with Claude's Accept). Add:
    `/.well-known/agent-skills/index.json` (rewritten to `/agent-skills/`),
    `/claude-plugins/marketplace.json`, and `/up.proxy.md` (an old slug: does the generic
    `.md` 301 or the unpoly-migrate redirect fire first?).
  - Confirm nginx stays cache-free; a CDN must honor `Vary: Accept`.
  - Check that `/.well-known/agent-skills/unpoly-docs.tar.gz` is served without
    `Content-Encoding: gzip` (an active `AddEncoding x-gzip .gz` would make clients
    unpack it on the fly and fail the digest check).
  - A build with `BASE_URL` set moves every absolute URL it writes (twins, marketplace,
    `guide_url`), not only the skill's.
  - `npx skills add https://unpoly.com` and the Claude marketplace route against staging
    (`BASE_URL=https://<staging-host> bundle exec middleman build` gives a build whose
    absolute URLs and marketplace archive URL point at staging).
- **Fresh-eyes review findings for Henning** (not resolved by the station: they touch an
  agreed decision or reserved wording):
  - **The `.md` rename redirect (13C note) cannot fire.** In `.htaccess` context
    mod_rewrite runs before mod_alias, so `/old.md` hits the generic `.md` → page 301
    first, then `/old` → `/new` (HTML, or the twin by negotiation). The line
    `RedirectPermanent /old-page-name.md /new-page-name.md` in the contributing docs is
    therefore dead advice. Options: drop the line from the docs (the generic rule already
    lands on the page), or make the generic rule skip paths with a redirect so agents
    land on `/new.md`. Confirm on staging with `/up.proxy.md`.
  - **Reserved wording, suggested edits:**
    - SKILL.md: "so more terms only help" overclaims (suggest "extra terms rarely hurt");
      "one file per attribute, function, event, header and module" leaves out classes,
      properties and selectors (suggest "one file per API symbol and module"); "The first
      heading is the page title, followed by its kind in parentheses" only holds for API
      pages; "ranked by matches per file" should be "by matching lines per file".
    - The AgentIndex line "Release notes for every version of Unpoly" (SKILL.md and
      `/index.md`): the skill ships only 2.x and later.
    - Root index lead: "Every page is also available as Markdown" → "Every
      documentation page …" (the landing page and imprint have no twin).
    - Install draft: "Claude Code, Codex, Cursor, Copilot, Gemini CLI and about 80 other
      agents" will go stale; suggest "and most other coding agents".
  - **Content gap (content track):** nine Learn chapters have no summary yet (Forms,
    Overlays, Live fragments, History, Scrolling & focus, Network & caching, Animation,
    Backend integration, Advanced rendering), so `/index.md` and SKILL.md list them
    without a description (17A+ wants one sentence each).
- **Pending Henning approvals:**
  - Screenshots in `~/Projects/md-station/screenshots/` (not committed):
    `side-by-side/*.before-after.png` (all pages of the `markdown` shoot suite, 1280 and
    390 px), `side-by-side/*.borders-vs-pipe.png` (the types variant). Cards and types are
    pixel-identical to before; the only visible change is the MD button. The pipe variant
    (`md-pipe-variant/`) is not applied; the shipped default keeps the borders and a
    visually hidden pipe.
  - Wording: SKILL.md (`unpoly-site/source/skills/unpoly-docs/skill.txt.erb`), the root
    index lead, the drafts file, the contributing-docs section.
  - Simplifications from the trim pass that need a decision (behavior-keeping ones are
    applied): T1 move the "This page is being written." filter into `Toc::Topic` (touches
    existing code); T2 let the layout render the MD button from the twin list instead
    of 9 template calls (risks its placement); T3 give twins their area and hub at
    registration (the preview would need a restart after a `toc.yml` change); T4 drop
    the video `title`/`figcaption` fallbacks; T5 drop the "Type:" label; T6 drop
    search.py tuning beyond decision 23 (stemming, hub/changelog factors, lead
    snippets), each against the ranking queries; T7 fail instead of skip without
    python3; T8 delete `shoot/markdown.rb` after the screenshot approval.

## Setup notes

- The unpoly worktree has its own `node_modules/` and `dist/` (`npm ci && npm run build`,
  2026-10-07).
- capistrano-middleman deletes `build/` after a deploy, so nothing may rely on a build
  left behind by a deploy.


## Implementation notes (decided by the builder)

Decisions made during implementation without asking, for Henning to confirm or revert.

- **Deploy and `.well-known`:** capistrano-middleman's archive glob (`build/**/{*,.*}`)
  never descends into dot-directories, so `build/.well-known/` would not deploy. The
  well-known files are built into `build/agent-skills/`, and `.htaccess` rewrites
  `/.well-known/agent-skills/*` there. URLs in `index.json` stay `/.well-known/…`.
- **Calver without leading zeros:** `YYYY.MMDD.HHMM` computed as numbers
  (`month * 100 + day`, `hour * 100 + minute`), so January 5, 00:05 is `2027.105.5`
  (semver forbids leading zeros). Still strictly increasing; October looks as decided.
- **Card headings at level 4:** 30.16 says "level 3 under Essentials/All features"; those
  are `h3`, so the card titles are `aria-level="4"` (nested under them).
- **Kind badge inside the heading:** the badge follows the signature *inside* the
  `role="heading"` element, so the Markdown reads `#### [up.render()](…) (JavaScript
  function)`. Visibility tags join it as chips; a stable feature renders none (it was
  hidden by CSS before).
- **Parameter heading on `.feature--param-info`:** `role="heading"` sits on the wrapper of
  signature and experimental icon, so a labelled icon lands in the heading:
  `#### [options.placeholder] (Experimental) {#options.placeholder}`.
- **"Type:" label:** besides the visually hidden pipe (30.11), the `types` helper writes a
  visually hidden `Type: ` before the types, for screen readers and the Markdown
  (`Type: string | Element`). Not asked for; remove it if unwanted.
- **Images: empty alt fails too.** Middleman's `image_tag` writes `alt=""` by default, so
  only a non-empty alt counts. Decorative images take `aria-hidden`. `/changes/upgrading`'s
  screenshot got alt text.
- **Absolute unpoly.com links in prose** (`https://unpoly.com/changes/upgrading` in
  release notes) are treated as site links: twin `.md` on the web, relative in the skill.
- **Links in a link stay one link:** a link that wraps blocks keeps its href and runs its
  blocks into the link text.
- **Contents nav:** the auto-TOC `<nav>` got `aria-label="Contents"`.
- **Fixture pages get web twins** (they are pages in every build); the skill leaves them
  out. A new fixture page `spec/fixtures/parser/markdown.md` (`/test.markdown`) has one of
  everything the converter handles, for the golden files.
- **Golden files** normalize the documented version to `<version>`, so a release doesn't
  churn them.
- **search.py:** one tuning beyond decision 23, required by the ranking queries for
  parameters (`up-accept-location` has no page of its own): an identifier that heads a
  section (a parameter heading) earns a bonus on its own term's score. Without it,
  parameter queries ranked their feature outside the top 3; `names` in the front matter
  stays out (8.2B). Stemming and hub/changelog factors are also the search agent's tuning;
  all 35 ranking queries pass against the real build.
- **`[up-target]` has no page:** the ranking query `up-target` expects `[up-follow]`
  (which documents the attribute) in the top 3, and `up-target targeting fragments` the
  guide.
- **Ranking queries in CI:** a second GitHub Actions job builds only the skill
  (`middleman build --glob 'skills/**/*'`, ~2 min) and runs `rake skill:test`. The RSpec
  job runs the Python unit tests too (and skips the ranking without a build). CI only
  runs for pushes to master and pull requests, so neither has run on `docs-rework-md`.
- **Build time:** a full build went from ~40 s to ~2.5 min wall (every page renders three
  times: HTML, web twin, skill file). `SKIP_SKILL=1` saves the skill third.
- **Accept regex:** `q=0` counts anywhere in the first media range's parameters
  (`text/markdown; charset=utf-8; q=0` stays HTML). Verified in Ruby against a table of
  real agents' headers, not in Apache (none local); on the deploy-day checklist.
- **`.md` redirects on renames:** the contributing docs ask for
  `RedirectPermanent /old.md /new.md` next to the page redirect. If Apache runs the
  generic `.md` → page 301 (mod_rewrite) before mod_alias, that line never fires and the
  agent lands on the new page's HTML (or its twin via negotiation). Check `/up.proxy.md`
  on staging; drop the note if the rewrite wins.
- **Screenshot suite:** `shoot/markdown.rb` (`bin/shoot markdown`) stays committed for
  the approval round; delete it afterwards if it has no further use.
- **Plan example vs. output (30.1):** the example `` #### `[options.target]` `` has
  backticks; the generic converter writes `#### [options.target] {#options.target}`
  (the signature is no `<code>`). SKILL.md describes the real output.
- **Fresh-eyes review, applied:** the last `<i class="fa">` (`examples/_embed`) now uses
  `icon()`; specs for `data-toc-ignore`/`data-toc-include` in `TOCInserter` and for
  `BASE_URL`; a comment that `base_url` reads Middleman's private `@locs[:rack]`; the
  AgentIndex class comment now admits the one-line descriptions it holds; three
  wording fixes in the contributing-docs section.
- **Fresh-eyes review, rejected:**
  - rubyzip instead of the 30-line ZIP writer: a new default-group dependency.
  - One rule for the duplicated Accept condition: the two lines read more plainly than
    an env-flag indirection, and a spec keeps them identical.
  - Skipping the ranking spec in plain `rspec` without an env var: a stale local build
    is visible from its README note, and `rake skill:test` (and CI) build fresh.
  - Caching the layout-less HTML render between a twin and its skill file: build time
    (~2.5 min) is acceptable for now, and the cache would have to cross Middleman's
    forked renderers.
  - The "This page is being written." duplicate and the other trim ideas: reserved for
    Henning (the trim list).

