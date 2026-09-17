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

## Landing round 3 — verdict ledger (2026-09-16; ALL APPLIED to mock v11, and Henning
APPROVED v11 as good enough for implementation)

Mock artifact: https://claude.ai/artifact/G1namZkdtXKVjExAQjTBt8 (v11 = all verdicts below).

- F1a: spec-chip line under hero CTAs: "One JavaScript file · no build step · MIT".
- F2 (F2e variant): comparison section stays htmx+SPA only. Fit list gains positive bullet
  "You want one mental model for navigation, overlays and forms — not a kit of separate
  libraries to combine." Choose-another column gains: "You need native iOS/Android shells
  around your app and don't want to write your own — Hotwire ships ready-made adapters
  for that." (single space before dash; "ready-made" per Henning).
- F3: Carson Gross quote moves to END of "Your HTML keeps its meaning" as pull-quote;
  that section also RESTATES (fresh words, not verbatim) the full-page/URL-universality
  point, e.g. "since your server can always answer with a complete page, every screen
  keeps a working address of its own". davisums + LaundroMat quotes struck. Proof strip
  becomes label "In production at" + logo wall (assets in ../unpoly-site/tmp/logo-wall/,
  9/10, TUIfy missing).
- F4 REJECTED: no maturity/"since 2015" line anywhere (reads as legacy tech; muddies story).
- F5a: fragment section's survival sentence de-twinned: "The rest of the page simply
  stays: your scroll position, your focus, the form you were halfway through." Edge-case
  bullet keeps its technical enumeration.
