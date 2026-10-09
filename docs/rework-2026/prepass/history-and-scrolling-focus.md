# Pre-pass: History and Scrolling & focus

Checked against the maintainer patterns in `docs/rework-2026/writer-brief.md` (1-8).
Line numbers refer to the state of `docs-rework` at the time of the pass.
No Rails examples on any of these pages (pattern 8: nothing to do).


## /history

1. **Pattern 1 (same as the Forms decision on chapter overviews).** The section
   "History is a navigation default" repeats the job of [[navigation-defaults]] and of
   `/updating-history#get-requests`:

   > Updating history is one of the [navigation defaults](/navigation-defaults) that links and forms get out of the box.
   > The low-level `up.render()` function only changes history when you pass a `{ history }` option.
   >
   > Only a `GET` response can change history, since only `GET` URLs can be reloaded.
   > A form that submits with `POST` changes history once the server redirects to the next page.

   Proposal: remove the section, as was decided for "Submitting is navigation" / "Following is
   navigation" on /forms and /links. Both facts are owned by /updating-history (#scripting and
   #get-requests). No inbound links to its auto anchor (grepped both repos).

2. **Pattern 5.** The overview copies /updating-history almost literally: the same two link
   examples (`/posts/5` with `[up-follow]`, `/comments?page=2` with `[up-target="#comments"]`) and the same sentence:

   > so the user does not collect a history entry for every minor update.

   (history.md:31, updating-history.md:30). The tracking section does the same with
   tracking-page-views.md:22-23:

   > The event is emitted after every change of the address bar, whether from a followed link,
   > a redirecting form submission or the Back button.

   Proposal: re-angle the overview, don't delete it. For example, keep only the minor-fragment example
   in the overview and phrase it from the user's side ("Paginating comments doesn't add a history
   entry, so the Back button skips straight to the previous page"). The detail page keeps both examples.

