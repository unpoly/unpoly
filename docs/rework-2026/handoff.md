> **The "From Build·Structure (2026-09-16)" section below is HISTORICAL — do not execute
> from it.** It was written by the reverted first Build·Structure attempt (branch
> docs-rework-attempt-1); the page renames were reverted (V2) and the naming table
> changed. plan.md decides; sections from attempt 2 onward (2026-09-17+) are live again.

# Docs rework 2026 — station handoff

What one build station leaves for the next. `plan.md` holds the decisions; this file holds
the open threads that a later station must pick up, so nothing has to be reconstructed
from a diff.

Rules: append a section per station, newest last. A station that picks up an item ticks it
off here in the same commit. Items nobody claims before shipping are the pre-ship
checklist.


## From Build·Structure (2026-09-16) to Build·Content

### Owed to `toc.yml`

`src/unpoly/pages/toc.yml` lists the pages that existed when the structure was built.
**Every new page needs its entry in the same commit that creates it** — the site refuses
to build otherwise, which is the point.

- The 11 chapter overviews are missing. Add each as the *first* page of its topic: a
  page group starts at its first page, so the overview automatically becomes the chapter's
  entry point and drops out of the list below it.
- Chapters currently start at a detail page (Links starts at `handling-everything`,
  Overlays at `layer-terminology`). That is temporary and resolves itself once the
  overview lands in first position.
- `Getting started` holds only `install` and `attributes-and-options`. The seven new
  pages go before them, in reading order; `install` belongs after `how-unpoly-works`.
- Pages that dissolve (`layer-terminology`, `skipping-rendering`, `predefined-animations`,
  `predefined-transitions`, `motion-tuning`, `handling-everything`, `attributes-and-options`)
  are still listed, in the chapter that absorbs them. Remove the entry when the page goes.
- The reading order drives the next-page widget on every Learn page, so the order inside a
  topic is a content decision, not a technical one.

### Owed to `@see`

`@see` was retired *as navigation*, not as a directive. Its 64 page targets are now
`@learn-ref`; ~55 module→feature entries remain and still render as the "Essentials" cards
on module pages (`Interface#essential_features`, flagged with a TODO).

The reference link pass should turn those into intro prose with backtick autolinks, as
settled in plan.md. When the last one is gone, delete: `@see` parsing in the site's
`Parser` (`REFERENCE_PATTERN`, `parse_references!`), `Referencer`, `Interface#essential_features`,
the `essential-features` block and `source/api/_see_also.erb`.

### Pages renamed here, prose not rewritten

Slug, title and redirect are final; the text still says what it said before.

| New slug | Old slug | Still owed |
|---|---|---|
| `navigation-defaults` | `navigation` | rewrite carrying the "what counts as navigation and why" narrative |
| `tracking-page-views` | `analytics` | reframe around location-change events |
| `new-deployments` | `handling-asset-changes` | reframe as "reacting to new deployments" |

`attributes-and-options` was *not* renamed: it becomes "The shape of the API" and absorbs
the layered-API idea, which is a rewrite, not a slug change. Its config-defaults section is
also due to move to "Handling all links" (trim g).

### Pages moved from unpoly-site

`/install` and `/server-bindings` are now `@page` documents converted from ERB. Two
simplifications happened in the conversion and are worth a second look:

- The Bootstrap and ES6 tables lost their gzipped-size column, which was computed from
  the local `dist/` build and has no Markdown equivalent.
- `npm install unpoly --save` lost the `@next` suffix that the ERB added for pre-releases.
  If that matters, it needs a token like `%UNPOLY_VERSION%`.

Both pages are unreviewed prose and fall under the review contract.

### Pending redirect

`RedirectPermanent /tutorial /how-unpoly-works` points at a page Build·Content will write.
`bundle exec rake docs:check_urls` in unpoly-site reports it under PENDING and will stop
once the page exists. Run that task before shipping; it is the "no lost URL" safety net.

### Reference link pass

`bundle exec rake docs:learn_refs` lists the public selectors and events with no
`@learn-ref` — 39 at the end of this station, down from 92. Functions, properties and
headers are exempt for now.

### Noted, not done

- Deprecated features are not folded into a collapsed group in the reference sidebar
  (settled 2026-09-02). The tree renders from `Toc::ModuleTopic#children`, so this is a
  model change plus CSS, not a template change.
- `up.browser`, `up.migrate` and `up.tooltip` still have pages that nothing links to.
  They are exempt from the manifest check because they document no current feature.
  Marking them `@internal` would be the honest fix, but `up.Layer#isOpen`/`#isClosed`
  currently parse under `up.browser` and would lose their breadcrumb.

## From Build·Structure attempt 2 (2026-09-17) — LIVE

Batches 1–5 of the station are done, verified and pushed (unpoly `8c6470580`,
unpoly-site `07ae0573`): parser/token foundations, 23 stubs + /install and
/server-bindings conversions + 5 redirects, toc.yml + strict checks, Learn/API nav
split with full-accordion menu, and the @see/article-ref migrations. Evidence at wrap:
196 rspec examples green, `middleman build` "All links OK" (re-confirmed after the last
lib edits), `rake docs:check_urls` 78/78, unpoly self-test + lint green.

### Owed by the next Structure session (batch-6 tail)

- ✔ Update docs/contributing/documentation.md (done 2026-09-17, `27c436610`).
- ✔ Check unpoly-site README for staleness (done 2026-09-17, `95a74de0`).
- The review queue below was walked with Henning on 2026-09-17; verdicts are in plan.md
  ("Structure station review verdicts") and applied by the station's final commits.
  The station is complete; next station per plan.md is Landing + CSS.

