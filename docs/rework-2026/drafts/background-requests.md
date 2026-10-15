Background requests
===================

A background request is a request the user is not actively waiting for, like [preloading](/preloading) a link or [polling](/polling) a fragment.
Background requests never show the [progress bar](/progress-bar), and they wait while requests for the user's own clicks and submissions are sent first.


What changes for a background request {#effects}
-------------------------------------

Unpoly treats a background request differently in two ways:

- **It never shows the progress bar.** A background request does not emit an `up:network:late` event, no matter how long it takes. The [progress bar](/progress-bar) only appears for requests the user is waiting for.
- **It has a lower priority.** Unpoly sends at most [6 requests](/up.network.config#config.concurrency) at the same time. When more requests are waiting, requests in the foreground are sent first. A background request is only sent when no foreground request is waiting.

Loading in the background does not change how a request is [aborted](/aborting-requests), [cached](/caching) or styled with [feedback classes](/feedback-classes).
`up.network.isBusy()` also returns `true` while a background request is loading.


Which requests load in the background {#defaults}
-------------------------------------

The following requests load in the background by default:

- Requests from [preloading](/preloading) a link.
- Requests from [polling](/polling) a fragment.
- Requests that [revalidate](/caching#revalidation) cached content after it was rendered.

Links, forms and [deferred content](/lazy-loading) load in the foreground by default.
A slow request from one of them shows the progress bar.


Loading in the background {#opting-in}
-------------------------

To load a link, form or deferred element in the background, set an [`[up-background]`](/up-follow#up-background) attribute.
From JavaScript, pass a [`{ background: true }`](/up.render#options.background) option to a rendering function or to `up.request()`.

For example, a form that publishes a post can save a draft while the user types.
The user is not waiting for the draft to be saved, so it should not show the progress bar
or delay the user's clicks:

```html
<form method="post" action="/posts" data-autosave="/drafts">
  <textarea name="text"></textarea>
  <button type="submit">Publish</button>
</form>
```

A [compiler](/enhancing-elements) watches the form and sends its fields to the draft URL in the background:

```js
up.compiler('form[data-autosave]', function(form, { autosave: url }) {
  up.watch(form, { delay: 2000 }, function() {
    up.request(url, { method: 'post', params: up.Params.fromForm(form), background: true }) // mark: background: true
  })
})
```

To load a request in the foreground that would load in the background by default, set `[up-background="false"]`.


When the user waits for a background request {#promotion}
--------------------------------------------

Sometimes the user needs the response of a request that is still loading in the background.
For example, the user hovers over a link and Unpoly starts [preloading](/preloading) it.
Before the preload request has finished, the user clicks the link.

Unpoly does not make a second request in this case. The click reuses the preload request from the [cache](/caching),
and the preload request is moved into the foreground. From then on it is treated like any other foreground request:

- When the request takes longer than [usual](/progress-bar#timing), the progress bar appears.
- When the request is still waiting to be sent, it is sent before any background request.

This happens whenever a foreground request reuses a cached request that is still loading in the background.


Detecting background requests {#detecting}
-----------------------------

To check if a request is loading in the background, read its `up.Request#background` property.
Network events like `up:request:load` or `up:fragment:loaded` give you the request as `event.request`.

For example, an app that warns users before their session times out may restart its idle timer with every request.
Requests from polling or preloading are not user activity, so the listener skips them:

```js
up.on('up:request:load', function(event) {
  if (!event.request.background) { // mark: event.request.background
    restartIdleTimer()
  }
})
```

The property is `false` for a background request that was moved into the [foreground](#promotion).


@page background-requests

---

## Follow-ups

- **progress-bar.md** (~49-54, "Requests that are loading in the background..."): keep one sentence and link `[[background-requests]]`; the defaults list and opt-in now live here.
- **preloading.md** (~85, ~105): "background request" links point to `/up.render#options.background`; point them to `/background-requests` instead. Consider a sentence in "Preload request behavior" that clicking a link while it preloads reuses the request and moves it into the foreground (link to `#promotion`).
- **lazy-loading.md** (~118): link "load quietly" to `/background-requests`.
- **tracking-page-views.md** (~150): optionally link `event.request.background` to `/background-requests#detecting`.
- **Reference copies** (identical "deprioritized ... won't trigger the progress bar" text): `pages/params/up.render/request.md` (~39-45), `pages/params/up-follow/request-extras.md` (~25-30), `src/unpoly/network.js` (~411-416, `up.request` `{ background }`). Shorten to one sentence plus a link to `/background-requests`. `up.Request#background` in `src/unpoly/classes/request.js` (~263-270) still links the progress bar to `/up.network.config#config.progressBar`; point it to `/progress-bar` and `/background-requests`, and add `@learn-ref background-requests`.
- `[up-defer]` `[up-background]` description (`src/unpoly/link.js` ~1113) and `up.network.isBusy()` (`network.js` ~630) link to `/up.render#options.background` / `/up.request#options.background`; could link the guide.
- **network.md overview**: has no "See also"/"Also in this topic" tail yet. Add one mentioning background requests, or a sentence in "How Unpoly makes requests" after "one queue that limits concurrent requests".
- **toc.yml**: add `background-requests` after `aborting-requests` in "Network & caching" when the page moves to `src/unpoly/pages/`.
