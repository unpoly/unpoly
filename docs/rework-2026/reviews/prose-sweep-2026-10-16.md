# Prose sweep, 2026-10-16

Read-only review of the complete documentation site for prose quality: AI tropes, inconsistent terminology, and sections that are hard to understand. Nothing was edited.

**Scope.** All 147 Learn pages in `src/unpoly/pages/**` (incl. `params/` and `partials/`), the `/*- */` doc comments in all 54 files under `src/unpoly/` and `src/unpoly-migrate/`, and the reader-facing pages in `unpoly-site/source` (landing, hubs, support, imprint, privacy, skill). Release notes and `docs/rework-2026` were skipped.

**Method.** Learn pages, params and partials were read in full by the lead reviewer. The API reference and the site were split into four slices and read in full by one reviewer each; the lead spot-checked their top findings against the source. Regex scans over the whole corpus checked for stock AI words, "not X but Y", em-dash connectives, rhetorical questions and reserved-term misuse. Per-slice notes with every minor finding and a typo list live in the session scratchpad (`review-api-1.md`, `review-api-2.md`, `review-api-3.md`, `review-migrate-site.md`, `prose-sweep-notes.md`).

**Summary.** The Learn pages are clean of AI slop: the scans found no em-dash connectives, no rhetorical questions and no "not X but Y" contrasts in prose, and the humanizer pass shows. The remaining problems are (A) a few pages with an aphoristic rhythm, above all the landing page; (B) real terminology drift, led by "failed response" surviving the rename to /error-responses and "layer" being used for the attribute/function/config shape; (C) a cluster of copy-paste errors in parameter descriptions that say the wrong thing, plus one Learn page that describes the scroll default wrong.

Counts: A: 5 patterns (1 high, 2 medium, 2 low). B: 14 concepts (3 high, 7 medium, 4 low). C: 18 findings (8 high, 6 medium, 4 low).

Line numbers refer to the files as of this commit on `docs-rework`. `F:` = `src/unpoly/fragment.js`, `L:` = `link.js`, `M:` = `form.js`.


## (A) AI tropes

Ranked by impact. Overall the corpus is plain; these are the places where rhythm or sales language still shows.

### A1. Landing page: one-line closers and dramatic fragments (high, confined to one file)

`unpoly-site/source/index.html.erb` is the one place with the classic AI cadence. Four of its seven sections end on a one-line closer that restates the section, and two cards end on a fragment:

- :109 "The same care runs through every feature."
- :184 "The same pattern enhances existing tags, invents new elements, or mounts a whole React island." (forced triad)
- :193 "They just learn to do it better."
- :291-293 "Enhance one link. Leave the rest alone."
- :136 "It never went away." (card punchline)
- :143 "extensive JavaScript API", :151 "the events you wish the platform had", :265 "htmx is excellent for that temperament"
- :58 the trailer repeats the heading and opening of the section at :190-203.

The file's header says the copy is owned by the design canvas, so the fix belongs there. Suggest cutting the closers outright (each section already made its point) and replacing the fragments with a plain sentence.

### A2. `custom-form-fields.md`: aphoristic rhythm (medium)

The page is informative, but it leans on balanced sentences and a "not X but Y" closer more than any other Learn page:

- :16 "If you can keep a native field in the form, do."
- :24 "The user sees the control; the form submits the field."
- :54 "Don't forget the `change` event."
- :100 "for free"
- :166-169 "A `formdata` listener affects what Unpoly **sends**, not what it **watches**. ... Use it for data that is derived, not edited."

Suggest rewriting :24 and :166-169 as plain statements ("The form submits the hidden field; the control only sets its value." / "Values appended here belong to the whole form, so watchers and validations cannot attribute them to a field. Use it for values your code computes.").

### A3. `up.protocol` module intro: staged rebuttal plus enumeration (medium, high-traffic page)

`src/unpoly/protocol.js:4`: "None of this is required: Unpoly works with any backend ... Each header is useful on its own. Reading `X-Up-Target` lets the server ..., `ETag` and `Last-Modified` let it ..., and `X-Up-Events` or `X-Up-Accept-Layer` let it ..." This rebuts a belief nobody stated and then picks three headers in one sentence, which `documentation.md` asks writers to avoid. The header list below the intro already carries the enumeration; one sentence on what request and response headers do is enough.

### A4. Repeated flourish about speed (low, 4 places)

