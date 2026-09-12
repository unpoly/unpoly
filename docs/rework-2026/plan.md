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
- Signature decisions 2–8 from the session agenda were argued in discovery but NOT
  formally settled: TOC manifest format, @guide-ref syntax, review contract,
  shipping/two-repo coordination, landing-page skeleton. Next alignment session.

## Deferred (only after content changes and the new landing page have shipped)

- **URL prefixes** (added 2026-09-12): move API symbols under `/api` (e.g. `/api/up.render`)
  and guide pages under `/learn` (e.g. `/learn/subinteractions`). Old root URLs keep
  working via `.htaccess` redirects (e.g. `/up-submit` -> `/api/up-submit`), but our own
  docs must link with the prefixes. Deferred because it causes heavy churn in the Unpoly
  sources (thousands of links); until then, hubs live at `/learn` and `/api` while pages
  stay at root.
- Step 2 per-page rewrites of kept pages.
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
