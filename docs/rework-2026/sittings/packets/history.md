# Sitting packet: History chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: C3 with B6, B7, A23, A24 (2476125d0, your overview re-angle), A25-A27, A29 (1ed027539),
A24 tracking half and A28 (09db32d44). Deferred duplication item carried here: C10 (/tracking-page-views,
other side on /caching).

| Page | Pointers |
|------|----------|
| history | 0 |
| updating-history | 0 |
| restoring-history | 0 |
| tracking-page-views | 2 |


## History (`/history`, 72 lines)

Chapter overview: updating the address bar, restoring the previous page, tracking page views.

**Changed since writing**
- 2476125d0 (C3, B6, B7): your re-angle. "Updating the address bar" explains page changes from the user's side
  and keeps only the pagination example. "History is a navigation default" is gone. `[up-back]` pointer in
  "Restoring the previous page" (history.md:47). The tracking sentence no longer copies tracking-page-views.

No pointers. (Checked: an overlay gets visible history only when its initial content contains a main element,
open_layer.js:209-212; restore renders `config.restoreTargets`, default `['body']`, history.js:75, :452.
The `restoreTargets` snippet and the tracking listener repeat the detail pages' code, but each teaser has its
own sentence around it. Same case as the teasers you left in the Overlays and Loading state sittings.)


## Updating history (`/updating-history`, 244 lines)

When history changes, forcing or preventing it, other major fragments, GET-only, `up.render()`, what is updated,
meta tags, partial updates, explicit URL/title, `up.history.push()`, observing changes.

**Changed since writing**
- 2476125d0 (A24): "When the new URL is the one already in the address bar, no entry is added." (updating-history.md:35)
- 2476125d0 (A23): error responses follow the same rules (updating-history.md:98-100).

No pointers. (Checked: non-`GET` responses set `history = !!location`, from_response.js:162-173, so the
`[up-location]` exception holds; `up.history.push()` returns early for the current URL, history.js:397;
auto history matches the fragment or a descendant, fragment.js:2319-2333; `[up-location]`, `[up-title]`, `[up-lang]`
take a string or `false`, `[up-meta-tags]` only a boolean, link.js:404-407; `metaTagSelectors` include JSON-LD,
history.js:76-83. `/navigation-defaults#navigation-defaults` resolves, navigation-defaults.md:40.)


## Restoring history (`/restoring-history`, 137 lines)

What happens on Back, restoring a different fragment, `up:location:restore`, owned entries and `willHandle`, `[up-back]`.

**Changed since writing**
- 1ed027539 (A26): positions and focus are remembered per layer; without them Unpoly falls back to the
  link defaults (restoring-history.md:21-23).
- 1ed027539 (A25): pending requests for the restored fragment are aborted (restoring-history.md:25-26).
- 1ed027539 (A27): offline Back keeps the content while the URL changes (restoring-history.md:30-31).

No pointers. (Checked: the restore render uses `fail: false`, `peel: 'force'`, `layer: 'root'`, `cache: 'auto'`,
`revalidate: 'auto'`, `scroll: ['restore', 'auto']`, `focus: ['restore', 'auto']`, history.js:444-480; a pop between
two URLs with the same base is a `'hash'` change and only reveals, history.js:195-197, :497-499; `willHandle = true`
takes effect on the later pop because a foreign push arrives as `alreadyHandled`, history.js:199, :484-491;
`[up-back]` sets `[up-href]` and `[up-scroll=restore]` only when a previous URL is known, history.js:749-756.)


## Tracking page views (`/tracking-page-views`, 155 lines)

`up:location:changed`, hash changes, overlays, tracking from a compiler, custom dimensions, `up:fragment:loaded`.

**Changed since writing**
- 09db32d44 (A24, tracking half): no event when a link renders the URL already shown (tracking-page-views.md:25).
- 09db32d44 (A28): closing an overlay with visible history counts another view of the parent page; the layer
  listener doesn't (tracking-page-views.md:62-64). This insertion broke the "such overlays" reference two lines
  below; the fix is under "Clear fixes".
- 1ed027539 (A29): polling and validation also load fragments; skip polling via `event.request.background`
  (tracking-page-views.md:151-152). See pointer 2.

### 1. /caching copies the tracking compiler (C10, deferred duplication)

> Then track a page view from a [compiler](/enhancing-elements):
>
> ```js
> up.compiler('[track-page-view]', function(element, data, meta) {
>   // Don't track duplicate page views if we just reloaded for cache revalidation.
>   if (!meta.revalidating) {
>     trackPageView(meta.layer.location) // mark-line
>   }
> })
> ```

(tracking-page-views.md:97-106)

> To detect revalidation, compilers may accept a third argument with information about the current [render pass](/up.render).
> In the example below a compiler wants to [track a page view](/tracking-page-views) in a web analytics tool:
>
> ```js
> up.compiler('[track-page-view]', function(element, data, meta) { // mark: meta
>   // Don't track duplicate page views if we just reloaded for cache revalidation.
>   if (!meta.revalidating) {
>     // Send an event to our web analytics tool.
>     trackPageView(meta.layer.location)
>   }
> })
> ```

(caching.md:265-276)

Same selector, same comment, same call. This page owns the tracking example. /caching's own angle is
"a compiler can tell a revalidation apart", which needs one sentence and the property name. The property is
documented in the meta table at enhancing-elements.md:220 (script.js:675). In earlier sittings you sent the
reader to the owner instead of keeping a copy (C7, C8). (Pattern 5)

- **A.** On /caching, keep the heading and the angle, and point to this page's example.
- **B.** On /caching, use a different side effect (e.g. a compiler that plays a sound for new messages).
- **C.** Leave both.

**Lean: A (medium).** Draft for caching.md:260-276 (keeps the auto anchor, which has no inbound links):

```md
### Detecting revalidation from a compiler

Compilers with side effects may want to behave differently when the compiled element is being
reloaded for the purpose of cache revalidation. A compiler's third argument has a
[`meta.revalidating`](/enhancing-elements#meta) property for this.
For example, a compiler that [tracks page views](/tracking-page-views#fragments) skips revalidations,
so the same view is not counted twice.
```

### 2. The polling sentence is appended after the "too many events" advice

> If this tracks too many events, filter further on the properties of [`event.request`](/up:fragment:loaded#event.request),
> such as its `{ target }` or `{ layer }`.
> Polling and form validation also load fragments. Polling requests have `event.request.background` set,
> so you can skip them by checking that property.

(tracking-page-views.md:149-152)

The fix round added the A29 sentences after the general advice. The paragraph now says "filter further"
first and only then names the events you would filter. Turned around, it reads as cause → common fix →
general fix. Polling requests are background requests (radio.js:354, `up.Request#background` at classes/request.js:269).

- **A.** Reorder the paragraph, same facts.
- **B.** Put the polling check in the code example (`if (!event.revalidating && !event.request.background)`) and keep one sentence.
- **C.** Leave it.

**Lean: A (medium).** Draft for tracking-page-views.md:149-152:

```md
Polling and [form validation](/validation) also load fragments, so this listener counts them too.
To skip polling, check `event.request.background`, which is set for polling requests.
To filter further, inspect other properties of [`event.request`](/up:fragment:loaded#event.request),
such as its `{ target }` or `{ layer }`.
```


## Clear fixes (apply without asking)

1. tracking-page-views.md:66. The A28 paragraph inserted at :62-64 is about overlays *with* visible history,
   so "such overlays" now points at the wrong group. The sentence means overlays without visible history (:58-60).
   `To also track navigation within such overlays, observe` → `To also track navigation within overlays without visible history, observe`