"regardless of how fast the user clicks or how slow the network is" appears verbatim at `M:1237` and `M:2164`, and as "however fast the user is and however slow the network" at `reactive-server-forms.md:137-138`. `M:2161-2164` also stages a problem ("will often exhibit race conditions") before the rescue. One concrete sentence ("Unpoly sends one validation request at a time and batches the rest") says more.

### A5. Isolated sales words and chatty asides (low)

- `start/overview.md:71-72` "Every move works on its own, so you can stop at any point and already have a better app." (sales closer on the first page)
- `data.md:52` "For a more powerful alternative"; `placeholders.md:137` "appear seamless"; `M:790` "comes with a number of quality of life improvements"; `templates.md:94` "very low-tech", :147 "countless template engines"
- `backend-integration.md:32-33` "A server that ignores them gets a working app. A server that reads them can do less work." (parallel pair); `extensions.md:4` "no server library, no build step, no CSS framework" (triad)
- Pre-AI chattiness: `protocol.js:948` "two edge cases you might or might not care about", :953-957 browser list "last tested in 2019-03"; `script.js:368-377` "You will sometimes find yourself ... We would much rather define..."
- "ensure/guarantee" is not overused (35 hits corpus-wide, most technical); only `F:735`/`F:800` repeat "to ensure that the user never sees expired/stale content" twice on one event, and `feedback-classes.md:147` repeats it again.


## (B) Terminology

Each entry: the concept, the variants found, locations, and a suggested canonical term. Ranked by how likely a reader is to be confused.

### B1. "failed response" vs "error response" (high, 25 vs 39 occurrences)

The page was renamed to /error-responses and its own prose uses "error response", but the older term survives across pages, params and the reference, often in the same section as the new one:

- Learn pages: `advanced-rendering.md:85-101` (section titled "Handling error responses", body says "failed form submission", "failed responses", "A failed response"); `validation.md:70,97,106,117,129` ("Signaling a failed submission", "failure detection", chip "Failed responses will appear here") vs :134 "rendering error responses differently"; `transitions.md:76-78`; `optimizing-responses.md:69,108`; `targeting-other-layers.md:195,202`; `polling.md:134`; `render-lifecycle.md:272`; `server-protocol.md:34`; `updating-history.md:98` ("a failed `GET` request renders an error page"); `opening-overlays.md:94`.
- Params: `params/up-follow/request.md:28`, `targeting.md:13`, `scrolling.md:9`, `focus.md:9`; `params/up.render/request.md:61,63` ("considered failed"), `scrolling.md:12`, `focus.md:9`.
- Reference: `network.js:57-59` ("a [error response]" then "failed response"), :424-429; `protocol.js:77-78, 142, 158, 160, 163, 174-180, 243, 541, 556` ("A fragment update is considered *failed*"); `request.js:979` "a failed HTTP status"; `render_job.js:128, 238`; `render_result.js:59`; `M:360, 1556`.
- "failed request" for a request with no response (`network-issues.md:5,24`; `F:824, 860`; `network.js:932`) is a different concept and can stay, but should not be used for error responses (`updating-history.md:98`, `protocol.js:163`).

Canonical: "error response" / "error status". "Failed form submission" (the user-facing event) may stay.

### B2. "layer" for the attribute/function/config shape (high, 2 pages, one of them Getting started)

`start/api.md:10` "One feature, three layers {#layers}", :13 "The quickest layer is an attribute", :34 "All three layers set the same option"; `attributes-and-options.md:13` same heading with the anchor `#layers`, :40 "Each layer only replaces the values it actually sets". "Layer" is one of Unpoly's most loaded terms (root layer, overlays, `[up-layer]`), and both pages appear next to pages that use it in that sense. Suggest "three forms" or "three places" and a new anchor.

### B3. main element / main target / main content / main content area / primary content element / main fragment (high, corpus-wide)

Counts: "main element" 71, "main target" 52, "main content" 9. The variants switch within single pages:

