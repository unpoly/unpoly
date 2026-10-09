Backend integration
===================

Unpoly works with any backend that renders HTML. Requests from Unpoly look like regular browser requests,
and the server answers with full pages, using the routes and templates it already has.
Optional HTTP headers let the server shorten its responses, skip unchanged content, or steer the frontend.


Plain HTTP by default
---------------------

When the user follows a link that targets a fragment, Unpoly makes a request
that any web framework can handle without a plugin:

```http
GET /users/5 HTTP/1.1
X-Up-Version: [[=version]]
X-Up-Target: .profile
```

The server renders the page for `/users/5` the same way it would for a full page load.
Unpoly extracts the `.profile` element from the response and discards the rest.

There is no JSON API to build and no separate fragment endpoint to maintain.
Forms work the same way, with one convention: respond to an invalid submission with an error status like `422`,
so Unpoly knows to re-render the form instead of the success target.
See [[submitting-forms#validation]].

The `X-Up-*` headers above are the start of an optional protocol. A server that ignores them
gets a working app. A server that reads them can do less work, as the sections below show.


Rendering only what is targeted
-------------------------------

The `X-Up-Target` request header names the fragment that Unpoly will render.
A server can skip the rest of the page and respond with only that element.
A `Vary` header then tells Unpoly that the response is specific to the target:

```http
HTTP/1.1 200 OK
Vary: X-Up-Target

<div class="profile">...</div>
```

Other headers tell the server which layer is updating, so an overlay can get a page without site navigation,
and whether the request comes from Unpoly at all.

<p class="read-more"><a href="/optimizing-responses">Read more: Optimizing responses</a></p>


Skipping unchanged content
--------------------------

Unpoly reloads fragments when [polling](/polling), [revalidating the cache](/caching#revalidation) or calling `up.reload()`.
When the first response carried an `ETag`, Unpoly sends it back with the reload:

```http
GET /messages HTTP/1.1
If-None-Match: "x234dff"
```

When nothing changed, the server can answer with an empty `304 Not Modified`
and Unpoly finishes the render pass without changes.
The exchange then costs about 1 KB and no rendering time.

<p class="read-more"><a href="/conditional-requests">Read more: Conditional requests</a></p>


Reacting to new deployments
---------------------------

Since Unpoly never makes a full page load, users keep running the JavaScript and CSS they loaded
when they opened the page. When a response contains scripts or stylesheets that differ from the current page,
Unpoly emits an `up:assets:changed` event:

```js
up.on('up:assets:changed', function() {
  // Show a banner offering to reload
})
```

You decide how to react: notify the user, reload at the next navigation, or swap in the new stylesheets.

<p class="read-more"><a href="/handling-asset-changes">Read more: Reacting to new deployments</a></p>


Steering the frontend from the server
-------------------------------------

Response headers let the server change what Unpoly does with a response.
It can emit events on the client, update the document title, or close an overlay with a result value
instead of rendering anything:

```http
HTTP/1.1 200 OK
X-Up-Accept-Layer: { "id": 5012 }
X-Up-Events: [{ "type": "user:created" }]
```

The full set of headers is small, and you only implement what you use.
Libraries for many languages and frameworks wrap it in helpers.
See [[protocol-implementations]].

<p class="read-more"><a href="/server-bindings">Read more: Optional server bindings</a></p>

@page backend-integration
@menu-title Overview
@signature
