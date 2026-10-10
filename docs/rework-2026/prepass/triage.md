# Triage of the pre-pass findings (2026-10-10)

Sources (all in this folder): **LS** loading-state-and-live-fragments, **HS** history-and-scrolling-focus,
**ON** overlays-and-network, **AB** animation-and-backend, **AR** advanced-rendering-and-scripting,
**FGL** facts-getting-started-and-links, **FF** facts-forms. "LS /polling 2" = report LS, page section
/polling, finding 2. Duplicates across reports are merged into one item.

**Counts:** Q 3 · CODE 1 · C 21 · A 61 · B 24.
**Dropped:** 0. No claim proved false on re-check. Not counted: the FF "Planned sitting additions"
confirmations (no action needed), the unverified `npx skills add` command and demo/GitHub URLs (FGL; not
findings), and the pages reported with no findings.

Verified during triage (were unverified or marked "worth a check"):
- AR /navigation-defaults 1: a non-navigating render of an error response rejects with "No target selector given for failed responses". The same path is covered by spec/unpoly/fragment_render_url_spec.js:507 (deriveFailOptions, render_options.js:241-253, has no `target`/`fallback`).
- AR /preserving-elements 2: targeting an `[up-keep]` element directly keeps it, see spec/unpoly/fragment_keep_spec.js:448-458.
- AR /enhancing-elements 1: closing an overlay runs destructors of its content, see spec/unpoly/classes/layer/overlay_spec.js:513, :531.
- ON /history-in-overlays 1 (lifetime claim): `layer.history` is assigned only in open_layer.js:207,212, so a layer opened with `history: false` keeps it.
- LS /optimistic-rendering 3: second submission aborts the first, see fragment_render_abort_spec.js:224. Its preview is reverted, see status_render_spec.js:372.
- FGL /preloading 1: `up.on()` adds no `capture` unless asked (event_listener.js:48-52), so a non-bubbling `mouseenter` never reaches the document listener.


## Q: intended behavior (for Henning, one by one)

### Q1. Validations set no feedback classes by default
- **Docs say:** "While a validation or autosubmit request is loading, feedback classes like `.up-active` and `.up-loading` are set by default" (watch-options.md:154). The `[up-watch-feedback='true']` default is in pages/params/up-watch/loading-state.md:22.
- **Code does:** `options.feedback = u.some(dirtyRenderOptionsList, 'feedback')` (form_validator.js:284). `statusOptions()` parses `feedback` without a default (status.js:429), so an unset attribute yields an explicit `false` that overrides the render default `feedback: true` (fragment.js:256). Autosubmit does get classes by default (form.js:136-137). Specs only test the opt-in (form_validate_fn_spec.js:853). Temp spec (FF): no classes without `[up-watch-feedback]`.
- **Both make sense because:** validations can be seen as silent background updates, but every other render (incl. autosubmit) shows feedback, and the comment at form_validator.js:283 ("If any solution wants feedback, they all get it") reads like opt-out was meant.
- **Lean:** code bug. Treat an unset `feedback` as `true` in `_mergeRenderOptions()`, with a spec.
- **Pages:** watch-options, feedback-classes, up-watch loading-state params. (Either way, a validating *field* never gets `.up-active`, since the origin is the form, form_validator.js:244. That fix is A10.)

### Q2. `[up-validate]` validates again for an unchanged value
- **Docs say:** "Unpoly guarantees the callback is run only once per unique changed value" (watch-options.md:41-42), on a page that lists `[up-validate]` among the features its options apply to.
- **Code does:** the validator's listener validates on every named event without comparing values (form_validator.js:24-31). FieldWatcher, used by `up.watch()`/`[up-autosubmit]`/`[up-switch]`, skips unchanged values (field_watcher.js:99-101, :174-180). `input` expands to `input change` (form.js:24), so typing and then tabbing out sends two requests. Temp spec (FF) confirms. No spec covers deduplication for validation.
- **Both make sense because:** "validate on every named event" is simple and predictable, while dedupe saves server round trips in the recommended validate-while-typing pattern.
- **Lean:** code bug. Skip validations whose field value equals the last validated one, like FieldWatcher does.
- **Pages:** watch-options, partials/validating-while-typing.md.

