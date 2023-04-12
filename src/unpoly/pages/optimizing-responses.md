Optimizing responses
====================

Servers may inspect [request headers](/up.protocol) to customize or shorten responses,
e.g. by [omitting content that isn't targeted](#omitting-content-that-isnt-targeted)
or by [rendering different content for overlays](#rendering-different-content-for-overlays).



## Omitting content that isn't targeted

Unpoly transmits the [targeted selector](/targeting-fragments) in an `X-Up-Target` request header.

Server-side code may shorten its response by only rendering HTML
that matches the target selector. For example, you might prefer to not render an
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


@page optimizing-responses
