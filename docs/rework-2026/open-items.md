# Open items queue (Henning answers async)

Decisions go in triage.md "Henning's answers" once settled. Item numbers continue the 2026-10-11 slow-down list.

## Decided in the slow-down list (applied after the list closes)
- 1 Preventable peeling → done (dfad2c0fd). 1.1A Back force-peels. 1.2C `[up-peel]` words + `up.layer.parsePeelOption()`. 1.3B removed `up.reveal({ peel })`.
- 2 Close-event pointer to onAccept/onDismiss → 🤖, done with 1.
- 3, 4, 6, 7, 8, 10-14, 24 → duplication items, deferred to chapter sittings.
- 5 → 5A: drop the first `autoCache` example on /caching, link "configure this default" to #disabling-route.
- 9 → 9D: /optimizing-responses #version becomes "Detecting a full page load" (draft in session; `up.target?` example from unpoly-rails, pointer to X-Up-Target); #title gets "A response without a `<head>` has two more limits: Unpoly keeps the current meta tags, and it cannot detect a new deployment."
- 15 → 15A: delete the commented-out "General advice" block on /script-security.

## Open (answer by number + option)

### 16 /custom-form-fields pattern table overstates the `value` getter
Only watching and switching read `value`. Validation of a form-associated element uses the browser's form data; disabling uses only `disabled`. A *configured* element needs the getter to be submitted/validated at all (Unpoly adds it via addField(), which reads `.value`).
- 16A (lean, medium) split into columns "Submitted and validated | Watched and switched | Disabled":
  hidden field: Yes | Yes | Yes; form-associated: Yes | With a `value` getter | Yes; configured: With a `value` getter | With a `value` getter | Yes; formdata listener: Yes | No | No.
- 16B keep two columns, reword cells.

### 17 /custom-form-fields #contract: implementation rationale
Cut "The other two need nothing from you, because of how component authoring works…" and "Both fall back on *absence*, not falseness…". The table already says "nothing" for name/disabled.
- 17A (lean) cut both. 17B keep.

### 18 /custom-form-fields re-enabling edge case
Replace the paragraph "The same rule cuts the other way when re-enabling…" with one sentence: "If you style your element from the `[disabled]` attribute, reflect your `disabled` property to it."
- 18A (lean) one sentence. 18B keep paragraph.

### 19 /custom-form-fields lazy-loading tip placement
The tip "If your element's definition is loaded lazily, register its tag name in up.form.config.fieldSelectors…" sits in #contract but is about choosing a configured element.
- 19A (lean) move into #configured after the `fieldSelectors.push` example. 19B leave.

### 20 /custom-form-fields section order
hidden field → form-associated → contract → configured → formdata. #configured relies on #contract ("as described above").
- 20A 🤖 keep. 20B move #contract after all four patterns.

### 25 Changelog marker for preventable peeling
docs/changes/CHANGELOG_3.x.md, Unreleased, "Preventing peeled overlays from closing". The agent used ⚠️. The legend (CHANGELOG.md:8-9) says ⚠️ = polyfilled by unpoly-migrate.js, ❌ = breaking without polyfill. There is no polyfill. BUT the same Unreleased section already uses ⚠️ for several unpolyfilled behavior changes (CHANGELOG_3.x.md:14-19: multipart for file inputs, image button coordinates, reset buttons, fromForm() requires a form, param order). So in practice ⚠️ currently means "behavior change that may need code changes".
- 25A (lean) keep ⚠️, consistent with the other entries in this release, and add the upgrade hint: "Check `event.value === ':peel'` or render with `[up-peel=force]`".
- 25B ❌ for this one (strictly by the legend; then lines 14-19 would need the same review).
- 25C reword the legend so ⚠️ covers unpolyfilled behavior changes that rarely affect apps.

### 26 `[up-reveal-padding]` / `{ revealPadding }` ignored when rendering (code bug)
`up.FragmentScrolling` only passes its known keys to `up.reveal()` (classes/fragment_scrolling.js:5-14), and `revealPadding` is missing, so the documented render option and attribute do nothing. `up.reveal(element, { padding })` itself works.
- 26A (lean, strong) add `'revealPadding'` to the keys (and map it to `padding` if needed), with a spec. One line plus spec.
- 26B remove the option from the render docs.

### 27 /install and /skill under /learn?
The URL move puts every Learn page under `/learn/`, including the share-friendly `/install` and `/skill` (redirects keep the old URLs working). The README still labels the link "unpoly.com/skill".
- 27A (lean, weak) move them like every other page; update the README label to the new URL.
- 27B keep both at root as exceptions.

### 28 unpoly.com URLs inside library code
The script also rewrote two error messages in src/unpoly/classes/change/ to `https://unpoly.com/learn/failed-responses`. Launch order is Unpoly release first, site deploy last: between the two, that URL would 404 for users of the new release.
- 28A (lean, strong) exclude executable JS strings from the rewrite (doc comments still get rewritten). The old URL redirects after the deploy anyway.
- 28B keep the rewrite and deploy the site first.

### 29 Dead hand-written redirects
`/up-href`, `/up.observe` and `/up.layer.context` are both deprecated symbol pages and redirect sources in .htaccess. The page wins, so those rules never fire.
- 29A (lean, medium) delete the three dead rules.
- 29B leave them.

### 30 Rewriting links in old release notes (0.x to 2.x)
The script rewrites links in historic release notes where the target still exists, and leaves the rest.
- 30A (lean, medium) allow it: the notes keep working links without redirect hops.
- 30B exclude docs/changes/ for 0.x to 2.x from the rewrite (old links still work through redirects).

### 31 Push the URL move dry-run branches?
Branches `url-move-dryrun` exist locally in unpoly and unpoly-site (worktrees in /home/henning/Projects/urlmove/). My push was blocked by the permission system. The runbook is copied to docs-rework (docs/rework-2026/url-move-runbook.md), but the script and the site commits only exist locally.
- 31A push both branches (nothing merges); you can run `! git -C /home/henning/Projects/urlmove/unpoly push -u origin url-move-dryrun` and the same for urlmove/unpoly-site, or allow me to.
- 31B keep them local until launch day.

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