### Q3. A configured custom field inside `<fieldset disabled>` is submitted
- **Docs say:** "A field inside a `<fieldset disabled>` is omitted from a submission, because the browser omits it" (custom-form-fields.md:135-138, in a section that applies to every kind of custom field).
- **Code does:** for a configured (non-form-associated) element the browser omits nothing. Unpoly adds it through `addField()` (params.js:541-543), which checks only the element's own state (form.js:242 `readFieldDisabled`, "an ancestor `<fieldset disabled>` … we deliberately don't track"). Temp spec (FF): the configured field is submitted, while a native input beside it is omitted.
- **Both make sense because:** ignoring ancestors is deliberate for watchers, but authors expect a disabled fieldset to exclude everything inside it from a submission.
- **Lean:** code bug for submissions only (`fromForm()` skips configured fields inside `fieldset:disabled`). Watchers stay as documented.
- **Pages:** custom-form-fields.


## CODE: clear bugs

- **Space never activates faux buttons.** `makeClickable()` checks `event.key === 'Space'` (link.js:671), but browsers report `' '` (`'Space'` is `event.code`). The spec spec/unpoly/event_spec.js:1120 dispatches a synthetic `key: 'Space'` (Trigger.keySequence → trigger.js:199), so it enshrines the bug. Fix both code and spec to use `' '`. Source: FGL /faux-interactive-elements side note.


## C: judgment calls, by chapter

### Forms
- C1. /handling-all-forms macro (decided in the sitting): `form.setAttribute('up-disable', '')` overwrites an author's `[up-disable=".actions"]`. Add a `hasAttribute` guard, or exclude such forms in the selector? Pattern 6 says to add guards only when needed. (FF planned additions, macro bullet)

### Loading state
- C2. /optimistic-rendering: `form.reset()` in both previews is not reverted, so an aborted or offline request loses the user's text. Drop `form.reset()`, or keep it and add one sentence? Same in unpoly-demo application.js:239. (LS /optimistic-rendering 1)

### History
- C3. /history overview copies /updating-history (same two link examples, same sentence) and tracking-page-views. Re-angle from the user's side and keep only the minor-fragment example? (HS /history 2)

### Overlays
- C4. /overlays "Closing with a result": re-angle to the family of ways to close, and leave the close-condition example to the Subinteractions teaser that follows. Draft in source. (ON /overlays 1)
- C5. /overlays vs /opening-overlays#link: the progressive-enhancement paragraph is duplicated almost verbatim. Which page keeps it, and does the other become mechanics-only? (ON /overlays 2)
- C6. /closing-overlays: add a paragraph plus code example on preventing `up:layer:dismiss` (unsaved changes). Show a dirty-check guard or not? (ON /closing-overlays 2)
- C7. /closing-overlays "Using the discarded response" duplicates subinteractions "Reloading on acceptance". Keep the example on subinteractions and re-angle this one to the event API? (ON /closing-overlays 4)
- C8. /closing-overlays "Close animation" repeats /customizing-overlays#animation. Rewrite to the per-close `{ animation }` angle only. Draft in source. (ON /closing-overlays 5)

### Network & caching
- C9. /network overview copies three passages (offline listener, the 15 s revalidation sentence, slow-server sentence). Re-angle each; drafts in source. (ON /network 1)
- C10. /caching "Detecting revalidation from a compiler" is a literal copy of the tracking-page-views example. Use a different side effect, or shrink it to a pointer? (ON /caching 3)
- C11. /caching: drop the first `autoCache` example (`request.method === 'GET'`), since it nearly restates the default (network.js:142)? (ON /caching 4)
- C12. /network-issues: merge "Slow server responses" and "HTTP error codes" into one short "What is not a network issue" section. Draft in source. (ON /network-issues 2)

### Animation
- C13. /animation overlay example near-literally copies customizing-overlays.md:137-143. Re-angle to "which effect plays when" and drop the example? (AB /animation 3)

### Backend integration
- C14. /backend-integration overview has three literal copies (the "1 KB" sentence appears 3×, two handling-asset-changes sentences). Re-angle from the server developer's side. Drafts in source. (AB /backend-integration 2)
- C15. /optimizing-responses #version: the example ("render only the `<body>`") breaks titles, meta tags and deployment detection. Swap the example, and add a sentence to #title. Pick the new example. (AB /optimizing-responses 2)

