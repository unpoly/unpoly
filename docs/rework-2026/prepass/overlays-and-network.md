# Pre-pass: Overlays and Network & caching

Checked against the maintainer patterns in `docs/rework-2026/writer-brief.md` (1-8).
Line numbers refer to the state of `docs-rework` at the time of the pass.
Not re-raised (already decided): both #result-values sections stay, the modes table is gone from
/customizing-overlays, and /reactive-server-forms owns the concurrency of validations.


## /overlays

1. **Pattern 3 + 5.** "Closing with a result" (overlays.md:77-101) teases closing with exactly one
   member of the family, and the example is the subinteraction pattern (`up-accept-location` +
   `up.reload()`). The same example appears three times in the chapter: overlays.md:87-94,
   opening-overlays.md:178-184 and subinteractions.md:50-56 (with companies). The next teaser,
   "Subinteractions", also teaches a subinteraction, so the overview shows the same idea twice in a row.

   > Users usually open an overlay to complete a small task. You can give the link a
   > *close condition* for when that task is done:

   Proposal: re-angle the closing teaser to the family of ways to close, and leave the
   close-condition example to the Subinteractions teaser that follows. Draft:

   > An overlay closes when the user dismisses it, clicks an [`[up-accept]`](/closing-overlays#on-click) button,
   > or when a *close condition* is met, like reaching a URL, emitting an event or rendering a fragment.
   > Your JavaScript and the server can close overlays, too.
   >
   > ```html
   > <button up-accept="{ id: 5 }">Choose user #5</button>
   > ```

2. **Pattern 5.** The "Opening an overlay" teaser copies the detail page almost word for word:

   > The link stays a standard hyperlink. When the user opens it in a new tab,
   > or when JavaScript is unavailable, the browser loads `/users/new` as a full page.

   (overlays.md:23-24, opening-overlays.md:22-23 with `/menu`.) The preceding "The server renders … as
   a full HTML page … Unpoly extracts the page's main element" paragraph is also duplicated
   (overlays.md:18-19, opening-overlays.md:18-20). Proposal: keep both facts on the overview (they are
   the selling point) and re-angle /opening-overlays#link to the mechanics only, e.g. "Unpoly requests
   `/menu` with an `X-Up-Mode: modal` header and shows the response's main element", with a pointer
   back for the progressive-enhancement point. Or the other way round; just not twice verbatim.

3. **Pattern 5 (config lines).** Three pages tell the reader where mode defaults live:

   > You can change the default mode in `up.layer.config.mode`.
   > Defaults for each mode are configured in `up.layer.config`,
   > like `up.layer.config.drawer` for drawers or `up.layer.config.overlay` for all overlays.

   (overlays.md:72-74; again opening-overlays.md:54 and customizing-overlays.md:16-17.)
   Proposal: /customizing-overlays#modes owns the per-mode config. The overview keeps only
   "You can change the default mode in `up.layer.config.mode`." (or drops it too, since
   /opening-overlays#modes has it).


## /opening-overlays

1. **Pattern 1.** "Close conditions" {#close-conditions} (opening-overlays.md:171-188) is /closing-overlays' job.
   Its opening is a near-literal copy of closing-overlays.md:119-120:

   > When opening an overlay, you can define a *condition* for when the overlay's task is done.
   > When the condition occurs, the overlay closes automatically and a callback runs:

   plus the third copy of the `/users/new` + `up.reload('.user-list')` example. Proposal: replace the
   section with one sentence, keep the anchor:

   > When opening an overlay, you can also define when it should close, like when it reaches a URL.
   > See [close conditions](/closing-overlays#close-conditions).

   Inbound links to `/opening-overlays#close-conditions` should be checked (grep both repos) and can stay
   on the shrunk section.

2. **Pattern 5.** The modes table is included twice in the chapter: `@include overlay-modes-table` at
   overlays.md:63 and opening-overlays.md:52. /opening-overlays#modes already links to
   [mode](/overlays#layer-modes) in its first sentence. Proposal: drop the table and the
   "These modes are available:" line here; the overview owns the table.

3. **Pattern 2 (failed responses).** "What if `/menu` responds with an error?" The page doesn't say.
   The failed response does **not** open an overlay: `layer` is not a shared option, so the fail
   pass renders the error page's main element into the link's own layer (usually the page behind).
   Only the form section mentions `[up-fail-layer]`, and only as an alternative.
   Proposal: one sentence at the end of #link:

   > When the server responds with an [error code](/failed-responses), the error page is rendered in
   > the link's own layer, not in an overlay. To show errors in an overlay, set
   > [`[up-fail-layer=new]`](/layer-option#fail-layer).

   Evidence: `src/unpoly/classes/render_options.js:76-82` (`SHARED_KEYS` has no `layer`),
   `:246-257` (fail options = defaults + shared keys + fail-prefixed overrides),
   `src/unpoly/pages/layer-option.md:178-185` (owner of the explanation).

4. **Pattern 2 (concurrency).** "What if the user double-clicks the link, or clicks two overlay links
   quickly?" Only one overlay opens: a second request to open an overlay over the same base layer
   aborts the first. Proposal: one sentence at the end of #link:

   > When the user clicks a second overlay link while the first is still loading, only the second
   > overlay opens. See [aborting rules in layers](/aborting-requests#layers).

   Evidence: `src/unpoly/classes/change/open_layer.js:28-34` (opening request bound to the base layer's
   main element), aborting-requests.md:117-118.


## /closing-overlays

1. **Pattern 2 (failed responses) + "clearly wrong".** "Does a validation error close my overlay?"
   The location condition is checked only when a render pass in the overlay updates its location.
   A form that fails validation (non-`GET`, error status) renders without history, so its URL never
   reaches the condition and the overlay stays open. The page doesn't say this, and the result value
   it states is incomplete: the value also has a `location` property.

   > Named segments captured by the [URL pattern](/url-patterns) (`$id`) become
   > the overlay's [acceptance value](#acceptance-values), here `{ id: 123 }`.

   Proposal:

   > Named segments captured by the URL pattern (`$id`) become the overlay's acceptance value, along
   > with the matched `location`: here `{ id: 123, location: '/companies/123' }`.
   >
   > The condition is checked whenever the overlay's location changes. When the form fails validation,
   > the server re-renders it without changing the location, so the overlay stays open until the
   > submission succeeds.

   Evidence: `src/unpoly/classes/layer/overlay.js:393-402` (`closeValue = { ...resolution, location: newLocation }`),
   `src/unpoly/classes/change/update_layer.js:138-141, 253-271` (new location only when the render has history),
   `src/unpoly/classes/change/from_response.js:163-173` (non-`GET` response → `history = !!location`).
   Same table row in subinteractions.md:79 ("The captured segments, e.g. `{ id: 123 }`") needs the same fix.

2. **Pattern 2 (unsaved changes).** "Can I stop an overlay from closing, e.g. when it has unsaved changes?"
   Nowhere in the chapter. `up:layer:dismiss` and `up:layer:accept` can be prevented, which also blocks
   `Escape`, background clicks and the `×` button. Proposal: one paragraph at the end of
   "Running code when an overlay closes" {#callbacks}:

   > To keep an overlay open, for example when it has unsaved changes, prevent the
   > `up:layer:dismiss` event:
   >
   > ```js
   > up.on('up:layer:dismiss', function(event) {
   >   if (!confirm('Discard your changes?')) event.preventDefault()
   > })
   > ```

   Evidence: `src/unpoly/classes/change/close_layer.js:25-27`, `src/unpoly/layer.js:1555-1556`.
   (Simplest correct example; a real app would check for dirty fields first. Henning to decide whether
   to show that guard.)

3. **Pattern 2 (nested overlays, requests, focus).** "What happens to overlays this overlay opened, to its
   pending requests, and to focus?" None of it is on the closing page. Proposal: one sentence at the end of
   "Accepting and dismissing" {#intents}, linking to the owners:

   > When an overlay closes, overlays it has opened are closed with it, its pending requests are
   > [aborted](/aborting-requests#layers), and [focus returns](/focus#overlays) to the link that opened it.

   Evidence: `src/unpoly/classes/change/close_layer.js:31` (abort), `:46` (`this.layer.peel()` dismisses
   descendants with `:peel`, `layer_stack.js:31`), `:123-137` (focus to `layer.origin`).

4. **Pattern 5.** "Using the discarded response" (closing-overlays.md:416-428) and subinteractions'
   "Reloading on acceptance" (subinteractions.md:119-129) show the same example: `/companies/new`,
   `up-accept-location="/companies"`, `up.render(…, { response: event.response })`; only the selector
   differs (`.companies` vs. `.company-list`). Subinteractions already links here. Proposal: keep the
   example on /subinteractions (task angle: "skip the extra request"), and re-angle this section to the
   event API it introduces, e.g. a global `up:layer:accepted` listener that reads `event.response`, or just
   prose plus the bullet list of when `{ response }` is set.

5. **Pattern 5.** "Close animation" (closing-overlays.md:489-496) repeats /customizing-overlays#animation:

   > To use a different animation for one overlay, set an `[up-close-animation]` attribute or pass a `{ closeAnimation }` option
   > when opening it.

   /customizing-overlays owns open/close animations and links here only for the per-close override
   (customizing-overlays.md:154-155). Proposal: keep only what is this page's angle:

   > To close with a different animation than the one configured for the overlay, pass an `{ animation }`
   > option to `up.layer.accept()` or `up.layer.dismiss()`, or set an `[up-animation]` attribute on an
   > `[up-accept]` or `[up-dismiss]` element. See [[customizing-overlays#animation]] for the default animations.

6. **Pattern 6.** Both peeling examples set a redundant `up-submit` next to `up-layer`:

   > `<form method="post" action="/users" up-submit up-layer="parent">`

   (closing-overlays.md:374, 394). `[up-layer]` already makes a form Unpoly-submitted, which
   /layer-option says explicitly (layer-option.md:39). Proposal: drop `up-submit` in both.
   Evidence: `src/unpoly/form.js:158` (`submitSelectors: ['form:is([up-submit], [up-target], [up-layer], [up-transition])']`).

7. **Pattern 8 (prose).** closing-overlays.md:357:

   > With the `unpoly-rails` gem, you can produce these headers with `up.layer.accept(value)` or `up.layer.dismiss(value)`.

   Prose-only Rails mention (the Forms sitting asked to check those too). Proposal: "With the
   `unpoly-rails` gem, …. Other [backend integrations](/backend-integration) offer similar helpers,
   or you can set the header yourself." Low priority; skip if the cross-cutting note is only for code blocks.


## /subinteractions

1. **Pattern 2 (failed responses).** "Starting a subinteraction" says the overlay is accepted when the server
   redirects, but the first thing a reader of the project/company example wonders is what happens when
   the company form has errors. Proposal: one sentence after "the overlay is accepted automatically"
   (subinteractions.md:63-65), owner is /closing-overlays#location-condition (see finding 1 there):

   > When the company form has validation errors, it re-renders within the overlay, which stays open
   > until the company is created.

   Evidence: see /closing-overlays finding 1. The `{ id: 123 }` table row (subinteractions.md:79) is covered there too.


## /customizing-overlays

No findings of its own. (Mode config duplication: /overlays finding 3. Close animation: /closing-overlays finding 5.)


## /layer-option

1. **Pattern 6.** The form example sets `up-submit` next to `up-layer`, and eleven lines later the page
   says you don't need to:

   > `<form method="post" action="/users" up-submit up-layer="root" up-target=".user-list">`
   >
   > An `[up-layer]` attribute already implies `[up-follow]` or `[up-submit]`, so you don't need to set both.

   (layer-option.md:28, 39.) Proposal: drop `up-submit` from the example.
   Evidence: `src/unpoly/form.js:158`, `src/unpoly/link.js:25,123` (`[up-layer]` in `ATTRS_SUGGESTING_FOLLOW`).


## /context

1. **Pattern 8.** Both backend examples are Rails without the agreed note: the ERB template
   (context.md:55-67, "This ERB template uses the `unpoly-rails` gem") and the controller
   (context.md:118-129, "With the `unpoly-rails` gem, assigning a key in the controller sets this header for you").
   Context is on the Forms-sitting list for this. Proposal, after each block:

   > Other backends can read the `X-Up-Context` request header the same way.

   and after the controller:

   > Without `unpoly-rails`, set the `X-Up-Context` response header yourself.


## /history-in-overlays

1. **Pattern 2 (forms opening overlays).** "Does an overlay opened by a form submission show a URL?"
   Not unless the server redirects: a non-`GET` response renders with `history: false`, and an overlay
   opened with `history: false` keeps invisible history for its whole lifetime, so later links inside it
   don't change the address bar either. Readers of #configuring-visibility only learn the main-element rule.
   Proposal: one sentence at the end of "Hiding an overlay's history" {#configuring-visibility}:

   > An overlay that shows the response to a `POST` form has invisible history, since its URL cannot be
   > reloaded. When the server redirects to a `GET` URL, the overlay shows that URL. See
   > [[updating-history#get-requests]].

   Evidence: `src/unpoly/classes/change/from_response.js:163-173` (non-`GET` → `renderOptions.history = !!renderOptions.location`),
   `src/unpoly/classes/change/open_layer.js:203-212` (layer history fixed at open; `'auto'` resolved once,
   inherited `&&= baseLayer.history`). Lifetime claim: worth one spec run before writing it, since
   `layer.history` is taken from the open options via `up.layer.build()` (`classes/layer/base.js:91`).


## /network

1. **Pattern 5.** The overview copies three passages from detail pages:
   - The offline listener (network.md:86-90) is the identical snippet from network-issues.md:25-27
     (and from the `up:fragment:offline` reference, fragment.js:836-838).
   - "A cache entry is only considered fresh for 15 seconds. When Unpoly renders older content, it reloads
     the fragment from the server right after. This is called *revalidation*" (network.md:49-51) vs.
     caching.md:40-42 ("Cache entries are only considered *fresh* for 15 seconds. When Unpoly renders older
     content from the cache, it reloads the fragment from the server right after. This process is called
     *cache revalidation*.").
   - "A server that is slow to respond is not a network issue. Unpoly shows a progress bar after 400 ms,
     and can show loading state …" (network.md:94-95) vs. network-issues.md:117-125.

   Proposal: re-angle, not delete. For the offline teaser, show the per-link variant instead
   (`<a href="/bids" up-on-offline="…">`) or just prose ("Unpoly emits `up:fragment:offline`, which you can
   use to retry or show a message"). For revalidation, phrase from the user's side ("the user sees the
   cached page at once and the fresh page a moment later") without the numbers. Drop the slow-server
   sentence here if /network-issues finding 2 is taken.

2. **Pattern 3.** "Instant revisits from the cache" teases caching with the auto-cache default and the
   `POST` expiry only. The family (preloading, expiring/evicting after a change, disabling for a link,
   `304 Not Modified`) is not named. Proposal: one sentence before the read-more link:

   > You can [preload](/preloading) links before the user clicks, expire or evict entries after a change,
   > answer revalidation with [`304 Not Modified`](/conditional-requests), or turn caching off for a single link.


## /caching

1. **Pattern 4.** "Enabling caching" {#enabling} titles the default as something you must switch on, but the
   section's own second sentence says navigation caches out of the box:

   > When [navigating](/navigation-defaults), the `{ cache: 'auto' }` option is already set by [default](/up.fragment.config#config.navigateOptions).

   Proposal: retitle (keep the anchor), e.g. "Which responses are cached" {#enabling}.

2. **Pattern 2 (failed responses, concurrency).** Two expert questions with no answer on the page:
   "Is a 500 page cached?" and "Two links to the same URL clicked quickly: two requests?"
   Proposal: two sentences in the retitled #enabling section:

   > Error responses are not cached. They also evict an earlier cached response for the same URL.
   > When a request for the same URL is already loading, a second request waits for it instead of
   > making another network request.

   Evidence: `src/unpoly/network.js:580-593` (error response → `cache.evict(request.url)`; network error or
   empty response → evict that request), `:557-567` (cacheable request is put into the cache before it is
   queued), `:500-534` (`useCachedRequest()` tracks an in-flight request).

3. **Pattern 5.** "Detecting revalidation from a compiler" (caching.md:256-272) is a literal copy of the
   tracking example in tracking-page-views.md:94-100 (same `[track-page-view]` compiler, same comment,
   same `!meta.revalidating` guard). Proposal: re-angle with a different side effect (e.g. only autoplay a
   video or play an entry animation on the first render, not on revalidation), or shrink to one sentence
   ("compilers receive `meta.revalidating`, see [[enhancing-elements]]") and link the tracking example.

4. **Pattern 6.** The first `autoCache` example (caching.md:22-30) replaces the default with
   `request.method === 'GET'`, which is nearly what the default already does (safe methods), so it
   teaches nothing. The route-based example at caching.md:171-175 shows the useful pattern (wrap the
   default). Proposal: drop the first code block and keep the sentence "Which requests `'auto'` caches is
   decided by `up.network.config.autoCache`", linking to [#disabling-route](#disabling-route).
   Evidence: `src/unpoly/network.js:142` (`autoCache(request) { return request.isSafe() }`).

5. **Pattern 1 (minor).** "Caching optimized responses" and its subsection "How cache entries are
   matched" (caching.md:275-288) are two headings that each only point to /optimizing-responses.
   Proposal: merge into one short section with one pointer sentence (keep both anchors, e.g. a
   `{#how-cache-entries-are-matched}` shim on the paragraph if needed).


## /aborting-requests

1. **Pattern 2 (non-GET).** "If my form submission is aborted, did the server still save it?" Aborting
   only stops the browser from waiting for the response; the request may already have been processed.
   This is the real reason for `[up-abortable=false]`, but the section only says the submission
   "is not interrupted". Proposal: one sentence in "Protecting a request from being aborted" {#preventing},
   after the form example:

   > An aborted request may already have reached your server. For a form that changes data, aborting
   > only means that its response is not rendered.

   Evidence: `src/unpoly/classes/request.js:710-716` (abort = `xhr.abort()` on the client).


## /network-issues

1. **Pattern 2 (no handler).** "What does the user see when I don't handle `up:fragment:offline`?" Nothing:
   Unpoly registers no default listener, so the click seems to do nothing. The page implies this
   ("lets you decide") but never says it. Proposal: one sentence at the end of "Disconnects"
   (network-issues.md:16-17):

   > Without a listener, the page stays as it is and the user gets no feedback, so most apps
   > should register one.

   Evidence: no `up.on('up:fragment:offline', …)` in `src/` (only doc examples);
   `src/unpoly/classes/change/from_url.js:90-110` (emits the event, then rethrows).

2. **Pattern 1 + 5.** "Slow server responses" and "HTTP error codes" (network-issues.md:117-137) each
   explain a neighbour's topic (loading state, failed responses) to say it is *not* a network issue.
   The slow-server part is also on /network (see /network finding 1). Proposal: merge into one short
   section, e.g. "What is not a network issue":

   > Slow responses and error codes are not network issues and emit no `up:fragment:offline` event.
   > While a slow response loads, Unpoly shows a [progress bar](/progress-bar), and you can add
   > [loading state](/loading-state). To render error responses differently, see [[failed-responses]].