- `navigation-defaults.md:5` "main content" / :47 "main target" / :56 "main element"
- `scrolling.md:14` "main target" / :105 "main element" / :226 "main target" / :233 "main element"; `focus.md:19` "If updating a main target, focus the main element"
- `targeting-fragments.md:41` "main element" vs :289-300 "main target"
- `error-responses.md:73` "main target" / :75 "main content area"; `history.md:5` / :12; `updating-history.md:4` / :14; `advanced-rendering.md:64`; `start/overview.md:48`; `opening-overlays.md:115,168`
- Reference: `L:179` "main element" vs `L:1147` "main target" (both link /up-main); `F:497, 640, 2373` "main target(s)"; `F:1886, 2349` "main element"; `F:2342, 2551`, `viewport.js:469` "main content area"; `F:2388` `[up-main]` lead "primary content element"; landing `index.html.erb:101` "main fragment".

Suggest: "main element" for the node on the page, "main target" only when the selector itself is meant (e.g. `up.fragment.config.mainTargets`), and drop "main content (area)", "primary content element" and "main fragment".

### B4. Overlay result value: four names, four anchors (medium, `layer.js`)

"acceptance value" (`layer.js:619, 784, 811, 1094, 1554`), "dismissal value" (:637, 1127, 1161, 1510, 1638), "dismissal reason" (:792, 813), "overlay result value" (:552, 570, 590, 1015-1067); `base.js:151` vs :243 split the same way. Links go to `/closing-overlays#acceptance-values`, `#dismissal-reasons`, `#result-values` and `/subinteractions#result-values`. The Learn pages use "result value" as the umbrella with "acceptance value"/"dismissal reason" as kinds; the reference should follow, with one anchor per kind.

### B5. keep vs preserve vs persist (medium)

`[up-keep]` is "keeping elements", but: `F:11` "preserved across updates"; `F:877` `[up-keep]` lead "will be persisted when rendering" (this is the hub blurb); `F:883, 903` "preserve the playback state"; `F:946` "persisted"; `keeping-elements.md:44` chip "preserved"; `render-lifecycle.md:36` "Preserve elements within a fragment"; `polling.md:183` "To preserve individual elements"; `islands.md:107` "To preserve an island"; `params/up.render/client-state.md:23` and `up-follow/client-state.md:20` "will be preserved". "Preserving scroll positions/focus/data" (`scrolling.md:149`, `focus.md:105`, `data.md:216`) is a different concept and reads fine. Canonical for elements: kept/keeping.

### B6. "in the background" for ordinary requests (medium, Getting started)

`start/overview.md:18` "fetches `/messages` in the background", `start/links.md:17`, `start/forms.md:21` "sends the form data in the background". These are foreground requests; /background-requests defines the term as `[up-background]`. Suggest "without leaving the page" (as `network.md:13` already says). Separately, "a layer in the background" / "background layer" (`targeting-other-layers.md:103,113`; `closing-overlays.md:273-303`; `layer.js:1339`; `base.js:375`) is a third sense of the word; "parent layer" or "the layer behind" avoids it.

### B7. "effect" outside the Motion sense (medium)

The Motion chapter defines *effect* as the umbrella for transitions and animations (`motion.md:9`, `controlling-motion.md` throughout). Elsewhere the word names unrelated things: switching effects (`switching-form-state.md:7-12, 208-214`; `forms.md:102` "Light effects like showing, hiding"), preview effects (`loading-state.md:6` "Every effect appears instantly", `placeholders.md:45`, `previews.md:122`), compiler side effects (`enhancing-elements.md:112-131` "Element-local effects", "Global effects"). Suggest "changes" for previews and compilers, "rules" or "behaviors" for switching.

### B8. overlay / dialog / modal / box / backdrop / background (medium)

`overlays.md:19-21` "shows it in a modal dialog. The user can dismiss the dialog by pressing Escape, by clicking outside the box"; `start/overlays.md:4,19,23` "like a modal dialog", "clicking outside the dialog"; `history-in-overlays.md:6` "a page opened in a dialog"; `opening-overlays.md:5,63`. For the dismiss area: "backdrop" (`overlays.md:73`), "background" (`closing-overlays.md:19,68`; `customizing-overlays.md:166,177`), "outside the (overlay) box" (`overlays.md:21`, `customizing-overlays.md:161`). Migrate: `modal.js:10,162` "modal overlay", :168 and :182 (`[up-drawer]`!) "displayed in a modal dialog". Suggest "overlay" for the thing, "modal" only as the mode name, "backdrop" for the dismiss area.

### B9. transition vs animation mixed up inside `motion.js` (medium, the module that defines them)

