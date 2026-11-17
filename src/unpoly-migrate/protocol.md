# up.protocol

@namespace up.protocol

-----

# X-Up-Clear-Cache

The server may send this optional response header to control which previously cached responses should be [expired](/learn/caching#expiration) after this response.

The value of this header is a [URL pattern](/api/url-patterns) matching responses that should be expired.

For example, to expire all responses to URLs starting with `/notes/`:

```http
X-Up-Clear-Cache: /notes/*
```

@header X-Up-Clear-Cache
@deprecated
  Use `X-Up-Expire-Cache` instead.

-----

# X-Up-Reload-From-Time

This request header contains a timestamp of an existing fragment that is being [reloaded](/api/up.reload).

The timestamp must be explicitly set by the user as an `[up-time]` attribute on the fragment.
It should indicate the time when the fragment's underlying data was last changed.

See `[up-time]` for a detailed example.

### Format

The time is encoded as the number of seconds elapsed since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time).

For instance, a modification date of December 23rd 2020, 1:40:18 PM UTC would produce the following header:

```http
X-Up-Target: .unread-count
X-Up-Reload-From-Time: 1608730818
```

If no timestamp is known, Unpoly will send a value of zero (`X-Up-Reload-From-Time: 0`).

@header X-Up-Reload-From-Time
@deprecated
  Read the standard [`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since) request header instead.
  Unpoly sends it when the fragment has a `Last-Modified` time. See [conditional requests](/learn/conditional-requests).
