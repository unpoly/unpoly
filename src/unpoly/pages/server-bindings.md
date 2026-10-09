Optional server bindings
========================

Your backend can inspect and manipulate Unpoly's rendering through plain HTTP headers:
request headers tell the server what Unpoly is about to render,
and response headers let the server change what happens on the client.
This exchange is the [server protocol](/up.protocol). None of it is required, and you can implement only the parts you need.

Libraries that implement the protocol exist for many languages and frameworks. See [[protocol-implementations]].


What the server can read {#request-headers}
------------------------

Every request that Unpoly makes carries headers describing its purpose.
For a link that updates a `.menu` element in a drawer overlay, the server sees:

```http
GET /sitemap HTTP/1.1
X-Up-Version: [[=version]]
X-Up-Target: .menu
X-Up-Mode: drawer
```

**The frontend's version** arrives in `X-Up-Version`. Its presence alone tells an Unpoly request
from a full page load.

**The targeted fragment** arrives as a CSS selector in `X-Up-Target`.
A server can [render only that fragment](/optimizing-responses#target) and skip the rest of the page.
When the server responds with an error status, Unpoly renders a different target,
which is sent as `X-Up-Fail-Target`.

**The targeted layer** is described by `X-Up-Mode`, the [mode](/up.layer.mode) of the layer being updated,
and `X-Up-Fail-Mode` for failed responses. `X-Up-Origin-Mode` names the layer of the link or form that made the request,
in case it targets another layer. A server may [render leaner pages for overlays](/optimizing-responses#mode).

**The layer's context** arrives as JSON in `X-Up-Context` (and `X-Up-Fail-Context`),
so a server can [vary a reused screen](/context#reuse-interaction-with-variation) by the data a layer was opened with.

**Validation requests** carry the names of the fields being validated in `X-Up-Validate`.
The server is expected to validate the submission without saving it and to render the form again,
as described in [[validation]].

**The known version of a reloaded fragment** arrives as `If-None-Match` or `If-Modified-Since`,
so the server can answer with an empty `304 Not Modified` when nothing changed. See [[conditional-requests]].

A response that depends on any of these headers should name them in a `Vary` header,
so that Unpoly [partitions its cache](/optimizing-responses#vary) by their values.


What the server can send {#response-headers}
------------------------

Response headers let the server override what Unpoly would do with the response.
All of them are optional. Without them, Unpoly renders the targeted fragment from the response body.

**Changing the target.** An `X-Up-Target` response header replaces the selector that Unpoly will render.
The value `:none` finishes the render pass [without changes](/conditional-requests#rendering-nothing):

```http
HTTP/1.1 200 OK
X-Up-Target: .flashes

<div class="flashes">Your changes were saved.</div>
```

**Setting the document title.** When a [shortened response](/optimizing-responses#title) has no `<title>`,
an `X-Up-Title` header sets it. The value is a [relaxed JSON](/relaxed-json) string.

**Correcting the browser location.** After a redirect, Unpoly uses the final URL for the browser's address bar.
It cannot see a change of the HTTP method, e.g. when `POST /users` redirects to `GET /users`.
Send `X-Up-Location` and `X-Up-Method` to make the final URL and method explicit:

```http
HTTP/1.1 200 OK
X-Up-Location: /users
X-Up-Method: GET
```

**Emitting events on the client.** `X-Up-Events` takes a relaxed JSON array of event objects.
Each object's `type` becomes the event type, other properties become properties of the event:

```http
HTTP/1.1 200 OK
X-Up-Events: [{ type: 'user:created', id: 5012 }]
```

**Closing or opening overlays.** `X-Up-Accept-Layer` and `X-Up-Dismiss-Layer` [close the targeted overlay](/closing-overlays#from-server)
with the given result value, instead of rendering the response. `X-Up-Open-Layer` renders the response
in a new overlay. See [[subinteractions]] for the pattern these headers enable.

**Updating the layer context.** An `X-Up-Context` response header carries the changed keys.
See [Changing context from the server](/context#server-updates).

**Controlling the cache.** After a request that changed data on the server, Unpoly expires its entire cache.
`X-Up-Expire-Cache` and `X-Up-Evict-Cache` narrow this to a [URL pattern](/url-patterns), or disable it with `false`:

```http
HTTP/1.1 200 OK
X-Up-Expire-Cache: /notes/*
```

**Versioning content.** An `ETag` or `Last-Modified` header lets the server answer later reloads with `304 Not Modified`.
See [[conditional-requests]].

The [`up.protocol`](/up.protocol) reference lists every header with its exact format.


Other conventions {#conventions}
-----------------

A few parts of the protocol are not headers:

- Unpoly sends a [CSRF token](/up.protocol.config#config.csrfToken) with unsafe requests, read from a `<meta name="csrf-token">` tag.
  The header name defaults to `X-CSRF-Token` and is configured in `up.protocol.config.csrfHeader`.
- When Unpoly makes a full page load with a method other than `GET` or `POST`,
  it sends a `POST` with the original method in a `_method` [parameter](/up.protocol.config#config.methodParam).
- A server can set a [`_up_method` cookie](/_up_method) to tell Unpoly the method of the initial page load.
  This lets Unpoly handle pages that were loaded with a `POST` request.

A protocol implementation for your framework typically wraps all of this in helpers,
sets the `Vary` header when you read a request header, and handles the `_up_method` cookie for you.
See [[protocol-implementations]] for the list.

@page server-bindings
