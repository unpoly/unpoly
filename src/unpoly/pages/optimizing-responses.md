Optimizing responses
====================

Servers may inspect [request headers](/up.protocol) to customize or shorten responses,
e.g. by [omitting content that isn't targeted](#omitting-content-that-isnt-targeted)
or by [rendering different content for overlays](#rendering-different-content-for-overlays).



## Omitting content that isn't targeted

Unpoly transmits the [targeted selector](/targeting-fragments) in an `X-Up-Target` request header.

Server-side code may shorten its response by only rendering HTML
that matches the target selector. For example, you might prefer not to render an
expensive sidebar if the sidebar is not targeted.

Doing this is **fully optional**. The server is free to send redundant elements or full HTML documents.
Only the [targeted fragment](/targeting-fragments) will be updated on the page.
Other elements from the response will be discarded.

### Example

The user makes a request to `/sitemap` in order to updates a fragment `.menu`.
Unpoly makes a request like this:

```http
GET /sitemap HTTP/1.1
X-Up-Target: .menu
```

The server may choose to [optimize its response](/optimizing-responses) by only render only the HTML for
the `.menu` fragment. It responds with the following HTTP:

```http
Vary: X-Up-Target

<div class="menu">...</div>
```

@include vary-header-note


## Rendering different content for overlays

This request header contains the targeted layer's [mode](/up.layer.mode) in an `X-Up-Mode` request header.

Server-side code is free to render different HTML for different modes.
For example, you might prefer to not render a site navigation for overlays.

```http
X-Up-Mode: drawer
X-Up-Target: main
```

The server chooses to render only the HTML required for the overlay.
It responds with the following HTTP:

```http
Vary: X-Up-Mode

<main>...</main>
```


## Rendering different content for Unpoly requests

When Unpoly updates a fragment, it always includes an `X-Up-Version` header.

Server-side code may check for the presence of an `X-Up-Version` header to
distinguish [fragment updates](/up.link) from full page loads.

### Example

The user updates a fragment. Unpoly automatically includes the following request header:

  ```http
X-Up-Version: 1.0.0
```

The server chooses to render different HTML to Unpoly requests, e.g. by excluding the document `<head>`
and only rendering the `<body>`. The server responds with the folowing HTTP:

```http
Vary: X-Up-Version

<body>
  ...
</body>
```


## Rendering content that depends on layer context

[Layer context](/context) is an object that exists for the lifetime of a layer.

You may use this to [re-use existing interactions in an overlay](/context#reuse-interaction-with-variation),
bit with a variation like a different page title.


Caching optimized responses {#vary}
---------------------------

Servers may inspect [request headers](/up.protocol) to [optimize responses](/optimizing-responses),
e.g. by omitting a navigation bar that is not targeted.

Request headers that influenced a response should be listed in a `Vary` response header.
This tells Unpoly to partition its cache for that URL so that each
request header value gets a separate cache entry.

### Example

@include vary-header-example


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