### Advanced rendering
- C16. /advanced-rendering overview copies three detail-page passages (`.tasks:after` example, navigation-defaults intro, `X-Maintenance` listener). Re-angle; drafts in source. (AR /advanced-rendering 1)
- C17. /attributes-and-options #options and #config re-teach precedence now owned by #layers. Re-angle #options to parsing, and cut the #config sentence? (AR /attributes-and-options 1)
- C18. /navigation-defaults "Defaults that depend on the origin" shares its example and sentence with render-lifecycle. Use a navigation-angled example (`scroll = false` for tabs)? (AR /navigation-defaults 2)
- C19. /targeting-fragments "Targeting an element object" repeats the target-derivation opening example. Drop the code block and keep the origin point? (AR /targeting-fragments 2)

### Scripting
- C20. /scripting overview repeats start/elements and enhancing-elements#registration. Re-angle to element *lifetime*: lead with the destructor example and fold in "The page is long-lived". Draft in source. (AR /scripting 1)
- C21. /script-security: the commented-out "General advice" block (lines 9-33) still awaits a resurrect/delete/leave verdict. (AR /script-security 2, open item)


## A: facts for the fix round

- A1. links.md:49-50, following-links.md:60: "the new content is scrolled into view" → "the page scrolls to the top" (fragment.js:280 `layer-if-main`). (FGL /links 1, /following-links 2)
- A2. following-links.md:19-21 "scroll positions, focus … survive" and forms.md:27 "scroll positions, focus and other forms all survive": wrong for main-target navigation. Use "Elements outside the updated fragment keep their state, like unsaved input in other forms." (FGL /following-links 1, FF /forms 1)
- A3. partials/no-follow-reasons.md:6: the exclusion is `[href^="#"]`, not only `#`. Corrected wording in source. (link.js:133, link_spec.js:652) (FGL /following-links 3; shows on following-links + handling-all-links)
- A4. handling-all-links.md:38-42: add "Links with an `[onclick]` attribute." to the click-activation list (link.js:136, link_follow_attr_spec.js:424). (FGL /handling-all-links 1)
- A5. preloading.md:73-77: `up.on('mouseenter', 'main', …)` never fires. Use `mouseover`, or pass `{ capture: true }`. (FGL /preloading 1)
- A6. preloading.md:91-95: a bare `<a href="/menu">` is not followed. Add `up-follow`, and say "any followed link". (FGL /preloading 2)
- A7. submitting-forms.md:66-67, validation.md:72: "non-200 status" → "a status code outside the 2xx range" (network.js:141). Keep it in the shrunken #validation text. (FF /submitting-forms 1, /validation 1)
- A8. custom-form-fields.md:9-13 table: validated and disabled work without a `value` getter, while watched and switched need one. Split the column or reword both rows. (FF /custom-form-fields 1)
- A9. watch-options.md:9-16: loading-state options apply only to `[up-validate]`/`[up-autosubmit]`. `[up-watch]` callbacks must forward `options`. Add the two sentences from the source. (FF /watch-options 3)
- A10. feedback-classes "Fields can be active origins": drop the `[up-validate]` bullet. A validation's origin is the form (form_validator.js:244), so this holds whatever Q1 decides. (LS /feedback-classes 1)
- A11. feedback-classes: content rendered from the cache gets no feedback classes (request.js:611). One sentence at the start of "Feedback during cache revalidation". (LS /feedback-classes 2)
- A12. placeholders: not shown for cache hits or revalidation (request.js:611, from_response.js:92). One sentence plus a link to previews#using-previews-with-caching. (LS /placeholders 1)
- A13. previews "How previews end": focus taken by a preview is restored unless the user moved it (status.js:252-261). One sentence. (LS /previews 1)
- A14. `up.Preview#hideContent` doc example calls the nonexistent `preview.hideChildren()` (classes/preview.js:695). (LS /previews, reference bug)
- A15. optimistic-rendering: a second submission aborts the first request and reverts its preview. One sentence plus a link to aborting-requests. Don't claim what the server does with the aborted POST. (LS /optimistic-rendering 3)
- A16. progress-bar: background list misses cache revalidation (from_response.js:101). Deferred content loads in the foreground unless `[up-background]` is set (link_defer_spec.js:46). lazy-loading gets one sentence linking there. (LS /progress-bar 1, /lazy-loading 2)
- A17. lazy-loading "Showing a fallback while loading": on an error response nothing is rendered and the fallback stays. Set `[up-fail-target]` to show it. (LS /lazy-loading 1)
- A18. infinite-scrolling: pages loaded by scrolling are not in the URL. Coming back starts at page 1. (LS /infinite-scrolling 1)
- A19. polling: a reload aborts earlier requests in the fragment and is aborted by updates of the fragment or an ancestor (render_job.js:211-213, fragment_polling.js:30-34). (LS /polling 1)
- A20. polling: every reload sets `.up-loading` on the fragment (fragment.js:256, radio.js:359). Opt out with `[up-feedback=false]`. (LS /polling 2)
- A21. hungry-elements, flashes: hungry elements and flashes also update from error responses (`hungry` is a shared key, render_options.js:78). One sentence on each page. (LS /hungry-elements 1, /flashes 1)
- A22. flashes "targeted automatically": `[up-flashes]` also picks up render passes in overlays above (`[up-if-layer=subtree]`, radio.js:517-522). Link /hungry-elements instead of /up-hungry. (LS /flashes 2)
- A23. updating-history #get-requests: the same rules apply to error responses (a failed GET into main changes the URL; a failed form submission doesn't). (render_options.js:76-79, fragment.js:259-268) (HS /updating-history 1)
- A24. updating-history #when-history-is-changed and tracking-page-views: rendering the URL already shown adds no entry and emits no `up:location:changed` (history.js:397, layer/base.js:859). (HS /updating-history 2, /tracking-page-views 3)
- A25. restoring-history: restoring aborts pending requests for the restored fragment (history.js:452, fragment.js:254). (HS /restoring-history 1)
- A26. restoring-history step 4, scrolling#restore, focus#restore: positions and focus are kept per layer in memory until the next full load. Without them, `restore` does nothing (restoring falls back to `auto`). Mention the `[up-scroll="restore, top"]` / `[up-focus="restore, target"]` fallbacks. (viewport.js:542,602-608,650,677; history.js:476,478) (HS /restoring-history 2, /scrolling 1, /focus 1)
- A27. restoring-history: offline Back keeps the content while the URL changes. Link network-issues. (history.js:444-480, from_url.js:93) (HS /restoring-history 3)
- A28. tracking-page-views #overlays: closing an overlay with visible history emits `up:location:changed` for the parent URL (counts a view), while the layer listener doesn't. (close_layer.js:64, layer/base.js:657-664) (HS /tracking-page-views 1)
- A29. tracking-page-views: `up:fragment:loaded` also fires for polling and validation. Skip polling via `event.request.background` (radio.js:354). (HS /tracking-page-views 2)
- A30. scrolling-and-focus: the focus order is the wrong way round. Use "the counterpart of the element the user was in, or the new fragment if there is none" (fragment.js:279). (HS /scrolling-and-focus 2)
- A31. scroll-tuning: delete the important box claiming swaps can't animate scrolling (commit 1ec2f03af, fragment_render_scrolling_spec.js:910). (HS /scroll-tuning 1)
- A32. opening-overlays #link: an error response renders in the link's own layer, not an overlay (`layer` not shared, render_options.js:76-82). Link layer-option#fail-layer. (ON /opening-overlays 3)
- A33. opening-overlays #link: a second overlay link clicked while the first loads opens only the second (open_layer.js:28-34). (ON /opening-overlays 4)
- A34. closing-overlays location condition: the value is `{ id: 123, location: '/companies/123' }` (overlay.js:399). A form failing validation keeps the overlay open. Apply the same to the subinteractions.md:79 table row and add one sentence after "accepted automatically". (ON /closing-overlays 1, /subinteractions 1)
- A35. closing-overlays #intents: closing also closes descendant overlays, aborts the overlay's requests and returns focus to the opener (close_layer.js:31,46,123-137). One sentence. (ON /closing-overlays 3)
- A36. history-in-overlays #configuring-visibility: an overlay opened by a POST response has invisible history for its lifetime unless the server redirects (from_response.js:163-173, open_layer.js:203-212). (ON /history-in-overlays 1)
- A37. caching #enabling: error responses aren't cached and evict the URL. A concurrent request for the same URL waits for the in-flight one (network.js:500-534,557-567,580-593). (ON /caching 2)
- A38. aborting-requests #preventing: an aborted request may already have reached the server (request.js:710-716). (ON /aborting-requests 1)
- A39. network-issues "Disconnects": without an `up:fragment:offline` listener the user gets no feedback (no default listener in src/). (ON /network-issues 1)
- A40. animation #fail-transition: a failed response does not use `[up-transition]` (`transition` not in SHARED_KEYS, render_options.js:76-82). Only a navigateOptions default applies to both. Corrected text in source. (AB /animation 1)
- A41. animation: revalidation re-renders without a transition (NO_MOTION, from_response.js:88-91). Back-button restores aren't animated (history.js:444-478, motion.js:234-236). (AB /animation 2)
- A42. animation #how-a-transition-plays: the old element stays in the DOM with `.up-destroying`. Unpoly lookups ignore it, but `querySelector` doesn't (update_steps.js:103, fragment.js:1179). (AB /animation 5)
- A43. motion.js:196,269,399 document `[options.duration=300]`; the default is 175 (motion.js:41). (AB /animation, reference bug)
- A44. backend-integration.md:21-22 (and optimizing-responses.md:6): "discards the rest" → "except hungry elements and the `<head>`". (AB /backend-integration 3)
- A45. optimizing-responses #target: `X-Up-Target` doesn't list hungry elements or flashes, so keep rendering them (update_layer.js:28-40 vs :172-181, radio_hungry_spec.js:189). (AB /optimizing-responses 1)
- A46. optimizing-responses #vary: `Vary` also protects the browser HTTP cache and CDNs from serving shortened responses to full loads. Check the CDN honors it. (AB /optimizing-responses 3)
- A47. conditional-requests #how-it-works: the initial page load's headers aren't visible to scripts. Render `[up-etag]`/`[up-time]` to make the first reload conditional (fragment.js:3178-3183, addition.js:97-100). (AB /conditional-requests 1)
- A48. handling-asset-changes #tracking-assets: responses without `<head>` aren't compared. Use the polling detector instead (from_content.js:86-89). (AB /handling-asset-changes 1)
- A49. navigation-defaults "Opting out": also loses the main-element fallback. An error response renders nothing unless `[up-fail-target]` is set (verified, see top). (AR /navigation-defaults 1)
- A50. targeting-fragments lines 86, 267, 282: "in either" → "in the current page or in the response" (from_content.js:61,156-165). (AR /targeting-fragments 1)
- A51. target-derivation feature list: add `[up-keep]` and `[up-validate]` (fragment.js:1027, form.js:1102-1103). (AR /target-derivation 1)
- A52. failed-responses: remove the "aborted by a second request" bullet. Aborts render no fail options (render_job.js:189). (AR /failed-responses 1)
- A53. preserving-elements: a kept element's compilers don't rerun and its destructors aren't called until it is finally removed (fragment_keep_spec.js:779, :802). (AR /preserving-elements 1)
- A54. preserving-elements: targeting an `[up-keep]` element directly keeps it, so nothing changes. Point to #forcing-updates (fragment_keep_spec.js:448). (AR /preserving-elements 2)
- A55. enhancing-elements: destructors run only when Unpoly removes the element (swap, `up.destroy()`, overlay close). Use `up.destroy()` in your own code. (AR /enhancing-elements 1)
- A56. enhancing-elements #registration: compilers run in registration order, each for all its matches, and `{ priority }` changes it (hello_fragment.js:66-91, script.js:221-226). (AR /enhancing-elements 2)
- A57. enhancing-elements date picker: one sentence that libraries adding popups or listeners outside the input need a destructor. (AR /enhancing-elements 3)
- A58. data "Merging data attributes": `[up-data]` wins over `data-*`, and `[up-use-data]` wins over both (script.js:864-869). (AR /data 1)
- A59. templates.md:101: `up-fragment="#my-template"` → `#task-template`. (AR /templates 1)
- A60. islands: give the `[up-keep]` color picker an `[id]`, since class matching only works while unique (fragment.js:1027-1031). Match the prose. (AR /islands 1)
- A61. legacy-scripts: "When allowing inline scripts to run" is wrong. Scripts run by default unless the CSP blocks them (script.js:83, script_gate.js:252-263). Corrected text in source. (AR /legacy-scripts 1)


