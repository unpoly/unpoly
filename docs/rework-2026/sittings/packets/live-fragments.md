# Sitting packet: Live fragments chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: A17-A22, B3, B4 (lazy-loading), B5 (fix round, 146b56aca).
/flashes moved here from Forms (d5a3a910b). You reviewed it in the Forms sitting (forms.md, "/flashes"),
so only the fix-round changes are new. Deferred duplication item carried here: C14 (/polling side, other sides on
/backend-integration and /conditional-requests).

| Page | Pointers |
|------|----------|
| live-fragments | 0 |
| lazy-loading | 0 (1 clear fix) |
| infinite-scrolling | 0 |
| polling | 1 |
| hungry-elements | 1 |
| flashes | 0 |


## Live fragments (`/live-fragments`, 104 lines)

Chapter overview: `up.reload()` and `[up-source]`, deferred elements, polling, hungry elements; infinite scrolling in "Also in this topic".

**Changed since writing**
- 146b56aca (B3): end of "Updating elements outside the target": "To show confirmations or errors from any response,
  use a ready-made hungry element for [notification flashes](/flashes)." (live-fragments.md:92, the Forms-sitting decision)

No pointers. (Checked: polling pauses for a hidden tab and a covered layer, classes/fragment_polling.js:98-101;
`[up-source]` is looked up on the closest ancestor, fragment.js:326, so "remembers the URL each fragment was
loaded from" holds.)


## Lazy loading content (`/lazy-loading`, 269 lines)

`[up-defer]` on insert, on reveal, manual; fallback while loading; one URL for many elements; other targets; caching; performance; SEO; preventing the load.

**Changed since writing**
- 146b56aca (A16): "A slow deferred request also shows the [progress bar](/progress-bar). To load quietly, set an
  `[up-background]` attribute." (lazy-loading.md:121; 794062ab2 linked the attribute to `/up-defer#up-background`)
- 146b56aca (A17): "When the server responds with an error code, nothing is rendered and the fallback stays.
  To show the error, set an `[up-fail-target]` attribute." (lazy-loading.md:123-124)
- 146b56aca (B4): Rails note after the ERB example (lazy-loading.md:208).

No pointers. One factual slip is under "Clear fixes". (Checked: the deferred element targets itself and needs a
derivable target, link.js:1020 `target: ':origin'`; `[up-intersect-margin]`, link.js:947; a prevented
`up:deferred:load` is not retried, link.js:1033.)


## Infinite scrolling (`/infinite-scrolling`, 111 lines)

The "load more" link as a deferred element targeting `#next-page, #pages:after`, the server response, the last page, loading earlier.

**Changed since writing**
- 146b56aca (B5): "deferred placeholder" → "deferred link" / "deferred element" (infinite-scrolling.md:5, :27, :74).
- 146b56aca (A18): "Pages loaded by scrolling are not part of the URL. When the user navigates away and comes back,
  the list starts again with the first page." (infinite-scrolling.md:77-78)

No pointers.


## Polling (`/polling`, 202 lines)

`[up-poll]`, interval, other URL, derived target, pausing, stopping, failed responses, 304s, skipping, JavaScript.

**Changed since writing**
- 146b56aca (A19): "A reload is a regular render pass: it aborts earlier requests targeting the fragment or its
  descendants, and is itself aborted when the user updates the fragment or a container around it." (polling.md:27-28)
- 146b56aca (A20): reloads set `.up-loading`, opt out with `[up-feedback=false]` (polling.md:30-31; 794062ab2 added the link).
- (701968b94 on 2026-10-09 shortened the ETag section to a pointer.)

### 1. The "1 KB" sentence, third copy (C14, deferred duplication)

> Many polling requests find that nothing has changed. Your server can then skip rendering
> and respond with an empty `304 Not Modified`, which costs about 1 KB and no rendering time.

(polling.md:155-156)

> When Unpoly reloads a fragment that has not changed, your server can answer with an empty `304 Not Modified`.
> The exchange then costs about 1 KB and no rendering time.

(conditional-requests.md:4-5)

> When nothing changed, the server can answer with an empty `304 Not Modified`
> and Unpoly finishes the render pass without changes.
> The exchange then costs about 1 KB and no rendering time.

(backend-integration.md:65-67)

C14 asks to re-angle the Backend integration overview, which is the literal copy of conditional-requests.
The polling side is a paraphrase from the polling angle ("many polling requests find that nothing has changed"),
and polling is the page where the saving matters most, since it repeats every 30 seconds. (Pattern 5: re-angled, fine)

- **A.** Leave /polling as is. Fix the literal copy at the Backend integration sitting (C14 draft there).
- **B.** Drop the cost clause here too: "…and respond with an empty `304 Not Modified`."

**Lean: A (medium).** No change on this page.


## Hungry elements (`/hungry-elements`, 172 lines)

`[up-hungry]`, derivable targets, transitions, conditions via `up:fragment:hungry`, other layers, disabling, config, conflicts.

**Changed since writing**
- 146b56aca (A21): "Hungry elements are also updated from responses with an [error code](/failed-responses),
  like a form re-rendered with validation errors." (hungry-elements.md:44-45)

### 1. "should not replace it": which "it"?

> For example, a subnavigation should only update when the user navigates to another page.
> A form validation that targets a fieldset should not replace it.
> The following only updates `#side-nav` for render passes that [update history](/updating-history):

(hungry-elements.md:81-83)

"it" can be read as the fieldset, which makes no sense ("a validation that targets a fieldset should not replace
the fieldset"). It means the subnavigation. The two sentences are one example: navigation yes, validation no.
The code below checks exactly that, since a validation doesn't update history.

- **A.** Merge into one sentence.
- **B.** Leave it.

**Lean: A (medium).** Draft for hungry-elements.md:81-82:

```md
For example, a subnavigation should update when the user navigates to another page,
but not when a form validation updates a fieldset.
```


## Notification flashes (`/flashes`, 212 lines)

`[up-flashes]` placement, rendering, clearing, overlays, caching, a custom container.

**Changed since writing**
- 146b56aca (A22): "This works like a [hungry element](/hungry-elements): the container piggy-backs on every
  render pass in its layer and in overlays above it." (flashes.md:54-55; was "in its layer", linking `/up-hungry`)
- 146b56aca (A21): "This also works for [failed responses](/failed-responses), so an error flash rendered with a
  form's validation errors is shown too." (flashes.md:57)
- d5a3a910b: moved into this chapter, after hungry-elements (toc.yml).

No pointers. (You reviewed this page in the Forms sitting: overlay subsections, caching gotcha and screenshot kept.
Checked the new sentences: `[up-flashes]` sets `[up-if-layer=subtree]`, radio.js:518-523; `hungry` is shared with
fail options, render_options.js:78.)


## Clear fixes (apply without asking)

1. lazy-loading.md:46-48 says the rest of the response is discarded, but hungry elements in it are updated too.
   Every render pass has `hungry: true` (fragment.js:249), and deferred loads don't change it (link.js:1008-1025).
   radio_hungry_spec.js:35 shows a non-navigating `up.render()` updating a hungry element. This is the same fix as A44
   on /backend-integration.

   > Unpoly swaps the deferred element with the element from the response.
   > Other elements in the response are discarded, so the server is free to send
   > a full HTML document.

   →

   ```md
   Unpoly swaps the deferred element with the element from the response.
   Apart from [hungry elements](/hungry-elements), other elements in the response are discarded,
   so the server is free to send a full HTML document.
   ```
