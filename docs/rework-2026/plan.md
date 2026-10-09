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
  keeps pages). /tutorial redirects to /start/overview (originally written as
  how-unpoly-works, before the /start settlement in V7). Renamed guide pages get NEW slugs
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
  becomes label "In production at" + logo wall (assets COMPLETE at 10 in
  docs/rework-2026/logos/ — committed; "TUIfy" was a typo for TUI fly, the airline).
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

- COLORS: stick with the _constants.sass palette (file renamed to _tokens.sass in the CSS station) (main/secondary/tertiary/quaternary);
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
  in the _constants.sass palette (file renamed to _tokens.sass in the CSS station) (mock = copy-and-structure source, not a pixel spec);
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
  breakpoints, per the CSS/layout liberties section. (Tree-filter removal moved to the
  Search station when it was split out 2026-09-17: search functionality stays intact and
  restyled until its replacement exists; this line originally predated the split.)
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

EXECUTION RULES (added 2026-09-17 after the attempt-1 post-mortem; bind every station):
1. Converted prose stays verbatim. Any sentence a conversion forces you to invent is
   flagged for Henning's review — never silently written.
2. Citation-style @see inside @param bodies converts by fixed template — `See [[X]].` —
   in Structure (a deterministic retag, like {:.article-ref} -> @learn-ref). No free
   prose beyond the template. The V1 partial-migration handoff is ONLY the module
   Essentials cards.
3. Every new reader-visible sentence, anywhere (hub templates included), is either in
   Henning's review queue or not written.
4. If you need a convention another station owns (e.g. spacer variables), use a literal
   plus a TODO(<station>) comment. Never set the convention.
5. A handoff may only contain work the RECEIVING station owns per these boundaries.
   Dropping or deferring your own scope requires Henning's sign-off.
6. An answer from Henning that doesn't pick an option is NOT a verdict. Re-ask or park
   the thread; never interpret a mandate.
