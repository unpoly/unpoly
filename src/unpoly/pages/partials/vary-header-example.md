The user makes a request to `/sitemap` in order to updates a fragment `.menu`.
Unpoly makes a request like this:

```http
GET /sitemap HTTP/1.1
X-Up-Target: .menu
```

The server may choose to [optimize its response](/optimizing-responses) by only render only the HTML for
the `.menu` fragment. It responds with the HTTP seen below. Note that it includes a `Vary` header
indicating that the `X-Up-Target` header has influenced the response body:

```http
Vary: X-Up-Target

<div class="menu">...</div>
```

After observing the `Vary: X-Up-Target` header, Unpoly will partition cache entries to `/sitemap` by `X-Up-Target` value.
That means a request targeting `.menu` is no longer a cache hit for a request targeting a different selector.

@partial vary-header-example
