> [note]
> Request headers that influenced a response should be listed in a `Vary` response header.
> This tells Unpoly to [partition its cache](/caching#caching-optimized-responses) for that URL so that each
> request header value gets a separate cache entries.

@partial vary-header-note
