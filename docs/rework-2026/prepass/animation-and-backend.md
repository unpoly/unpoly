# Pre-pass: Animation and Backend integration

Checked against the maintainer patterns in `docs/rework-2026/writer-brief.md` (1-8).
Line numbers refer to the state of `docs-rework` at the time of the pass.
Not re-raised: conditional-requests owns the ETag explanation; the Rails note (pattern 8) is a global fix-round task.


## /animation

1. **Pattern 2 + wrong vs. implementation (failed responses).** "Transitions for failed responses" {#fail-transition}
   reads as if a failed response reuses `[up-transition]` and `[up-fail-transition]` only makes it *different*:

   > When the server responds with an error code, Unpoly renders the response
   > with [different options](/failed-responses#fail-options). To animate that case differently,
   > set an `[up-fail-transition]` attribute:

   `transition` is not a shared key, so a form with only `[up-transition]` renders its validation errors
   without any transition. Only a default from `up.fragment.config.navigateOptions` applies to both cases.
   Proposal:

   > A failed response does not use `[up-transition]`. When the server responds with an error code, Unpoly renders
   > the response with [different options](/failed-responses#fail-options), and the form with validation errors
   > appears instantly. To animate that case, set an `[up-fail-transition]` attribute.
   > A default transition in `up.fragment.config.navigateOptions` applies to both cases.

   Evidence: `src/unpoly/classes/render_options.js:76-82` (`SHARED_KEYS` has no `transition`),
   `render_options.js:241-253` (fail options = defaults + shared keys + `fail*` overrides),
   `render_options.js:174-177` (navigate defaults are part of `defaults`).

2. **Pattern 2 (caching, Back button).** After "To use a transition for every navigation, set a default in
   `up.fragment.config.navigateOptions`" (animation.md:38-42), experts ask whether cached content animates twice
   and whether the Back button animates. Neither happens: revalidation re-renders with `NO_MOTION`, and history
   restoration is not a navigation (and targets `body`, which is never animated). Proposal, one sentence after the config snippet:

   > When a [cached](/caching#revalidation) page is revalidated, the fresh content replaces it without a second transition.
   > Pages restored by the *Back* button are not animated.

   Evidence: `src/unpoly/classes/change/from_response.js:88-91` (`...up.RenderOptions.NO_MOTION`),
   `src/unpoly/classes/render_options.js:21-26`, `src/unpoly/history.js:444-478` (no `navigate: true`,
   `target: config.restoreTargets` = `body`), `src/unpoly/motion.js:234-236` (singletons are never animated).

3. **Pattern 5 (duplication with /customizing-overlays).** The overlay example is a near-literal copy of
   customizing-overlays.md:137-143 (same link, same attributes, only `move-to-top` vs. `move-to-bottom`):

   > When opening an overlay, `[up-animation]` sets the opening animation and `[up-close-animation]` the closing animation:
   > ```html
   > <a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-top">Details</a>
   > ```

   The duration paragraph (animation.md:180-181) also repeats customizing-overlays.md:147-148.
   Proposal: re-angle to what this page owns (which effect plays when), drop the example:

   > Opening an overlay plays an animation on the new overlay, and closing it plays another one.
   > Each [overlay mode](/overlays#layer-modes) has defaults. To choose different animations or durations,
   > see [[customizing-overlays#animation]].

4. **Pattern 4 (heading).** "Disabling animation globally" {#disabling-animation-globally} opens with the
   *default* behavior for reduced-motion users, which is the expert's first question, but the heading makes it sound
   like an opt-in setting:

   > Animations are enabled unless the user has asked their system to
   > [minimize non-essential motion](...). In that case `up.motion.config.enabled` is `false`.

   Proposal: retitle to "Reduced motion and disabling animation" (keep the anchor).

5. **Pattern 2 (lookups during a transition).** "How a transition plays" {#how-a-transition-plays} says the old element
   is still positioned over its former place, but not what code sees during that time. Experts with compilers or
   tests will ask "does `querySelector('#story')` find two elements?". Proposal, one sentence after the list:

   > While the transition plays, the old element is still in the DOM with an [`.up-destroying`](/up-destroying) class.
   > Unpoly functions like `up.fragment.get()` ignore it, but `document.querySelector()` may still find it.

   Evidence: `src/unpoly/classes/change/update_steps.js:103` (`markAsDestroying(step.oldElement)`),
   `src/unpoly/fragment.js:1179,1203-1204`.

6. **Pattern 5 (literal repeat within the page).** animation.md:20-21

   > Content after the fragment only shifts when the new version has a different size.

   is repeated at animation.md:288-289 ("so elements after the fragment only shift when the new version has a
   different size"). Proposal: keep it in "How a transition plays" only, cut it from the opening example.

Side note (reference bug, outside the guide): `up.animate()`, `up.motion.morph()` and the internal `animateNow()` document
`[options.duration=300]` (`src/unpoly/motion.js:196,269,399`), but the default is `config.duration = 175` (motion.js:41).
The guide's 175 is correct.


## /backend-integration

1. **Pattern 3 (teaser shows part of the family).** "Steering the frontend from the server":

   > It can emit events on the client, update the document title, or close an overlay with a result value
   > instead of rendering anything:

   The family on /server-protocol#response-headers is larger: change the target (or render nothing), set the title,
   correct location/method, emit events, close or open overlays, update the layer context, expire or evict cache entries.
   Proposal:

   > It can change the target or render nothing, emit events on the client, update the title or the layer context,
   > expire cache entries, or open or close an overlay instead of rendering into the page:

2. **Pattern 5 (near-literal copies of the detail pages).** The overview repeats detail-page sentences instead of
   teasing them from a new angle:
   - backend-integration.md:66 "The exchange then costs about 1 KB and no rendering time." is literal in
     conditional-requests.md:5 and polling.md:150 (third copy).
   - backend-integration.md:74-76 "Since Unpoly updates fragments instead of loading new pages, users keep running
     the JavaScript and CSS they loaded when they opened the page." ≈ handling-asset-changes.md:4-5;
     and :84 "notify the user, reload at the next navigation, or swap in the new stylesheets" ≈
     handling-asset-changes.md:6.

   Proposal: re-angle the overview from the server developer's side, e.g. for conditional requests:
   "A polling fragment that rarely changes then costs your server a hash comparison instead of a full render.";
   for deployments: "Your deploy process needs no changes: fingerprinted asset URLs in the `<head>` are enough
   for Unpoly to notice a new version." (true only if the response has a `<head>`, see /optimizing-responses #2).

3. **Pattern 2 (cross-reference).** backend-integration.md:21-22

   > Unpoly extracts the `.profile` element from the response and discards the rest.

   Not quite: it also reads hungry elements, the `<title>`, meta tags and assets from the response. Same claim on
   optimizing-responses.md:6. See /optimizing-responses findings 1 and 2; proposal here: "… and discards the rest,
   except [hungry elements](/hungry-elements) and the `<head>`."


## /optimizing-responses

1. **Pattern 2 (hungry elements and flashes).** "Rendering only the targeted fragment" {#target} encourages
   omitting untargeted layout:

   > A typical use is to skip expensive parts of the layout, like a sidebar or a navigation bar,
   > when they are not part of the target.

   `X-Up-Target` does not include `[up-hungry]` or `[up-flashes]` elements (they are matched only after the response
   arrives), so a server that renders only `X-Up-Target` silently starves them. /hungry-elements says this (hungry-elements.md:39-42),
   but this page, where the decision is made, does not. Proposal, one sentence after the quote:

   > `X-Up-Target` does not list [hungry elements](/hungry-elements) like [flashes](/flashes).
   > Keep rendering them in shortened responses, or they stop updating.

   Evidence: `src/unpoly/classes/change/update_layer.js:28,34-40` (header from preflight steps) vs.
   `update_layer.js:172-181` (hungry steps added postflight), `spec/unpoly/radio_hungry_spec.js:189`
   ("does not change the X-Up-Target header for the request").

2. **Pattern 2 + 6 (responses without `<head>`).** "Rendering different content for Unpoly requests" {#version}
   suggests:

   > Server code can check for the header to tell fragment updates from full page loads,
   > e.g. to render only the `<body>` for Unpoly:

   A response without `<head>` keeps the old title and meta tags on every navigation and turns off deployment
   detection (`up:assets:changed` is only checked when the response has a `<head>`). So the page's own example
   breaks titles and /handling-asset-changes. #title only covers the title. Proposal: pick an example that keeps
   the `<head>` (e.g. "to omit a cookie banner or a tracking snippet that only belongs to full page loads"),
   and add to #title:

   > Without a `<head>`, Unpoly also keeps the current meta tags and cannot [detect a new deployment](/handling-asset-changes).

   Evidence: `src/unpoly/classes/response_doc.js:96-130` (title, metaTags, assets all `_fromHead`),
   `src/unpoly/classes/change/from_content.js:86-89` (`if (assets) assertAssetsOK`).

3. **Pattern 2 (HTTP caches, proxies, CDNs).** "Caching optimized responses" {#vary} only says `Vary`
   partitions Unpoly's cache:

   > This tells Unpoly to partition its cache for that URL, so that each header value gets a separate cache entry:

   Experts will ask what the browser's HTTP cache or a CDN does with a shortened response for the next full page load.
   `Vary` is standard HTTP, which is exactly why it is the right tool. Proposal, one sentence after the quote:

   > `Vary` is a standard HTTP header, so it also keeps the browser's HTTP cache and shared caches like CDNs from
   > serving a shortened response to a full page load. Check that your CDN honors `Vary` for custom headers,
   > or don't let it cache these responses.

   The same "tells Unpoly" phrasing sits on backend-integration.md:38 and server-protocol.md:47-48; one sentence here is enough.


## /conditional-requests

1. **Pattern 2 (initial page load).** "How a reload becomes conditional" {#how-it-works}:

   > The first response for a fragment carries a version of its content, as an `ETag` or `Last-Modified` header.
   > Unpoly remembers that version on the rendered fragment.

   That is not true for the initial page load: scripts cannot read its response headers, and Unpoly only sets
   `[up-etag]`/`[up-time]` when it renders a fragment itself. So the *first* poll of a fragment from the initial page
   is never conditional. Proposal, one sentence after the quote:

   > The headers of the initial page load are not visible to scripts. To make the first reload of such a fragment
   > conditional, render its version into an [`[up-etag]` or `[up-time]` attribute](#fragment-versions).

   Evidence: `src/unpoly/fragment.js:3178-3183` (boot only sets `[up-source]`), `src/unpoly/classes/change/addition.js:97-100`
   (`[up-etag]` set only on rendered fragments, `false` when the response had none), `fragment.js:1875-1877`.


## /handling-asset-changes

1. **Pattern 2 (shortened responses).** "Detecting a new version" {#tracking-assets}:

   > Whenever Unpoly renders a response with a `<head>`, it compares the assets on the current page
   > with the assets in the response.

   The condition is easy to read past, and apps that [optimize responses](/optimizing-responses) send no `<head>`.
   Proposal, one sentence after it:

   > Responses without a `<head>`, like [shortened responses](/optimizing-responses#target), are not compared.
   > If your server shortens every response, use the [polling detector](#polling) below.

   Evidence: `src/unpoly/classes/change/from_content.js:86-89`, `src/unpoly/classes/response_doc.js:118-137`.


## /server-protocol

No findings (the `Vary` phrasing on line 47-48 is covered by /optimizing-responses #3).


---

Rails: no Ruby/ERB code on these pages. Prose mentions only: conditional-requests.md:26-27 (Rails CSRF token masking defeats body-hash ETags),
optimizing-responses.md:163 and server-protocol.md:123 (`unpoly-rails` sets `Vary` for you).