3. **Pattern 3.** "Updating the address bar" shows only `[up-history=true|false]`. The family is larger:
   treating other fragments as major, keeping title/meta/lang unchanged, setting your own URL or
   title, and pushing entries from JavaScript. "Restoring the previous page" leaves out `[up-back]`.
   Proposed teaser sentences:

   > You can also treat other fragments as major, keep the title or meta tags unchanged, set a
   > different URL or title, or push entries from JavaScript.

   and, in the restoring section:

   > To offer a *Back* link inside the page, use an [`[up-back]`](/restoring-history#back-link) attribute.


## /updating-history

1. **Pattern 2 (failed responses).** The page never says what happens when the server responds
   with an error. Experts will ask whether a 404 page changes the URL. It does when the request
   was a `GET`: `history` is shared between success and fail options, and the navigation defaults
   are applied to both. A failed non-`GET` submission never changes history.
   Proposal: one sentence at the end of "Only `GET` requests update history" {#get-requests}:

   > The same rules apply to error responses. When a failed `GET` request renders an error page into the
   > main element, the address bar shows its URL, like after a full page load. A form submission that fails
   > with a validation error does not change history. See [[failed-responses]].

   Evidence: `src/unpoly/classes/render_options.js:76-79` (`history` in `SHARED_KEYS`, comment
   "we only set history for reloadable responses"), `src/unpoly/fragment.js:259-268`
   (navigateOptions "set to both success and fail options"),
   `src/unpoly/classes/change/from_response.js:163-173` (non-`GET` → `history = !!location`).

2. **Pattern 2 (same URL).** "Does following a link to the current URL pile up entries?" It does not:
   `up.history.push()` returns early when the URL is already shown, and the layer only pushes when the
   new location differs from the live location. Proposal: one sentence in #when-history-is-changed:

   > When the new URL is the one already in the address bar, no entry is added.

   Evidence: `src/unpoly/history.js:397`, `src/unpoly/classes/layer/base.js:859`.


## /restoring-history

1. **Pattern 2 (concurrency).** "What if a link is still loading when the user presses Back, or the
   user presses Back twice quickly?" The restore render uses the default `{ abort: 'target' }` and targets
   the `<body>` (or `restoreTargets`), so pending requests for the restored fragment are aborted and a late
   response cannot overwrite the restored page. Proposal: one sentence after the numbered list:

   > Requests that are still loading for the restored fragment are aborted, so a late response
   > cannot overwrite the restored page. See [[aborting-requests]].

   Evidence: `src/unpoly/history.js:452` (`target: config.restoreTargets`), `src/unpoly/fragment.js:254`
   (`abort: 'target'` in `renderOptions`, applies to every render).

2. **Pattern 2 (no saved positions).** Step 4 says:

   > 4. Scroll positions are restored to where they were when the user left the page.

   Saved scroll and focus state lives in memory, per layer. After a full page reload (or for an entry
   from before the reload) nothing is known, and Unpoly falls back to the default strategy. Proposal: append

   > If no positions are known, for example after a full page reload, Unpoly scrolls and focuses
   > as it does when [following a link](/scrolling#auto).

   Evidence: `src/unpoly/history.js:476,478` (`scroll: ['restore', 'auto']`, `focus: ['restore', 'auto']`),
   `src/unpoly/viewport.js:542,602-608` (`layer.lastScrollTops`, returns `false` when nothing is saved).

3. **Pattern 2 (offline, secondary).** "What if the user is offline when going back?" The browser has
   already changed the URL, the page keeps its old content, and `up:fragment:offline` is emitted
   (a cached response is still used). The page says "the page must follow" but not what happens when it can't.
   Proposal: after "Unpoly renders whatever the server responds, even an error page.":

   > When the server cannot be reached, the address bar shows the restored URL while the page keeps its content.
   > You can handle this case like any other [connection loss](/network-issues).

   Evidence: `src/unpoly/history.js:444-480` (plain `up.render()` with `cache: 'auto'`),
   `src/unpoly/classes/change/from_url.js:93` (emits `up:fragment:offline`).


## /tracking-page-views

1. **Pattern 2 (overlays, double count).** With the default `up:location:changed` listener, closing an
   overlay with visible history counts a second view of the page behind it: the parent layer pushes its
   URL back, which emits `up:location:changed` with `reason: 'push'`. Proposal: one sentence in
   "Tracking navigation in overlays" {#overlays}:

   > When an overlay with visible history closes, the address bar returns to the parent page's URL.
   > This emits `up:location:changed` and counts another view of the parent page.
   > The `up:layer:location:changed` listener below does not.

   Evidence: `src/unpoly/classes/change/close_layer.js:64`, `src/unpoly/classes/layer/base.js:657-664`
   (`up.history.push(this._savedLocation)`), `src/unpoly/history.js:611` (patched `pushState`
   tracks with `reason: 'push'`). The layer listener stays quiet because the root's saved location
   doesn't change (`base.js:865`).

2. **Pattern 2 (polling).** "Tracking every fragment update" with `up:fragment:loaded` counts every
   `[up-poll]` reload and every `[up-validate]` request as a page view. The page only says:

   > If this tracks too many events, filter further on the properties of [`event.request`](/up:fragment:loaded#event.request),
   > such as its `{ target }` or `{ layer }`.

   Proposal: name the common culprits and the cheap filter for polling:

   > Polling and form validation also load fragments. Polling requests have `event.request.background` set,
   > so you can skip them by checking that property.

   Evidence: `src/unpoly/radio.js:354` (`defaults = { background: true }` for polling),
   `src/unpoly/classes/request.js:269` (`up.Request#background`).

3. **Pattern 2 (same URL, secondary).** A full page load counts a view when the user clicks a link to the
   current page; Unpoly emits no `up:location:changed` because the URL doesn't change. Proposal: after
   "It is *not* emitted for the initial page load.":

   > Nor is it emitted when a link renders the URL that is already in the address bar.

   Evidence: `src/unpoly/history.js:397`, `src/unpoly/classes/layer/base.js:859`.


## /scrolling-and-focus

1. **Pattern 4.** The first section is headed "Navigation defaults", which sounds like a special mode
   and names a neighbour page. It describes the normal case. Proposal: retitle and keep the anchor,
   e.g. `What happens after following a link {#navigation-defaults}`.

2. **Accuracy.** The default focus order is wrong way round:

   > In that case focus moves to the new fragment (or to the counterpart of the element the user was in),

   `keep` (re-focus the counterpart) comes before `target-if-lost` (focus the new fragment). Proposal:

   > In that case focus moves to the counterpart of the element the user was in, or to the new fragment
   > if there is none,

   Evidence: `src/unpoly/fragment.js:279` (`autoFocus: ['hash', 'autofocus', 'main-if-main', 'keep', 'target-if-lost']`).

3. **Pattern 3.** "Showing or hiding focus rings" shows the two classes, but not the other options of the
   family (configuring the strategy globally, overriding it per link). Proposal: one sentence before the read-more:

   > You can change which elements get which class in `up.viewport.config.autoFocusVisible`,
   > or override it for a single link with `[up-focus-visible]`.


## /scrolling

1. **Pattern 2.** "Restoring previous scroll positions" {#restore} doesn't say what happens when nothing was saved:

   > Set `[up-scroll="restore"]` to restore the last known scroll positions for the updated URL:

   Positions are kept in memory for each layer, so they are gone after a full page load and on a URL
   the user hasn't visited in this layer. `restore` then does nothing. Proposal:

   > Scroll positions are remembered for each layer until the next full page load. When no positions
   > are known for the URL, nothing scrolls. Add a fallback with `[up-scroll="restore, top"]`.

   Evidence: `src/unpoly/viewport.js:542` (`options.layer.lastScrollTops.set`), `viewport.js:602-608`
   (returns `false` without saved positions), history restoration uses the same fallback idea
   (`src/unpoly/history.js:476`).


## /scroll-tuning

1. **Wrong vs. implementation (pattern 6).** The important box is outdated:

   > When [swapping a fragment](/targeting-fragments#swapping), the scroll motion cannot be animated.
   > You *can* animate the scroll motion when [prepending, appending](/targeting-fragments#appending-or-prepending)
   > or [destroying](/up.destroy) a fragment.

   Smooth scrolling works for swaps since commit `1ec2f03af` "[viewport] Allow smooth scrolling when
   swapping a fragment". The page's own example above it (`up-target="#comments" up-scroll="target"
   up-scroll-behavior="smooth"`) is a swap, so the page contradicts itself today. Proposal: delete the box.

   Evidence: `spec/unpoly/fragment_render_scrolling_spec.js:910` ("animates the revealing when swapping
   out an element"), `src/unpoly/classes/change/update_steps.js:124-125` (swap calls `_handleScroll` with
   the step's `scrollBehavior`), `src/unpoly/classes/reveal_motion.js:12`.


## /focus

1. **Pattern 2.** Same gap as /scrolling#restore, in "Restoring focus" {#restore}:

   > Set `[up-focus="restore"]` to restore the last known focus state for the updated URL:

   Proposal (mirror the scrolling sentence):

   > Focus state is remembered for each layer until the next full page load. When nothing is known for the URL,
   > focus is not changed. Add a fallback with `[up-focus="restore, target"]`.

   Evidence: `src/unpoly/viewport.js:650,677` (`layer.lastFocusCapsules`), `src/unpoly/history.js:478`.


## /focus-visibility

No findings.
