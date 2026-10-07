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

### Open

- **32 content-coordination** (new): `{:toc="true"}` renames in `closing-overlays.md`,
  the install-page section (26), template/CSS changes on a branch the styling track
  moves daily, attribute renames.
- Remaining table items 4, 6–10, 12–28 (7 and 10 largely covered; 9 keeps only the root
  and hub links the twin template adds).

### Previously listed details

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