## B: patterns for the fix round

- B1. loading-state intro and previews sentence, previews intro: add disabling to the preview family (status.js:276). (P3; LS /loading-state 1, /previews 2)
- B2. optimistic-rendering template example: remove the `if (text)` guard (form is `[required]`). (P6; LS /optimistic-rendering 2)
- B3. live-fragments "Updating elements outside the target": add the flashes pointer sentence (Forms-sitting decision). (LS /live-fragments 1)
- B4. Rails notes: lazy-loading "Improving cacheability" (ERB), context.md:55-67 and :118-129 (+ "set `X-Up-Context` yourself"), attributes-and-options.md:90-98, closing-overlays.md:357 (prose). (P8; LS /lazy-loading 3, ON /context 1, AR Rails note, ON /closing-overlays 7)
- B5. infinite-scrolling: "placeholder" → "deferred link/element", matching lazy-loading. (LS /infinite-scrolling 2)
- B6. history: remove "History is a navigation default" (same decision as /forms and /links). No inbound anchor links. (P1; HS /history 1)
- B7. history: family sentences for "Updating the address bar" and `[up-back]` in "Restoring the previous page". Drafts in source. (P3; HS /history 3)
- B8. scrolling-and-focus: retitle "Navigation defaults", keeping `{#navigation-defaults}`. (P4; HS /scrolling-and-focus 1)
- B9. scrolling-and-focus "Showing or hiding focus rings": add the `autoFocusVisible` / `[up-focus-visible]` sentence. (P3; HS /scrolling-and-focus 3)
- B10. overlays.md:72-74: keep only the `up.layer.config.mode` line, since /customizing-overlays owns per-mode config. (P5; ON /overlays 3)
- B11. opening-overlays #close-conditions: shrink to one pointer sentence and keep the anchor. (P1; ON /opening-overlays 1)
- B12. opening-overlays #modes: drop the included modes table, since the overview owns it (as in duplication-scan outcome 6). (ON /opening-overlays 2)
- B13. closing-overlays.md:374,394 and layer-option.md:28: drop the redundant `up-submit` next to `up-layer` (form.js:158). (P6; ON /closing-overlays 6, /layer-option 1)
- B14. network "Instant revisits": add the caching family sentence. (P3; ON /network 2)
- B15. caching: retitle "Enabling caching", keeping `{#enabling}`. (P4; ON /caching 1)
- B16. caching: merge "Caching optimized responses" and "How cache entries are matched" into one pointer section, keeping both anchors. (P1; ON /caching 5)
- B17. animation: retitle "Disabling animation globally" to "Reduced motion and disabling animation", keeping the anchor. (P4; AB /animation 4)
- B18. animation.md:20-21: cut the repeated "only shifts when … different size" sentence (kept at :288). (P5; AB /animation 6)
- B19. backend-integration "Steering the frontend": widen the teaser to the response-header family. (P3; AB /backend-integration 1)
- B20. advanced-rendering "Handling failed responses": add the family sentence. (P3; AR /advanced-rendering 2)
- B21. failed-responses "Handling fatal network errors": name `[up-on-offline]` / `up:fragment:offline` and link network-issues. (P3; AR /failed-responses 2)
- B22. providing-html "Rendering a `<template>`": shrink to a pointer at templates, keeping `{#template}`. (P1/P5; AR /providing-html 1)
- B23. script-security: in #callback-nonces and #script-element-nonces, replace the repeated `<meta name="csp-nonce">` block and the "only need to match" sentence with a pointer to #meta-csp-nonce. (P5; AR /script-security 1)
- B24. validation concurrency paragraph (sitting draft): qualify the abort claim to "when a submission replaces the form" (form_submit_fn_spec.js:509). The other draft claims hold. (FF planned additions)
