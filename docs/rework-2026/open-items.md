# Open items queue (Henning answers async)

Decisions go in triage.md "Henning's answers" once settled. Item numbers continue the 2026-10-11 slow-down list.

## Decided in the slow-down list (applied after the list closes)
- 1 Preventable peeling → done (dfad2c0fd). 1.1A Back force-peels. 1.2C `[up-peel]` words + `up.layer.parsePeelOption()`. 1.3B removed `up.reveal({ peel })`.
- 2 Close-event pointer to onAccept/onDismiss → 🤖, done with 1.
- 3, 4, 6, 7, 8, 10-14, 24 → duplication items, deferred to chapter sittings.
- 5 → 5A: drop the first `autoCache` example on /caching, link "configure this default" to #disabling-route.
- 9 → 9D: /optimizing-responses #version becomes "Detecting a full page load" (draft in session; `up.target?` example from unpoly-rails, pointer to X-Up-Target); #title gets "A response without a `<head>` has two more limits: Unpoly keeps the current meta tags, and it cannot detect a new deployment."
- 15 → 15A: delete the commented-out "General advice" block on /script-security.
- 16-20 → done: /custom-form-fields restructured (16A table splits Submitted | Watched, validated, switched | Disabled; 17A/18A rationale and re-enabling paragraph cut; 19A lazy-loading tip in #registering; 20 the #contract section dissolved into the patterns).
- 25 → 25A done: ⚠️ kept, upgrade hint (`event.value === ":peel"`, `[up-peel="force"]`) in CHANGELOG_3.x.md.
- 26 → 26A done (1d30c72be): `revealPadding` honored when rendering, with spec.
- 27 → 27X done: /install and /skill move to /learn like every page, and keep permanent short redirects (fragments like /install#npm carry over). The script lists both rules first in the generated block, marked "never remove", aborts if either is missing, and rewrites the README label to unpoly.com/learn/skill. Runbook updated.
- 28 → 28X (script behavior, verified 2026-10-13): .js files are rewritten only inside comments, so the two error-message URLs in src/unpoly/classes/change/ stay `https://unpoly.com/failed-responses` (redirects after the deploy). This was missing from the script and is now in it.
- 29 → 29A done (dafc7b416 on docs-rework): the three dead rules removed from src/unpoly-migrate/.htaccess.
- 30 → 30A (script behavior, verified): links in old release notes are rewritten where the target still exists, the rest is left alone.
- 31 → 31A done: both `url-move-dryrun` branches pushed.

## Persona review findings (2026-10-11, full report: prepass/persona-review-2026-10-11.md)
Not yet numbered; to be walked through after the current list. All three personas understood Unpoly's shape within ~5 pages; the start page's "Is Unpoly right for you?" did most of the work.
- P1 → DROPPED 2026-10-13 (P1D: few concepts map cleanly; a nuanced mapping is too much text to write and maintain). No Turbo/Hotwire comparison anywhere; htmx comparison only on /. Suggests a Getting-started page "Coming from htmx or Turbo" (concept mapping + what Unpoly lacks).
- P2 → DONE 2026-10-13. [up-validate] server work understated ("the one thing Unpoly asks of your backend" on /start/forms, "one convention" on /backend-integration); only /validation#backend says "don't save on X-Up-Validate".
- P3 → DONE 2026-10-13: /real-time-updates. (Was deferred 2026-10-12.) Push/real-time never addressed. Henning wants a guide (no framework support). Draft + agent review: drafts/push-updates.md, drafts/push-updates-review.md, artifact https://claude.ai/artifact/8KYQWqVMqKQcpm6FNE1JfX. Open: (a) signal reloads element's child vs selector in message, (b) abort:false on signal reload, (c) own heading for token streaming, (d) placement in Live fragments after Hungry elements. → DONE 2026-10-13: /real-time-updates
- P4 → DONE 2026-10-13. / overclaims Back: "restores the exact screen state" vs re-fetch + scroll/focus restore.
- P5 → DONE 2026-10-13. up.compiler summary "called when a matching element is inserted into the DOM" reads like a MutationObserver.
- P6 → DONE 2026-10-13. Optimistic rendering is a headline card on / but its page says experimental.
- P7 → DONE 2026-10-13. Unpoly's own size is never stated (only unpoly-migrate.js 9.2 KB).
- P8 German MDN links → FIXED (unpoly util.js, unpoly-site repository.rb type autolinks).

## Code example check findings (2026-10-11; ~1,150 examples, ~60 fixes pushed in 10 commits 80d1c6b5b..3ff80b8c3; log in session scratchpad)
Not yet numbered. Code bug (lean: fix + spec, strong):
- E0 → FIXED (E0A). script.js parseCallback: with expandObject, the closure's `argNames` is reassigned on every call, so a parsed callback called twice gets duplicate arg names (layer/value/response undefined). Likely hits onAccepted/onDismissed etc.
Questions:
- E1 → FIXED 2026-10-12. url-patterns.md:81-89 numeric wildcard `/users/$` doesn't work as documented (bare `$` literal; reproduced).
- E2 → FIXED 2026-10-12. form.js:2026,2057 `params.require(:user)` but fields aren't nested.
- E3 → FIXED 2026-10-12. fragment.js:2166-2188 [up-id] example claims toTarget() throws for `<a href="/">`; it doesn't.
- E4 → FIXED 2026-10-12. render_result.js:44-46 renderOptions.target is the resolved selector, not ':main' (docs or code?).
- E5 → FIXED 2026-10-12. base.js:896-907 up.Layer#affix appends to first swappable element, not outmost.
- E6 → FIXED 2026-10-12. subinteractions.md up.validate('select', {params}) re-renders the whole group.
- E7 → FIXED 2026-10-12. script.js:651 up.hello() on detached element.
- E8 → FIXED.
- E9 → FIXED 2026-10-12. `up-animation="shake"` isn't built in.
- E10 → FIXED.
- E11 → FIXED 2026-10-12. [up-alias] absolute same-origin URLs never match.
- E12 → FIXED 2026-10-13. prose bits: script.js broken link and `Array<string` FIXED; still open: params.js fromURL @return; response.js #header text.

## Status notes (no decision needed)
- 2026-10-11: code fixes pushed: dfa0712e0 (Q1 validation feedback default), aea7978a1 (Q3 configured fields in disabled fieldset, changelog bullet extended), 714a4b519 (Space key). Full suite 4329 passed, 1 failed: link_target_spec.js:752 transition transform spec, passes alone and in its group (looks flaky, unrelated).
- Fix round merged (7 commits) + overlay leftovers (09db32d44). Changelog entry for [up-on-accept]/[up-on-dismiss] added.
- Running: unpoly-site namespace rename + sidebar spec + link check (worktree); URL move script dry run (throwaway worktrees, not merged).
- unpoly-site: Unpoly::Guide → Unpoly::Site rename merged + pushed (977b8949). sidebar_spec.rb:260 fixed (dc7025fc: syntax highlighter's mark masks merged with following digits). Twins spec expectation updated (bd5d9ca7). check_urls 78/78, build + HTMLProofer OK.
- Anchor scan of the built site: 3 broken anchors on current pages fixed (c2835e615). 118 more are in old release notes /changes/0.x and 2.x (the build skips them on purpose; e.g. /up.popup, /up.modal links). Left alone.
- Running: search ranking (/layer-option for "layer"; skill search "history state"), URL move dry run.
- URL move dry run done: script `bundle exec rake docs:url_move` (unpoly-site, branch url-move-dryrun), 627 documents moved (83 /learn, 544 /api), 3,277 links rewritten, 627 generated redirects + 154 retargeted, no chains, idempotent; build "All links OK", check_urls green (now also checks missing redirects and chains), real Apache 2.4: 782 old URLs → 301 → 200. Site code stays as commits to rebase on launch day (as planned). Runbook: docs/rework-2026/url-move-runbook.md.

## Rework decisions (2026-10-14)
- R1 → R1C+: Henning reads every remaining Learn page (9 chapters, 48 pages), plus the 8 Overlays pages (the 2026-10-13 sitting covered only packet notes). For each page Claude lists what deserves the most attention. Order: Overlays first.
- R7 (landing claim, 2026-10-15) → keep "The missing application layer for HTML". Challenger "HTML from the future" (imagined HTML6 for applications, polyfilled by Unpoly) was weighed over several rounds: it evokes instead of describing, needs its byline to decode, weakens the htmx differentiation ("layer" signals the higher-level temperament that "Is Unpoly right for you?" names), and adds a metaphor to decode on a page that already carries a nuanced explanation. Ideas from it may move below the fold.
