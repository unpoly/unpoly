/*-
@module up.protocol
*/

up.migrate.clearCacheFromXHR = function(xhr) {
  let value = xhr.getResponseHeader('X-Up-Clear-Cache')

  if (value) {
    up.migrate.deprecated('X-Up-Clear-Cache', 'X-Up-Expire-Cache')

    if (value === 'false') {
      return false
    } else {
      return value
    }
  }
}

/*-
The server may send this optional response header to control which previously cached responses should be [expired](/caching#expiration) after this response.

The value of this header is a [URL pattern](/url-patterns) matching responses that should be expired.

For example, to expire all responses to URLs starting with `/notes/`:

```http
X-Up-Clear-Cache: /notes/*
```

### Overriding the client-side default

If the server does not send an `X-Up-Clear-Cache` header, Unpoly will [expire the entire cache](/up.network.config#config.expireCache) after a non-GET request.

You may force Unpoly to keep the cache fresh after a non-GET request:

```http
X-Up-Clear-Cache: false
```

@header X-Up-Clear-Cache
@deprecated
  Use `X-Up-Expire-Cache` instead.
*/


/*-
This request header contains a timestamp of an existing fragment that is being [reloaded](/up.reload).

The timestamp must be explicitly set by the user as an `[up-time]` attribute on the fragment.
It should indicate the time when the fragment's underlying data was last changed.

See `[up-time]` for a detailed example.

### Format

The time is encoded is the number of seconds elapsed since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time).

For instance, a modification date of December 23th, 1:40:18 PM UTC would produce the following header:

```http
X-Up-Target: .unread-count
X-Up-Reload-From-Time: 1608730818
```

If no timestamp is known, Unpoly will send a value of zero (`X-Up-Reload-From-Time: 0`).

@header X-Up-Reload-From-Time
@deprecated
  Use the standard [`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) header instead.
@stable
*/
