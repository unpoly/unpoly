# up.link

@namespace up.link

-----

# [up-dash]

[Follows](/api/up.follow) this link as fast as possible.

This is done by:

- [Following the link](/api/up-follow) without a full page load
- [Preloading the link's destination URL](/learn/preloading)
- [Triggering the link on `mousedown`](/api/up-instant) instead of on `click`

## Example

Use `[up-dash]` like this:

    <a href="/users" up-dash=".main">User list</a>

This is shorthand for:

    <a href="/users" up-target=".main" up-instant up-preload>User list</a>

@selector [up-dash]
@param [up-dash='body']
  The CSS selector to replace

  Inside the CSS selector you may refer to this link as `:origin`.
@deprecated
  To accelerate all links use `up.link.config.instantSelectors` and `up.link.config.preloadSelectors`.

-----

# [up-href]

Makes any element [behave like a hyperlink](/learn/faux-interactive-elements).

## Example

The following `<span>` element will [navigate](/api/up-follow) to `/details` when clicked:

```html
<span up-href="/details">Read more</span>
```

@selector [up-href]
@param [up-href]
  The URL to load when activated.
@params-note
  All modifying attributes for `[up-follow]` may also be used.
@deprecated
  Following an element with only an `[up-href]` attribute is deprecated.
  Also set an `[up-follow]` attribute on the same element.