`motion.js:97` the `up.transition()` example calls `cross-fade` an "animation"; :73-76 the `up.animation()` contract says "when the transition has ended" / "the transition instantly jumps"; :110-122 the `up.transition()` contract mixes "animations" / "the animation" / "the transition" in one list; :400 `up.morph()` `options.duration` "duration of the animation". `element.js:104` `up.element.get()` "not aware of layers or [transitions](/up-destroying)" means elements being destroyed. Canonical: "animation" in `up.animation()`/`up.animate()`, "transition" in `up.transition()`/`up.morph()`; the Learn pages (/transitions, /animations) already do this.

### B9a. "reveal" for something other than scrolling (low, single hit)

`history-in-overlays.md:50` "This reveals the location of significant content to the user". Everywhere else "reveal" is the scroll term. Suggest "shows". (`history.js:573` `[up-meta]` "To preserve a `<head>` element" is the same kind of slip for "keep"; suggest "leave unchanged".)

### B10. History wording in the layer reference (low)

"the overlay will render history" (`layer.js:129-133`), "Whether this layer renders history" (`base.js:47`), "visible history" (`layer.js:511, 976`; `base.js:41, 762`), "can affect browser history and window title" (`layer.js:1786`; `base.js:39, 766`). The Learn page is /history-in-overlays and says "visible history"; use that.

### B11. "AJAX request", "UJS attributes", "HTML selectors" (low, dated vocabulary)

"via AJAX" / "AJAX request": `M:320, 322`; `L:1281`; `network.js:300, 764, 793, 833, 880, 917`; `protocol.js:1057, 1062, 1076`; vs "with JavaScript" / "request" elsewhere. `script.js:368` "UJS attributes", :587 "HTML selectors", :603 "Unpoly's own HTML selectors". Suggest "request" and "`[up-*]` attributes".

### B12. render pass / fragment update / render task (low)

"render pass" (137) and "fragment update" (68) are used interchangeably, including within one table (`render-lifecycle.md:268` "Fragment update was aborted" among render-pass rows) and in `params/up.render/navigation.md:4`. `render_job.js:4` says "A queued render task." Readers will cope, but a one-line definition on /render-lifecycle ("a render pass is one call to `up.render()`; it updates one or more fragments") would settle it.

### B13. Minor one-offs (low)

- `M:1481` `up.form.isSubmittable()`: "Unpoly will follow forms if ..." (submit).
- "navigate" for a plain follow: `faux-interactive-elements.md:14` "will [navigate](/up-follow)"; migrate `link.js:139`.
- `handling-all-links.md:47` "accelerated links" (instant links).
- `F:734-800` "expired" / "stale" / "too old" for the same cache state; `F:740` "validation response" should be "revalidation response".
- `M:351` `up.submit()` "the watched form's attributes" (copied from `up.autosubmit()`); `M:431` `up.form.submitOptions()` "the link's render options".
- Migrate `form.js:52,62`: the `[up-observe]` page says "The script given to `[up-watch]`". Migrate `modal.js:118-119`, `popup.js:78-79` "current layer" vs siblings "current overlay".
- Reference links to the deprecated `/up.replace` for the current concept: `F:1116`, `F:1885`; `params.js:9, 462` refer to `up.replace()` as if it existed.
- `radio.js:210-214` `[up-hungry]` conflict rules: "primary render target", "direct render target", "explicit render targets", "target selector" in three sentences; :158,187 "hungry element" vs :220-228 "hungry fragment". `radio.js:16` "passive updates" is never introduced.
- `viewport.js:6, 468` default viewport is the "document's scrolling element" vs :796 "the `<body>` element". `viewport.js:853, 886` "fragment link" (just "link").
- `history.js:276-278` `event.willHandle`: "Whether Unpoly thinks it is responsible" / "Unpoly feels responsible" (plainer: "Whether Unpoly will handle this change").


## (C) Hard-to-understand or misleading sections

Ranked by impact. Each entry: location, what is hard, a one-line suggestion.

### C1. `submitting-forms.md:93` describes the scroll default wrong (high)

"the browser URL and history are updated, and the new content is scrolled into view." The navigation default (`scrolling.md:13-17`, `following-links.md:59`, `start/overview.md:52`) scrolls the page to the top when a main target is updated and does not scroll otherwise. Use the sentence from `following-links.md:59`.

### C2. Parameter descriptions copied from a sibling that now say the wrong thing (high, reference)

Each of these reads fluently and is wrong:

