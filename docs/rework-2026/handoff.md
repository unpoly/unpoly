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
