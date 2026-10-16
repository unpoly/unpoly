# Code example check — 2026-10-16 (paused, partial)

Read-only review of code examples in the new documentation site, verified against
`src/unpoly/**/*.js` and `spec/unpoly/**/*_spec.js` only (nothing was run).
The review was paused early because the usage limit was nearly exhausted; see Progress.

## Findings

### Severity 1 — example would not work / throws
None found in the covered area.

### Severity 2 — claimed behavior is wrong
None found in the covered area.

### Severity 3 — misleading but works
None found in the covered area.

## Checked, no findings

- `unpoly-site/source/index.html.erb` (landing page, 10 examples/claims):
  all 21 event names in the event groups exist (`@event` grep over `src/unpoly`);
  `<main up-poll>` and `<a href up-defer>` are derivable targets (`src/unpoly/fragment.js:229`, `:240`);
  `up.layer.ask({ url })` exists (`src/unpoly/layer.js:818`);
  `up.submit('#invite-form', { params })` is a valid call (`src/unpoly/pages/params/up.submit/request.md:19`);
  the "runs your component teardown before anything is swapped out" claim holds, since destructors run in
  `beforeRemove` (`src/unpoly/classes/change/update_steps.js:127`, `src/unpoly/motion.js:452-461`).
- `unpoly-site/source/skills/unpoly-docs/skill.txt.erb`: only shell commands, nothing Unpoly-specific to verify.
- `unpoly-site/examples/*` (modal, timestamp-compiler, transition, update-fragment):
  `up-layer="new"`, `up-transition="move-left|move-right"`, `up-target=".one"` and the `.timestamp` compiler are valid.

## Unverified
- Everything in Progress → Remaining. Not checked for lack of budget, not because of a problem.

## Progress

Covered:
- Site-only pages in `unpoly-site/source` (landing page, skill page, examples). Changelogs skipped as instructed.

Remaining (not checked):
- All Learn pages under `src/unpoly/pages/**/*.md` (~776 fenced blocks in 147 files, incl. `partials/` and `params/`).
- All API reference examples in `/*- ... */` doc comments under `src/unpoly/**/*.js` (~500 blocks; largest:
  `fragment.js` 72, `form.js` 53, `protocol.js` 50, `script.js` 33, `element.js` 29, `classes/preview.js` 28,
  `util.js` 26, `layer.js` 24, `link.js` 23, `event.js` 23) and `src/unpoly-migrate/**/*.js` (~13 blocks).

A reviewer brief for resuming the work is at
`/tmp/claude-1000/-home-henning-Projects-unpoly/4f44b7f5-92a9-4c0a-8493-b2f8c8601b3b/scratchpad/brief.md`
(per-area split: pages A–E, JS fragment+classes, form/status/radio/viewport/motion,
protocol/network/link/layer/history, script/element/util/event/migrate). Nine parallel reviewers had been
started on these slices; they were killed before returning any results (none wrote a findings file). Had they finished,
each would have written its results to `findings-pages-{a..e}.md`, `findings-js-fragment.md`, `findings-js-form.md`,
`findings-js-protocol.md` and `findings-js-script.md` in that scratchpad directory, in the report format above.
Those results have not been verified and are not folded into this report.