- `F:1832-1841` `up.reload()` `options.focus`: "By default Unpoly will keep scroll positions of all viewports ... See scrolling for a list of allowed values." Copied from `options.scroll`.
- `params/up-follow/focus.md:25` `[up-save-focus]`: "Saved scroll positions can later be restored with `[up-focus=restore]`" (focus state).
- `F:609-614` `up.render()` @return: "the promise rejects when ... the form element was aborted" (copied from `up.submit()`; "the render pass was aborted").
- `base.js:216` `up.Layer#dismiss`: "If there isn't an acceptance value, omit this argument." (dismissal value)
- `request.js:468-471` `up.Request#fragment`: "When multiple fragments were inserted, the first fragment is returned. To get a list of all inserted fragments ..." A request inserts nothing; say "targeted".
- `L:80` `up.link.config.preloadSelectors`: "preload *all* links on `mousedown`" (copied from `instantSelectors`; preloading is on hover).
- `L:1466-1468` `[up-preload]` `[up-intersect-margin]`: "will load the deferred content" (copied from `[up-defer]`).
- `protocol.js:559-560` `X-Up-Fail-Context`: "you might prefer to not render a site navigation for overlays" (copied from `X-Up-Mode`); the example at :565 uses a key literally named `context`.
- `params/up-follow/lifecycle-hooks.md:6` and `params/up.render/lifecycle-hooks.md:6` `[up-confirm]`/`{ confirm }`: "shown as a native browser prompt" linking to `Window/prompt`; the implementation (`browser.js:75`) calls `window.confirm()`.

### C3. Migrate: replacement advice the polyfill itself rejects (high)

`src/unpoly-migrate/popup.js:16,20` recommend `up.layer.open({ origin, layer: 'popup' })`; `modal.js:36,40,61` recommend `up.follow(link, { layer: 'modal' })`. But `src/unpoly-migrate/layer.js:31-34` warns that `{ layer: 'modal' | 'popup' }` was removed and rewrites it to `'overlay'`, which opens no new layer. Suggest `up.layer.open({ origin, mode: 'popup' })` and `{ layer: 'new', mode: 'modal' }` in both the @deprecated text and the warning strings (the polyfill code passes the same options, so this is also a bug). Related wrong names: `network.js:204` "Use `up.Response#lateDelay`" (`up.Request#lateDelay`); `util.js:28` "`up.util.object(...keys)`" (`up.util.except(object, ...keys)`); `element.js:185/188, 198/202` give two different replacements for one function.

### C3a. `up.morph()` describes its mechanism twice, contradicting itself (high)

`motion.js:345-409`: :348-355 says the new element is inserted before the old one, the old element is positioned absolute and "removed from the DOM"; :364-380 says both elements are *cloned*, the clones are positioned, and "the old element remains hidden in the DOM"; :387-388 `@param oldElement` "will remain attached". Keep one description (the clone version matches the code). Also :373 "`display: hidden`" is not a CSS value.

### C3b. More copied parameter text in the util/viewport/preview slice (high)

- `viewport.js:620` `up.viewport.saveFocus()`: "restored by calling `up.viewport.restoreScroll()`" (restoreFocus); :636 `options.layer` "save scroll positions".
- `params.js:94-115` `up.Params#toArray()`: prose says `{ key }`/`{ value }`, example shows `{ name, value }`. `params.js:151-173` `up.Params#toQuery()` documents a `params` parameter the instance method does not take. `params.js:496` promises an array serialization but the example only calls `params.get()`.
- `preview.js:560` `up.Preview#insert()`: "You can control where the new element by providing..." (missing verb); `preview.js:726` `showPlaceholder()`: "will be shown temporary overlay"; `preview.js:183` "Only if the preview function is async, `preview.ended` can be `true`" (inverted); `preview.js:378` `addClass` example named `'loading-attr'` (copied from `setAttrs`).
- `history.js:265` `event.reason` `'replace'`: "The current history update was changed via" (entry was replaced); `element.js:1306` `styleNumber` @return "The cast attribute value" (CSS property); `list.js:40-46` calls `[...list]` "destructuring" (spread).

### C4. `up.reload()` contradicts itself on caching (high)

`F:1768` says pass `{ cache: true }` to restore from cache; the param at `F:1816` says `{ cache: 'auto' }`. Pick one and explain the other. Also `F:1762` "Your server-side app is not required to re-render a request if there are no changes to the cached content" sits in a section about conditional requests; suggest "The server can answer `304 Not Modified` when the fragment has not changed."

