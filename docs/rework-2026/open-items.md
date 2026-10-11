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

## Status notes (no decision needed)
- 2026-10-11: code fixes pushed: dfa0712e0 (Q1 validation feedback default), aea7978a1 (Q3 configured fields in disabled fieldset, changelog bullet extended), 714a4b519 (Space key). Full suite 4329 passed, 1 failed: link_target_spec.js:752 transition transform spec, passes alone and in its group (looks flaky, unrelated).
- Fix round merged (7 commits) + overlay leftovers (09db32d44). Changelog entry for [up-on-accept]/[up-on-dismiss] added.
- Running: unpoly-site namespace rename + sidebar spec + link check (worktree); URL move script dry run (throwaway worktrees, not merged).
- unpoly-site: Unpoly::Guide → Unpoly::Site rename merged + pushed (977b8949). sidebar_spec.rb:260 fixed (dc7025fc: syntax highlighter's mark masks merged with following digits). Twins spec expectation updated (bd5d9ca7). check_urls 78/78, build + HTMLProofer OK.
- Anchor scan of the built site: 3 broken anchors on current pages fixed (c2835e615). 118 more are in old release notes /changes/0.x and 2.x (the build skips them on purpose; e.g. /up.popup, /up.modal links). Left alone.
- Running: search ranking (/layer-option for "layer"; skill search "history state"), URL move dry run.
- URL move dry run done: script `bundle exec rake docs:url_move` (unpoly-site, branch url-move-dryrun), 627 documents moved (83 /learn, 544 /api), 3,277 links rewritten, 627 generated redirects + 154 retargeted, no chains, idempotent; build "All links OK", check_urls green (now also checks missing redirects and chains), real Apache 2.4: 782 old URLs → 301 → 200. Site code stays as commits to rebase on launch day (as planned). Runbook: docs/rework-2026/url-move-runbook.md.
