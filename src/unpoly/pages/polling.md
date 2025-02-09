Polling
=======

You can reload fragments from the server periodically. This will pick up changes made by other users, or by background tasks.


## Basic example {#example}

The `.unread-count` fragment below shows the number of unread message.
You can use `[up-poll]` to refresh the counter every 30 seconds:

```html
<div class="unread-count" up-poll>
  2 new messages
</div>
```

## Controlling the reload interval {#interval}

You may set an optional `[up-interval]` attribute to set the reload interval in milliseconds:

```html
<div class="unread-count" up-poll up-interval="10000"> <!-- mark-phrase "up-interval" -->
  2 new messages
</div>
```

If the value is omitted, a global default is used. You may configure the default like this:

```js
up.radio.config.pollInterval = 10000
```

## Controlling the source URL {#source}

The element will be reloaded from the URL from which it was originally loaded.

To reload from another URL, set an `[up-source]` attribute on the polling element:

```html
<div class="unread-count" up-poll up-source="/unread-count"> <!-- mark-phrase "up-source" -->
  2 new messages
</div>
```

## The target selector is derived {#target}

A target selector will be [derived](/target-derivation) from the polling element.

For example, the following element will be polled with the selector `#score`:

```html
<div id="score" up-poll> <!-- mark-phrase "score" -->
  Score: 1400
</div>
```

When you see an error `Cannot poll untargetable fragment`, Unpoly cannot derive a good
selector that identifies the element. In that case, set a unique `[id]` or `[up-id]` attribute.


## Handling failed responses {#failed-responses}

By default polling will *not* render server responses with an error code,
even when the response contains a matching fragment. After the configured
interval, the server will be polled again.

In order to *any* response that contains a matching fragment,
set an `[up-fail=false]` attribute:

```html
<div class="download-status" up-poll up-fail="false"> <!-- mark-phrase "up-fail" -->
  Download not ready yet.
</div>
```

This will update the fragment with any response that contains
a `.download-status` element, even when that response has a 4xx or 5xx status code.

When polling encounters a fatal error (like a timeout or loss of network connectivity),
it will try again after the configured interval.


## Polling is paused in the background {#pausing}

By default polling will pause while the fragment's [layer](/up.layer) is covered by an overlay.
When the layer is uncovered, polling will resume.
To keep polling on background layers, set [`[up-if-layer=any]`](#up-if-layer).

Polling will also pause automatically while the browser tab is hidden.
When the browser tab is re-activated, polling will resume.

When at least one poll interval was spent paused in the background and the user
then returns to the layer or tab, Unpoly will immediately reload the fragment.
You can use this to load recent data when the user returns to your app after working on something else for a while. For example, the following
would reload your [main](/main) element after an absence of 5 minutes or more:

```html
<main up-poll up-interval="300_000">
  ...
</main>
 ```

## Skipping updates on the client {#preventing-request}

Client-side code may prevent a polling request by preventing an `up:fragment:poll` event
on the polling fragment:

```js
up.on('up:fragment:poll', function(event) {
  // Don't reload a fragment that contains a playing video
  let video = event.target.querySelector('video')
  if (video && !video.paused) {
    event.preventDefault()
  }
})
```

The server will be polled again after the configured interval, emitting another `up:fragment:poll` event.

To not use a polling response that has already been received, use the `up:fragment:loaded` event or `[up-keep]` attribute.

## Saving bandwidth when nothing changed {#detecting-unchanged-content}

When polling a fragment periodically we want to avoid rendering unchanged content.
This saves <b>CPU time</b> and reduces the <b>bandwidth cost</b> for a
request/response exchange to about 1 KB (1 packet).

A good way to detect unchanged content is to deliver the initial fragment
with an `ETag` header. An ETag is a hash of the data that was used to produce the HTML:

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

The server can compare the ETag from the request with the ETag of the underlying data.
If no more recent data is available, the server can skip rendering and
respond with `304 Not Modified`. No response body is required.

```http
HTTP/1.1 304 Not Modified
```

See [Conditional requests](/conditional-requests) for more details and examples.

When an update is skipped, Unpoly will try to poll again after the configured interval.

## Stopping polling {#stopping}

There are multiple ways to stop the polling interval:

- The fragment from the server response no longer has an `[up-poll]` attribute.
- The fragment from the server response has an `[up-poll="false"]` attribute.
- Client-side code has called `up.radio.stopPolling()` with the polling element.


@page polling
