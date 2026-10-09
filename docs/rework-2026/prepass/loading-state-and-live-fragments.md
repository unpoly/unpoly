# Pre-pass: Loading state and Live fragments

Checked against the maintainer patterns in `docs/rework-2026/writer-brief.md` (1-8).
Line numbers refer to the state of `docs-rework` at the time of the pass.
The only Rails code on these pages is the ERB block in /lazy-loading (pattern 8, see there).


## /loading-state

1. **Pattern 3.** The intro and the previews teaser list the family without disabling:

   > While Unpoly waits for the server, it can show loading state: a highlighted button,
   > a dimmed fragment, a spinner, a skeleton screen or even the expected result.

   > Feedback classes and placeholders are *previews*: temporary page changes that Unpoly
   > applies when a request starts, and reverts when the request ends.

   Disabling is a member of the same family. It is implemented as a preview
   (status.js:276 runs `up.form.getDisablePreviewFn()` next to placeholders and feedback classes), and the
   /submitting-forms teaser agreed in the Forms sitting lists it first. Today it only appears as a
   sentence under "Styling loading elements". Proposal: add it to the intro ("…a highlighted button,
   disabled form fields, a dimmed fragment…") and to the previews sentence ("Feedback classes,
   placeholders and [disabling](/disabling-forms) are *previews*…").


## /feedback-classes

1. **Wrong vs. implementation.** "Fields can be active origins" claims:

   > - A field with `[up-validate]` is changed.
   >
   > In these cases, that field is considered the [origin](/origin) element that
   > caused the submission. It is also marked as `.up-active`, in addition to the form and its default submit button

   This holds for `Return` and `[up-autosubmit]` (form.js:475-476 sets
   `activeElements = [origin, submitButton, form]`), but not for `[up-validate]`. A validation renders
   with `origin = form` and no `activeElements` (form_validator.js:244), so only the form could become `.up-active`.
   Also, a validation sets feedback classes only when a field or form opts in with `[up-watch-feedback]`:
   form_validator.js:284 computes `feedback = u.some(renderOptions, 'feedback')`, and
   `statusOptions` has no default for it (status.js:429). The specs only test the opt-in
   (form_validate_fn_spec.js:853-888).
   Proposal: drop the `[up-validate]` bullet. Out of scope here, but related: watch-options.md:154 says
   "While a validation or autosubmit request is loading, feedback classes … are set by default".
   That's true for autosubmit and false for validation. You decide whether the docs or the code are wrong.

2. **Pattern 2 (caching).** The page says nothing about content rendered from the cache. Previews,
   including feedback classes, don't run for a cache hit (request.js:611 `if (!this.ended && !this.fromCache)`).
   Proposal, one sentence at the start of "Feedback during cache revalidation":
   > When content is rendered from the [cache](/caching), no `.up-active` or `.up-loading` classes are set, since there is nothing to wait for.


## /placeholders

1. **Pattern 2 (caching).** Same gap: a reader may wonder why their skeleton never shows for a
   cached page, or for the revalidation request. Placeholders are previews, so they are skipped
   for cache hits (request.js:611) and for revalidation (from_response.js:92 merges `NO_PREVIEWS`,
   which sets `placeholder: false`, render_options.js:6-11). Proposal, one sentence after the
   "Like all preview effects…" paragraph:
   > Placeholders are not shown when content is rendered from the cache. See [using previews with caching](/previews#using-previews-with-caching).


## /previews

1. **Pattern 2 (focus).** Nothing says what happens when a preview hides, replaces or disables the
   focused element. Unpoly captures focus before running previews and restores it after reverting
   them, unless the user has focused something else in the meantime (status.js:252-261,
   focus_capsule.js `autoVoid()`/`restore()`). Proposal, one sentence at the end of "How previews end":
   > When a preview takes focus away from an element, Unpoly focuses it again after the preview is reverted, unless the user has focused another element in the meantime.

2. **Pattern 3.** The intro names the built-in previews but leaves out disabling:

   > Unpoly's [feedback classes](/feedback-classes) and [placeholders](/placeholders) are built on previews.

   Proposal: "…[feedback classes](/feedback-classes), [placeholders](/placeholders) and
   [disabling](/disabling-forms) are built on previews." (status.js:273-276.)

Reference bug outside scope: the `up.Preview#hideContent` example calls a nonexistent
`preview.hideChildren()` (classes/preview.js:695).


## /optimistic-rendering

1. **Pattern 6 (incorrect example).** Both preview functions call `form.reset()`:

   > ```js
   > preview.insert(form, 'afterend', newTask)
   > form.reset()
   > ```

   `form.reset()` is not reverted when the preview ends. This page says the preview leaves the screen
   consistent "in cases where we end up *not* updating the entire `#tasks` fragment, e.g. when the form
   submission fails", and /previews#advanced-mutations says changes made outside `up.Preview` need an
   undo. If the request is aborted or hits a network error, the optimistic task disappears and the user's text is lost.
   (A 422 is fine, since the server re-renders the form.) The demo does the same (unpoly-demo application.js:239).
   Proposal: either drop `form.reset()` (a successful response replaces the form, since it lives inside
   `#tasks`), or keep it and add one sentence: "Resetting the form is not undone when the preview ends.
   If the request fails without a response, the user needs to type the text again."

2. **Pattern 6 (unexplained guard).** The template version adds a guard that the first version doesn't have:

   > ```js
   >   if (text) {
   > ```

   The form has `[required]`, so `text` is never empty, and the demo has no such guard. Proposal: remove
   the `if`, so the two examples differ only in the template line.

3. **Pattern 2 (concurrency).** Optimistic rendering is where "the user adds two tasks quickly" matters.
   The second submission targets `#tasks` too, so with the default `{ abort: 'target' }` it aborts the first request
   (render_job.js:211-213, fragment.js:254). The first preview is reverted, so the first optimistic task
   disappears until the second response renders the server's list. The server has usually already
   processed the aborted POST, so the task comes back in the second response. Proposal, one sentence after the first
   example, plus link:
   > When the user submits again before the server responds, the new submission [aborts](/aborting-requests) the earlier request and its preview, so only the latest optimistic task is shown until the server's list arrives.
   (Worth a check on the scratch server before you write it, especially the "comes back" part.)


## /progress-bar

1. **Pattern 2 / incomplete list.** In

   > Requests from [preloading](/preloading) or [polling](/up-poll) are automatically
   > marked as background requests.

   cache revalidation is missing (from_response.js:101 `background: true`). Readers will also expect
   lazy loading in the list, but a deferred element makes a *foreground* request, so a slow one shows
   the bar (link.js:1007-1024 sets no `background`; spec link_defer_spec.js:46 "makes a foreground request by default").
   Proposal:
   > Requests from [preloading](/preloading), [polling](/polling) and [cache revalidation](/caching#revalidation) are automatically marked as background requests. [Deferred content](/lazy-loading) loads in the foreground unless you set `[up-background]`.


## /live-fragments

1. **Pattern 3 (already decided, not yet done).** /flashes moved into this chapter, but the overview
   doesn't mention it. The Forms sitting decided: "Live fragments overview gets a short mention/link
   (e.g. at the end of the hungry elements section: flashes are a ready-made hungry element)".
   Draft for the end of "Updating elements outside the target":
   > To show confirmations or errors from any response, use a ready-made hungry element for [notification flashes](/flashes).


## /lazy-loading

1. **Pattern 2 (failed responses).** Nothing says what happens when the deferred URL responds
   with an error. Deferred loads are not navigation (`navigate: false`, link.js:1011), so there is no
   fallback to the main element. Without `[up-fail-target]`, nothing is rendered, the fallback children stay
   and an `up.CannotMatch` error is logged (from_content.js:174-175; same path as the spec
   link_defer_spec.js:105 "does not update the main element"). Proposal, one sentence at the end of "Showing a fallback while loading":
   > When the server responds with an error code, nothing is rendered and the fallback stays. To show the error, set an [`[up-fail-target]`](/failed-responses#fail-options) attribute.

2. **Pattern 2 (progress bar).** A slow deferred request shows the global progress bar, which
   surprises readers who think of lazy loading as background work (link_defer_spec.js:46). Proposal, one
   sentence in "Showing a fallback while loading":
   > A slow deferred request also shows the [progress bar](/progress-bar). To load quietly, set an `[up-background]` attribute.
   (Pairs with the /progress-bar finding. One page should own the full explanation.)

3. **Pattern 8.** "Improving cacheability on the server" uses ERB (`<% if current_user.admin? %>`)
   without a note. Proposal, after the first code block:
   > The example uses Ruby on Rails, but works similarly with any other backend.


## /infinite-scrolling

1. **Pattern 2 (history).** The page doesn't answer "what happens when the user leaves and comes back?".
   The URL stays `/items`. Going back [restores](/restoring-history) by rendering `/items` again
   (history.js:444-478, target `body`, usually from the cache), and that response only contains page 1.
   Scroll restoration can't reach a position on page 5. Proposal, one sentence at the end of
   "Loading the next page" or "Structuring the HTML":
   > Pages loaded by scrolling are not part of the URL. When the user navigates away and comes back, the list starts again with the first page.

2. **Pattern 5 / terminology.** The intro and "Note the following" call the link a placeholder:

   > The "load more" link at the bottom is a [deferred placeholder](/lazy-loading)

   > - The link is an `[up-defer]` placeholder that loads …
   > The new link is again an `[up-defer="reveal"]` placeholder.

   /lazy-loading consistently says "deferred element", and "placeholder" is the name of a different
   loading-state feature ([[placeholders]]). Proposal: say "deferred link" or "deferred element" here.
   (The `[up-defer]`/`up.deferred.load()` reference in link.js uses "placeholder" throughout as well; that's
   for a later reference pass.)


## /polling

1. **Pattern 2 (concurrency).** The page doesn't say how a poll interacts with user navigation. A poll is a
   regular render pass with the default `{ abort: 'target' }` (fragment.js:254; pollOptions only adds
   `background: true`, radio.js:354):
   - When a user interaction updates the polled fragment or a container around it, the pending poll
     request is aborted, and polling stops until the new fragment brings its own `[up-poll]`
     (render_job.js:211-213, fragment_polling.js:30-34).
   - When the poll starts, it aborts the user's pending requests that target elements *inside* the polled
     fragment (same code path). This matters for the `<main up-poll up-interval="300_000">` example on this page.

   Proposal, one sentence plus link (e.g. at the end of "Polling a fragment"):
   > A reload is a regular render pass: it [aborts](/aborting-requests) earlier requests targeting the fragment or its descendants, and is itself aborted when the user updates the fragment or a container around it.

2. **Pattern 2 (loading state).** Every poll sets `.up-loading` on the polled fragment. Feedback
   defaults to true (fragment.js:256), pollOptions doesn't override it (radio.js:359 only parses
   `[up-feedback]`), and poll requests never come from the cache (request.js:611). An app that dims `.up-loading`
   will dim its unread counter every 30 seconds. Proposal, one sentence at the end of "Polling a fragment":
   > While the reload is loading, the fragment gets the [`.up-loading`](/feedback-classes) class. To not style it, set `[up-feedback=false]`.


## /hungry-elements

1. **Pattern 2 (failed responses).** Nothing says whether hungry elements update from an error response.
   They do: `hungry` is a shared key that also applies to fail options (render_options.js:78). That's
   how an error flash in a 422 response reaches `[up-flashes]`. Proposal, one sentence at the end of
   "Marking an element as hungry":
   > Hungry elements are also updated from responses with an [error code](/failed-responses), like a form re-rendered with validation errors.


## /flashes

1. **Pattern 2 (failed responses).** The most common error flash ("Could not save") comes with a
   422 response. Readers will want to know whether it shows. It does (render_options.js:78, see /hungry-elements). Proposal,
   one sentence at the end of "Flashes are targeted automatically":
   > This also works for [failed responses](/failed-responses), so an error flash rendered with a form's validation errors is shown too.

2. **Wrong vs. implementation (small).** In "Flashes are targeted automatically":

   > This works like a [hungry element](/up-hungry): the container piggy-backs on every
   > render pass in its layer.

   `[up-flashes]` has `[up-if-layer="subtree"]` (radio.js:517-522), so it also picks up render passes in
   overlays. That's what "One container for all layers" below relies on. Proposal: "…on every render
   pass in its layer and in overlays above it." Now that /hungry-elements is the next page in the same
   chapter, link the guide (`/hungry-elements`) instead of the `[up-hungry]` reference.
