URL patterns
============

Some Unpoly features let you match a URL using *URL patterns*. You can use them to define [overlay close conditions](/subinteractions#close-conditions), or when [adding aliases to navigation items](/up-alias).

This page describes the syntax of URL patterns. URL patterns are not regular expressions.

## Matching an exact URL

Pass any absolute path or fully qualified URL to only match this exact value:

```text
/users/new
```

### Example

This pattern matches one specific URL:

```html
<!-- Closes the new overlay when user visits "/users/new" -->
<a href="/users/" up-layer="new" up-accept-location="/users/new">Users</a>
```

The same pattern can be used from JavaScript:

```js
/* Closes the new overlay when user visits "/users/new" */
up.layer.open({ acceptLocation: "/users/new" })
```

## Matching with wildcards

The asterisk (`*`) matches zero or more arbitrary characters:

```text
/users/*
```

This pattern matches anything after `/users/`, like `/users/`, `/users/new` or `/users/123/edit`.

You can put asterisks anywhere in a URL pattern, and use more than one. To match any URL that ends in `/new`:

```text
*/new
```

This pattern matches `/users/new` or `/admin/123/new`.

An asterisk in the middle of a URL pattern matches URLs with a given prefix and suffix:

```text
/users/*/edit
```

This pattern matches `/users/123/edit`, `/users/David/edit` or `/users/123/name/edit/`.

An asterisk after `?` (the start of the query string) matches URLs with a query string:

```text
/users/?*
```

This pattern matches `/users/?sort=username` or `/users/?page=3`.

### Example

A URL pattern with a wildcard suffix:

```html
<!-- Closes the new overlay when user visits anything underneath "/users/" -->
<a href="/users/" up-accept-location="/users/*" up-layer="new">Users</a>
```

The same pattern can be used from JavaScript:

```js
up.layer.open({ acceptLocation: "/users/*" })
```

### Numeric-only wildcards

A dollar sign (`$`) followed by a name matches one or more digits (`0-9`):

```text
/users/$id
```

This pattern matches `/users/123`, but not `/users/new` or `/users/123/edit`.
The value is also captured, see [Capturing number segments](#capturing-number-segments) below.

To also match URLs underneath, append a wildcard:

```text
/users/$id/*
```

This pattern matches `/users/123/edit`.


## Matching one of multiple alternatives

To match one of multiple URL patterns, separate them with a space or comma.

The URL pattern below matches both `/users/123` and `/account`:

```text
/users/*, /account
```

### Examples

A URL pattern with alternatives:

```html
<!-- Closes layer when user visits either /account or anything underneath "/users/" -->
<a href="/users/" up-accept-location="/users/* /account" up-layer="new">Users</a>
```

JavaScript functions that take URL patterns accept multiple patterns
as either a space-separated string, a comma-separated string or as an array of patterns:

```js
up.layer.open({ url: '/users', acceptLocation: "/users/* /account" })
up.layer.open({ url: '/users', acceptLocation: "/users/*, /account" })
up.layer.open({ url: '/users', acceptLocation: ["/users/*", "/account"] })
```

## Excluding patterns from matching

To exclude a URL or pattern from matching, prefix the URL pattern with a minus (`-`) character.

The following URL pattern matches `/users/123`, but not `/users/456`:

```text
/users/* -/users/456
```

### Example

```html
<!-- Closes layer when user visits any URL beginning with "/users/", but not "/users/456" -->
<a href="/users/" up-accept-location="/users/* -/users/456" up-layer="new">Users</a>
```

The same pattern can be used from JavaScript:

```js
up.layer.open({ acceptLocation: "/users/* -/users/456" })
```

## Capturing named segments

You can capture the value that a wildcard matched.
For example, when closing an overlay [once a location is reached](/subinteractions#location-condition),
you can use a part of the URL as the overlay's [acceptance value](/closing-overlays#acceptance-values).

To define a captured segment, prefix it with a `:` like this:

```text
/users/:name
```

### Example

The example below keeps an overlay open until it reaches a user's detail page (like `/users/foo`).
Then the user name from the URL (`foo`) becomes the overlay's [acceptance value](/closing-overlays#acceptance-values) as `{ name: 'foo' }`:

```html
<!-- Closes layer when user visits any URL beginning with "/users/" and captures the suffix as { name } -->
<a href="/users/"
  up-accept-location="/users/:name"
  up-layer="new"
  up-on-accepted="console.log(`Reached user ${value.name}!`)">
  Users
</a>
```

The same pattern works from JavaScript. `up.layer.ask()` opens an overlay
and returns a promise for its [acceptance value](/closing-overlays#acceptance-values):

```js
let { name } = await up.layer.ask({
  url: '/users',
  acceptLocation: '/users/:name'
});
```

### Capturing number segments

To define a captured segment consisting of digits only, prefix it with a `$` like this:

```text
/users/$id
```

This pattern matches `/users/123` and captures `{ id: 123 }`. It does not match `/users/new`.


@page url-patterns
