# Release notes brief (decision R4, 2026-10-16)

The `Unreleased` section in docs/changes/CHANGELOG_3.x.md reads like a commit log. The release notes for the docs-rework release are drafted separately and replace it at release time.

## Goals
- High-level overview of what is new and changed, for humans and agents who are not deep into Unpoly internals. Must not duplicate the commit log.
- Marketing: make users excited about new possibilities. Headline sections show what you can do now, with short examples.
- Model: the 3.12.0 and 3.14.0 release notes (intro sentence or two, sponsor note, ⚠️ convention, contents nav, feature sections with examples, grouped one-line items, "Smaller fixes and changes", "Upgrading").

## Structure (decided)
1. Headline sections, in this order, and only these three:
   - **A new documentation site** (Learn guide in chapters, new guides, new /learn and /api URLs with redirects).
   - **Docs for coding agents** (own section although one deliverable with the site: Markdown twin of every page, /llms.txt, the agent skill).
   - **Custom form fields** (form-associated custom elements, formdata listeners, the new guide; short and exciting, ~5 lines of prose + example).
2. Grouped short items by topic (Forms, Overlays incl. the peeling change, Caching, Rendering, Network, …), one line each, linking the guide.
3. **"Form submissions now match the browser"** as a group section: one sentence on why (Unpoly now uses the browser's form-data algorithm, so edge cases behave like a native submission), then every serialization edge case in one line each (no markers: browser alignment). Not inside the headline section.
4. "Smaller fixes and changes", "Upgrading".

## Filter for every item
Include: new API, user-visible behavior, bugs users may have hit, every breaking change. Marker rule (docs/contributing/releasing.md, 2026-10-16): only intentional changes to documented API/behavior are breaking (⚠️ polyfilled, ❌ not); bug fixes, browser alignment and undocumented behavior get no marker but are still listed. Exclude: refactorings, spec-only changes, docs typos, internal renames without users. Each section starts with one plain sentence on what changes for the user, no internal terms.

## Process
- Draft in docs/rework-2026/drafts/release-notes.md. Do NOT edit CHANGELOG_3.x.md until the release (avoids conflicts with hk/refine-tests-2026-10, which also adds entries).
- Sources: current `Unreleased` section, `git log v3.14.3..docs-rework`, decision logs in docs/rework-2026/ (sittings/, open-items.md) for the why.
- At release: merge the test branch, sort its new `Unreleased` entries into the draft with the same filter, replace `Unreleased` with the draft. Version number per R3.
- Start the drafting agent after the FACE review agent has committed (so its entries are in `Unreleased`).
