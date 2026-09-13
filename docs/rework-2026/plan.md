# Docs rework 2026 — alignment state

Status file for the unpoly.com documentation restructuring ("Rework docs entirely 2026-08").
Written 2026-09-02 after the first alignment session. This is the source of truth for
decisions made so far; the structure below supersedes any earlier sketches.

Progress map (visual view of this file, update at end of each session):
https://claude.ai/code/artifact/733a0aa5-3bdc-4f53-840a-f1ac8254146c

Per Henning's rule: don't trust this file blindly — nothing here is implemented yet,
so verify claims about the *current* repo state against the repo.

## The big picture (argued in discovery, direction accepted, details not all settled)

- Split unpoly.com into a **Learn** section (guides, book-like, prev/next) and an
  **API reference** (modules → features, the current tree minus guide links).
- Keep the authoring model: docs live in this repo, `/*- -*/` comments + `pages/*.md`.
- URLs stay at root (`/up-follow`, `/enhancing-elements`); add `/learn` and `/api` hub pages
  (the current `/api` page shows guide links and must be rebuilt as a real reference hub).
  Old guide URLs get redirects in `src/unpoly-migrate/.htaccess`.
  DEFERRED LONG-TERM (see Deferred section): eventually move symbols under `/api/...`
  and guides under `/learn/...`.