### Review queue for Henning (execution rules 1/3 — reader-visible words introduced)

- Learn-refs slot label reuses the existing "Guide:"/"Guides:" wording ("Learn" would
  be new copy — Henning's call).
- Reading-nav labels "Previous"/"Next"; deprecated menu group label "Deprecated".
- install.md was converted verbatim INCLUDING pre-existing typos ("You know have
  everything", "Recent versions of Unpoly supports", "files that configures") — left
  for Content's rewrite, not conversion damage. Structural liberties: colspan tables
  became 2-column; extension links retarget to #browser-support/#bootstrap//server-bindings.
- server-bindings.md: the GitHub "edit this page" link now points at the .md in the
  unpoly repo (the ERB it named is deleted).
- toc.yml: custom-form-fields is the one page v5 does not place; it sits in Forms after
  handling-all-forms (one-line change if wanted).
- /up.browser, /up.migrate, /up.tooltip now 404 (per V3; API symbols are outside the
  no-lost-URL check). Three .htaccess lines if Henning wants redirects — unruled.

### Inherited by Build·Content (V1 twice-written record, second copy)

- 55 feature-target @see remain and render the module Essentials cards. Content replaces
  them with intro prose per module (TODO(content) markers at Interface#essential_features),
  then deletes the @see machinery: REFERENCE_PATTERN/parse_references! in parser.rb,
  Referencer, essential_features, the essential-features template block, _see_also.erb.
- `rake docs:learn_refs` lists 39 public selectors/events without a ref — the insertion
  queue under the T5 one-ref policy.
- Old-major changelog links: majors 0–2 are scoped out on OUTPUT pages in config.rb
  (V6 "ignored" chosen); the current major is fixed.

### Riders

- Search station: the sidebar tree filter was KEPT (it filters whichever area's menu is
  loaded, zero effort spent); removing it stays a Search-station liberty.
- Site build ~4 min with link check; SKIP_CHECK_LINKS=1 skips it. Preview:
  `bundle exec middleman server` → localhost:4567, restart after config.rb/lib changes.

## From Landing + CSS (2026-09-18)

The visual system is built and committed on `docs-rework` in unpoly-site: tokens and
vendored fonts, the landing page, the frame, the block refresh with its regression specs,
and the token rename. `plan.md` holds the decisions; what follows is what the next
stations pick up.

### Inherited by Search

- **The pill is already there, and it is already the trigger.** The global header carries
  `source/_search_pill.html.erb`, styled by `guide/blocks/search-pill.sass` and wired by
  `javascripts/components/search_pill.js`. Today it is a link to `/api` that the compiler
  upgrades into "focus the sidebar's field" wherever that field exists, so it never
  promises what the page cannot do. Replace the compiler's body with the popup and the
  markup, styles and header slot stay as they are.
- It advertises `/`, the key that actually works. If the new search takes `⌘K`, the `kbd`
  in the partial is the one place to change.
- **The tree filter was kept and restyled.** It still filters whichever area's menu is
  loaded and still expands to the Algolia full-text list on Enter. Removing it remains a
  Search-station liberty, as the Structure station recorded — but note that two specs in
  `spec/features/search_spec.rb` now drive it from `/loading-state`, because `/up.render`
  carries the API menu, which has no "Overlays" or "Forms" to filter.
- **The drawer carries search now.** `source/menu/narrow.html.erb` gained the same
  `.menu--search` and `.content-search` the sidebar has. On a phone the burger is the only
  way in, so a search that lived only in the sidebar was no search at all.
- The pill is hidden below `$bp-sidebar`, where the burger takes over.

### Inherited by Content

- **The request-flow diagram is a reusable partial.** `source/_fragment_updates_diagram.html.erb`
  draws it as inline SVG with real text, which is why it can use the site's webfont. C4
  reserves it for "How Unpoly works" as well: render it with
  `<%= partial 'fragment_updates_diagram' %>`. Its source image is tracked at
  `docs/rework-2026/fragment-updates.png`.
- **The landing page's copy is not editable in place.** `source/index.html.erb` carries
  mock v11 verbatim and says so at the top; wording changes go through the mock and
  Henning, not the template.
- The hub pages still show the Structure station's "This page is being written." stubs.
  They are styled, so replacing the prose needs no CSS.
- The token specimen used for the C1 review is deleted, as planned — `source/specimen.html.erb`
  and its block are gone, and nothing references them.

### Owed to Ship

- Nothing outstanding. The fonts are woff2-only from one Roboto release, so the build no
  longer ships the eot/ttf/svg variants; if a deployment step ever listed those files by
  name, it wants checking once.

### Leftovers

- **No block-local breakpoint literals survived.** The shipped stylesheet contains three
  media-query rules, at `$bp-sidebar` (1024px) and `$bp-toc` (1280px), and nothing else.
  A third breakpoint needs an argument, not a convenience.
- **The screenshot harness is not in the repo.** It lives in the station's scratchpad and
  drives Capybara against `bundle exec middleman server` rather than an in-process rack
  app — which matters, because the in-process app re-parses the guide on every request and
  times Selenium out. Adopting it into `spec/` or `bin/` is unruled; without it, the
  regression evidence for a later restyling has to be rebuilt from scratch.
- `plan.md` still calls the palette file `_constants.sass` in its guardrails record
  (2026-09-16). It is `_tokens.sass` now.
- `hljs.sass` is deliberately outside the token system: it is a third-party syntax theme
  and its colours answer to the highlighter, not to the site.
