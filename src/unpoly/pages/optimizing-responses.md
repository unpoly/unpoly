Optimizing responses
====================

Your server can shorten or customize its responses by reading the request headers that Unpoly sends,
like the targeted selector or the mode of the updating layer.
This is optional: Unpoly only takes the targeted fragment from any response and discards the rest,
so a full HTML page is always a valid answer.


Rendering only the targeted fragment {#target}
------------------------------------

Unpoly sends the [target selector](/targeting-fragments) in an `X-Up-Target` request header.
When a link targets a `.menu` element, the server sees a request like this:

```http
GET /sitemap HTTP/1.1
X-Up-Target: .menu
```

The server may answer with a full page and let Unpoly pick out the `.menu` element.
Or it may skip the rest of the page and render only what was asked for.
A response that was tailored to the target must list the header in a `Vary` header,
so the [cache](#vary) does not reuse it for other targets:

```http
HTTP/1.1 200 OK
Vary: X-Up-Target

<div class="menu">...</div>
```

A typical use is to skip expensive parts of the layout, like a sidebar or a navigation bar,
when they are not part of the target.

A request may target [multiple fragments](/targeting-fragments#multiple).
The header then lists all selectors, separated by commas, and the response should contain an element for each:

```http
X-Up-Target: .menu, .flashes
```

A request made without a target, like a plain `up.request('/sitemap')` call, has no `X-Up-Target` header.
Treat a missing header as a request for the full page.


### Setting the title without a `<head>` {#title}

A shortened response usually has no `<head>` and therefore no `<title>`.
To still update the document title, send it as an `X-Up-Title` response header,
encoded as a [relaxed JSON](/relaxed-json) string:

```http
HTTP/1.1 200 OK
Vary: X-Up-Target
X-Up-Title: "Sitemap"

<div class="menu">...</div>
```


### Failed responses target a different fragment {#fail-target}

When the server responds with an error code, Unpoly renders a [different target](/failed-responses#fail-options).
Form submissions use this to update the `<form>` with validation errors instead of the success target.
The fail target is sent as a separate `X-Up-Fail-Target` header:

```http
POST /users HTTP/1.1
X-Up-Target: .content
X-Up-Fail-Target: #signup-form
```

A server that optimizes its responses should render for `X-Up-Target` on success,
and for `X-Up-Fail-Target` when it responds with an error status like `422`.


Rendering different content for overlays {#mode}
----------------------------------------

Unpoly sends the [mode](/up.layer.mode) of the updating layer in an `X-Up-Mode` request header.
A link that opens a drawer overlay produces a request like this:

```http
GET /users/5 HTTP/1.1
X-Up-Mode: drawer
X-Up-Target: main
```

The server may render a leaner version for overlays, e.g. without the site navigation.
As before, the `Vary` header tells Unpoly that the response depends on the mode:

```http
HTTP/1.1 200 OK
Vary: X-Up-Mode

<main>...</main>
```

For the root layer the header is `X-Up-Mode: root`.
When a failed response may render into a different layer,
its mode is sent as `X-Up-Fail-Mode`.


Rendering different content for Unpoly requests {#version}
-----------------------------------------------

Every request made through Unpoly carries an `X-Up-Version` header with the frontend's version:

```http
X-Up-Version: [[=version]]
```

Server code can check for the header to tell fragment updates from full page loads,
e.g. to render only the `<body>` for Unpoly:

```http
HTTP/1.1 200 OK
Vary: X-Up-Version

<body>
  ...
</body>
```

Prefer `X-Up-Target` when you only want to omit untargeted content.
`X-Up-Version` is for differences that apply to *all* Unpoly requests.


Rendering content that depends on layer context {#context}
-----------------------------------------------

A layer can carry a [context](/context) object, e.g. to reuse a screen in an overlay
with a different heading. Unpoly sends it as JSON in an `X-Up-Context` request header:

```http
X-Up-Context: { "title": "Choose a company contact" }
X-Up-Target: main
```

A response that depends on the context lists it in its `Vary` header. See [[context]] for the full exchange.


Caching optimized responses {#vary}
---------------------------

Unpoly [caches](/caching) responses and reuses them for later requests to the same URL.
A response that was tailored to a request header must not be reused for a request with a different header value:
a response that only contains `.menu` cannot serve a request for `.sidebar`.

Request headers that influenced a response should therefore be listed in a `Vary` response header.
This tells Unpoly to partition its cache for that URL, so that each header value gets a separate cache entry:

```http
HTTP/1.1 200 OK
Vary: X-Up-Target, X-Up-Mode

<div class="menu">...</div>
```

After seeing `Vary: X-Up-Target`, a cached response for `.menu` is no longer a cache hit for a request targeting a different selector.

You can set the `Vary` header from your own server code.
Many [protocol implementations](/protocol-implementations) set it for you once you read a header.


### How cache entries are matched {#cache-matching}

By default cached responses will match all requests to the same URL.

When a response has a `Vary` header, matching requests must additionally have the same values for all listed headers:

<table>
  <tr>
    <th class="split-table-head">
    </th>
    <th>
      🠦 <code>X-Up-Target: .foo</code><br>
      🠤 <code>Vary: X-Up-Target</code>
    </th>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .foo</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .bar</code></th>
    <td>❌ cache miss</td>
  </tr>
  <tr>
    <th>🠦 <i>No <code autolink="false">X-Up-Target</code></i></th>
    <td>❌ cache miss</td>
  </tr>
</table>


When a response has *no* `Vary` header, that response is a cache hit for <i>all</i> requests to the URL, regardless of target:

<table>
  <tr>
    <th class="split-table-head">
    </th>
    <th>
      🠦 <code>X-Up-Target: .foo</code><br>
      🠤 <i>No <code autolink="false">Vary</code></i>
    </th>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .foo</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .bar</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th>🠦 <i>No <code autolink="false">X-Up-Target</code></i></th>
    <td>✔️ cache hit</td>
  </tr>
</table>


Requests can [target multiple fragments](/targeting-fragments#multiple) by separating selectors
with a comma. If the server replies with `Vary: X-Up-Target`, that response is a cache hit for each individual selector:

<table>
  <tr>
    <th class="split-table-head">
    </th>
    <th>
      🠦 <code>X-Up-Target: .foo, .bar</code><br>
      🠤 <code>Vary: X-Up-Target</code>
    </th>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .foo</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .bar</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .foo, .bar</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .bar, .foo</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .baz</code></th>
    <td>❌ cache miss</td>
  </tr>
  <tr>
    <th>🠦 <code>X-Up-Target: .foo, .baz</code></th>
    <td>❌ cache miss</td>
  </tr>
  <tr>
    <th>🠦 <i>No <code autolink="false">X-Up-Target</code></i></th>
    <td>❌ cache miss</td>
  </tr>
</table>


@page optimizing-responses
