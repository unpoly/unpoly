Polling
=======

A fragment can reload itself from the server periodically.
This picks up changes made by other users or by background jobs,
using regular HTTP requests instead of a persistent connection.


## Polling a fragment {#example}

The `.unread-count` fragment below shows the number of unread messages.
Set an `[up-poll]` attribute to refresh it every 30 seconds:

```html
<div class="unread-count" up-poll> <!-- mark: up-poll -->
  2 new messages
</div>
```

Every 30 seconds Unpoly requests the URL the fragment was loaded from,
finds the `.unread-count` element in the response and swaps it into the page.
The rest of the page is left alone. Reloading does not scroll, move focus or change the browser URL.

The response is expected to again contain an `[up-poll]` attribute on the fragment.
This is how the server keeps polling going, or [stops it](#stopping).


## Controlling the reload interval {#interval}

Set an `[up-interval]` attribute with a number of milliseconds:

```html
<div class="unread-count" up-poll up-interval="10000"> <!-- mark: up-interval="10000" -->
  2 new messages
</div>
```

Without the attribute, the global default of 30 seconds is used.
You can change it by configuring `up.radio.config.pollInterval`:

```js
up.radio.config.pollInterval = 10000
```


## Reloading from another URL {#source}

The fragment is reloaded from the URL it was originally loaded from.
Unpoly remembers that URL in an `[up-source]` attribute when the fragment is inserted.

To reload from a different URL, set the `[up-source]` attribute yourself:

```html
<div class="unread-count" up-poll up-source="/unread-count"> <!-- mark: up-source="/unread-count" -->
  2 new messages
</div>
```

A dedicated route like `/unread-count` can render just the fragment,
which is cheaper than rendering the full page it was first loaded with.


## The target selector is derived {#target}

Unpoly [derives](/target-derivation) a target selector from the polling element,
so it can find the element's counterpart in the response.
The element below is polled with the selector `#score`:

```html
<div id="score" up-poll> <!-- mark: id="score" -->
  Score: 1400
</div>
```

When you see a warning `Cannot poll untargetable fragment`, Unpoly could not derive a
selector that identifies the element. Give the element a unique `[id]` or `[up-id]` attribute.


## Polling pauses in the background {#pausing}

Polling pauses while the browser tab is hidden, and resumes when the user returns to the tab.

Polling also pauses while the fragment's [layer](/up.layer) is covered by an overlay,
and resumes when the overlay closes. To keep polling under an overlay,
set an [`[up-if-layer=any]`](/up-poll#up-if-layer) attribute.

When the user returns after at least one interval was spent in the background,
Unpoly reloads the fragment immediately. You can use this to refresh a page when the user
comes back after working on something else for a while. The following reloads
your [main element](/main) after an absence of five minutes or more:

```html
<main up-poll up-interval="300_000"> <!-- mark: up-interval="300_000" -->
  ...
</main>
```


## Stopping polling {#stopping}

Polling stops when any of the following happens:

- The fragment from the server response no longer has an `[up-poll]` attribute.
- The fragment from the server response has an `[up-poll="false"]` attribute.
- Your JavaScript calls `up.radio.stopPolling()` with the polling element.

The first two let the server end polling once the work is done. A fragment that
shows the progress of a background job can poll until the job has finished:

```html
<div id="export-status" up-poll up-interval="2000">
  Exporting 43 of 120 records...
</div>
```

The response for the finished job renders the same element without `[up-poll]`:

```html
<div id="export-status"> <!-- mark-line -->
  <a href="/exports/5/download">Download your export</a>
</div>
```


## Handling failed responses {#failed-responses}

By default polling will *not* render responses with an error code,
even when the response contains a matching fragment.
The server is polled again after the configured interval.

To render *any* response that contains a matching fragment,
set an [`[up-fail=false]`](/up-poll#up-fail) attribute:

```html
<div class="download-status" up-poll up-fail="false"> <!-- mark: up-fail="false" -->
  Download not ready yet.
</div>
```

This updates the fragment with any response containing a `.download-status` element,
even when that response has a 4xx or 5xx status code.

When polling encounters a fatal error, like a timeout or a lost network connection,
it tries again after the configured interval.


## Saving bandwidth when nothing changed {#detecting-unchanged-content}

Many polling requests find that nothing has changed. The server can skip rendering
in that case and answer with an empty response, which costs about 1 KB (one packet)
and no CPU time for rendering.

For this, deliver the initial fragment with an `ETag` header.
An ETag is a hash of the data that was used to produce the HTML:

```http
HTTP/1.1 200 OK
ETag: "x234dff"

<html>
  ...
  <div class='messages'>
    ...
  </div>
  ...
</html>
```

When Unpoly polls the fragment, it echoes the ETag in an `If-None-Match` header:

```http
GET /messages HTTP/1.1
If-None-Match: "x234dff"
```

The server compares the ETag from the request with the ETag of the underlying data.
If no more recent data is available, it skips rendering and responds with `304 Not Modified`.
No response body is required:

```http
HTTP/1.1 304 Not Modified
```

When an update is skipped, Unpoly polls again after the configured interval.

See [[conditional-requests]] for more details, and for an alternative based on modification times.


## Skipping updates on the client {#preventing-request}

Before each reload, an `up:fragment:poll` event is emitted on the polling fragment.
Prevent the event to skip a single update:

```js
up.on('up:fragment:poll', function(event) {
  // Don't reload a fragment that contains a playing video
  let video = event.target.querySelector('video')
  if (video && !video.paused) {
    event.preventDefault() // mark: event.preventDefault()
  }
})
```

The server is polled again after the configured interval, emitting another `up:fragment:poll` event.

To discard a response that has already been received, use the `up:fragment:loaded` event.
To preserve individual elements within the reloaded fragment, give them an `[up-keep]` attribute.


## Polling from JavaScript {#scripting}

To start polling an element that has no `[up-poll]` attribute, pass it to `up.radio.startPolling()`:

```js
let element = document.querySelector('.unread-count')
up.radio.startPolling(element, { interval: 10000 }) // mark: up.radio.startPolling
```

The options object may contain any option from `[up-poll]`, like `{ url }` or `{ ifLayer }`.

To stop, pass the element to `up.radio.stopPolling()`:

```js
up.radio.stopPolling(element)
```


@page polling
@signature