- SETTLED 2026-09-13 — Structure architecture and manifest (final, supersedes earlier drafts):
  - Division of labor: TEMPLATES are dumb and shared across /learn and /api; they query
    Unpoly::Guide objects for type and properties, never "which area am I" conditionals.
    DIRECTIVES own every fact of a single document (@page, @module, @menu-title,
    @guide-ref, @parent, visibility). The YAML owns only relations (which pages form a
    topic, in which order; which interfaces are listed, in which order) and area-level
    presentation (linear reading with prev/next vs. lookup).
  - Consequences: module @see lists lose their navigation job (pure "see also" content);
    PROMOTED_INTERFACE_NAMES and the up.link long-text hack in interface.rb die;
    /learn and /api hub pages are generated from the model (topic titles + blurbs =
    first paragraph of first page), not hand-written.
  - Manifest: `src/unpoly/pages/toc.yml`, parsed into Unpoly::Guide::Topic objects.
    Both topic types satisfy one model contract (#title, #children, #start_page);
    templates never see the type. Entries carry an explicit `type:` key:
      learn:
        reading: linear
        topics:
          - type: page-group
            title: Getting started
            pages: [how-unpoly-works, install, ...]
          - type: page-group
            title: Overlays
            pages: [overlays, opening-overlays, ...]
      api:
        reading: lookup
        topics:
          - type: module
            module: up.link
          - type: page-group
            title: Formats
            start: none
            pages: [url-patterns, relaxed-json]
  - `start:` on a page-group: default is the first page (learn overviews are designed
    entries); `none` renders an expand-only label node (like existing group headers in
    the reference tree); may also name a specific page. Module topics derive their start
    (the module doc) and everything else from parsed source.
  - Build checks: strict shapes per type (unknown/missing keys fail); every @page listed
    exactly once across both sections; every @module exactly once in api; slugs must exist.
- SETTLED 2026-09-13 — `@learn-ref`: the single mechanism linking reference docs to Learn
  pages. Repeatable directive on features and modules: `@learn-ref <slug>[#anchor]`,
  optional explicit label indented below. Labels are derived: page title, and for anchored
  refs a composite "Page title › Heading" so labels are self-contextualizing and drift-proof.
  Rendered by the shared template in one fixed slot: below the lead paragraphs, before the
  first heading and auto-TOC — for features AND modules (replacing the module "Guides"
  lists that @see used to drive). `{:.article-ref}` is retired: all ~84 usages migrate
  (all are intro-slot); the markdown extension is deleted after migration. In-body guide
  mentions become plain markdown links. Enforcement: unresolvable slug/anchor fails the
  build; public non-deprecated @selector/@event with zero learn-refs warns; functions/
  properties/headers exempt for now (tighten later toward "every public feature has one").
- SETTLED 2026-09-13 — Writing rules & slop pass (P1+P2): no new file, no bespoke lint.
  documentation.md gains two concise sections: "Writing style" (conventions; existing pages
  are no canon — improve on them) under Writing prose, and "Overview pages" (the job 0-4
  spec, condensed) under Guide pages. The slop pass is the vendored third-party
  `humanizer` skill (blader/humanizer, MIT, v3.0.0) at .claude/skills/humanizer/ —
  kept PRISTINE so `npx skills update` works; the house overrides (passives, semantic
  adverbs, definition lists, enumeration, lead paragraphs, pedagogical guides, technical
  terms; never touch code/@directives/anchors) live in documentation.md's Writing style
  section, which agents read before writing docs and pass as context when running the
  skill. Workflow line: run humanizer before review.
  Optional later CI gate: Syntaf/vale-llm-slop (noted, not adopted).
- SETTLED 2026-09-13 — Review contract (P3): Henning reviews every overview page and
  every new or rewritten page, like any mostly-new content. Kept pages move without
  re-review. Automated gates replace eyes elsewhere: the site build, its link checker,
  the contributing-guides TOC test, and the toc.yml manifest checks. The humanizer pass
  runs before human review.
- SETTLED 2026-09-13 — Shipping (P4): big-bang from the two docs-rework branches, no
  preview stage — review happens on a local middleman server. unpoly-site builds from
  vendor/unpoly-local (symlink to ../unpoly), so local checkouts define what builds.
  Merge unpoly master into docs-rework once before the build phases start and once more
  at the end (the few in-between doc commits are processed/rewritten manually during the
  final merge). Old site keeps shipping from master meanwhile; at ship time merge both
  branches and deploy the latest stage.
- SETTLED 2026-09-13 — /install move (M4): /install becomes the Getting-started page
  Installation (`@page install`, URL unchanged), converted from ERB to markdown.
  server-bindings content moves to the Backend integration page (now ↩ moved, not ✎ new);
  redirect /install/server-bindings -> /server-bindings. bootstrap and legacy-browsers are
  too small for pages: they become ## sections of Installation ("Bootstrap integration",
  "Browser support") with anchor redirects (/install/bootstrap -> /install#bootstrap,
  /install/legacy-browsers -> /install#browser-support). Version interpolation: the parser
  replaces the token %UNPOLY_VERSION% (distinct sigil, no collision with mustache examples,
  no naming rule needed) with the current version — usable in any page, needed in code
  blocks like `unpoly@%UNPOLY_VERSION%`.
- SETTLED 2026-09-13 — Redirects (M3): rules live in `src/unpoly-migrate/.htaccess` as
  RedirectPermanent, per existing convention. Renamed API symbols need none (@deprecated
  keeps pages). /tutorial redirects to how-unpoly-works. Renamed guide pages get NEW slugs
  (M3.1A) — but slugs are hand-picked for brevity/clarity, not blindly slugified titles
  (e.g. a title word may be dropped or changed when it makes a poor slug); old slug
  redirects. Dissolved pages redirect to the ANCHOR of the absorbing section
  (e.g. /layer-terminology -> /overlays#layer-modes); absorbing sections carry stable
  {#custom-slug} anchors, verified against the M2.2 heading index. Split pages redirect to
  their majority target (/skipping-rendering -> /conditional-requests,
  /handling-everything -> /handling-all-links). The current /install SUB-PAGES flatten
  into @page structure and need redirects too: /install/server-bindings -> /server-bindings,
  /install/bootstrap and /install/legacy-browsers -> their new homes (decide slugs when
  migrating). Safety net before shipping: a one-time "no lost URL" check — every slug live
  on unpoly.com today must resolve to a page or match a redirect rule.
- SETTLED 2026-09-13 — Wikilink page autolinks: `[[slug#hash]]` (Gollum/Obsidian-style)
  expands to a markdown link with a derived label: page title, or "Page title: Subheadline"
  for anchored refs. One resolver shared with @learn-ref; heading index must handle ATX and
  setext headings, kramdown auto-IDs and explicit {#custom-slug} suffixes; unresolvable
  path/hash fails the build. Works for @page docs AND feature pages (gives #hash support
  that backtick autolinks lack). Custom labels keep using plain markdown links - one way
  per job. @see is retired entirely (module Essentials cards die; key features are
  mentioned in module intro prose with autolinks instead).
  Migration judgment for existing hand-links: migrate citation-style references where the
  link stands alone ("See [Using the discarded response](/closing-overlays#...)" ->
  "See [[closing-overlays#using-the-discarded-response]]"), accepting slightly different
  derived labels as long as the sentence still works. Do NOT migrate links whose label is
  a word woven into the sentence ("revalidate [expired](/caching#expiration) responses") -
  those stay hand-labeled markdown links.
  @see fate (settled): retired entirely. 63 page-targets -> @learn-ref; 49 module
  Essentials entries -> intro prose with autolinks (cards removed); 4 feature see-alsos ->
  prose with wikilinks/backtick autolinks.
- Tutorial dies; redirect to Getting started. `/install` content moves into this repo.
- Landing page: remix of Synthesis.pdf copy + talk diagrams ("The Limits of Hypermedia",
  RubyShift 2026). Ships independently. See "Landing page" below.
- Step 1 = restructure + new transition pages, keeping good pages untouched.
  Step 2 = per-page rewrites, later, page by page.

## Settled in the alignment session (2026-09-02)

- **Tiers**: "Getting started" (linear) + topic chapters. No separate deep-dive tier —
  it collapsed into the final chapter "Advanced rendering". No appendix, no glossary.
- **Every chapter opens with an overview page.** `loading-state.md` is the model
  (ladder of strategies, pointers to detail pages). Overviews define their chapter's terms.
- **Every Learn page ends with a "Next page" widget** (order from the TOC manifest);
  don't rely on the nav tree.
- **Guide vs. reference contract** (now in `docs/contributing/documentation.md`,
  "Where documentation lives"): guides = holistic use cases, prose, low prerequisites,
  not exhaustive; reference = every option, deep behavior/edge cases, assumes intent.
  Placement test = who does the text serve. Duplication is inevitable and intended.
- Chapter-level placements and dissolutions: see full structure below (it encodes them all).
- Trims/moves (1.24): **move** result values closing-overlays→subinteractions (a),
  Vary tables caching→optimizing-responses (c), config-defaults section
  attributes-and-options→Handling all links (g); **partial** for the ETag/304 exchange
  shared by polling/conditional-requests/up.reload (e); **no change** b, d, f, h.
- From the reference, seed/strengthen guides (reference keeps its depth):
  `[up-validate]`'s use-case halves → Validating forms + Reactive server forms;
  `[up-hungry]`'s use cases → new Hungry elements page;
  reload use case → Self-loading fragments overview;
  `[up-follow]`'s automation/use-case parts → new Following links page;
  `up.link` module intro (Motivation + SVGs) → How Unpoly works.
- Reference sidebar: fold deprecated features, collapsed by default.
- `predefined-animations`, `predefined-transitions`, `motion-tuning` → one Animation page.
  `layer-terminology` → Overlays overview. `skipping-rendering` → dissolved three ways.
  `url-patterns`, `relaxed-json` → API reference side (format specs). No "Upgrading" page.
- Getting started pages use **imperative titles**; chapter pages keep gerund titles.
- polling sits in Self-loading fragments (earlier reservation about Network resolved).

## The Learn section (v5, final for step 1 unless noted)

Markers: ✎ new · ↩ moved · ⇒ absorbed · ✂ split · § technical trailer

GETTING STARTED
  How Unpoly works ✎ (sources: RubyShift talk, up.link module intro + SVGs)
  Installation ↩ (from unpoly-site; version number via placeholder directive)
  Link to fragments ✎ (server sees normal requests, renders full pages, no backend changes)
  Submit forms ✎ (the one backend ask: error status on validation failure)
  Open overlays ✎
  Enhance elements ✎
  The shape of the API ↩ (attributes-and-options + layered-API idea from philosophy docs;
    title settled 2026-09-12)
  Where to go from here ✎ (adoption path: one screen at a time → going all-in)

LINKS — Overview ✎ · Following links ✎ · Handling all links ✂ · Preloading links ·
  Navigation bars · Clicking non-interactive elements

FORMS — Overview ✎ · Submitting forms (+invalid-form ✂) · Validating forms (strengthened) ·
  Reactive server forms (strengthened) · Switching form state · Disabling forms while working ·
  Notification flashes ↩ · Handling all forms ✂ · Watch options §

OVERLAYS — Overview ✎ (⇒ layer-terminology) · Opening overlays ·
  Closing overlays (result values moved out) · Subinteractions (gains result values ✂) ·
  Customizing overlays · Targeting other layers § · Layer context § · History in overlays §

LOADING STATE — Overview (exists; add perceived-responsiveness framing) · Feedback classes ·
  Placeholders · Previews · Optimistic rendering · Progress bar

LIVE FRAGMENTS (settled 2026-09-12; overview's first line must defuse any realtime/
  websocket connotation: no persistent connection, just HTTP) — Overview ✎ (incl.
  up.reload baseline) · Lazy loading content · Infinite scrolling · Polling · Hungry elements ✎

HISTORY — Overview ✎ · Updating history · Restoring history · Tracking page views ↩
  (analytics, reframed around location-change events)

SCROLLING & FOCUS — Overview ✎ · Scrolling · Scroll tuning § · Focus · Focus ring visibility §

NETWORK & CACHING — Overview ✎ (intro up.request briefly) · Caching (Vary tables moved out) ·
  Aborting requests · Handling network issues

ANIMATION — one page (⇒ predefined-animations, predefined-transitions, motion-tuning)

SCRIPTING (title settled 2026-09-12) — Overview ✎ · Enhancing elements with JavaScript ·
  Attaching data to elements · Templates · Framework islands ✎ (React/Vue in compilers;
  from talk) · Migrating legacy JavaScripts ↩ · Script security ↩ §

BACKEND INTEGRATION — Overview ✎ (plain HTTP by default; headers are opt-in upgrades) ·
  Optimizing responses (gains Vary tables ✂) · Conditional requests (+rendering-nothing ✂) ·
  Reacting to new deployments ↩ (handling-asset-changes, reframed) · Server bindings ✎/↩

ADVANCED RENDERING — Overview ✎ · Targeting fragments · Target derivation ·
  Providing HTML to render · Navigation defaults (navigation.md, needs rewrite: carry the
  "what counts as navigation and why" narrative) · Handling failed responses ✂ (fail-prefix
  system; trailing restatements stay as pointers) · Preserving elements (+up-keep ✂) ·
  Render lifecycle (+up:fragment:loaded ✂)

API REFERENCE side additionally: URL patterns · Relaxed JSON.

Ceasing to exist (all get redirects): layer-terminology, skipping-rendering,
predefined-animations, predefined-transitions, motion-tuning, attributes-and-options,
handling-everything, navigation (renamed), analytics (renamed),
handling-asset-changes (renamed), tutorial (site-side).

Tally: Getting started + 12 chapters, ~78 pages, ~21 new (11 overviews, 7 GS pages,
Following links, Handling all links/forms, Framework islands, Hungry elements, Server bindings).

## Open items

- Page order within chapters (decide at writing time).
- (Settled 2026-09-12: chapter titles "Live fragments" and "Scripting", GS page
  "The shape of the API", section name "Learn" confirmed.)
- Next up: process & shipping (writing skill + prose lint, review contract details,
  two-repo shipping), then landing-page skeleton. (All mechanisms settled 2026-09-13:
  manifest, @learn-ref, wikilinks, redirects, /install move — see big picture.)

## Deferred (only after content changes and the new landing page have shipped)

- **URL prefixes** (added 2026-09-12): move API symbols under `/api` (e.g. `/api/up.render`)
  and guide pages under `/learn` (e.g. `/learn/subinteractions`). Old root URLs keep
  working via `.htaccess` redirects (e.g. `/up-submit` -> `/api/up-submit`), but our own
  docs must link with the prefixes. Deferred because it causes heavy churn in the Unpoly
  sources (thousands of links); until then, hubs live at `/learn` and `/api` while pages
  stay at root.
- Step 2 per-page rewrites of kept pages.
- Rename the `Unpoly::Guide` namespace in unpoly-site to `Unpoly::Site` (added 2026-09-13).
- Backend language switcher for protocol-chapter code samples.
- Goal-based index pages ("fast", "resilient") above the chapters.

## Landing page (separate track, discovery only — nothing settled)

Structure: PDF funnel (Synthesis.pdf, ~/Documents/Unpoly/2026-06 New Landing Page/) +
talk's objection frame and diagrams. Hero: "Keep your HTML. Lose the reloads." +
subtitle w/ hypermedia/progressive-enhancement SEO nouns + "think htmx with a high-level
API" kicker + slide-12 diagram (request → full response → fragment used, with
preserved-state glyphs). Sections: update-only-what-changed snippet → pressure paragraph +
slide 3 bars → backend-stays-in-charge + slide 20 → "Three boring ideas" as fact-check
questions → client-side logic (slides 33/36/50) → hard parts grid (slide 15) →
speed ladder (slide 30, honest "mixed" verdict) → no-magic HTTP block →
fit map (slide 46) + good fit/not-a-fit lists → social proof (Carson Gross first) →
start small (satellite service / internal tool / admin backend). No backend code on the
landing page; HTTP is the neutral language. No sidebar on /; keep brand; no icon rows.
Talk PDF: ~/Downloads/The Limits of Hypermedia (RubyShift 2026).pdf. Diagrams: export
as SVG from slides (human), agent recolors to site palette (fragment_flow_*.svg as style
exemplar). Talk also = draft of "How Unpoly works" (transcribe, don't invent).

## Writing-agent guardrails (discovery consensus, to be finalized as a skill/doc)

- Voice (amended 2026-09-13): the existing guides are NOT a sacrosanct style reference —
  Henning is not a native speaker and page quality varies. The contract is a short list of
  conventions (to be added concisely to docs/contributing/documentation.md, P1): definition
  openers, task-named headings, "you"/"we", code early and often, no closing summaries,
  avoid AI-slop patterns. Exemplars (flashes, lazy-loading, enhancing-elements, etc.)
  illustrate the conventions but writers should keep what works and have the courage to
  improve the style beyond them. (Step 1 still doesn't rewrite kept pages; this applies
  to new and rewritten text.)
- Blocklist + prose lint idea (bin/lint-prose): "not X, it's Y", load-bearing, seamless,
  robust, leverage, delve, elegant, "it's worth noting", em-dashes, three-fragment runs,
  intro-about-the-intro, closing punchlines.
- Length budgets from comparable existing pages. Outline with facts per section before prose.
- Separate writer and critic agents. Approved pages join the exemplar set.
- The guide-vs-reference placement contract is in docs/contributing/documentation.md.
- **Deslop pass**: whenever a generated page is otherwise done, make a dedicated pass to
  remove "AI slop" tropes from wording and sentence structure ("not X, it's Y",
  em-dash chains, three-fragment runs, punchline endings, filler adjectives, etc.).
  The `/deslop` skill can drive this pass. This is a per-page completion step,
  in addition to the writer/critic split and any lint. Where deslop rules conflict
  with the house voice of the exemplar guides (e.g. conventional passives like
  "when no mode is given", or "See X for details and examples" pointers), house voice wins.

## Overview page spec (settled 2026-09-12)

Every chapter opens with an overview page. Jobs, in order:

0. **Scope & value** in a standalone first paragraph: what Unpoly offers for this topic,
   answering "do I want to read this?". Doubles as the chapter's blurb on the /learn hub.
1. **Mental model**: the terms and the one idea every detail page in the chapter assumes.
2. **Minimal working example** of the chapter's most common case. A reader who reads only
   the overview can already do the basic thing.
3. **Map of the 2-4 most common needs**, each a situation sentence with a taste of code,
   ordered by escalation, linking its detail page. Never lists all pages: the sidebar and
   next-page path own completeness. Include a rung only if a reader would plausibly arrive
   at the chapter *because* of that need.
4. **Boundaries** only where a likely wrong turn exists (e.g. infinite scrolling is not
   under Scrolling). Omit the section otherwise.

Jobs 0-2 are unconditional; 3 is capped; 4 is conditional. Budget: 400-800 words.
Jobs are content requirements, not a section order: default to example before model,
unless the example cannot be understood without the model. Headline features of the
topic (e.g. layer isolation) get their own section; never bury them inside the
model/terminology block (pilot review finding, 2026-09-12).
Review contract: Henning reviews every overview page like any other mostly-new content.
Chapters weight jobs differently: use-case chapters lean on the map (exemplar:
loading-state.md), concept chapters lean on the model (exemplar: the Overlays pilot).

Pilot: docs/rework-2026/pilots/overlays.md - pending Henning's review. Once approved,
both exemplars + this spec are the contract for the other ~10 overviews.

## Evidence gathered (for context, verified 2026-09-02)

- 60 guide pages, 569 public features (334 fn / 114 prop / 57 sel / 36 ev / 23 hdr).
- article-ref coverage: selectors 31/57, events 22/35, properties 15/110, functions 15/218,
  headers 0/23. Gaps mostly = prose links not yet promoted to the marker.
- Longest doc comments: [up-validate] 421 lines, up.layer.open 263, [up-layer=new] 248,
  up.compiler 201, up.request 190 — see "seed/strengthen" list for which feed guides.
- Site: /api page currently lists guides (misnomer); guides+API share one nav tree;
  interface.rb:104 hardcodes long-text rendering for up.link; deprecated features clutter
  the reference sidebar.
- Playwright screenshot setup: scratchpad of session 4f44b7f5 (shot.mjs + shots/).
