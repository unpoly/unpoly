# Docs rework 2026 — alignment state

Status file for the unpoly.com documentation restructuring ("Rework docs entirely 2026-08").
Written 2026-09-02 after the first alignment session. This is the source of truth for
decisions made so far; the structure below supersedes any earlier sketches.

Per Henning's rule: don't trust this file blindly — nothing here is implemented yet,
so verify claims about the *current* repo state against the repo.

## The big picture (argued in discovery, direction accepted, details not all settled)

- Split unpoly.com into a **Learn** section (guides, book-like, prev/next) and an
  **API reference** (modules → features, the current tree minus guide links).
- Keep the authoring model: docs live in this repo, `/*- -*/` comments + `pages/*.md`.
- URLs stay at root (`/up-follow`, `/enhancing-elements`); add `/learn` and `/api` hub pages
  (the current `/api` page shows guide links and must be rebuilt as a real reference hub).
  Old guide URLs get redirects in `src/unpoly-migrate/.htaccess`.
- Chapter order defined in a single TOC manifest file in this repo (replaces
  `PROMOTED_INTERFACE_NAMES` in unpoly-site's `repository.rb`). Build fails on orphan pages.
- New directive `@guide-ref` for the reference→guide header slot (repeatable, resolves
  labels from target page titles/anchors; build-checkable). In-body refs keep `{:.article-ref}`.
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
    title open: "The shape of the API" / "Understanding the API")
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

SELF-LOADING FRAGMENTS (title provisional, see open items) — Overview ✎ (incl. up.reload
  baseline) · Lazy loading content · Infinite scrolling · Polling · Hungry elements ✎

HISTORY — Overview ✎ · Updating history · Restoring history · Tracking page views ↩
  (analytics, reframed around location-change events)

SCROLLING & FOCUS — Overview ✎ · Scrolling · Scroll tuning § · Focus · Focus ring visibility §

NETWORK & CACHING — Overview ✎ (intro up.request briefly) · Caching (Vary tables moved out) ·
  Aborting requests · Handling network issues

ANIMATION — one page (⇒ predefined-animations, predefined-transitions, motion-tuning)

SCRIPTING (title open) — Overview ✎ · Enhancing elements with JavaScript ·
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

- Title: SELF-LOADING FRAGMENTS (candidates: Live fragments, Active fragments,
  Automatic loading; "self-loading" accepted as working title only).
- Title: SCRIPTING (candidates: Scripting, Client-side logic, Enhancing with JavaScript).
- Title: "The shape of the API" GS page.
- Confirm "Learn" as the section name (used throughout this file).
- Page order within chapters (decide at writing time).
- Signature decisions 2–8 from the session agenda were argued in discovery but NOT
  formally settled: TOC manifest format, @guide-ref syntax, review contract,
  shipping/two-repo coordination, landing-page skeleton. Next alignment session.

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

- Voice: imitate src/unpoly/pages/*.md ONLY (human-written) — not docs/contributing
  (partially AI-written). Exemplars: optimistic-rendering, flashes, reactive-server-forms,
  lazy-loading, enhancing-elements. Measured traits: 0 em-dashes in 4,400 words,
  ≤1 rhetorical question/page, gerund task headings, code block per ~100 words,
  no closing summary, one-sentence definition openers, "we" in walkthroughs.
- Blocklist + prose lint idea (bin/lint-prose): "not X, it's Y", load-bearing, seamless,
  robust, leverage, delve, elegant, "it's worth noting", em-dashes, three-fragment runs,
  intro-about-the-intro, closing punchlines.
- Length budgets from comparable existing pages. Outline with facts per section before prose.
- Separate writer and critic agents. Approved pages join the exemplar set.
- The guide-vs-reference placement contract is in docs/contributing/documentation.md.

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
