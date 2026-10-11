Push updates
============

You can update fragments when the server pushes a change, for example to show a new chat
message or the progress of a background job. Unpoly has no built-in push channel, but a short
[compiler](/up.compiler) connects an element to
[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) or a
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), and renders what arrives.

> [tip]
> If a delay of a few seconds is fine, [polling](/polling) is simpler. It needs no persistent
> connection and works with every server and proxy.


## Pushing a signal, reloading the HTML {#signal}

The simplest setup sends no HTML over the connection. The server only announces that something
changed, and Unpoly reloads the fragment with a regular request:

```html
<div data-changes="/inbox/changes"> <!-- mark: data-changes -->
  <div id="inbox">...</div>
</div>
```

```js
up.compiler('[data-changes]', function(element) {
  let source = new EventSource(element.dataset.changes)
  source.addEventListener('message', () => up.reload(element.firstElementChild)) // mark: element.firstElementChild
  return () => source.close() // mark: source.close()
})
```

The server sends a message whenever the inbox changes. Its content does not matter.
A message ends with a blank line:

```text
data: changed

```

`up.reload()` requests the URL the `#inbox` fragment was loaded from and swaps it like a [poll](/polling) would.
Your server keeps rendering HTML the way it already does, including its layout and authorization checks.
It can even answer with `304 Not Modified` when nothing changed for this user (see [[conditional-requests]]).

The compiler returns a [destructor](/up.destructor) that closes the connection when the element
leaves the page, e.g. when the user navigates away. This is also why the compiler reloads the
element's child, not the element itself. Reloading the connected element would replace it,
closing the connection and opening a new one with every message.


## Pushing HTML {#html}

To save the extra request, send the new HTML with the message:

```js
up.compiler('[data-stream]', function(element) {
  let source = new EventSource(element.dataset.stream)

  source.addEventListener('message', function(event) {
    up.render({ fragment: event.data, origin: element, abort: false }) // mark: fragment: event.data
  })

  return () => source.close()
})
```

Each message carries one element with an ID. Unpoly finds the element with the same ID on the
page and swaps it:

```text
data: <span id="unread-count">3 new messages</span>

```

To update several elements, send one message for each element.

New content is [compiled](/enhancing-elements) like any other fragment. The options do the following:

`{ origin: element }`
: Renders in the [layer](/layer-option) of the connected element, even while an overlay is open.

`{ abort: false }`
: Keeps the user's own pending requests for the same fragment. By default a render
  [aborts](/aborting-requests) them.

When the page has no element with the message's ID, `up.render()` rejects with an `up.CannotMatch` error,
which appears in the browser console. If that is expected, e.g. because your connection lives in the
layout and not every page shows an unread count, ignore it with `.catch(() => {})`.

> [note]
> A message's `data:` field ends at a line break. To send HTML that spans several lines,
> prefix each line with `data: `. The browser joins them with line breaks.

> [important]
> The server renders a pushed message once and sends it to every connected user.
> Don't push HTML that differs per user, like an *Edit* button that only the author sees.
> Push a [signal](#signal) instead, so each user reloads HTML rendered for them.


### Appending instead of swapping {#appending}

To add new items to a list, append the message's children to the list with an
[`:after` target](/targeting-fragments#appending-or-prepending):

```js
up.render({ target: '#messages:after', document: event.data, origin: element, abort: false })
```

```text
data: <div id="messages"><p>Hi there!</p></div>

```


### Progress and streamed text {#events}

A message with an `event:` name only reaches listeners for that name. Use these for data that
is not HTML, like the progress of a background job:

```text
event: progress
data: 75

```

```js
source.addEventListener('progress', function(event) {
  element.querySelector('progress').value = event.data
})
```

To stream text into an element as it is generated, e.g. an answer from a language model,
append each message as text. When the text is complete, the server sends the final HTML in a
`done` event:

```js
up.compiler('[data-answer]', function(element) {
  let source = new EventSource(element.dataset.answer)

  source.addEventListener('message', (event) => element.append(event.data))

  source.addEventListener('done', function(event) {
    up.render({ fragment: event.data, origin: element, abort: false }) // mark: 'done'
  })

  return () => source.close()
})
```

```text
data: Hello

data:  world

event: done
data: <div id="answer">Hello <b>world</b></div>

```

The final HTML has no `[data-answer]` attribute. It replaces the element, which closes the
connection. This matters because `EventSource` reconnects when the server ends a response,
and the stream would start over.


## Using a WebSocket {#websocket}

A WebSocket receives messages the same way. Unlike `EventSource`, it does not reconnect on its own:

```js
up.compiler('[data-socket]', function(element) {
  let socket
  let destroyed = false

  function connect() {
    if (destroyed) return // mark: if (destroyed) return
    socket = new WebSocket(element.dataset.socket)
    socket.addEventListener('message', function(event) {
      up.render({ target: '#messages:after', document: event.data, origin: element, abort: false })
    })
    socket.addEventListener('close', () => setTimeout(connect, 2000)) // mark: setTimeout(connect, 2000)
  }

  connect()

  return function() {
    destroyed = true
    socket.close()
  }
})
```

The `destroyed` check stops a reconnect that is still waiting when the element leaves the page.

To send something to the server, keep using regular forms. Your server already handles their
validation and errors, and the response renders with all of Unpoly's features. In a chat,
the form posts the message over HTTP, and the server broadcasts it over the socket to every
participant, the sender included:

```html
<div data-socket="/chat/socket">
  <div id="messages">...</div>

  <form method="post" action="/chat/messages" up-submit up-target="form">
    <input name="text">
    <button>Send</button>
  </form>
</div>
```

If your backend has its own client for WebSocket channels, like Rails' Action Cable, call
`up.render()` from its callback for received messages. It works the same way.


## Things to watch {#caveats}

Don't replace the connected element
: If a pushed fragment or a navigation swaps the element with the connection, its destructor
  closes the connection and the new element opens a new one. Put the attribute on a container that
  stays in place, like your layout. Inside a fragment that the user navigates, you can also give it an
  [`[up-keep]`](/preserving-elements) attribute. A kept element keeps its connection, but it also keeps
  its children, so it should not contain content that navigation needs to update.

Reconnecting
: `EventSource` reconnects after a lost connection. The server sets the delay with a `retry:` field.
  When messages have an `id:` field, the browser sends the last ID in a `Last-Event-ID` request header,
  so the server can send the messages that were missed. To stop the browser from reconnecting, the server
  can respond with `204 No Content`. A WebSocket needs the reconnect code shown [above](#websocket).

Hidden tabs
: A connection stays open while the tab is in the background. To save server resources,
  close it on [`visibilitychange`](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)
  and reconnect when the tab is visible again, then [reload](#signal) to catch up.

Authentication
: The browser sends your session cookies with an `EventSource` or WebSocket to the same origin,
  so your server can authorize the stream like any other request. Check that a user may see what
  the stream sends. A WebSocket handshake is not limited to your own origin, so check its `Origin` header.

Connections per browser
: Over HTTP/1.1, a browser opens at most six connections to the same host, across all tabs.
  Each open `EventSource` uses one, so a few tabs can block all other requests to your site.
  Serve event streams over HTTP/2, which does not have this limit.

Proxies and servers
: Each open connection holds a request on your server. Check that your server, load balancer and
  proxies allow long-running responses, and that they don't buffer event streams.


@page push-updates