- F6c: chip grid = only content said nowhere else. Survivors: Loading indicators, Flaky
  networks & offline, Animated transitions, Accessible defaults. Add: Preloading,
  Conditional requests, CSP-compatible scripting, Focus trapping in overlays
  (roster subject to Henning's veto on sight).
- F7: cut "You describe the interaction. Strong defaults do the rest — and every default
  can be changed." entirely. Merge staccato: "A link still navigates and a form still
  submits — they just learn to do it better."
- F8a: section intro becomes "These are the screens that usually get an app rewritten in
  React:" (replaces "are considered out of reach… Unpoly disagrees").
- F9/coda REWORKED WHOLE (supersedes prior coda). Final text:
    h3: "… and escape hatches everywhere"
    P1 (Henning's words): "When attributes aren't enough, you can recompose Unpoly's
    behavior using its extensive JavaScript API. Every attribute has a JavaScript twin —
    [up-submit] is up.submit(), modifying attributes become options."
    CODE (Henning's, + comment): "// Let the user create a record in an overlay, then use
    the result:" / "let { email } = await up.layer.ask({ url: '/users/new' })" /
    "up.submit('#invite-form', { params: { email } })"
    (optional rigor: add acceptLocation: '/users/:email' — Henning decides at review)
    P2: "Along the way, Unpoly emits the events you wish the platform had:" + event chips.
    P3: "And your own JavaScript plugs in through compilers: enhance existing HTML tags,
    invent new elements, integrate third-party libraries, bring server-side data into
    frontend components — or mount a whole React island." (NO lifecycle/teardown sentence,
    NO config beat, NO "use them to observe" sentence, NO renderOptions event snippet.)
    Background (not for the page): a serious JS API is real maintenance cost — which is
    why it's a credible differentiator vs htmx's attributes-first minimalism.
- F10 settled: (a) lead keeps "Here is a single enhanced link:", the "One attribute."
  fragment DIES (Henning read it as AI slop), list intro = "When it's clicked, Unpoly:";
  (b) Henning's line: "Rendering only the fragment is a simple, optional optimization;
  most screens never need it." (comma splice fixed to semicolon; "simple but optional"
  -> "simple, optional"); (c) "You don't build separate fragment endpoints. Unpoly works
  with the routes you already have." (dash tail then split per d); (d) vary joints with
  full-sentence splits/parentheses/semicolons where dash tails cluster — applied to the
  fragment section's closing paragraph (list-dash, split, semicolon); spaced-out single
  tails elsewhere stay; (e) checklist unbolds items 1-2, keeps aborts/caches/Back/
  teardown bolds; hero triptych bolds stay.
- F11 settled: (b) NO design-rule promotion — the full-page fact already appears three
  times in fresh words (fragment intro parenthetical, closing paragraph, semantics
  restatement) and the degradation rule was already stated as a rule ("Every feature has
  a graceful degradation story."). Carson relocation covered by F3.
- Still open after round 3: CSS/layout-liberties discussion, TUIfy logo, optional
  makandra cold-reader test (see Open items).

## CSS/layout liberties for the build (settled 2026-09-16, Henning's guardrails verbatim in spirit)

- COLORS: stick with the _constants.sass palette (main/secondary/tertiary/quaternary);
  new variants via saturation/lightness tweaks are fine. Grays are unrestricted, but
  re-used grays become Sass variables.
- SPACING: margins/spacers may be reworked freely, but converge on a small set of
  predefined spacer levels as Sass variables — no infinite variety.
- LAYOUT: wide latitude — full-width top bar, sidebar alignment, breakpoints, mobile
  view are the agent's choice.
- DO NOT BREAK pages not discussed in this alignment, especially pages that demo a CSS
  feature or HTML selector: adapt them to the new design or keep them working. Write
  missing feature specs (spec/features/, Capybara) where regressions need a guard.
- FONT: keep Roboto (sizes/margins are tuned to it); different weights allowed. Font is
  vendored via a google-webfonts-helper-style tool (https://gwfh.mranftl.com/fonts) —
  download new weights with it.
- ARCHITECTURE: CSS stays isolated BEM blocks (source/stylesheets/guide/blocks/) with
  minimal global styles (basic typography, spacing utilities). Refresh/modernize blocks
  freely, but TALK TO HENNING before changing information architecture fundamentally —
  e.g. parameter groups (@section in the JSDoc dialect) are a recent addition and must
  not get lost in a redesign.
- BLOCK JUDGMENT: adapt/extend an existing block vs. new block by judgment. No dozens of
  modifiers forcing a block into a fundamentally different shape; but no duplicate
  "button" blocks just for a size difference (that is a modifier).
- NO CSS FRAMEWORKS (no Bootstrap/Tailwind). Just Sass compiling to CSS.
- DARK MODE: out of scope for this rework.
- BROWSER FLOOR (site CSS): last 2 years, same as the framework — :has(), container
  queries, dvh etc. are allowed.
- SASS COMPILER: stay on the pinned Ruby Sass by default; if it becomes a wall, the agent
  may switch to a newer Sass (dart-sass) and migrate the existing files.
- CONFIRMED ASSUMPTIONS: the mock's colors are placeholders — the landing page is built
  in the _constants.sass palette (mock = copy-and-structure source, not a pixel spec);
  blocks orphaned by the restructure (e.g. tree-filter styles) may be deleted after a
  grep confirms no other use.
- REGRESSION METHOD (agent's call, noted for continuity): Capybara feature specs for
  structural invariants (parameter groups/@section rendering, demo pages) + a
  before/after Playwright screenshot sweep over a hand-picked inventory of tricky pages;
  Henning sees the inventory before the sweep.

## Session boundaries (settled 2026-09-17, after the Build·Structure session overreached)

Each build session reads this before starting. Rule of thumb when unsure whether a
question is in scope: needs taste about wording -> Content session; the build breaks
without the answer -> Structure session; it's about how things look -> CSS session.

BUILD · STRUCTURE — machinery and naming, ZERO prose:
- toc.yml + Topic model, Learn/API nav split, /learn and /api hubs, dumb shared templates.
- @learn-ref and [[wikilink]] PARSING + build checks (not the ~60 insertions).
- %UNPOLY_VERSION% token, /install move mechanics, deprecated-features folding.
- Final slugs, titles and STUBS for all new/renamed pages (a stub = final slug + title +
  one placeholder line; the build checks and redirects need slugs to exist, so slug/title
  sign-off legitimately happens here). .htaccess redirects; the "no lost URL" check.
- Must NOT: write or move prose, seed pages from reference material, touch CSS beyond
  what templates force.

LANDING + CSS FOUNDATION — the visual system:
- Spacer/gray variables, refreshed BEM blocks, top bar with search pill, layout and
  breakpoints, tree-filter removal, per the CSS/layout liberties section.
- The landing page built from mock v11; screenshot sweep + feature specs for the
  don't-break contract.
- Must NOT: touch docs prose or structure; no new pages.

BUILD · CONTENT — every sentence:
- Getting-started pages, chapter overviews, new/seeded pages (fills the stubs), the ~15
  moves & splits of existing prose.
- The reference link pass: @learn-ref insertions in doc comments, citation-link ->
  wikilink migration.
- Pipeline per page: outline -> write -> critic -> humanizer -> lint -> Henning reviews.
- Must NOT: invent slugs or structure — it fills the skeleton the Structure session
  committed. Any prose the Structure session left in stub pages is noise to replace,
  not a draft to preserve.

SHIP — merges, final master sync, "no lost URL" re-check, deploy. No authoring.

Sequencing: Structure -> Landing+CSS -> Content -> Ship. Never two sessions editing
unpoly-site at the same time.

## Open items (pending task list, refreshed 2026-09-16)

Alignment (current session or its compacted continuation):
- TUIfy logo: Henning supplies an asset privately, or TUIfy leaves the wall.
- Optional: cold-reader test of the mock with 2-3 makandra developers.

Build phase (fresh sessions per station, see the progress map):
- Build·Structure: DONE 2026-09-16. toc.yml manifest + Unpoly::Guide::Toc with strict
  build checks; Learn/API nav split (one node template, one hub template, per-area menu,
  next/previous widget); @learn-ref directive and [[wikilink]] autolinks sharing one
  resolver over a Kramdown heading index; `{:.article-ref}` (84) and page-target @see (64)
  migrated; navigation/analytics/handling-asset-changes renamed with redirects; /install
  and /install/server-bindings moved into src/unpoly/pages as @page documents;
  /tutorial retired; %UNPOLY_VERSION% token; `rake docs:check_urls` ("no lost URL") and
  `rake docs:learn_refs`. Open threads handed to Build·Content in
  docs/rework-2026/handoff.md — read it before starting a station.
- Build·Content: Getting started (8), chapter overviews (10), new/seeded pages (4),
  moves & splits (~15 ops), reference link pass (~60 features).
- Landing build (parallel track): mock → real Middleman page, logo wall, search pill.

Decide at writing/build time: page order within chapters; search grouping UX (S4);
hotkeys, empty states, sidecar delivery; retiring the Algolia push for latest.

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

## Landing page (alignment in progress; state as of 2026-09-15)

CONFIRMED HERO (2026-09-15, survived a night's sleep and two refinement rounds):

    # The missing application layer for HTML

    Unpoly expands what links, forms and server-rendered pages can do:

    <a href="/tasks/123" up-target="#pane">Details</a>    <!-- updates a fragment -->
    <a href="/users/new" up-layer="new">Add user</a>      <!-- opens in a modal overlay -->
    <form up-validate>…</form>                            <!-- validates against your server -->
    <main up-poll>…</main>                                <!-- keeps itself fresh -->

    The application stays on your server — any language, any framework.
    The browser learns just enough to feel like an app.
    Your HTML keeps its meaning — agents and crawlers can read your app
    without running JavaScript.

    [ Learn Unpoly ]  [ API Reference ]  · or see it running in the demo

  Trailer structure is deliberate: three sentences, three actors (server keeps the app /
  browser learns just enough / HTML keeps its meaning). "Agents" is stated as a plain
  architectural fact — never AI-washing tone. Sentence 3 amended 2026-09-15: the earlier
  "still reads the same to humans and agents" was ambiguous (read as same-over-time =
  trivially true, instead of same-across-consumers vs. an SPA's empty div); the fix states
  the stake explicitly and echoes the section title "Your HTML keeps its meaning". Rejected trailer forms: the 44-word version
  enumerating agents/crawlers/screen readers (list moved to its own segment),
  "works without JavaScript" framing (dated; degradation story lives in the segment),
  "in HTML that..." (dangling preposition).

Settled in the 2026-09-14 session:

- PRIMARY VISITOR: the htmx/Hotwire user unhappy with their tool's craft (htmx: verbose,
  attribute soup, weird glyphs, underbuilt JS API; Hotwire: conceptual weirdness,
  frames/streams arbitrariness, Stimulus proliferation; both: unhandled edge cases,
  no graceful degradation story, polish delegated to the developer). Secondary: the
  backend dev under "maybe we need React" pressure. Explicitly conceded: devs who LIKE
  explicit/verbose minimalism — they are well served by htmx, and the fit section says so.
- POSITIONING: stands on its own feet; identity = convention-over-configuration hypermedia
  ("the application layer" thesis: HTML is a document language, Unpoly is its expansion
  pack for applications; Henning's framing "a fantasy spec for HTML6, in angle brackets
  and attributes, not JS" is keeper material). Comparisons only as informative trade-offs
  (model passage: the PDF's "Some teams want small primitives..." text); one mid-page
  section may name htmx/Hotwire respectfully; never put-downs.
- HERO FORMAT: Claim / Byline (resolution-first) / Code (4 lines: fragment update,
  overlay, validation, polling — the code is the ONLY enumeration in the hero) / Trailer
  (see confirmed hero above) / buttons [Learn Unpoly] [API Reference] + quiet "see the
  demo" text link. A hero that explains + a strong Getting started relieve the landing
  page from explaining everything. No-build-step and backend-agnostic are demoted to the
  "start small" section (adoption facts, not hero facts).
- HERO FINALIST ALTERNATES (if the slept-on pick sours):
  byline "Unpoly teaches links, forms and pages what applications need:" (warm);
  byline "Unpoly adds the application attributes that HTML never got:" (wistful);
  claim without "missing"; byline verb A/B "extends"/"multiplies";
  fallback byline family: SPA-reference ("...the interactivity of a single-page app").
- KILLED with reasons: "Keep your HTML. Lose the reloads." (category-generic — htmx could
  run it unchanged; a decade of hero drafts failed this differentiation test);
  platform-history bylines (too long-winded; lead with value); "application behavior" and
  "upgrades HTML from documents to applications" (abstract); bylines enumerating 3 features
  (arbitrary picks; the CODE is the only enumeration — it reads as examples);
  "completes/finishes HTML" (htmx docs literally say "htmx completes HTML as a hypertext");
  "primitives"/"building blocks"/"tools" as Unpoly nouns (the other temperament's
  vocabulary; htmx motto is "high power tools for HTML" — but "Unpoly upgrades the web's
  canonical set: link, form, page" survives as a concept); "reimagines" (deck cliché).
- SECTION ORDER (switcher-first re-cut; category education demoted to Learn):
  hero → "one attribute, everything handled" (Unpoly's own code, defaults enumerated
  positively — the anti-attribute-soup argument without a comparison) → what the layer
  contains (slide-15 grid framed as "the quiet parts of a real app") → grown-up escape
  hatches (JS API, render lifecycle, framework islands) → "your HTML keeps its meaning"
  segment (NEW, 2026-09-15: Unpoly enhances real HTML elements without changing what they
  are; consequences: SEO, agents reading HTML without executing JS, screen readers;
  the up-defer anecdote — lazy loading deliberately modeled as a self-loading hyperlink so
  content degrades to one click; title still open: "Progressive enhancement, by design" /
  "A link is still a link, a form is still a form" / "Enhance, don't replace") →
  "no magic, just HTTP" (wire transparency, DevTools debugging — now a separate sibling
  segment) → trade-offs (respectful, may name names; NEW material: quote htmx's own
  motivations "Why should only <a> & <form> be able to make HTTP requests?" as the honest
  philosophical contrast — htmx generalizes request-making to any element/event, Unpoly
  makes the canonical elements more capable) → fit/not-fit incl. htmx concession →
  social proof (Carson Gross first) → start small + CTA. Slide-12 request-flow diagram
  moves to Learn's "How Unpoly works", not the hero.
- TEST PROTOCOL for the hero: cold-read the styled candidates with 2-3 makandra devs
  matching the visitor profile; after an hour, ask them what Unpoly is — the byline they
  can paraphrase wins.
- LIVING MOCKUP (the copy source of truth for the landing build; iterated through 10
  versions on 2026-09-15): https://claude.ai/artifact/G1namZkdtXKVjExAQjTBt8
  Final structure and locked titles: hero (confirmed above, incl. "… and dozens more"
  code tease) → "Update only what changed" (fragment mechanic + full-pages philosophy,
  embeds the request-flow diagram from ~/Downloads/fragment_updates.png; carries the
  no-separate-fragment-endpoints differentiator) → "Edge cases included" (deep up-follow
  example + checklist + chips trimmed to invisible defaults) → "Built for tough
  requirements" (3 cards: Reactive server forms, Optimistic rendering, Complex overlay
  flows; then "… and escape hatches everywhere" coda: layered API, app-centric event
  chips — "events you wish the platform had", islands as prose mention only) →
  "Your HTML keeps its meaning" (semantics/degradation, up-defer anecdote) →
  "Is Unpoly right for you?" (htmx motivation quoted respectfully, fit lists, concession)
  → proof strip (quotes, logo wall placeholder) → "Start with one screen" closer.
  Killed during massage: "No magic, just HTTP" strip (endpoint point moved into fragment
  section); "Raising the ceiling"/other titles; Structured JavaScript card; React island
  code beat; maturity line (BUT see review below); the standalone Escape hatches screen.
- COLD REVIEW of the mock (2026-09-15, subagent, two-phase cold-then-informed):
  How-it-works model lands (quotes confirmed); "Edge cases included" is the strongest
  section. Findings queued as round 3, in three groups awaiting Henning's go:
  A (mechanical): 8 slop fixes (restating closers, "One attribute." fragment, staged
    "Unpoly disagrees", double-statement, dash tails, bold-on-every-item, "just work"),
    plus "layers all the way down" wording (collides with up-layer concept).
  B (structural): de-dupe the middle — state preservation said 3x, chips restate bullets,
    two closers restate their sections.
  C (judgment): Hotwire refugee unserved (no frames/streams/Stimulus contrast; davisums
    quote is a put-down laundered through a testimonial — replace); maturity sentence
    should return (reviewer independently reinvented the line Henning cut — it proves the
    "maintain for years" fit bullet and is the one uncopyable claim); add early clause
    that Unpoly IS a single client-side script (certainty currently arrives only in the
    last section); move Carson Gross quote next to the degradation section.
- Logo wall: 9 of 10 assets collected as verified SVGs in ../unpoly-site/tmp/logo-wall/
  (vw, audi, siemens, bosch, arm, zendesk, steady, urban-dictionary, adonisjs — all flat
  wordmarks/marks that desaturate cleanly; zendesk.svg gained a viewBox, urban-dictionary.svg
  was recolored from white to dark). TUIfy: NO public asset exists (tuify.de is domain-parked,
  Wayback shows only parking pages since 2013) — Henning must supply one privately or drop
  TUIfy from the wall. No brand-terms review, per Henning.
- NEXT SESSION: decide review groups A/B/C and apply round 3 to the mock → place logo
  assets → optional cold-reader test at makandra → then the landing build.

## Working agreements (how these sessions run; recorded 2026-09-16)

- Alignment runs as numbered decision tables with option codes; a settled decision is
  recorded in this file, the progress-map artifact is republished, and commits happen
  only on Henning's word.
- plan.md is the source of truth; the map artifact is the view; the landing mock artifact
  (https://claude.ai/artifact/G1namZkdtXKVjExAQjTBt8) is the copy source for the landing build.
- Build stations hand each other open threads in docs/rework-2026/handoff.md: one section
  per station, appended, and the station that picks an item up ticks it off there. What a
  station knowingly leaves undone goes in that file, not only in a commit message.
- Mock iteration protocol: feedback in rounds, republish the same artifact URL, yellow
  "mock-note" tags mark pending meta (never content).
- Context strategy: compact deliberately at clean boundaries (everything committed first),
  never mid-thought. Build phases run in FRESH sessions that read this file; heavy
  reading/writing is delegated to subagents so the orchestrating session stays lean.
- Henning reviews all new copy and pages; humanizer pass before review; the conventions in
  docs/contributing/documentation.md override the humanizer skill.

## Henning's copy taste (distilled 2026-09-16 from the landing sessions; binds all future copy)

- Lead with value. Never build up a problem at length — one clause of thesis, maximum.
- Concrete beats abstract. Rejected as too abstract: "application behavior",
  "upgrades HTML from documents to applications", "modern/dynamic frontend", "reads the
  same" (ambiguous axis). Accepted concreteness comes from: a felt reference (single-page
  app), experiential outcomes (in place, instant, state survives), canonical complete sets
  (the link, the form, the page), or an explicit stake (agents read your app without
  running JavaScript).
- No arbitrary feature enumerations in prose — any pick of three feels random and excludes
  the rest. CODE is the only enumeration; it reads as examples, not taxonomy.
- Every claim must pass the differentiation test: could htmx or Hotwire put this sentence
  on their page unchanged? (Killed this way: "Keep your HTML. Lose the reloads.";
  "completes HTML" — htmx's literal phrase; "high power tools" vocabulary.)
- Competitor vocabulary stays with its owner: "primitives"/"tools"/"building blocks" are
  htmx-temperament words. Quote competitors accurately and generously; concede their fit
  honestly (informative trade-offs, never put-downs).
- "Agents" is a plain architectural fact, never AI-hype tone.
- AI-slop watchlist beyond the humanizer skill: restating one-line closers, staged
  rebuttals against unattributed beliefs, dramatic fragments, bold-on-every-item,
  dash-tail clauses.
- Henning is not a native English speaker: flag non-idiomatic phrasing; he questions vague
  verbs and dangling prepositions at sentence level. Prefer plain subject-verb-object.

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