### C5. `[up-validate]` shows the finished HTML before introducing the attribute (medium)

`M:1915-1993` "Marking fields for validation": `M:1948-1966` shows the form with error messages and `up-validate` attributes, then `M:1968` introduces the attribute, and the same HTML repeats verbatim at `M:2086-2102`. Suggest cutting `M:1948-1966`.

### C6. `up.submit()` lead gives a wrong mental model (medium)

`M:320-324`: "Submits a form via AJAX and updates a page fragment with the response. Instead of loading a new page, the form is submitted via AJAX. The response is parsed for a CSS selector and the matching elements will replace corresponding elements." The second sentence repeats the first; the selector comes from `{ target }`, not from the response. The `[up-submit]` lead at `M:1506-1508` is the model to copy.

### C7. `tracking-page-views.md:62-64` unclear forward reference (medium)

"When an overlay with visible history closes, the address bar returns to the parent page's URL. This emits `up:location:changed` and counts another view of the parent page. The `up:layer:location:changed` listener below does not." The reader has not seen that listener yet and cannot tell what "does not" refers to. Suggest moving the sentence after the code block: "This listener does not count the parent page again when an overlay closes."

### C8. Dense paragraphs that assume later knowledge (medium)

- `watch-options.md:18-20`: three sentences on which options apply to which feature, before any example; "An `[up-watch]` callback must forward its options to the function that renders" assumes the reader knows the callback signature. Suggest moving it below the first example and linking the signature.
- `targeting-other-layers.md:102-107`: six sentences on `up.layer.current` inside compilers, with "This includes event listeners added by the compiler, `setTimeout()` callbacks and code after an `await`." Suggest a short list and a pointer to the "Passing a layer object" section, which already has the example.
- `protocol.js:942-971` `_up_method`: two edge cases are explained before the reader is told what to do; the cookie instruction comes last. Lead with the instruction.

### C9. Older pages that were not reworked (medium)

- `url-patterns.md:120` "JavaScript functions that URL patterns will accept multiple patterns" (garbled sentence); :6 "Please note that regular expressions ("regexes") are not supported. You must use the expression system described on this page." (old voice); "The above URL pattern will match ..." repeated eight times.
- `relaxed-json.md:32` heading "Postel's law" does not describe its section (Unpoly always outputs strict JSON). Suggest "What Unpoly sends".
- `conditional-requests.md:178` "a error response".

### C10. Reference sections where the structure misleads (medium)

- `layer.js:69` `up.layer.config`: `### Configuration inheritance` is an empty heading; the text it should hold sits above it at :50-52.
- `script.js:998-1006` `up:assets:changed`: `## Example` heading sits over two paragraphs of behavior before any example.
- `protocol.js:834-836` vs :858-860 (and :886-888 vs :911-913): "If the root layer is targeted, the header is ignored ..." appears twice in each comment.
- `base.js:762-767` `up.Layer#title`: two paragraphs restate the same point with an unrelated sentence between them.
- `layer.js:1183-1193, 1256-1266` `[up-dismiss]`/`[up-accept]` "On a hyperlink": "a button that closes the overlay but navigates somewhere else on the root layer" reads as if one click does both, and says "button" above an `<a>`.
- `base.js:330-339` `up.Layer#isAlive`: heading "Understanding aliveness"; says "unalive while closing" twice.

### C11. Single sentences that say the opposite or lack a word (low, but each misleads)

- `response.js:264` `up.Response#json`: "The response body parsed as a JSON string." (parsed from JSON)
- `network.js:478` `up.request` `options.failLayer`: "if the server sends a HTTP status code" (missing "error"; as written every response qualifies).
- `params/up-follow/loading-state.md:16-17`: "the placeholder will be shown temporary overlay" (missing "in a").
- `F:1339, 1460` `up.fragment.get()/all()`: "Only the root's children will be matched" (descendants); same in migrate `fragment.js:105`.
- `F:1666` `up.destroy()` "Detecting destructor errors": "Instead compiler errors will print" (destructor).
- `F:2711-2713` `up.fragment.abort()` "matches requests by screen region" ("region" means origin region elsewhere; say "by targeted fragment").
- `protocol.js:592` `X-Up-Method`: "Also for technical reasons Unpoly cannot detect redirects to the same URL, but using a different method." Hard to parse.
- `L:1058` `[up-defer]` lead: "moving expensive but non-critical fragments into partials" ("partials" is an unexplained server-side term).
- `script.js:344-345` `up.compiler`: "a destructor function that is called before it is removed from the DOM" ("it" reads as the function).

