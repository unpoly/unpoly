> [note]
> When the server modifies its response given a request header, it should
> echo that request header in a [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)
> response header. This informs a client to store the response in a separate cache entry.

@partial vary-header-note
