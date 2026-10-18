Streaming real-time updates
===========================

Your server can tell the page when something changed, for example when a new message arrives in an inbox.
A [compiler](/api/up.compiler) of a few lines connects to [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) or a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), and reloads the affected fragment with `up.reload()`.

> [tip]
> If a delay of a few seconds is acceptable, [polling](/learn/polling) is simpler.
> It needs no open connection and works with every server.


## Reloading on a signal {#signal}

Below we have an `#inbox` fragment. In the application layout we add an element with the URL of an event stream:

```html
<div id="inbox">...</div>

<!-- in the layout, outside elements that get swapped -->
<div data-stream="/updates"></div> <!-- mark: data-stream="/updates" -->
```

A compiler opens the connection and reloads a fragment when a message arrives:

```js
up.compiler('[data-stream]', function(element, { stream: url }) {
  let source = new EventSource(url)
  source.addEventListener('message', function(event) {
    let fragment = up.fragment.get(event.data, { layer: element })
    if (fragment) up.reload(fragment) // mark: up.reload(fragment)
  })
  return () => source.close()
})
```

The compiler receives the element's `[data-*]` attributes as its second argument, so `data-stream="/updates"` arrives as `stream`.

The server responds to `/updates` with a `Content-Type: text/event-stream` header and keeps the response open.
When the inbox changes, it writes a message to the stream. A message is a `data:` line followed by a blank line:

```text
data: #inbox

```

The browser fires one `message` event for each message. The event's `data` property is the text after `data: `, here `#inbox`.
Sending a selector is a convention of this example. Your server can send whatever your compiler understands.

When the page has an `#inbox` element, `up.reload()` requests the URL that element was loaded from, and swaps it with the new `#inbox` from the response.
When the page has no such element, the message is ignored.
With `{ layer: element }` Unpoly looks for the fragment in the layer of the `[data-stream]` element, so the fragment is found and reloaded even while an [overlay](/learn/opening-overlays) is open.

Like [polling](/learn/polling), the reload [aborts](/learn/aborting-requests) pending requests that target the fragment,
for example when the user just clicked a link that updates only the inbox.
To keep such requests, call `up.reload(fragment, { abort: false })`.


### Reloading or pushing HTML {#reload-vs-push}

The message in this example only says *what* changed. Each user's browser then loads the new HTML with a normal request.
Your server renders that response with its existing routes and templates, for the current user, with its usual authorization checks.

The cost is one extra request per browser. A signal to many users causes many reloads at the same time.
To keep them cheap, let your server answer with `304 Not Modified` when nothing changed for a user. See [[conditional-requests]].

You can also push rendered HTML instead of a signal, and pass it to [`up.render({ fragment })`](/api/up.render).
This saves the extra request. Your server then renders the HTML outside of a request,
and must make sure each user only receives what they may see.


### Where to put the connection {#placement}

The compiler returns a [destructor](/api/up.destructor) that closes the connection when its element leaves the page.

If you put `[data-stream]` on an element that gets swapped, for example the `#inbox` itself, each swap closes the connection and opens a new one.
So put it in your layout, outside the elements that get updated.
Unpoly does not replace the layout when the user navigates, so one connection lasts across page changes.

When the connection is lost, `EventSource` reconnects on its own.
It gives up when the server responds with a status other than `200` or with another content type.


## Using a WebSocket {#websocket}

A WebSocket receives messages the same way. Unlike `EventSource`, it does not reconnect on its own, so the compiler opens a new socket when the old one closes:

```js
up.compiler('[data-stream]', function(element, { stream: url }) {
  let socket
  let closed = false

  function connect() {
    if (closed) return // mark: if (closed) return
    socket = new WebSocket(url)
    socket.addEventListener('message', function(event) {
      let fragment = up.fragment.get(event.data, { layer: element })
      if (fragment) up.reload(fragment)
    })
    socket.addEventListener('close', function() {
      setTimeout(connect, 2000) // mark: setTimeout(connect, 2000)
    })
  }

  connect()

  return function() {
    closed = true // mark: closed = true
    socket.close()
  }
})
```

The `closed` flag stops the compiler from reconnecting after the destructor closed the socket.

The element's URL can be relative, like `data-stream="/updates"`, or a full `wss://` URL.
The server sends the selector as one text message. The event's `data` property is that text.


## Using a client library {#libraries}

Many frameworks come with their own client for push messages. You call `up.reload()` from its message callback.

For example, in Rails you can use Action Cable. Define a channel that streams from a named broadcasting:

```ruby
class UpdatesChannel < ApplicationCable::Channel
  def subscribed
    stream_from 'updates'
  end
end
```

When the inbox changes, broadcast the selector, for example from a model callback:

```ruby
class Message < ApplicationRecord
  after_create_commit do
    ActionCable.server.broadcast('updates', '#inbox')
  end
end
```

On the client, name the channel in the `[data-stream]` attribute:

```html
<div data-stream="UpdatesChannel"></div>
```

A compiler subscribes to that channel:

```js
import { createConsumer } from '@rails/actioncable'

let consumer = createConsumer()

up.compiler('[data-stream]', function(element, { stream: channel }) {
  let subscription = consumer.subscriptions.create(channel, {
    received(selector) {
      let fragment = up.fragment.get(selector, { layer: element })
      if (fragment) up.reload(fragment) // mark: up.reload(fragment)
    }
  })
  return () => subscription.unsubscribe()
})
```

Action Cable reconnects on its own, and all subscriptions of a consumer share one WebSocket.
To send a signal to one user only, use `stream_for current_user` in the channel and `UpdatesChannel.broadcast_to(user, '#inbox')` on the server.
This needs `identified_by :current_user` in your `ApplicationCable::Connection`.

Other clients work the same way, for example Laravel Echo, Phoenix Channels, Socket.IO, SignalR or Pusher.
Call `up.reload()` from the client's message callback.


## Running the server {#server}

Every open page holds one connection to your server. Keep the following in mind:

- Servers that use one thread or process per request, like PHP-FPM or a classic WSGI server, can only hold a few open connections.
  Use a server or service that is built for many open connections.
  This can be your framework's own solution (Action Cable, Laravel Reverb, Django Channels, Phoenix), a hub that your app publishes to (Mercure, Centrifugo), or a hosted service (Pusher, Ably).
- Proxies and load balancers must allow long responses, and must not buffer event streams.
  For example, nginx by default closes a connection that sends nothing for 60 seconds, and buffers responses unless you send an `X-Accel-Buffering: no` header.
  To keep a quiet event stream open, send a comment line like `: ping` every 30 seconds.
- Over HTTP/1.1, a browser opens at most six connections to the same host, across all tabs.
  Each open `EventSource` uses one of them. Serve event streams over HTTP/2, which allows many more (usually 100).

@page real-time-updates
@keywords SSE, Turbo Streams
@menu-title Real-time updates
