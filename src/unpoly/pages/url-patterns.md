URL patterns
============

Some Unpoly features let you match an URL using *URL patterns*. URL patterns are a powerful tool to define [overlay close conditions](/closing-overlays#close-conditions) or [adding aliases to navigation items](/up-alias).

This page describes the expression system Unpoly uses to match URL patterns. Please note that regular expressions ("regexes") are not supported. You must use the expression system described on this page.

## Matching an exact URL

Pass any absolute path or fully qualified URL to only match this exact value:

```text
/users/new
```

### Example

Let's look at a very simple use of an URL pattern, which matches one (and only one) specific URL:

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

The asterisk (`*`) matches one or many arbitrary characters:

```text
/users/*
```

In the above URL pattern, anything after `/users/` will be considered a match. For example, URLS like `/users/`, `/users/new`, `/users/123/edit`, etc. would all be considered a match for the URL pattern listed above.

You can put asterisks anywhere in an URL pattern (you and even use more than one asterisk in a single URL pattern). For instance, to match any URL that ends in `/new` you can use the URL pattern below:

```text
*/new
```

The above URL pattern will match `/users/new`, `/admin/123/new`, etc.

You may also place and asterisk in the middle of an URL pattern to match URLs with a given prefix and suffix:

```text
/users/*/edit
```

The above URL pattern will match `/users/123/edit`, `/users/David/edit`, `/users/123/name/edit/`, etc.

By putting the asterisk after `?` (the start of the querystring) you can match for urls with a querystring:

```text
/users/?*
```

The above URL pattern will match `/users/?sort=username`, `/users/?page=3` etc.

### Example

Here is an example of a URL pattern with a wildcard suffix:

```html
<!-- Closes the new overlay when user visits anything underneath "/users/" -->
<a href="/users/" up-accept-location="/users/*" up-layer="new">Users</a>
```

The same pattern can be used from JavaScript:

```js
up.layer.open({ acceptLocation: "/users/*" })
```

### Numeric-only wildcards

The dollar sign (`$`) will match any digit (`0-9`), or a series of digits:

```text
/users/$
```

The above URL pattern will match `/users/123`, `/users/123/edit`, but not `/users/new`.


## Matching one of multiple alternatives

To match one of multiple URL patterns, separate the URLs by a space character.

The URL pattern below will match either the `/users/123` or `/account` URLs:

```text
/users/* /account
```

### Examples

Here is an example of a URL pattern with alternatives:

```html
<!-- Closes layer when user visits either /account or anything underneath "/users/" -->
<a href="/users/" up-accept-location="/users/* /account" up-layer="new">Users</a>
```

JavaScript functions that URL patterns will accept multiple patterns
as either a space-separated string or as an array of patterns:

```js
up.layer.open({ acceptLocation: "/users/* /account" })
up.layer.open({ acceptLocation: ["/users/*", "/account"] })
```

## Excluding patterns from matching

To exclude an URL or pattern from matching, prefix the URL pattern with a minus (`-`) character.

The following URL pattern will match the URL `/users/123` but not `/users/456`:

```text
/users/* -/users/456
```

### Example

```html
<!-- Closes layer when user visits any URL beginning with "/users/", but not "/users/456" -->
<a href="/users/" up-accept-location="/users/* /users/456" up-layer="new">Users</a>
```

The same pattern can be used from JavaScript:

```js
up.layer.open({ acceptLocation: "/users/* /users/456" })
```

## Capturing named segments

Sometimes it's useful to capture the value of the wildcard that was matched.
For example, when closing an overlay [once a location is reached](/closing-overlays#location-condition),
you can use a part of the URL as the overlay's [result value](/closing-overlays#overlay-result-values).

To define a captured segment, prefix it with a `:` like this:

```text
/users/:name
```

### Example

The example below will keep an overlay until a user's detail page is reached (like `/users/foo`).
Then the user name from the URL (`foo`) becomes the overlay's [result value](/closing-overlays#overlay-result-values) as `{ name: 'foo' }`:

```html
<!-- Closes layer when user visits any URL beginning with "/users/" and captures the suffix as { name } -->
<a href="/users/"
  up-accept-location="/users/:name"
  up-layer="new"
  up-on-accepted="console.log(`Reached user ${value.name}`!)">
  Users
</a>
```

We can use the same pattern from JavaScript. Here we're using the `up.layer.ask()` function which opens an overlay
and returns a promise for its [result value](/closing-overlays#overlay-result-values):

```js
var { name } = await up.layer.ask({ acceptLocation: '/users/:name' });
```

### Capturing number segments

To define a captured segment consisting of digits only, prefix it with a `$` like this:

```text
/users/$id
```

The above URL pattern will match `/users/123` as `{ id: 123 }`. It will not match `/users/new`.





@page url-patterns