7. Never leave work in the git index. The staging area is empty except in the act of
   committing (on Henning's word only).
8. Planned partial migrations are written down twice: the leaving session's instructions
   say "stopping here is correct", the receiving session's say "you inherit X, finish it".

Sequencing: Structure -> Landing+CSS -> Search -> Content -> Ship (Search station added
in round 3). Never two sessions editing unpoly-site at the same time.

## Alignment round 2 — verdicts on the structure-review (2026-09-17)

Context: the first Build·Structure attempt (opus, saved on branch docs-rework-attempt-1 in
both repos, reverted from docs-rework) left docs/rework-2026/build-structure-review.md.
Its judgement calls were settled here so the Fable re-attempt executes without open calls:

- V1 (@see retirement): PARTIAL — Structure converts the 64 page-target @see to @learn-ref;
  the ~58 module→feature entries keep rendering as Essentials cards until Content replaces
  each module's cards with intro prose and deletes the @see machinery in that same pass.
  STANDING RULE: every planned partial migration is written down twice — the leaving
  session's boundary says "stopping here is correct", the receiving session's says
  "you inherit X in this state, finish it".
- V2 (renames): a page migrated without fundamental change KEEPS its master title and slug
  (Henning's hand-picked). Agents pick titles/slugs only for new pages or pages they
  fundamentally reshape (move/cut/extend/rewrite). A rename travels WITH the rewrite in
  the same Content commit. Structure performs no renames.
- V3 (module manifest): visibility is the signal. up.browser, up.migrate, up.tooltip get
  @internal in the unpoly sources; Interface#guide_page? becomes !internal? (internal
  modules render no page/menu node); manifest check = every interface with a guide page
  appears exactly once under api. A @class up.Layer header is added to
  src/unpoly-migrate/classes/layer/base.js so merge_interface re-parents isOpen/isClosed
  (fixes their breadcrumb). Spec fixtures stay excluded by source path.
- V4 (sidebar): FULL ACCORDION — expanding a node (by navigation or click) collapses
  everything outside its ancestry; the current node auto-expands ONE level (children,
  not descendants).
- V5 (dynamic values): [[=helper arg…]] tokens. Registry, parse-don't-eval: whitelisted
  names delegating to Middleman helpers; bare-word string args (optional quotes only for
  args containing spaces); per-helper signatures declared in the registry with coercion;
  unknown/malformed/mistyped token fails the build listing known tokens; substitution runs
  everywhere INCLUDING code blocks; escape: \[[=. Initial registry: version, npm_tag
  (empty on stable / @next on pre-release), size FILE (via unpoly_library_size).
  Replaces %UNPOLY_VERSION%. Wikilinks stay bare [[slug]] / [[slug#hash]] — no folding
  into helper syntax, no pipe labels (custom labels = plain markdown links).
  REJECTED with reasons: raw ERB in .md (ERB is page CONTENT in code examples —
  context.md, attributes-and-options.md; escaping would poison copy-paste examples);
  eval-in-cleanroom (arg expressions are still code; collisions can SUCCEED silently —
  %{name: "Alice"} is valid Ruby); typed call-site args (typing lives in the registry).
- V6 (changelog links): /changes pages for the CURRENT major are link-checked and fixed to
  the best-available target; older majors are ignored or fixed the same way — whichever is
  cleaner — with scoping applied to the Middleman OUTPUT pages (/changes/<version>), not
  the .md input. Incidental pre-existing fixes (e.g. the broken #options.cache anchor in
  up.RenderResult#finished) travel in their OWN commit, never buried in a station commit.
- CHANGELOG SPLIT (done, committed): docs/changes/CHANGELOG_<major>.x.md per major
  (byte-identical entries, chronology preserved), root CHANGELOG.md = tiny index with
  absolute links (unpoly.com/changes + GitHub) and the unpoly-migrate upgrade paragraph.
  Site parser merges the files by git-tag timestamp (the original file interleaves
  maintenance releases); full site suite green.
- PACKAGING (done, committed): npm and gem ship essentials only — dist sources, LICENSE,
  README, manifest, tiny changelog index; no docs/, no tests, no tmp. All sourcemap
  variants ship in npm (unminified maps were missing); the gem ships maps from the next
  release (copy_assets + gemspec glob include *.map — do NOT release manually); gemspec
  homepage + metadata URIs point at unpoly.com (changelog_uri = /changes).
- V7 (stubs + naming): stubs approach ACCEPTED — Structure creates all new pages as stubs
  (final slug, final title, @page, one-line "This page is being written." body plus an
  HTML comment naming the content sources per plan), all listed in toc.yml, strict checks
  from day one, names reviewed as one set. SETTLED slugs: chapter overviews = chapter
  nouns: links, forms, overlays, live-fragments, history, network, scrolling-and-focus,
  animation (single-page chapter), scripting, backend-integration, advanced-rendering;
  loading-state exists. New detail pages: following-links, handling-all-links,
  handling-all-forms, hungry-elements, islands (title "Framework islands"; slug shortened
  by Henning 2026-09-17), server-bindings (see the orchestrator ruling below: converted,
  not stubbed). how-unpoly-works became /start/overview.
  Renames-at-rewrite (Content): navigation -> navigation-defaults, analytics ->
  tracking-page-views; handling-asset-changes KEEPS its slug (matches the API vocabulary
  [up-asset]/up:assets:changed; only the title changes to "Reacting to new deployments").
  SETTLED (2026-09-17): Getting-started pages live under a /start/ FOLDER — the only
  directory; everything else stays flat in pages/ (no folders per chapter; react.dev
  precedent, and V2 protects existing slugs). GS pages: /start (= How Unpoly works, the
  chapter entry), /start/links, /start/forms, /start/overlays, /start/elements
  (Enhance elements), /start/api (The shape of the API), /start/next (Where to go from
  here); /install stays flat per V2. REVISED (Henning, 2026-09-17): the chapter entry
  lives INSIDE the folder as /start/overview (= How Unpoly works), so every GS file sits
  in pages/start/; bare /start redirects to /start/overview via .htaccess, and /tutorial
  redirects straight to /start/overview (no chain). Under the deferred /learn prefix this
  becomes /learn/start/overview — three segments accepted (Henning, 2026-09-17). Mechanics: the @page argument is the FULL slug
  (@page start/forms), the file path mirrors it (pages/start/forms.md), a build check
  enforces path == slug; toc.yml, @learn-ref and [[wikilinks]] all use the full slug;
  URL generation/proxies/redirects handle one path segment. Under the deferred /learn
  prefix this nests as /learn/start/forms with the standard redirects.
- ORCHESTRATOR RULING (2026-09-17, pending Henning's veto): server-bindings is CONVERTED
  by Structure (verbatim ERB -> pages/server-bindings.md, like /install), not stubbed.
  M4 explicitly settled the disposition ("now ↩ moved, not ✎ new"; v5 marks it ✎/↩ and
  the /install/server-bindings redirect must land on real content); V7's stub list only
  settled its slug. Content later reframes it per v5. Stubbing would park live content
  offline behind a "This page is being written." line until Content — a ship risk M4
  already decided against. /tutorial redirects to /start/overview (Q2; target revised
  with the /start/overview nit).
- PARTIAL-MOVE RULE: old pages stay untouched and listed in toc.yml inside their absorbing
  chapter until Content moves/dissolves them; the commit that removes or renames a page
  carries its redirect (.htaccess edits allowed to Content for exactly this);
  rake docs:check_urls enforces on every build.

## Search settlement (settled 2026-09-14; RESTORED 2026-09-18)

This section was settled by Henning in ecd0e509a and accidentally dropped when
fed42a1b0 rewrote the Open-items section two days later (its open questions were
kept, its decisions were lost). Restored verbatim; it binds the Search station.

- SETTLED 2026-09-14 — Search (via solution exploration; killed: per-area and two-stage search):
  UX stakes: global, single-stage, results in a popup, subheadline sections as individual
  results annotated with their document title, every result labeled with its area
  (Learn vs API, e.g. right-aligned badge) — but hits are NOT segregated into per-area blocks.
  PRIMARY: Pagefind + symbol sidecar.
  - Pagefind indexes the built HTML, hooked into config.rb build hooks. Layout annotations:
    data-pagefind-body scoping, area filter, weights. Add <html lang="en"> — the benchmark
    detected "unknown" language, so stemming is currently off.
  - Symbol sidecar: generated JSON of public FEATURE and PARAM names -> paths/anchors
    (param entries labeled with their owner, e.g. "up-watch-delay — [up-watch]"). Rendered
    as an exact/prefix-matched first group in the popup, above full-text hits grouped by
    page with section sub-hits, pages ordered by score. Grouping is subject to UX testing
    at build time; if the first group gets noisy, demote param entries by ranking rule.
  - Widget: slim fake-input pill ("Search docs… ⌘K") in the one-row header between
    logo/version and the nav links (Learn, API, Demo, Changes, Support, GitHub icon);
    collapses to an icon at narrow widths; launcher also goes into the hamburger menu
    (mobile currently has no search entry point at all).
  - The sidebar tree filter dies with ALL related code (menu.coffee filter/expand-help,
    two-stage search.coffee + content_search.js).
  - Dev/test: the middleman preview serves HTTP and emits no files, so search in
    development needs a build step for the indexer (rake task or similar). Basic search tests.
  - esbuild + npm migration for unpoly-site (own Procfile + bin/dev) only if it eases the
    Pagefind spike; otherwise deferred to the very end.
  - Benchmark (2026-09-14): 832 pages / 9.9 MB HTML indexed in 1.24 s; 4.7 MB chunked index.
  FALLBACK, only on file-size or result-quality problems: Algolia — either the DocSearch
  program (eligibility uncertain: unpoly.com promotes paid consulting) or a self-indexed
  push with section records (~$8-20/month at instant-search volume, legacy free plan may
  be force-migrated regardless). Old version stages (v2/v3) keep their deployed sites and
  existing Algolia indexes untouched; retiring the Algolia push for `latest` is a
  build-time cleanup.
- Next up: landing-page skeleton — the LAST open alignment stop.

## Landing+CSS quality reset (2026-10-01)

Henning reviewed the built site and found the UI work sloppy in many places; the station
is REOPENED before any other work continues. His seed list (header color mix and element
distribution, Learn navigation/width bugs, landing code-block colors, stacked segment
backgrounds, diagram SVG not honest to the PNG's semi-transparent fills, card padding,
layout breaking when navigating between the landing and sidebar pages, search results
opening without the frame, .fineprint) is NOT the work list — "Don't just address the
listed issues... We need to find a grounded, holistic approach to clean up these issues
and find more."

Root-cause diagnosis (accepted): (1) layout-state leakage — the page family
(-full-width, sidebar presence) was rendered server-side into .guide--torso while the
Unpoly main target sat INSIDE it, so fragment navigation kept a stale frame; (2) design-
fidelity misses needing a deliberate pass; (3) a verification gap — no spec or screenshot
exercised cross-family navigation or post-interaction states.

PHASE A SETTLED (Henning 2026-10-01, verified against the Unpoly source):
- .guide--torso gets [up-main=root]: the sidebar+main container is the default target
  for root-layer navigation; every server response controls torso modifiers
  (-full-width) and sidebar presence. .guide--content keeps up-main="modal".
- [wants-menu-path] is deleted. The sidebar becomes a lazy-loaded placeholder using the
  documented container pattern: a stable wrapper `<div class="guide--menu"
  up-keep="same-html">` around `<a href="/api/menu" up-defer>` (plain up-defer — the
  value "instant" doesn't exist; "insert" is the default). same-html compares the
  wrapper's INITIAL server HTML (compile-time snapshot), so the loaded menu + scroll
  state survive same-section navigation (no re-request) and crossing sections swaps the
  wrapper and re-requests. up-keep on the bare link would self-destruct on first load
  (up-defer replaces :origin).
- Implementation spec note: the kept menu must track location changes (.up-current via
  [up-nav] works on kept elements; the accordion's expand-current logic must react to
  location, not only compile).

Header spec (settled from Henning's review, binds the fix): ONE background color for the
whole top bar with all contained elements in white (no blue logo/version segment);
react.dev arrangement — left: logo + version switch; centered: search box, generous
width on wide screens; right: all nav sections + GitHub link; "Support" loses its
special style and becomes a plain nav section.

Process upgrade (binds all future verification): navigation-path feature specs (every
page family entered via direct load AND via fragment navigation from each other family,
search results, drawer, logo) and post-navigation screenshots join the evidence
standard; direct-load-only sweeps are insufficient.

WALK VERDICTS (Henning 2026-10-03, slow-down round over the C1/C2 review items):
- Text column: FLUID — minimum 660px (the width where the contents rail fits at the
  1280 breakpoint), growing with the viewport to an 880px CAP; identical on every page
  at any given window width (the A-round "same width" ruling was about page-to-page
  jumps, not about freezing across viewports); rail space stays reserved above $bp-toc;
  column centers between sidebar and rail once at its cap.
- Drawer RESTRUCTURED: top level mirrors the header as uniform rows (Learn, API, Demo,
  Changes, Support, GitHub, Older versions); Learn/API/Older versions are disclosure
  rows reusing the sidebar accordion (label navigates to the hub, chevron expands);
  eyebrow captions die. Getting started stays (13 Learn entries — "12 chapters" was
  description, not exclusion). Formats' two pages are reachable inside API's disclosure
  (grouped, no third level). The sidebar's max-width no longer caps the drawer menu.
- Header: 53px tall (the mock's height); the bar becomes $indigo-800 with all elements
  white — red retreats to accent duty (links; the LOGO STAYS ALL-WHITE, Henning f1
  2026-10-03). Solves the 4.2:1 contrast finding with measured 9.25:1.
- Children index: ONLY on chapter overviews (module pages already have "All features" —
  Henning's catch, missed by builder and reviewer); titled with a regular
  <h2 toc="false">In this chapter</h2> (TOCInserter skips [toc=false], toc_inserter.rb:122).
- Blessed as built: /support/discussions in the article frame; "Older versions" label;
  header vocabulary in the drawer; aria-label="Sections".
- Dropped: the reviewer's "click during drawer-opening causes a full load" — Henning
  could not reproduce it against a throttled server; probe artifact.
- The sync-eviction hand-off (docs/plans/sync-cache-eviction.md) stays UNTRACKED —
  docs/plans/* is gitignored by design ("implementation plans are local working notes");
  plan.md's framework bullet above carries the durable record.

AGENTIC REVIEW ROUNDS (settled 2026-10-01): the screenshot/interaction harness is
ADOPTED into unpoly-site (bin/shoot + path scripts; it has been rebuilt from session
scratchpads twice — that ends). Every Phase C batch (and future station batches) gets a
FRESH-EYES review round by an agent that did not build the work, with three
ingredients: (1) the scripted interaction matrix with measurement probes (overflow,
margins, clipping, collisions, element-behind-element, focus rings, state after
navigation sequences) — probes graduate into permanent specs; (2) a screenshot pass
judged against NAMED references (the mock, react.dev, the written specs in this file) —
unanchored "does it look good" is known-blind: the builder's own evidence normalizes
what it built (the red/blue header sat unflagged in weeks of evidence shots); (3) the
builder's claims treated as hypotheses to verify, not trust. Builder and reviewer are
never the same agent.

Phases: A architecture (settled) -> B full defect inventory (interaction-path audit +
fidelity audit vs mock v11 and the header spec; catalog grouped by root cause; NO fixes)
-> C fixes by root cause with the upgraded evidence -> D Henning reviews on the live
preview before the station closes again.

PHASE B DONE (2026-10-01): 38 defects (8 break layout / 21 sloppy / 9 nits), catalog
with evidence: https://claude.ai/artifact/Lirx3BJtsh9kLf6iuwGnyZ — all seven seeds
reproduced and mostly broader (stale frame affects EVERY link out of the landing and
persists until reload; logo clips ~1024-1200px; diagram cut off on phones; phone search
opened behind the drawer; version switch unreachable <1024px).

TASTE RULINGS A1-A10 (walked one by one with Henning, 2026-10-01, all settled):
1. (1A) The second landing band gets a light-gray tint — alternating band rhythm.
2. (2C) Code blocks: ONLY fix the pure-black default text color; tags and attributes
   keep sharing one color. Unpoly-attribute emphasis is the job of the existing <mark>
   facilities, never a token color.
3. (3A) Support/Imprint/Privacy get a sidebar-less, centered article frame (explicit
   family under Phase A).
4. (4B) ONE footer site-wide: the mock's centered, muted, small-text line (same links,
   shared source) replaces the left-aligned fineprint everywhere. Top spacing as
   margin-top so it can collapse with the last content element's bottom margin; flex/
   grid parents block collapsing, so verify in the real frame and fall back to padding
   + zeroed last-child margin if needed.
5. (5A) Diagram on phones: full-bleed horizontal scroll strip, 620px floor, visible
   peek/edge-fade. No stacked variant for now.
6. ONE text column width on every page (the rail-compatible ~670px). Where the
   contents rail is absent its space stays RESERVED, so the column never moves. On
   narrow screens the contents stays in its in-body DOM position (the CSS-only lift
   applies above the breakpoint) and the reserved space disappears. Wide code examples
   SCROLL, never stick out — the gnarliest code lives on exactly the pages with a rail.
7. Logo wall: unbalanced 7+3 wrap ACCEPTED, no change (won't-fix).
8. (8C) Header clamp() typography stays exactly as is (15-18px fluid; the item was
   thinner than first presented).
9. (9A) Version switch on phones: an "OLDER VERSIONS" section at the END of the
   drawer's nav tree, built from the same elements as the LEARN/API sections — no new
   component.
10. Search icon permanently in the head bar at EVERY width; the drawer carries no
    search (supersedes the Sep-14 "launcher also goes into the hamburger menu" line and
    dissolves the popup-behind-drawer bug by construction). Drawer contents: Learn ->
    its 12 chapters, API -> its modules (one sub-level, no leaf features/pages), plus
    Demo / Changes / Support / GitHub as plain links, OLDER VERSIONS last. Enabling
    requirement: a TEMPLATE-GENERATED complete children index on chapter overviews and
    module pages (from toc/parser data, zero prose, no review queue), hidden above
    $bp-sidebar (the index replaces the sidebar, so their visibility is mutually
    exclusive by definition), data-pagefind-ignore so it never pollutes search
    excerpts; print reveal noted as a nit, not built. This index does NOT reopen the
    overview spec's capped map — prose stays capped, the generated block is navigation.

## Quality reset: C-tail — DONE, PUSHED 2026-10-05; PHASE D IS NEXT

Built, fresh-eyes reviewed (no blockers), fix round applied, pushed: unpoly-site
8d71bbe8..d9b9960d (10 commits: 5s timeout rider / rhythm / code ink / footer /
diagram / pill contrast / catalog nits / hero comment / rhythm specs / review fixes).
Suite 379 examples 0 failures. Root cause of the zero title gap: the header offset was
margin-top and swallowed the h1 margin by collapsing; now padding-top, 25px everywhere.
PHASE D TASTE LIST (queued for Henning's live review, one at a time):
- Footer text $gray-600 = 3.57:1 on white, below AA body-text 4.5:1 (old fineprint was
  the same; 4B said "muted" — contrast vs taste call).
- Logo strip + "Is Unpoly right for you?" band now share the same tint, reading as one
  gray band split by a hairline (strict alternation vs strip identity).
- Landing footer gap ~104px (band padding can't collapse) vs 40px on doc pages.
- P12: inline code in landing prose has no chip — consistent with the docs (no chips
  anywhere); the mock had chips. Site-wide inline-code taste question.
- D5 remainder: truncated sidebar titles have no tooltip (title attrs on ~800 nodes
  grow the menu payload; a JS-on-hover title would be new behavior).
- Long-title wrap: h1 overflow-wrap:anywhere fixes the rail overflow but breaks inside
  identifiers ("…prototype.then(o / nFulfilled…") because the floated edit link narrows
  line 1 (screenshot h1-long.png in builder scratchpad).
- P9: the landing's up-defer example is 895px in the 880px box at 1280 — a real fix
  edits mock copy (goes through Henning).

PHASE D WALK VERDICTS (Henning 2026-10-05, all seven items settled):
1. Footer: color STAYS $gray-600 ("great"); HALVE the bottom padding; "Henning Koch"
   links to https://triskweline.de/ (replaces the old Twitter URL).
2. Logo wall MERGES INTO the "Is Unpoly right for you?" band — one band, one tint,
   alternation self-heals; semantics: after explaining when Unpoly is right, the
   companies it was right for. Strip's standalone band status and hairlines die.
3. Landing footer gap ~104px: accepted as built (a).
4. Inline code: stays bare everywhere (a) — no chips.
5. Sidebar tooltips: none (a) — superseded by the flank widening below.
6. LAYOUT (grew out of item 5, Henning's 1900px screenshot): ONE shared fluid FLANK
   WIDTH for sidebar and contents rail (react.dev precedent, both 320px there) —
   symmetric flanks mean the column is viewport-centered at every width. Floor measured
   from the 1280 budget (flanks + 660 column + gutters fit $bp-toc); cap ~380-400px
   picked empirically so ~95% of real menu entries fit untruncated. Column behavior
   unchanged. ALSO: h1 titles get <wbr> break opportunities AFTER "(", BEFORE ".",
   AFTER ", " (Prettier-style; overflow-wrap:anywhere stays backstop) AND fluid h1
   type via clamp (~26px phone → current desktop size). Builder shoots the worst
   titles (up.RenderJob.prototype.then etc.) at 390/660/1280 for Henning's judgment;
   the empty-parens-below-breakpoint idea is PARKED as follow-up if those still grate.
7. Landing up-defer example (P9): don't shrink code — remove the whitespace between
   the HTML element and its trailing comment, or place the comment above the element
   (either blessed), to fit the 880px box; exact resulting markup in the report.

PHASE D APPLY STACK SHIPPED (2026-10-05): unpoly-site 4055d7e7..124b25cc pushed —
footer / landing / titles / flex torso / 3:1:1 weights / 2100px frame. Suite 393
examples 0 failures; reviewed in three rounds (full, flex re-review, spot-check), all
holds. Builder decisions ratified in review: the contents rail is a server-rendered
twin of the in-text contents (one copy visible per width, display:none hides the
other from the a11y tree, rail outside the search body); article pages use half
phantom flanks in 1024-1279 to stay centered at docs-equal width. The station closes
on Henning's word after his preview pass.

FLEX TORSO (Henning 2026-10-05, supersedes the clamp()-formula flanks of verdict 6):
Henning's diagnosis of the first build: .viewport lost its purpose (no cap, no center),
the column should grow FASTER than the flanks, below 1280 the column must take the
space freed by disappearing flanks instead of leaving it empty — "are you reinventing
flexbox?" (yes). Verdicts:
- The torso becomes a FLEX ROW with sticky flanks (react.dev pattern): column
  flex-grows with priority to its 880px max, flanks (270px floor) grow only after,
  to their 400px max. .viewport becomes the flex container or dies.
  REFINED (Henning 2026-10-05, "Let's try 3:1"): not strict column-first — flex-grow
  ratio 3:1:1 (column:flank:flank), so the column takes 60% of every extra pixel and
  the flanks breathe along (at 1500: column 792, flanks 314; column caps ~1647, full
  400/880/400 picture ~1760 as before). Same weights below 1280 between column and
  sidebar.
  WIDE-SCREEN RULE (Henning 2026-10-05, correcting the ensemble-centering build; note
  react.dev does NOT center — its side space grows forever, we deliberately differ):
  flanks TOUCH THE WINDOW EDGES up to ~2100px; once the three columns hit their maxes
  (~1760) the leftover becomes growing space AROUND the centered column (flex
  space-between inside the frame). From ~2100 the ensemble stops growing and the whole
  frame centers with outer margins (torso max-width ~2100 token + auto margins). The
  HEADER contents follow the same frame: the logo stays aligned with the left flank at
  every width (same max-width + margins on the header's inner container).
- Below $bp-toc/$bp-sidebar a hidden flank's space goes to the column. Rail breakpoint
  STAYS 1280; the column snap at the boundary is ACCEPTED (option i). With the 3:1
  weights below 1280 the snap measures ~862 → 660 (the sidebar shares the freed rail
  space 1:3, so the column peaks at 861.75 at 1279, not 880).
- Article pages keep phantom flank space so the column width equals docs pages at any
  window width (the standing "identical on every page" ruling).
- The --up-scrollbar-width formula fix is DROPPED (it was Chrome-right, Firefox-wrong:
  the browsers disagree on 100vw vs hidden scrollbars — reviewer-measured). Flex sizes
  by container width, and Unpoly's BodyShifter compensates body width on overlay open,
  so no shift should remain in either engine; specced as an outcome.

Original dispatch spec:

After C1/C2, the walk batch and the search batches, these are the still-unbuilt taste
rulings and defects. The builder verifies each against the current build first (some may
have landed incidentally), fixes what remains, with the usual fresh-eyes round:
- Vertical rhythm pass, incl. Henning's walk complaint: hubs and article pages have ZERO
  margin between the top navbar and the page title.
- (2C) Code blocks: fix only the pure-black default text color; tags/attributes keep one
  shared color; no token color for Unpoly-attribute emphasis.
- (1A) Second landing band: light-gray tint (alternating band rhythm).
- (4B) ONE footer site-wide: centered, muted, small-text (mock's line; same links,
  shared source) replacing the left-aligned fineprint; margin-top for collapsing, verify
  in the real frame, fall back to padding + zeroed last-child margin.
- (5A) Diagram on phones: full-bleed horizontal scroll strip, 620px floor, visible peek/
  edge-fade; PLUS the seed-list fidelity item — the SVG honest to the PNG's fills.
  MEASURED (builder + reviewer, 2026-10-05, independently): the PNG's fills are OPAQUE
  (#cfe2f3/#f4cccc/#ffe599, identical over band and white) — the seed list's
  "semi-transparent" was a visual misread; the faithful SVG uses opaque tints.
- Nits: search pill boundary; `/` kbd hint contrast.
- The Phase B defect catalog (claude.ai/artifact/Lirx3BJtsh9kLf6iuwGnyZ) is the
  completeness check: any still-reproducible defect joins the batch.
After this batch: PHASE D — Henning reviews on the live preview; the station closes.

## Content calibration batch 1: LINKS — WRITTEN + CRITIC-PASSED + PUSHED 2026-10-05;
## AWAITING HENNING'S CALIBRATION SITTING

7 commits 59086cdcd..dfdd5fec6 (overview new / following-links NEW — it was a stub,
premise corrected / handling-all-links rewrite / 3 polish passes / critic fixes).
Critic verdict: good batch, both writer bug-fixes verified correct (.includes(),
currentClasses class name), all examples implementation-accurate, magic-comment worry
a false alarm (client-side rewrite in syntax_highlighting.js). Accuracy fixes applied:
navigation effects qualified to main-element updates; no-follow list "falls back to
default browser behavior"; "fewer [up-...] attributes". Build "All links OK",
check_urls 78/78, self-test 206/206.
SITTING QUEUE (Henning rules during/after reading /links → /following-links →
/handling-all-links → /preloading → /navigation-bars → /faux-interactive-elements):
- "Related topics" closing section on the overview: meta-ish heading vs real wrong-turn
  boundaries (fold into prose / rename / keep).
- Overview prose ~380 words vs the 400-800 spec: calibration data, reads complete.
- Module pages and T5: up.link now carries 8 @learn-refs (consistent with up.status's
  6) — are module pages exempt from the one/two-ref rule? One line wanted.
- @menu-title Overview on links.md (from the pilot; other overview stubs lack it).
- no-follow-reasons partial renders on two pages of one chapter (intended reuse).
- Retitle "Clicking non-interactive elements" (wikilinks read "See Clicking
  non-interactive elements")? Reader-visible site-wide label.
- [up-emit] example props aligned to the reference ({ id: 5 }) — neutral, revert if
  user_id read better.

QUALITY-RESET STATION: CLOSED (Henning 2026-10-06). Final tweak folded in on close:
guide flank max-width 400px -> 380px. REGIME CHANGE (Henning): further visual tweaks
arrive informally while he uses the guide — "we'll just tweak it in time then, with
no new formal station"; they run as ordinary dispatch->review->push rounds.
INCIDENT LOG (2026-10-06): a builder probe ran `git stash` on a clean unpoly-site tree
and its pop surfaced Henning's PRE-EXISTING stash (stash@{0} "WIP on master: 7f88a92
Analytics"). The stash entry SURVIVED (conflicted pops keep it); tracked files were
restored; the three untracked leftovers (source/.htaccess, _browser.erb, vendored
jquery) were removed by the orchestrator. Builders no longer use stash for comparisons.
KNOWN FLAKE needing its own look: drawer_spec "opens Learn to every chapter" failed
under load twice (passes alone); suspicion: toggle click lands on the label link
mid-animation and navigates. Queued to the frame builder's next round.

CONTENT CALIBRATION BATCH 2: SCRIPTING — WRITTEN + CRITIC-PASSED + PUSHED 2026-10-06;
AWAITING HENNING'S SITTING. 8 commits bfb75cad9..e2add178b: overview NEW (links.md
template; map = enhancing-elements lead, data, islands; tail = templates [writer's
flagged threshold call], legacy-scripts, script-security), islands NEW (React/Vue
mount/unmount via compiler+destructor, props from up-data, up-keep + same-data note,
island-owns-its-subtree boundary), core compiler guide reworked (+#macros/#hello
sections, reorg under standing permission), data/templates/legacy polish, nonce
ACCURACY FIX (meta carries the BARE nonce — critic-confirmed by independent trace; the
old prefixed examples were wrong). 6 writer example-bugfixes all critic-verified; 3 new
learn-refs (up.macro/up.destructor/up.hello). Critic fix round applied (islands
[up-follow]-in-JSX false claim removed — following is event-delegated and works inside
islands; only compiler-dependent attributes are inert).
SITTING QUEUE (Scripting): ratify overview naming "compilers" one sentence before its
example; islands @signature?; 3-paragraph Related-chapters aside too heavy?; templates
below the map threshold. Reference nit parked for some sweep: up.template.clone @return
"pass this link" → "list" (fragment.js ~3047).

(Original go record:) GO given (Henning 2026-10-06, time+quota
checked). Pages: scripting (overview; links.md is THE template), enhancing-elements,
data, templates, islands, legacy-scripts, script-security. No dissolving pages, so no
relocation pre-pass. Fresh Fable writer per a1; all walk doctrines apply.

GETTING STARTED BATCH (mass-production batch 1, authorized 2026-10-06: "Can you
already prepare the next topic so it is ready when I'm back?" — full pipeline runs
while Henning is away; his review on return, after Scripting pages 5-7):
- Relocation pre-pass (Opus): dissolve attributes-and-options VERBATIM into start/api
  ("The shape of the API" absorbs it; the config-defaults section moves to
  handling-all-links per trim g), delete page + toc entry, redirect, retarget
  referrers. Also RESOLVE the /tutorial redirect: the planned /how-unpoly-works page
  does not exist — start/overview carries the "How Unpoly works" title; verify where
  /tutorial points today and fix it to the real slug (report).
- Writer (fresh Fable): write the 7 stubs (start/overview = the chapter overview AND
  the how-Unpoly-works narrative with the fragment-updates diagram partial reserved
  for it per C4; start/links, start/forms, start/overlays, start/elements, start/api
  absorbing the layered-API idea, start/next) + rewrite install (fix the inherited
  conversion typos; the gzip-column and %UNPOLY_VERSION% questions from handoff.md are
  REPORT-ONLY). All calibration doctrines apply; links.md + scripting.md are the
  overview templates; reading order drives the next-page widget, so order = content.
- Critic pass, fix round, push — ready for Henning's sitting on return.
- PRE-PASS LANDED (06af3f055, pushed): dissolution verbatim, 8 redirects (7 old aliases
  collapsed; /config + /configuration kept pointing at /start/api — orchestrator call,
  the layered-API rewrite makes it the config explainer; /handling-all-links#defaults
  was the alternative). /tutorial already pointed at /start/overview (stale handoff
  note corrected, 99b6e4a8e). Writer dispatched (7 stubs + install + start/api rewrite
  + the handling-all-links duplication rider).
- SHIPPED 2026-10-06: full chapter written + critic-passed (accurate, no blockers —
  defaults section and the three-layer ladder source-verified) + fix round + PUSHED
  (unpoly 72b223a74..be5319dc4). Diagram EMBED mechanism shipped (unpoly-site a75e276d,
  specs 6/0): markdown pages splice registered partials via
  <div embed="fragment-updates-diagram"></div>; guard spec keeps TODO placeholders from
  shipping; the overview renders the request-flow SVG in the column.
- SITTING QUEUE (Getting started): "Your first thirty minutes" heading (borderline
  meta); the overview closer's flavor; start/links teaches two moves (critic + orches-
  trator lean keep); should the CDN snippet show a file size (install); 422 naming
  "Unprocessable Content" vs "Entity" (global sweep item); teaser read-more labels read
  bare ("Read more: Links"); /config aliases → /start/api (orchestrator call, veto-able).

STYLING ROUND SHIPPED (2026-10-06, unpoly-site 299b2c91..5df84efc pushed, spot-check
"holds", suite 414/0): aside deleted; icons 1px lower; $title-gap 40 over titles with
menu/rail on the same line; $frame-edge 25 everywhere (trade-off: flank labels lose 9px,
199 vs 150 API labels wrap at 1280 — Henning's preview call, one-line revert); .viewport
RETIRED (=frame mixin on .guide--bar + .guide--torso); real italic-400 Roboto (+23.7KB;
NOTE: bold/500 italic still faux — add cuts only if Henning wants); +outline-button
mixin shared by Next / read-more / Learn-ref buttons (title-only labels, anchors kept);
leading-"up." glue (0 lone brackets / bare-up lines at all widths). FOR HENNING, still
open from this round: variable-font option (c) decision; spy-marker reservation gap
(a/b/c, builder leans faux-bold stroke); $frame-edge width trade-off.

INCIDENTAL LIVE-SITE FIXES (2026-10-07, unpoly-site 3e2d239e+053484b0 pushed): Edit
links carried %0A (git_revision missing .strip — every live Edit link broken; fixed +
specced); trailing-slash redirects now name https explicitly (Apache behind TLS-ending
proxy built http:// Locations); the www/v3 host redirect moved above the index.html
rewrite (it leaked /index.html into redirects on second pass). OPS ITEMS (updated 2026-10-08 with Henning): (a) DOWNGRADED TO COSMETIC — the live
site sends HSTS (max-age 1y, measured; no preload token), so primed browsers upgrade
the http:// Locations internally with zero insecure hops; only first-contact-
via-old-URL visitors and non-HSTS clients (curl, crawlers, agents) see the extra hop.
The one-line nginx proxy_redirect fix stays a someday nicety. (b) DROPPED — only the
repo's .htaccess is deployed (Henning); the live /install/rails oddity is simply
MASTER's older rule, and heals when docs-rework ships.

POTENTIAL NEW STATION UNDER RESEARCH (Henning 2026-10-07): "Markdown representation
of Learn and API content" — every page as agent-friendly .md (suffix URLs, an MD button
by Edit, Accept-header negotiation via .htaccess), judged by agent-effectiveness vs
double-maintenance burden; stretch: an unpoly/unpoly-skills repo (npx skills add) with
staged indexes + a BM25 search script adapted from makandra-cards' Bundle export.
Henning's full brief: /home/henning/Documents/Unpoly/2026-10-07 Unpoly Skill.md.
Opus research dispatched 2026-10-07; report lands before any station spec.

ROUND SHIPPED (2026-10-07, unpoly-site a75e276d..a5729803 pushed, spot-check holds,
suite 425/0): diagram embed mechanism; Edit button (gray outline, responsive label,
hidden <500px); spy reservation deleted; VARIABLE ROBOTO (vendored 66.8KB, was 90;
variable reproduces the static cuts pixel-identically — measured); buttons never
underline (root cause: landing/prose a @extend .hyperlink; two documented !importants);
INSET ARCHITECTURE per Henning's ruling (frame carries clamp(20,5vw,25px) padding,
flank margins carry the gaps, flank arithmetic 245/355, text edge == logo everywhere).
FOR HENNING'S GLANCE (notes, not blockers): capped column left-aligns below 1024
(930-1023 windows show slack right — logo alignment forces it); below 1024 the Edit
button aligns with the breadcrumb line, not the title line; Embeds::PATTERN is strict
(only the exact double-quoted form; variants ship a silent empty div — parked nit).

STYLING ONE-LINERS SETTLED (Henning 2026-10-06/07, slow-down; all dispatched to the
frame builder's running round alongside the Edit-page outline button with responsive
label "Edit page" -> "Edit" -> hidden on very narrow screens):
- (1A) VARIABLE ROBOTO per option (c): variable upright file (wght 100-900) + static
  italic-400; retired static cuts deleted (~-23KB vendored, 500 free forever).
- (2X) INSET ARCHITECTURE CORRECTION: insets 25px shrinking to 20px on very narrow
  screens, and they live in the =frame MIXIN (the element that caps+centers), NOT as
  flank padding — Henning caught the regression: with flank-borne insets, flankless
  widths fell back to the column's 20px padding and the text edge misaligned with the
  logo. Column loses its own horizontal padding (doubles up); the flank<->column buffer
  becomes margin-right/left ON THE FLANKS so it vanishes with them. Width arithmetic
  reworked; alignment spec text-edge == logo-edge at narrow AND 1280.
- (3C) SPY MARKER: true bold, the width-reservation ghost machinery DELETED; the
  current item may re-wrap when marked (accepted); other items must not move.
- (4A) No bold/500-italic cuts until real bold-italic usage appears broken.

EXTENSIONS TOPIC (Henning's plan 2026-10-08, supersedes the loose placement of the two
pages; the loose MECHANICS stay as capability): new LAST Learn chapter "Extensions",
order: overview (extensions.md) -> skill ("Agent skill", near-empty stub reserved for
the Markdown station; .htaccess /agent-skill + /agent -> /skill) -> protocol-
implementations ("Protocol implementations", the table moved out of server-bindings;
cross-links back) -> legacy-browsers -> bootstrap-integration. /install's modal links
become REGULAR links (both content-modal taste calls die). /server-bindings stays in
Backend integration, loses only the table now; its refocus on the pure protocol
(liberating the header reference from the up.protocol module index) belongs to the
BACKEND INTEGRATION chapter batch — at that moment the deferred vocabulary swap is
revisited: server-bindings may retitle "The server protocol" and protocol-
implementations may inherit "Server bindings" (option (a) chosen now to avoid the
collision). Dispatched to builder (structure) + writer (five files) 2026-10-08.

TOKEN ECONOMY (Henning 2026-10-09, after blowing the weekly quota in 3 days):
- The ORCHESTRATOR session and the Markdown-station session switch to OPUS 5.5
  (compact first); Fable is reserved for FRESH CHAPTER-REGISTER PROSE subagents only —
  small content edits (blurbs, section moves, verdict application) go to Opus too.
- AGENT HYGIENE: spawn FRESH short-lived agents per round instead of resuming
  long-lived ones (a resumed agent re-processes its whole accumulated context every
  wake-up; the old reviewer reached ~650k tokens). Continuity lives in plan.md and
  self-contained briefs, never in an agent's memory.
- LEANER REPORTING: numbers-only reports, detail on request; reviewers don't re-run
  suites the builder just ran green; spot-checks for small rounds, full fresh-eyes
  rounds only for new architecture or new prose.
MARKDOWN STATION MERGED + CLOSED (2026-10-08): docs-rework-md merged into docs-rework in
both repos (unpoly 038fa7189, unpoly-site 0829f1e7); shoot/markdown.rb deleted. The
binding record stays markdown-station-plan.md (where it and this summary disagree, it
wins); drafts in markdown-station-drafts.md. What shipped onto docs-rework:
- MARKDOWN TWINS: every doc page has a `.md` twin (HTML rendered with layout:false, then
  converted; golden-file specs, no element registry); one-line `<nav>` context line,
  front matter only name/area/visibility/url/released; links go to `.md` only where a
  twin exists; absolute URLs on a BASE_URL (build → https://unpoly.com, preview → own
  host). `/index.md` == `/llms.txt` (root index: hand-written lead in
  source/root_index.txt.erb, Learn chapters, API modules, Changes, Support).
- SERVING (.htaccess): extension-less URL negotiates to the twin only when text/markdown
  is FIRST in Accept; `/` → /index.md; missing `.md` 301s to the page; Vary: Accept;
  noindex on `.md`. Build enforces alt text on images / aria-label on videos.
- SKILL `unpoly-docs` (marketplace + plugin `unpoly`): built in unpoly-site
  (source/skills/), all majors' release notes, ~813 files, stdlib-Python BM25 search.py
  with ranking-query tests (`rake skill:test`, needs python3). Install routes:
  `npx skills add --global https://unpoly.com` (recommended) and the Claude marketplace
  at /claude-plugins/marketplace.json. Calver build stamp. Only the archives deploy.
  `SKIP_SKILL=1` skips it locally; full build now ~3.5–4 min.
- /SKILL PAGE (34): canonical page for everything agent-related (install, team setup,
  "make your agent use it", use without installing). Henning did its reading pass.
- AI-TOOLS CORNER (36 rev.): quiet title-row `SKILL · [M↓] · [⧉]` via the `page_title`
  helper; the EDIT LINK IS GONE (replaces our quiet gray Edit button); copy button copies
  the page's Markdown. Narrow: SKILL hides <460px, Markdown mark <360px, Copy stays.
- SEARCH: dialog empty-state TIP links /skill (37); trigger + dialog ARIA (39, 40);
  search logic extracted to search_core.js.
- WEBMCP (41): `search_docs` + `get_page_markdown` tools in webmcp.js; Chrome origin-trial
  token in _head.html.erb (Chrome 162, renew with each Chrome release).
- `.md` links bypass Unpoly (noFollowSelectors) since Unpoly renders HTML only.
OPEN FROM THE STATION (content track, i.e. ours):
- DONE 2026-10-08 (Henning approved wording): install.md "Docs for coding agents" section,
  CHANGELOG_3.x.md Unreleased entry, README reduced to the npx command only ("README is
  minimal, we don't want to duplicate the docs site"), root-index lead calibrated and its
  skill link on base_url (all links may use the dynamic host). Closing line stays "one
  JavaScript file" (no CSS mention, Henning).
- REMOVE the "This page is being written." filter (the `blurb` lambda in
  source/learn/index.html.erb) before ship — stubs never ship.
- SKILL.md wording nits applied 2026-10-08 (1A). Still to verify `"source": "url"` for
  extraKnownMarketplaces and whether `/plugin marketplace update` updates the plugin.
DEPLOY-DAY CHECKLIST (rides with the docs-rework deploy; detail in the station plan's
Hand-offs): staging curl matrix (negotiation, .md types, Vary, X-Robots-Tag, .md→page 301,
/ with Claude's Accept, both agent-skill index URLs, /up.proxy.md redirect order); both
install routes against a BASE_URL=staging build; tar.gz served WITHOUT Content-Encoding:
gzip; WebMCP tool shape in a real Chrome (staging needs the WebMCP flag, token is bound to
unpoly.com); copy button in Safari + Firefox; nginx stays cache-free (a CDN must honor
Vary: Accept); renew the origin-trial token.

PARALLELISM CAP (Henning 2026-10-09, after 4 parallel Fable writers + Opus critics
exhausted his 5h window in ~2h): at most TWO writers in parallel; space out critics; the
5h window, not the weekly quota, is the binding limit during sprints.
CHAPTER PRODUCTION SPRINT (2026-10-09, Henning: "drive this site rework as far as we can"
within a banked quota until Monday evening): parallel Fable writers per topic under the
shared docs/rework-2026/writer-brief.md; one Opus critic per wave (fixes clear errors,
reports judgment calls); writer + critic reports condensed in docs/rework-2026/waves/.
WRITTEN + CRITIC-PASSED: Forms (10 pages, 2 batches), Loading state, Live fragments (wave 1);
History, Overlays (8 pages; layer-terminology folded into overlays#layer-modes), Scrolling &
focus, Network & caching, Animation (wave 2). WRITTEN, critic running: Backend integration
(skipping-rendering dissolved → conditional-requests; Vary tables → optimizing-responses;
handling-asset-changes titled "Reacting to new deployments"). RUNNING: Advanced rendering
batch 1 (incl. navigation → navigation-defaults rename). Renames done: analytics →
tracking-page-views. layer-option titled "Targeting other layers". PENDING HENNING: sittings
(wave 1 first), Animation one page vs four (plan says one; writer wrote four), critics'
judgment calls, server-bindings vocabulary swap + header-reference liberation (writer
recommends: no full swap; API-index "HTTP headers" group), [up-on-offline] implementation
bug (ERROR_CALLBACK vs event; code fix). Reference-doc bugs collected in waves/ for one
fix round.

SEARCH RESULT PRESENTATION (Henning 2026-10-09, from a "link to" screenshot where three
"Links"-ish results were indistinguishable): (a) every result shows its closest hub as a
small gray line UNDER the title (Learn page → topic title; API feature → module; module →
"API"; release notes → "Changes"); same lookup as the Markdown twins' context line; the
WebMCP search_docs results gain the same field. (b) topic overview pages get "(overview)"
after their title IN SEARCH RESULTS ONLY (not the sidebar), and skip the breadcrumb.
(c) "Read more" button text is cut from the search index. Marker comments
(`<!-- mark: … -->`) leaking into snippets: Henning doesn't care, leave them.
LANDED (site ce563c4b): hub and overview flag are Pagefind FILTERS, not metadata (metadata
is searchable and would add matches); the hub is config.rb#search_hub, one step closer than
the twin's nav line for guide pages (topic, not area); the twin's nav line is unchanged.
search_docs gains `hub` (null for overviews and pages without one).
START PAGE DESIGN POLISH (Henning 2026-10-09, queued): content stays; polish the visuals —
badges/chips not pretty, oversized margin above "… and escape hatches everywhere", some
sections lack visual identity vs. their siblings (especially "Your HTML keeps its
meaning"). Iterate visually (screenshots/canvas), not in prose.

GETTING-STARTED SITTING CLOSED + HUB POLISH VERDICTS (Henning 2026-10-08, slow-down):
hub: h1 "Learn Unpoly" (template copy); "+N more" counts what #all-features lists (6A);
modules with no signature features say "N features" WITHOUT a plus (2X); hover stays
color-stable underline-solid (4); Formats name underlined (5); "Mini-languages used
throughout the API." becomes the generated /formats intro, feeding its hub summary (3A).
Getting started: pages 11-14+16 verdicts — links/forms/overlays/elements approved
(two moves on start/links stay); /start/next REWRITTEN (16X: de-slop the language;
order = See a complete app -> Start with one screen -> Next chapter promoting Links;
"Look up any feature" killed). TITLES 12.2A: singular imperatives "Link to a fragment",
"Submit a form", "Open an overlay", "Enhance an element" (gerunds collide with deep
pages). 12.1A: BOLD PASS over the GS register — at most one bolded phrase per section,
always the behavioral outcome, never names/labels; rule joins the guide; bold vs <mark>
settled: bold = prose importance, mark = code attention. READ-MORES leave all four
teasers (10A; Next is the conversion; the pattern stays on chapter overviews).
15A'': the full "Shape of the API" is COPIED to attributes-and-options as ADVANCED
RENDERING's second page (stands alone, duplication OK; chapter order per Henning:
overview, attributes-and-options, navigation, targeting-fragments, target-derivation,
failed-responses, preserving-elements, providing-html, render-lifecycle); the
/attributes-and-options redirect UNWINDS (native slug again; aliases /config etc. +
the 8 referrers retarget there); /start/api trims to the ~320-word teaser (ladder +
one taste per layer + closing pointer). Blurbs (7) and install one-worders (8, 9)
accepted. Ten blurb sentences stand as pushed.

HUB DESIGN SETTLED (Henning 2026-10-08, "happy with the current look and feel"):
the NAMED REFERENCE is the Design canvas https://claude.ai/artifact/KCzLYLgPJLygjHygUknWAA
at version 1791452212-ba6c (boards Main.dc.html = /learn, Api.dc.html = /api; mock
sidebar/header are SCENERY, not spec). Settled choices: /learn = intro cross-linking
/api; Start-here block on #f2f3f8 wash (radius 10, caption START HERE, indigo
"Getting started ›" 24px bold, blurb, page links); numbered path (46px circled numbers
+ connector line), chapter title indigo bold 20px + ›, blurb, FULL page lists as red
lightly-underlined links (decoration 40%); per-chapter Overview link = REDICON style
(bold red, light red underline, 2x2-grid icon). /api = rows: gray cube icon, mono bold
indigo module name WITH light indigo underline as the link (NO per-row Overview link),
model description, signature features as red lightly-underlined mono links (max 6,
"+ N more" gray, counts real), Formats row with brackets icon, intro naming Learn.
Mock copy = content spec per the v11 precedent (intros); chapter blurbs: 10 stubs get
one seeded summary sentence (from the mock, Henning-seen) via a writer + review.
Dispatched: builder implements against the reference (iterating its draft 122b7799);
writer seeds the blurbs.

TOPIC-LESS LEARN PAGES (settled with Henning 2026-10-07/08; supersedes the
move-to-Backend-integration + chapter-rename thread, which DIES): "Bootstrap
integration" and "Legacy browser support" become their OWN @pages, recovered from the
pre-rework install material (git), formally part of the LEARN AREA but in NO chapter:
- toc.yml gains a sanctioned topic-less list (e.g. `loose:`) so the strict check stays
  strict; topic-less pages never enter the reading chain, the sidebar tree, the /learn
  hub or any children index.
- They keep the LEARN badge in search (area classification from the model) and are
  indexed normally.
- /install's optional-extensions entries become one-liners whose links open the two
  pages in MODAL OVERLAYS ([up-layer=new]; .guide--content is up-main=modal by Phase A
  design) — dogfooding layers; dismiss returns to /install with state intact.
- DIRECT LOADS (deep links, search, .md agents) render the standard docs frame WITH the
  Learn menu, no selected node (Henning's refinement — not the article frame).

HUB PAGES BATCH (specced 2026-10-07 on Henning's "OK let's spec it"; his complaint:
/learn and /api are almost unstyled, links read fat-black non-interactive — the
Structure station's deliberately dumb templates were never given an identity):
- SCOPE: /learn and /api only. Module hubs (/up.link etc.) are EXCLUDED here: their
  look changes with the late Essentials→intro-prose content batch (plan 1143) and the
  ref sweep — styling around content that will be rewritten is rework. (One exception
  allowed: cheap link-interactivity fixes that apply site-wide anyway.)
- DIRECTION (refined with Henning 2026-10-07, "I like the direction"): two deliberately
  different temperaments on shared tokens. /learn = PATH + INDEX: a prominent "Start
  here" block for Getting started on top (course entrance one click deep — the
  react.dev instinct without losing the map), then chapters in reading order, EACH
  with its pages inline as a compact link list (model data; on mobile /learn is the
  only full-curriculum index — no sidebar there). /api = DENSE CATALOG: compact rows
  per module (code-font name, model description), grouped like the sidebar, each row
  carrying its module's @signature features as quick links (model-driven, zero new
  prose), plus a search prompt ("press /"). All link affordances interactive per the
  existing family; no card-row genericness.
- NO NEW PROSE: titles, blurbs and module descriptions come from the model (structure
  station rule 385 already reviewed those words). If a blurb is missing/weak, FLAG it
  for Henning instead of writing one.
- PROCESS: builder ships a first rendered proposal on the preview + screenshots;
  Henning judges pixels and iterates informally (his standing preference: taste calls
  on rendered results, not prose descriptions).

SCRIPTING SITTING CLOSED (Henning 2026-10-07): all 7 pages approved. Page 7
/script-security approved as shipped (nonce correction confirmed by the framework's own
specs: active meta specs are bare, only a commented-out spec block carries the old
prefixed form — flagged as a one-line comment fix next time framework specs are
touched). DEFERRED, no word given: the commented-out "General advice" block stays as
is. Every earlier Scripting queue item is resolved (compilers-first ratified, islands
@signature added, asides removed station-wide, templates promoted).

SCRIPTING SITTING p.5+6 (Henning 2026-10-07, pushed 408db97e6+2f1d9197f+0b9178e9e):
/islands approved with six verdicts — data-attribute props example, bold first
React/Vue, custom-form-fields pointer, keep-section rebuilt around up:fragment:keep +
event.newData in-place updates (same-data folded in as the remounting alternative),
caution against up.hello() on framework DOM, @signature ADDED (tier live after next
index rebuild). /legacy-scripts approved with restructure: 3-sentence problem→solution
intro (Henning-blessed draft), conversion sections first, scoping folded into them,
late "Memory leaks on long-lived pages" section (+destructor pointer). BONUS BUG FIX:
preserving-elements.md's keep example listened on the Maps object instead of the
element — never fired; fixed. Page 7 /script-security verdict pending (open word:
the commented-out "General advice" block — resurrect/delete/leave).

SITTING p.3+4 (Henning 2026-10-06): /data approved with restructure (H3 "All JSON
values can be data" + sibling "Merging data attributes", c63060d8d) and a two-sentence
mechanism chooser in the intro (7d7c537d2). NEW STYLE RULE from his wording fix: no
em-dash connectives joining statements ("any JSON — and compilers...") — write two
sentences; added to the guide's style bullets. /templates approved as-is; PARKED NIT:
its h4 nesting scans poorly, no idea yet ("no idea for avoiding it").

SITTING p.2 + LEARN-BUTTON (Henning 2026-10-06): enhancing-elements approved with one
move ("Integrating JavaScript libraries" to its own H2 before "Passing data", 6713388d5
pushed). LEARN-REF SLOT RESTYLE blessed: the stripe + hand icon die; one outline button
per ref (same shared style as Next/read-more), label "Learn: <target page title>" —
breadcrumb text compresses to the title, the href keeps its section anchor; two-ref
features render two buttons side by side. One affordance family: Next / Read more /
Learn.

SITTING VERDICTS p.1 + MORE TWEAKS (Henning 2026-10-06): compilers-before-example
RATIFIED and the guide's "(usually the example before the terminology)" parenthesis
DELETED (never meant as a rule); OVERVIEW SPEC AMENDED (guide + plan): an exciting/cool
feature earns a map section even when edge-casey — /templates PROMOTED to a scripting.md
map rung (writer dispatched); the guide's "leave other pages unlisted" updated to the
"Also in this topic" reality (8a59abc08). READ-MORE RESTYLE (supersedes "quieter than
Next"): extract the Next button's outline style into a shared mixin/block, apply to
read-more links (builder). FONTS (builder, Opus): load a real italic-400 Roboto cut
(italic currently faux-synthesized); RESEARCH ONLY: byte cost of Roboto as a variable
font vs our static cuts — numbers to Henning.

RELATED-CHAPTERS REMOVED EVERYWHERE (Henning 2026-10-06, supersedes 3X and the aside
design): he tried the bleed fix and others — the block "always keeps blocking the
conversion action (Next page). The overview should get the reader excited for THIS
chapter, then have them click next page." Asides removed from links.md + scripting.md
(ae4fa1b58); the .aside CSS block and its spec die in the site (dead code; git has it
if ever needed). Cross-chapter boundaries, if one is ever truly needed, go inline in a
map section as prose — no closing block. TOC/id question moot.
STYLING ROUND (Henning 2026-10-06, dispatched): (a) menu +/- icons sit 1px too high
everywhere; (b) title-to-header margin too small — the title is closer to the blue bar
than to its own content (hierarchy violation): increase the top gap for the title AND
the left menu AND the rail (shared top line), and CHECK whether the horizontal screen-
edge padding of bar content / menu / rail should grow to match; (c) ARCHITECTURE: the
header defines frame width via .viewport while the torso carries the same rule inline —
unify (lean: a Sass mixin used by both BEM elements, .viewport retired).

OVERVIEW-REDESIGN + TWEAK ROUND SHIPPED (2026-10-06, unpoly-site 01be22cb..d2ffbf18
pushed; spot-check "holds"): flanks capped 380 (99.9% of API titles fit); Overview
child row per chapter (server-rendered, kept-menu safe; drawer intentionally stops at
chapters; generated-index chapters get none; unpoly 7c7d59afd labels all 11); read-more
style (indigo + chevron, quieter than Next); lone-bracket fix (signature-glue span +
<wbr> before #, spec un-blinded first; /api/menu +16% = 375KB gzip-friendly, shorter
class name available if wanted); drawer flake CONFIRMED TEST-ONLY (mid-slide WebDriver
click on stale coordinates; settle helper added, product untouched); Henning's own
dfc66357 (separators $gray-400) folded in. Suite 411/0.
FOR HENNING'S INFORMAL LOOK: /links page tail (mockup realized), Overview rows with
current-state (note: chapter row + Overview child both carry the current CLASS, only
Overview is filled), read-more weight, his own separator tweak in context.

OVERVIEW-REDESIGN BATCH (dispatched 2026-10-06 on Henning's "Start working on all
aligned decisions"; built from the blessed design + walk doctrines):
- Writer (unpoly, links.md as the template case): map restructure under the threshold
  — faux-interactive-elements shrinks from a full map rung to one line under a new
  "Also in this topic" H2 (carries the below-threshold tail on desktop, since the
  children index is mobile-only); every remaining map section closes with a read-more
  element as embedded HTML: <p class="read-more"><a href="...">Read more: <title></a></p>
  (recurring documented pattern, not a new markdown construct); the Related-chapters
  aside stays the page close.
- Frame builder (unpoly-site, NEXT round after the current one lands): .read-more
  block style (visually distinct button-ish link, quieter than the Next button);
  sidebar/drawer render each chapter's first page as an explicit "Overview" CHILD row
  (from @menu-title; group header keeps expanding) — fixes the /links no-current gap;
  specs + the usual review round.

CALIBRATION WALK VERDICTS (Henning 2026-10-06, slow-down walked to completion, all 9 settled):
- (3X) The overview's closing block STAYS, retitled "Related chapters"; each sentence
  names the chapter it leads to ("...is covered by the Overlays chapter"). Henning's
  concern: readers must realize they are LEAVING the topic. Style-guide lines 607/617
  read as targeting meta summaries, not cross-reference blocks.
- (8) Rail scroll-spy marker: BOLD text only — the indigo block is "way too heavy for
  a soft scroll position indicator". Guard against bold-reflow.
- (9A/10A) PAGE TAIL hierarchy: Related chapters becomes a QUIET tinted aside
  (code-block gray, full column, no border/icon); the reading nav loses its separator
  line; "Next: <title> >" becomes an outlined BUTTON (Previous stays a quiet link,
  per Henning's mockup); gap to the muted footer grows. Rationale: "Next page" is the
  conversion action and must not drown.
- PRINCIPLE (Henning): one-off elements (like the aside) are EMBEDDED HTML in the
  Markdown — no new Markdown syntax extensions for occasional constructs.
- (5A) /faux-interactive-elements KEEPS its title "Clicking non-interactive elements"
  (the gerund is house style; the slug/title mismatch is contributor-side only — if it
  ever grates, rename the SLUG with a redirect, not the reader-visible title).
- (6A) navigation-bars keeps containers BEFORE styling — Henning: "you cannot style a
  link before you named containers, because nothing will be .up-current".
- (6-APPENDIX, standing rule rider): sections should also not depend on things only
  explained in later sections; this will sometimes clash with the basic->advanced
  gradient, and balancing the two is the technical writer's job.
- (7A) The "Updating .up-current classes" H3 (render-pass mechanics) moves OUT of
  navigation-bars' first section to a standalone H2 near the bottom.
- STANDING PERMISSION (Henning 2026-10-06): the content writer may re-organize and
  un-nest sections on its own when it helps the basic->advanced gradient or the
  dependency order (anchors/referrers checked; moves reported).
- (1A) The no-follow-reasons partial stays on BOTH chapter pages. DOCTRINE (Henning):
  repetition is a feature, not a bug, for learning; every page must stand on its own —
  readers enter anywhere via search, never assume linear reading. Where repetition
  would get excessive, use a fragment link to the other page instead.
- (2A) { id: 5 } stays. PRINCIPLE (Henning): stand-alone made-up examples are freely
  changeable when it helps understanding or formatting; attention is only needed when
  multiple examples ON THE SAME PAGE build on each other. There are no cross-page
  example scenarios.
- (4X) MODULE learn-ref GUIDANCE (Henning's wording, 2026-10-06): don't duplicate
  topic chapter lists on module pages. Modules are EXEMPT from max learn-ref counts
  but should work to keep the list low; linking the overview of a highly relevant
  topic is a good way. If a topic has low cohesion, prefer linking its individual
  high-cohesion pages instead, even at more refs. CAUTION (Henning): topics and
  modules were deliberately separated to evolve independently — today's module<->topic
  symmetry (up.link <-> Links) will not hold, so "always link the overview" is too
  crude a rule. Concrete now: up.link prunes to [[links]]; other modules normalize in
  the final ref sweep under this guidance.

CALIBRATION VERDICTS ROUND 1 (Henning 2026-10-06, "Great result for our first round"):
- STANDING CONTENT RULE (all future chapters): within each page, the most basic
  knowledge comes first; the further down, the more edge-case/technical — readers
  decide when to stop scrolling. Concrete fix: navigation-bars moves "Styling current
  links" BEFORE "Matching the current location" (writer).
- TOC (dispatched): the rail TOC gets a block modifier with font +2px on items AND
  caption (uses the rail's space, matches the left menu size); the in-content TOC
  keeps its size. SCROLL SPY in the rail: highlight the currently visible section.
- SIDEBAR MENU un-compression (dispatched; enabled by the API/Learn split): node
  labels WRAP into multiple lines (no truncation — "Clicking non-interactive elements"
  truncates at many widths), icon center-aligned with the FIRST label line, reduced
  line-height inside a multi-line label without reducing between-item spacing; a
  separator between depth-1 nodes only and only between two items (margin-bottom 5px,
  padding-bottom 5px, border-bottom 1px dotted ~#d4d4d4 snapped to the nearest token).
- BLESSED (Henning 2026-10-06, "We are aligned there"): (a) overview maps use an
  importance threshold, not one-section-per-page; below-threshold pages shrink to a
  line UNDER AN "Also in this topic" (or similar) SECTION on the overview itself —
  REMINDER Henning issued: the generated children index shows ONLY on mobile (it
  replaces the sidebar), so the overview must carry the long tail on desktop too.
  (b) Uniform, visually distinct "Read more: <page>" element closes every map section
  (template-enforced convention). (c) Every chapter gets an explicit "Overview" first
  child in the sidebar (deployed-site pattern; fixes the /links no-current gap;
  @menu-title Overview stays). Settled one-liners: overview word count = guidance not
  gate; @menu-title keep. Build+content batch to be specced after the walk.

Original dispatch spec:

Gated by a1 (Henning checks time + Fable quota) and e1 (quality reset shipped incl.
Phase D — as of 2026-10-05 the Phase D apply batch is in flight and Henning still
judges the V6 title screenshots). First real Content work; Scripting is calibration
batch 2 after this one's review proves the voice.

- SCOPE (toc.yml Links group, reading order): links (chapter overview, replaces the
  stub), following-links, handling-all-links (absorbs handling-everything's link half),
  preloading, navigation-bars, faux-interactive-elements. 6 pages = one review sitting.
- SPLIT HANDLING (lean, flag at dispatch): the Opus relocation pre-pass performs the
  WHOLE mechanical handling-everything split in one commit (both halves created
  verbatim, toc.yml, redirect, page deleted) so the split never half-exists; the Fable
  writer then rewrites only the Links-side pages. handling-all-forms stays verbatim
  relocated prose until the Forms batch.
- RELOCATION DONE (2026-10-05, unpoly c9a933955, local until site checks pass):
  three link sections + intro + two both-ish sections (legacy JS, navigation defaults)
  to handling-all-links; the forms H2 to handling-all-forms. PREMISE CORRECTION for
  all future batches: redirects live in UNPOLY's src/unpoly-migrate/.htaccess (included
  by unpoly.com), NOT in unpoly-site — /handling-everything → /handling-all-links,
  and the old /handle-everything chain collapsed to one hop. OWED TO THE FORMS BATCH:
  handling-all-forms has no intro (starts at its H2) and may want a pointer to the
  navigation-defaults section that landed on the links page.
- WORKERS (d1): Opus for the relocation pre-pass commit; a fresh FABLE writer for the
  chapter prose. Writer inputs: the writing-style + overview-pages guide sections
  (Henning-authored, 08bc5f81e + 2c5adfc7f deltas), the Overlays pilot
  (docs/rework-2026/pilots/overlays.md), exemplar loading-state.md, the overview spec
  (400-800 words, example before terminology, capped map — the generated children
  index is navigation and does NOT reopen the cap), T4 example rules (derived, never
  executed; flagged prominently in the report), T5 learn-ref policy (insertions in
  this chapter's pages only; the global sweep stays the late Opus pass).
- COMMITS (T6): relocation commit(s) first (mechanical, verbatim), then rewrite
  commits per page or coherent group; [docs] prefix in unpoly.
- REVIEW (b1): agent critic pass (fresh eyes, non-writer: prose against the style
  guide, examples against the implementation, structure against the overview spec) BEFORE
  Henning; then Henning reviews the chapter ON THE LIVE PREVIEW in reading order, one
  sitting, per-page diff links + every derived example flagged in the report.
- EVIDENCE: site builds green ("All links OK"), rake docs:check_urls still 78/78 (+
  any new redirect), unpoly bin/self-test, the chapter renders in the final frame.

## Content station frame (settled with Henning 2026-10-03; T1-T6 and the September
## settlements continue to apply — this adds the operational frame)

- (a1) This orchestrator session runs the station; each chapter batch is a fresh Fable
  writer-subagent. HARD GATE: no chapter worker spawns without Henning's explicit go,
  which he gives only after checking that time and Fable quota suffice for the worker
  to terminate.
- (b1) Review unit = one chapter batch (<=6 pages) per sitting, ON THE LIVE PREVIEW
  (real frame, reading order); batch report carries per-page diff links for rewrites
  and flags every derived code example. One approval covers words + learn-refs +
  chapter position; fix rounds re-review only changes. Rendered-artifact review stays
  a travel fallback per batch.
- (c1) Calibration chapters: LINKS (archetypal; exercises the handling-everything
  split) and SCRIPTING (hardest register; islands story) — reviewed before any mass
  production. Getting started is deliberately NOT calibration material; it follows as
  the first mass-production batch once the voice is proven.
- (d1 + model map) Moves/splits run as a mechanical pre-pass inside each chapter batch
  (relocation commit by an OPUS worker; the rewrite half is the Fable writer's).
  Learn-ref insertion + citation-link->wikilink migration = ONE final OPUS sweep after
  all chapters exist (T5 authority judgment needs the complete map; ambiguous calls
  queue to Henning). Essentials-cards -> module intro prose = its own late FABLE batch
  (new reader-visible sentences, full review round), ending with the @see machinery
  deletion; it runs BEFORE the final ref sweep (intro prose is often where a ref
  belongs).
- (e1) Content starts strictly AFTER the quality reset ships, Phase D included — one
  review stream at a time; writers render into the final visual frame.

## Search formalization batch — DONE, PUSHED 2026-10-05

Built by a fresh Opus builder, fresh-eyes reviewed (no blockers), fix round applied,
verified and pushed. unpoly-site 7481c43d..64247f15 (6 commits: adopt rig / deprecation
meta prep / sidecar deletion standalone / @signature directive / ranking specs + 2px gap /
fix round). unpoly 4f1d1d5bb + a7892f964 (90 @signature markers + guide section).
Full site suite 370 examples 0 failures; index 627 pages, tier 90.
- NEW IN THE FIX ROUND: parser FIXTURES ARE EXCLUDED from the search index entirely
  (old leak, made visible by the boost: /test.signature-page ranked #1 for "page");
  Interface#merge! carries signature_tier; index smoke spec asserts tier/tier_title and
  catches mashed meta keys; the 1500ms timeout now also covers the pagefind.js import
  (hang case has no automated spec — needs devtools, declined as a new dependency).
- PARKED from this batch: selection preserved across QUERY changes (the late-swap case
  died with the sidecar — new behavior, Henning's call if wanted); SIGNATURE_PATTERN
  matches inside code fences like every other directive pattern (accepted).
- Reader-visible for Henning's preview look: "Search is unavailable right now." (blessed
  (a)), the 2px hit gap, the @signature guide section.
- POST-SHIP VERDICTS (Henning 2026-10-05): the unavailable message waits AT LEAST 5s
  (was the 1500ms timeout; rider sent to the C-tail builder). The @signature guide
  section now states usage criteria — core features many apps use, key concepts,
  beginner/intermediate guides vs edge cases and dry references ("a reader most likely
  means" was not resolvable) — rewritten and pushed (6ad09d5e5).

Original spec (as dispatched):
- The @signature DIRECTIVE: parsed on features (doc comments) and @page documents,
  replacing the config.rb stand-in lists (search_signature_pages/_features); curation
  seeded from the rig's lists (Henning's Learn walk + the generous-features philosophy);
  a terse entry in docs/contributing/documentation.md (shared-guide constraint).
- Adopt the experiment: pagefind.yml (include_characters "-.:_"), the two-number
  ranking (titleWeight 2, tierTitleWeight 10, signatureBoost 1.4, pageLength 0.6,
  CLIENT-SIDE kind ladder), the in-code explanation blocks, results max-height.
- SIDECAR DECISION — SETTLED (Henning 2026-10-05): DELETE, in its own commit ("Have a
  worker delete the symbol machinery in a separate commit"). Empty state verdict (a):
  when Pagefind fails or times out (1500ms), the results area shows a quiet one-liner
  ("Search is unavailable right now."), no spinner, dialog otherwise intact. The parked
  r4 learn-ref row idea survives only as page-metadata variant.
- DISPATCHED 2026-10-05 to a fresh Opus builder (the /exit ended the previous workers):
  4 unpoly-site slices (adopt rig / delete symbols / @signature directive / ranking
  specs + micro-item leans) + 1 unpoly [docs] commit (@signature markers + guide entry).
  Builder commits locally, no push; fresh-eyes review before push.
- Ranking mechanism specs against the REAL index (build-backed suite, per the existing
  Q7 pattern): "layer" recall of its feature pages, density #1s (csp/offline/
  autosubmit), signature lift, ladder-as-tiebreaker.
- Dialog micro-items, still awaiting Henning's one-liners (leans recorded):
  deprecated-below-cap (lean: keep literal), selection preserved across the late swap
  (lean: fix, keyed by target URL), stripe on selected row (keep as selection marker vs
  Henning's original hover-only wording), hit+hit margin-top 2px (Henning's
  instruction, queued). Section-row text in the excerpt gray: DONE on the rig.
- Un-redden the search specs (symbol examples; useSymbols assumptions), full evidence
  set, fresh-eyes review round, commit slices, push (standing permission).

RIG FINAL STATE (2026-10-04, after the client-side ladder move): the kind ladder lives
in search_dialog.js (`kindLadder`, keyed by badge meta; linear on the whole score, so
~half the old squared-index effect, re-validated not re-tuned; applies to BOTH numbers;
reload-only knob). Index-side `search_weight`/`search_weighted`/guide.erb hooks retired —
guide.erb is back to master and out of the experiment diff. Rig = 4 files: config.rb
(tier lists + meta tags), search_dialog.js, pagefind.yml, search-dialog.sass. Snapshot
moved only near-ties: [up-defer] now edges above up:deferred:load for "defer" (the
expected consequence), [up-layer=new] above up.layer.on for "layer", up-etag above the
ETag header for "etag" (the one remaining "known and accepted" comment case). SPEC
ISOLATION measured: search_spec.rb is 16/30 red purely from the rig's useSymbols:false
+ maxPages:12; with useSymbols:true + maxPages:8 all 30 pass with the ranking active —
so the batch's spec fixes must land TOGETHER with the sidecar decision, and the ranking
itself breaks nothing.

## Synonym expansion (PARKED enhancement, design captured 2026-10-04/05)

Hand-curated synonym pairs (layer<->overlay, defer<->lazy, element<->fragment...) via
client-side query enumeration: Pagefind has NO boolean query syntax (verified in docs),
so (a OR b) expands to parallel searches merged per page by best score (1-3 word
queries x ~2 synonyms = 2-8 cheap searches sharing cached chunks; cross-expansion
scores are only approximately calibrated — note per-expansion normalization if a pair
behaves asymmetrically). CONSTRAINT (Henning): synonyms are BODY evidence only — they
must never feed the title number (up.element must not title-rank for "fragment";
a typed name is meant verbatim). Routes, in preference order: (1) zero title/tier_title
metaWeights on expansion searches IF Pagefind's options() re-call allows per-search
ranking (probe first); (2) client-side discount of title-driven expansion hits (we hold
meta.title + the term); (3) regardless: intent gating — never expand a term that
matches the symbol-name list as name/prefix. AI-generated keywords: declined
(drift, density pollution, against the curation philosophy).

## Search ranking: balanced defaults (Henning 2026-10-04, ending the per-query tuning)

Henning stopped the trial-query calibration ("we're overfitting on defer/follow...
accept that the ranking will not always be optimal — sometimes @signature addresses it,
sometimes the desired result is just further down"). The balanced defaults, each
grounded in general measurements, none fit to a trial query:
- titleWeight 2 (h1 index weight already carries titles; count once, keep body density
  competitive) · no split tokens in meta (Pagefind splits natively — measured) ·
  signature tier: tierTitleWeight 10, body x1.5, headings x1.22 (passed every guard
  class) · pageLength 0.6 (docs corpus: long docs are good docs — moderate penalty cut,
  above the 0.4 tail-cost threshold; within-tier order shifts accepted) · kind ladder
  Learn 1.05 / HTML 1.04 / CONFIG 1.03 / EVENT 1.02 / JS 1.01 / else 1.00 (proven pure
  tie-breaker; since 2026-10-04 CLIENT-SIDE and linear on the whole score — see the rig
  final state under the formalization batch). Results max-height: calc(100vh - 150px).

## Search ranking direction (Henning 2026-10-04, contingent on the tokenizer experiment)

- Perceived-importance ranking: selected documents get an index-time weight boost via
  data-pagefind-weight, driven by a NEW lightweight directive (working name
  `@signature`) that marks "signature" API features AND selected Learn pages (not all
  Learn pages are important — the directive subsumes any blanket Learn boost).
- This deliberately REPLACES the @see/Essentials lists as a ranking signal, so the V1
  plan (Essentials cards -> intro prose, then delete the @see machinery) proceeds
  unchanged; the curation moves into the new directive instead of dying with @see.
  The directive can also guide Content's intro prose (which features a module intro
  must mention).
- CURATION PHILOSOPHY (Henning 2026-10-04): the old @see/Essentials lists were picky
  only because module-hub SPACE was limited; @signature competes for rank, not space,
  so the feature curation can be more generous (queries discriminate enough). The old
  lists are a floor, not a ceiling — e.g. the lazy-loading family ([up-defer] etc.)
  joins although up.link's @see never listed it.
- SETTLED (Henning 2026-10-04): TWO bands only — @signature (boosted) and unmarked
  default. A graded A/B/C scheme was discussed and declined ("I already know I can name
  2... let's stick with 2 until I know I need 3"); revisit only if real demotion
  candidates accumulate. Naming note stays flagged: "signature" collides with
  function-signature vocabulary; alternatives if it ever grates: @essential, @core.
- For the EXPERIMENT the boost tier is seeded provisionally from model data
  (essential_features ∪ Learn pages) — no doc-comment edits until the ranking idea
  survives manual testing; the real curation list is Henning's when formalized.

## Search try-out verdicts (Henning, 2026-10-03, after using the popup on the preview)

Queued for the Search finishing batch (runs after the walk batch + retirement):
- Result display: BOTH groups show the thing's full signature/title (the page h1 form,
  e.g. `up.follow(link, [options])`), with the typed match highlighted. The sidecar's
  gray secondary survives ONLY as the owner on param rows (`[up-watch]`); module rows
  show the bare module name, nothing behind it (learning-topic blurbs are over).
- The search overlay is REBUILT on `up.layer.open()` as a MODAL (careful: "popup" is a
  different Unpoly mode — stop calling it popup; rename the block accordingly, e.g.
  search-dialog). The modal default style is close to what search needs; pass a
  `{ class }` option for search-specific styling so other modals stay untouched. This
  replaces the hand-rolled shell: scrollbar compensation (fixes the background shift of
  html.-search-open), focus trap/restore, Esc, and layer stacking come from the
  framework. Search internals (groups, matching, keyboard) stay.
- Reopen behavior: keep the query, RE-RUN the search on open, select-all the input
  (b2) — returning users refine, typing replaces.
- Row layout: fixed-width LEFT badge gutter (kind for API features, API for modules,
  LEARN for pages), titles aligned after it; Learn titles get font-weight 500 so sans
  prose holds up next to code font. Henning judges the rendered result ("I will need to
  see it visually"); expect tweaks.
- BLESSED (Henning 2026-10-03): the disclosure toggles' screen-reader label
  "Expand <title>" (e.g. "Expand Learn").
- POST-WALK VERDICTS (Henning 2026-10-03): the header logo stays all-white (no red
  mark on the indigo bar). FORMATS gets restructured instead of a caption-casing call:
  a NEW generated index page /formats (model-driven listing of url-patterns and
  relaxed-json, hub-pattern, zero prose; slug hand-picked by Henning) becomes the
  Formats topic's start page in toc.yml; drawer AND sidebar then show Formats as one
  ordinary linked row like a module — no group captions anywhere in the drawer; the
  start:none special case dies if nothing else uses it. Home: the Search finishing
  batch (or the walk-batch fix round if it comes first).
- POST-BUILD VERDICTS (Henning 2026-10-04): dialog stays unanimated (launcher feel);
  Pagefind timeout stays 1500ms; the dismiss button keeps the framework's default
  label. Gutter stays 64px, PLUS result styling: hits get a hairline separator
  (~#ddd — snap to the nearest gray token); API and Learn hits separate by color —
  RED for API, BLUE for Learn — applied to the badges (border + text, not filled)
  and to a left stripe shown on hover.
- DEDUP SETTLED (Henning 2026-10-03), revising the Sep-14 two-group shape: one list.
  A page-level symbol hit whose page also matched full-text is UPGRADED IN PLACE — the
  full-page row (signature title, sections, excerpt) takes the symbol's rank slot; the
  bare symbol row survives only when full-text has no match for it (e.g. prefix queries
  the tokenizer can't serve). Params/anchored symbols are never duplicated and stay.
  No score merging — position inheritance only (symbol order rules the top region,
  Pagefind order the rest, already-shown pages removed below). Rendering is an ATOMIC
  SWAP: previous results stay visible until both streams resolve for the new query,
  then the list swaps at once (no reflow); Pagefind error/missing index falls back to
  symbols-only after a short timeout.

## Search station verdicts (Henning, 2026-09-18, batch 0)

- Pagefind dependency (FINAL 2026-09-18 after an ecosystem-practice research round):
  pinned `npx pagefind@<version>` as the post-build indexer call — Pagefind's documented
  first-party path and the Jekyll/Hugo/Eleventy convention; no package.json, no gem
  (none official exists), no vendored binary, npm provenance checks for free. Version
  pinned in exactly one place. Node at build time is acceptable (the sibling unpoly
  repo already requires it; deploys build locally). Supersedes both earlier options
  (vendor / esbuild migration — the esbuild condition was unmet: Pagefind's runtime is
  emitted by the indexer, nothing bundles it).
- Algolia: killed entirely on this branch (code, gem, rake task, deploy step, README);
  v2/v3 stages deploy from master and keep their indexes.
- Shortcuts: `/` works and is hinted, nothing else for now. Hard rule: never override
  browser hotkeys on popular browsers/platforms (Ctrl-K is omnibox search on
  Chrome/Firefox Win/Linux — out; Mac-only ⌘K may be proposed later).
- Index scope: /changes excluded entirely; imprint/privacy/landing/examples ignored.
- UI strings blessed: placeholder "Search docs…", empty state "No results for X",
  badges "Learn"/"API", NO group headings, footer hints "↑↓ navigate · ↵ open · esc
  close".
- Badges refined: ONE badge per row, the most informative — Learn pages `Learn`; API
  feature rows show the feature's KIND (JS/HTML/CSS/EVENT/CONFIG/…) which subsumes
  `API`; non-feature API pages `API`. Feature#short_kind is completed and becomes the
  single canonical kind vocabulary; its value list goes to Henning's review.
- Vocabulary BLESSED (Henning 2026-09-18): JS, HTML, EVENT, HEADER, CONFIG, CSS, COOKIE
  — singular EVENT on badges (sidebar group headings stay plural EVENTS, different
  device); params inherit their owner's badge; unknown kinds raise at build time.
  Side effect accepted: module Essentials lists and preview cards relabel events/config
  from JS and headers/cookies from HTTP.

## Alignment round 3 — pre-settled queues for the CSS, Search and Content stations (2026-09-17)

Station order is now: Structure -> Landing+CSS -> Search -> Content -> Ship, with session
exit points at station boundaries. Coordination: this orchestrator session briefs and
audits station agents (run as subagents), answers questions covered by this file, and
escalates only genuine calls to Henning.

- S1 SEARCH is its own station: Pagefind crawler integration (needs STATIC build output —
  the preview server writes none), HTML annotation for indexing, results popup and match
  representation. Escalation risk acknowledged: Pagefind fixes, or the Algolia fallback
  per the settled criteria. Rider for Structure: it may REMOVE existing search
  functionality where it causes friction, and must not split the old search between
  Learn/API (the global rewrite obsoletes it).
- S2 CSS SCOPE (a'): the station owns ALL presentation everywhere — tokens, spacing,
  type, color, across the frame AND content blocks; docs pages intentionally get the new
  (airier) density so they match the landing language. It may NOT restructure a block's
  DOM or information design without escalation (agent -> orchestrator -> Henning).
- C1: taste tokens (spacer scale, grays, Roboto weights, type scale, breakpoints,
  per-block modernization) are proposed IN-STATION and frozen only after Henning's
  rendered-review round (styled landing + 3-4 representative doc pages). Chat alignment
  is for shape decisions only.
- C2: ONE global shared header — fixed, full-width, on every page; the mock is the
  content spec (logo+version, search pill, Learn/API/Demo/Changes/Support/GitHub, burger
  carrying search on mobile). Version switcher keeps its existing behavior.
- C3: sidebar pinned to the left edge, content centered in the remaining width (react.dev
  pattern, screenshot-confirmed). The in-page auto-TOC becomes a right rail on wide
  screens via CSS-ONLY relocation: DOM position unchanged (still above first h2),
  media-queried position:fixed + reserved content gutter + max-height with inner scroll;
  inline below the breakpoint. Scrollspy highlighting is an optional later JS enhancement.
  The screenshot sweep must include huge-TOC pages (up.render).
- C4: there is ONE diagram — talk slide 12 IS fragment_updates.png (verified). The
  Landing agent redraws it as an inline SVG partial with real <text> (site tokens,
  Roboto) — an <img>-embedded SVG cannot use webfonts. Henning offers a manual Inkscape
  cleanup as fallback. "How Unpoly works" reuses the same partial later. Logo wall is
  COMPLETE: 10 SVGs in docs/rework-2026/logos/.
- Preview mechanics (for all station briefings): `bundle exec middleman server` ->
  localhost:4567, writes no static files; reboot on frontend-library, config.rb or lib/
  changes. Design changes are shown via the live preview and screenshot artifacts.
- T1: toc.yml order — Structure seeds each chapter exactly per the v5 listing; Content
  may reorder WITHIN a chapter with a one-line rationale surfaced in batch review;
  cross-chapter moves are taxonomy and stay forbidden.
- T2: Henning reviews in chapter batches (max 6 pages, larger chapters split), Getting
  started first, plus an early calibration batch: the first 2-3 overviews come to him
  before the remaining overviews are written.
- T3: the writing-style/overview-pages guide sections already existed (Henning-authored,
  08bc5f81e — the orchestrator's "missing" premise was stale). Post-dating deltas folded
  2026-09-17 (2c5adfc7f): copy-taste bullets, extended slop watchlist, exemplar paths.
- T4: code examples are DERIVED from the docs and implementation — never executed or
  mechanically verified (no lint, no scratch-server checks). Every new example is
  reviewed by BOTH an agent critic pass and Henning; batches must surface examples
  prominently.
- T5: @learn-ref policy — default ONE ref per feature: the page that explains it in a
  bigger context, with a real-world use case, or as its feature family. TWO only when no
  single page is clearly authoritative. NEVER three. If no clearly relevant page exists,
  OMIT — never link a page that mentions the feature as a tangent or footnote.
- T6: every move/split lands as TWO commits — mechanical relocation first (verbatim
  text, toc.yml, redirect), then the rewrite/reframe (V2 renames ride in the second).

## Landing+CSS station verdicts (Henning, 2026-09-17, batch 0)

- The release-notification box (latest version + GitHub Discussions + X links on the old
  landing) DIES with the old landing; mock v11 is the structure source and has none.
- Install disappears from the global nav (mock's header is the content spec:
  Learn / API / Demo / Changes / Support / GitHub). Installing is part of Getting
  started, which the "Learn Unpoly" button leads to; /install stays reachable from the
  landing and the GS reading order.
- Gate split: tokens freeze after a rendered specimen review (hero + one landing section
  + 3-4 doc pages, before/after); the full landing is built only on frozen tokens.
- Tree filter: kept and restyled by this station; removal is the Search station's call.
- Search pill until Pagefind: real link, compiler-upgraded (focuses sidebar search where
  one exists, navigates to /api elsewhere); kbd hint shows `/`, no ⌘K promise.
- Tokens frozen 2026-09-18 with amendments (one token file; $*_BLOCK_SPACING duplicates
  deleted; +bold mixin deleted in favor of font-weight: bold; headings get tighter
  leading than the 1.55 body; woff2 only). Scales stay as proposed — no pruning.
- Semantic aliases (e.g. $CARD_ROUNDNESS: $RADIUS_M): only where two or more blocks must
  agree on a value; aliases always point at a token, never a fresh value. When unsure,
  use the raw token without a semantic mapping (Henning 2026-09-18).
- Palette restructure + lowercase rename: shape under alignment (hue names for the
  non-pure brand colors, shades only for hues actually used, anchor/center shade);
  research round running 2026-09-18. No palette changes until settled.
  SETTLED after the naming research (Henning 2026-09-18):
  - Spacing scale: NUMERIC index ($space-1..9). Which index is the "default"/medium
    spacing: research pending (framework precedence).
  - Type scale: t-shirt with 2+ letter codes; the middle step is `md`, not `base`.
  - Shades: hundreds (100..900 family), values COMPARABLE ACROSS HUES by lightness,
    500 = the average shade. Brand colors SNAP INTO the grid even if hue/lightness
    shifts slightly — brand colors are not holy (Unpoly's CI is only logo + icon).
    This supersedes the earlier "brand anchors stay exact" note.
  - Hues: red, blue, orange, indigo (from $COLOR_SECONDARY), gray; teal/yellow only if
    their uses survive the merge. Merging similar hues and snapping one-offs onto ramp
    shades is desired, not a bug. Only steps actually used get defined.
  - Fallback window title: "Unpoly - The missing application layer for HTML" (the new
    claim, verbatim).
  - Buttons: ONE casing consistently, never mixed; direction sentence case (Henning's
    lean + mock v11 is sentence case) — .action restyled site-wide in B3.
    EXTENDED 2026-09-18: sentence case also in the header nav and the "Edit this page"
    link (react.dev precedent). CLARIFIED 2026-09-18: the ruling covers buttons and nav
    items ONLY — uppercase stays legitimate where it feels right for small labels
    (badges, chips, eyebrows like HTML/EVENTS/CONFIG/OPTIONAL, table heads).
  - Breakpoints: keep the SET MINIMAL — every breakpoint multiplies the visual test
    surface. Prefer breakpoint-less CSS (wrapping flex, grid auto-fit, clamp) wherever
    a rule can express it; breakpoints only where layout fundamentally changes (e.g.
    sidebar -> hamburger).
  - SETTLED after the breakpoint/spacer research (Henning 2026-09-18):
    EXACTLY TWO structural breakpoints, named by capability, not size (MDN precedent):
    $bp-sidebar (sidebar <-> hamburger; exact px measured from the real sidebar width,
    in the 920-1044 band where Bootstrap/react.dev/MDN/Polaris all land) and
    $bp-toc (right TOC rail on/off at ~1280 — NOT 1536; react.dev's maintainers
    regret 1536 because it hides the TOC on 14" laptops). Cosmetic media queries
    sparingly, never added to the structural set. Everything else intrinsic
    (clamp/wrap/auto-fit; Every Layout sidebar pattern as reference).
    DEFAULT SPACING = $space-5 (index 5 of 9, the ~24px step, inheriting the old
    $BLOCK_SPACING role) — documented in the token file as THE default, per Carbon's
    spacing-05-of-9 center anchor and old Polaris's named "base". Deliberately airier
    than the frameworks' 16px: docs prose, not app chrome.

## Structure station review verdicts (Henning, 2026-09-17)

- Learn-ref slot label: "Learn:" (replaces the reused "Guide:"/"Guides:" wording).
- Reading nav on Learn pages: `< Previous` and `Next: <title> >` with chevron-left/right
  icons from the site's icon set; the widget is its own BEM block for the CSS station.
  The teased title is the next page in reading order; on the last page of a chapter this
  is the first page of the next chapter.
- REVISES 2026-09-02: NO separate collapsed "Deprecated" group in the module sidebar —
  it mixed types and visibilities. Deprecated features return to their type sections.
- API sidebar top-level nodes and the /api hub show the module NAME only (`up.link`);
  the prose titles ("Linking and following") are dropped in both. "Formats" renders as
  an expandable section like the modules.
- install.md's three pre-existing typos: fixed now in their own commit (not deferred
  to Content).
- Approved as-is: server-bindings "edit this page" link retarget; custom-form-fields
  placed in Forms after handling-all-forms; NO redirects for /up.browser, /up.migrate,
  /up.tooltip (they 404 per V3).

## Open items (pending task list, refreshed 2026-09-16)

- DONE 2026-10-02: the framework fix below SHIPPED on master (12e58c5fd + 4cb7d3cd9,
  docs/plans/sync-cache-eviction.md was the hand-off) and master was merged into
  docs-rework (d1bdedcc5); the site's sidebar simplification to zero component JS is
  running as a batch. Kept for the record:
- UNPOLY FRAMEWORK fix, after the redesign ships (logged 2026-10-01, Henning): a request
  issued synchronously after an abort of its own URL inherits the abort instead of
  hitting the network — eviction-on-abort trails by a microtask (network.js:596,
  u.always rejection handler) while cache.track() copies terminal states like 'aborted'
  onto the new request (classes/request/cache.js:160-163). Bit the site's lazy sidebar
  (compilers during a swap issue exactly such requests); worked around there with a
  next-task retry. SKETCH (Henning + source dive 2026-10-01): up.Request#_onSettle()
  (request.js:761) runs SYNCHRONOUSLY inside _reject/_resolve, before the promise
  rejects — today it only reverts previews, for exactly the same sync-before-next-DOM-
  mutation reason. Wire cache eviction there, scoped to settled-WITHOUT-response
  (abort/offline/timeout only; 2xx stays cached, 4xx/5xx keeps its async evict-by-url),
  attached the same way network.js:591 already attaches request.onLoading for reindexing.
  Trackers attached before the abort keep their deliberate terminal-state propagation.
  Belt-and-braces alternative/addition: cache.track() refusing ended-without-response
  requests (the cache.js:122 fast path only handles ended-WITH-response). Once shipped,
  the site's sidebar reduces to ZERO component JS (settled with Henning 2026-10-02):
  plain up-defer (insert) + up-keep="same-html" + the keep condition moved inline as
  [up-on-keep] on the wrapper; menu.coffee's placeholder compiler (retry) and the
  up:fragment:keep handler are deleted. Works because a refused keep inserts a fresh
  placeholder, and insertion re-arms an insert-mode defer — one attempt per render, no
  timers. The C1 specs (double-click, race, offline recovery) assert outcomes, not
  mechanisms, so they verify the swap at upgrade time.
  Related doc fix: the docs name `up.AbortError`, the code defines `up.Aborted`
  (name property "AbortError").
- Sass constants rename (logged 2026-09-18, Henning): convert the UPPERCASE_UNDERSCORE
  constants to lowercase dashed names (e.g. `$space-s`) — one mechanical pass, late in
  the CSS station or right after, not during the visual work. Possibly bundled with a
  palette restructure (base hues + shades + semantic aliases; values unchanged) — under
  discussion, not yet decided.

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
- Logo wall: COMPLETE, 10 verified SVGs committed in docs/rework-2026/logos/ (vw, audi,
  siemens, bosch, arm, zendesk, steady, urban-dictionary, adonisjs, tuifly — all recolored
  to uniform #333333, viewBox-only, desaturate cleanly). "TUIfy" was a TYPO for TUI fly
  (the German airline); mock's placeholder wordmark must be fixed at landing build.
  No brand-terms review, per Henning. tmp/ dirs proved volatile (assets were lost twice) —
  keep rework assets in this tracked folder.
- NEXT SESSION: decide review groups A/B/C and apply round 3 to the mock → place logo
  assets → optional cold-reader test at makandra → then the landing build.

## Working agreements (how these sessions run; recorded 2026-09-16)

- MODEL POLICY (Henning 2026-10-04): subagents default to OPUS; Fable is reserved for
  text-authoring tasks only (chapter writing, Essentials intro prose — matching the
  Content station's d1 model map).
- STANDING PERMISSION (Henning 2026-10-03): commit and push to the docs-rework branches
  of unpoly and unpoly-site, and to branches/worktrees based on docs-rework, without
  per-batch asks. The quality gates are unchanged: batches still get fresh-eyes review
  before committing, slicing stays deliberate, and taste still queues to Henning.

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
