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