### C12. Migrate doc comments with broken examples or missing words (low)

`event.js:44-45,69` `up.$on` example names `$link` but uses `$element`, and the text puts the element first while the signature shows the event first; `script.js:93-97` `up.$macro` example is invalid JS (`$link.attr('up-target': ...)`); `form.js:44,57,126` `[up-observe]` ("would run a log", `name` typed as Element); `link.js:151` `[up-href]` @deprecated text does not say what is deprecated; `protocol.js:71-85` `X-Up-Reload-From-Time` ("The time is encoded is the number", "December 23th", both @deprecated and @stable); `viewport.js:36-37` `up.scroll` vertical viewport explained as `overflow-x: scroll`; `network.js:266` "as may have built" (missing "you"); `tooltip.js:9` "A [title] was set instead."

### C13. Site pages (low, but visible)

- `imprint.html.erb:7-8` sends questions to the Google Groups e-mail list while `support/index.html.erb:8` says GitHub Discussions. Point the imprint at /support.
- `support/index.html.erb:65` "bugget", :19 "the leading team behind Unpoly's development", :13 unclosed `<p>`; `support/discussions.html.erb:4` "GitHub Dicusssions".
- `index.html.erb:160` event wall: the "Request" category links "aborted"/"offline" to `up:fragment:aborted`/`up:fragment:offline`; relabel or link the `up:request:*` events.
- `privacy.html.erb:40, 70, 94` unadapted boilerplate ("shopping cart function", "Art. 17 DSGVO", EU-US Privacy Shield).

### C14. Directive and rendering glitches noticed while reading (low; for a fix pass)

`M:1308` `{Promise<up.RenderResult}` missing `>`; `F:2003/2011` `options.strong`/`options.verify` typed `{Element}` but boolean; `F:1571-1576` `up.fragment.contains` has `@function` between `@return` and its text; `M:810, 1298, 1950` code fences indented deeper than surrounding prose; `M:362, 1558` use `See [[error-responses]].` inline (check it renders as intended); `layer.js:1727` `up.layer.isFront` returns `@like up.Layer#isOverlay`; `base.js:184, 193`, `overlay.js:24/35/48`, `network.js:385, 391`, `request.js:123, 184`, `script.js:699, 705` wrong param types or names. Grammar/typo lists per slice are in the scratchpad review files.


## Progress

Covered in full: all Learn pages incl. `start/`, `params/**` and `partials/**` (lead reviewer); API doc comments in `fragment.js`, `link.js`, `form.js` (slice 1); `layer.js`, `classes/layer/*`, `script.js`, `protocol.js`, `network.js`, `classes/request.js`, `response.js`, `render_result.js`, `render_job.js` (slice 2); `util.js`, `element.js`, `viewport.js`, `history.js`, `motion.js`, `event.js`, `status.js`, `radio.js`, `framework.js`, `log.js`, `error.js`, `browser.js`, `classes/preview.js`, `params.js`, `motion_controller.js`, `focus_capsule.js`, `list.js`, `options_parser.js` (slice 3); all of `src/unpoly-migrate/` and the reader-facing pages of `unpoly-site/source` (slice 4). Corpus-wide regex scans for stock words, contrasts, em dashes, questions and reserved terms.

Not covered: nothing in scope remains unread. The lead spot-checked the slice reports' top findings (about a dozen) against the source; the long tails of grammar/typo lists in the per-slice scratchpad files were not re-verified one by one. The session was asked to stop before a second pass over the Learn pages for borderline AI-cadence sentences; only the clear cases are listed in (A).


## Not findings (for calibration)

Checked and found consistent: "CSP nonce" (no "document nonce" anywhere); "transition" vs "animation" (used precisely, including `[up-fail-transition]` and the hungry-element transition); "reveal" as the `[up-defer=reveal]`/`[up-preload=reveal]` value; "compiler" (no "initializer"); "origin" vs "the link the user clicked" (the latter appears only where it introduces the term). The Learn chapters Links, Overlays, Loading state, Live fragments, History, Scrolling & focus, Network, Motion, Scripting and Backend integration read plainly and need no prose work beyond the term fixes above.
