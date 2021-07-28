URL patterns
============

Some Unpoly features like `a[up-alias]` let you match any URL with a given pattern.

For this matching Unpoly does *not* use regular expressions, but the URL pattern format outlined below.

\#\#\# Matching an exact URL

Pass any absolute path or fully qualified URL to only match this exact value:

```text
/users/new
```

\#\#\# Matching with wildcards

Append an asterisk (`*`) to any path to match all URLs with that prefix:

```text
/users/*
```

Prepend an asterisk to match all URLs with that suffix:

```text
*/edit
```

You may also infix an asterisk to match URLs with the given prefix and suffix:

```text
/admin/*/edit
```

\#\#\# Matching one of multiple alternatives

To match one of multiple URLs or patterns, separate the alternatives by a space.

The following will match either `/users/123` or `/account`:

```text
/users/* /account
```

JavaScript functions that take URL patterns will accept multiple patterns
as either a space-separated string or as an array of patterns:

```js
up.layer.open({ acceptLocation: '/users/* /account')
up.layer.open({ acceptLocation: ['/users/*', '/account'])
```

\#\#\# Excluding patterns

To exclude an URL or pattern, prefix with a minus.

The following will match `/users/alice` but not `/users/new`:

```text
/users/* -/users/new
```

\#\#\# Capturing named segments

It is sometimes useful to capture the value of a wildcard match, e.g. to
[close an overlay once a location is reached](/up.layer.open#options.acceptLocation).

The following will capture `{ name: 'alice' }` from the path `/users/alice`:

```text
/users/:name
```

To only match digits (`0-9`), use the dollar symbol:

```text
/users/:$id
```

@page url-patterns
