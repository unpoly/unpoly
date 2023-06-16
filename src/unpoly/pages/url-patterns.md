URL patterns
============

Certain Unpoly features like `a[up-alias]`, `a[up-accept]`, etc. will enable you match an URL with a given expression pattern. In Unpoly, these matching expressions are called `URL patterns`. URL patterns are a very powerful tool when closing layers, adding aliases to pages, and in many other situations.

This page describes the expression system Unpoly uses to match URL patterns. Please note that regular expressions (i.e., regexes) are not supported. You must use the expression system described on this page.

### Matching an exact URL

Pass any absolute path or fully qualified URL to only match this exact value:

```text
/users/new
```

#### Examples

First, let's look at a very simple use of an URL pattern, which matches one (and only one) specific URL.

```html
<!-- HTML
Closes the new layer when user visits "/users/new" -->
<a href="/users/" up-layer="new" up-accept-location="/users/new">Users</a>
```

```js
/* JavaScript
Closes the new layer when user visits '/users/new' */
up.layer.open({ acceptLocation: "/users/new" });
```

### Matching with wildcards

The asterisk (`*`) character matches one or many characters, numbers, or other valid special characters.

```text
/users/*
```

In the above URL pattern, anything after `/users/` will be considered a match. For example, URLS like `/users/`, `/users/new`, `/users/123/edit`, etc. would all be considered a match for the URL pattern listed above.

You can put asterisks anywhere in an URL pattern (you and even use more than one asterisk in a single URL pattern). For instance, to match any URL that ends in `/new` you can use the URL pattern Below

```text
*/new
```

The above URL pattern will match `/users/new`, `/admin/123/new`, etc.

You may also place and asterisk in the middle of an URL pattern to match URLs with a given prefix and suffix:

```text
/users/*/edit
```

The above URL pattern will match `/users/123/edit`, `/users/David/edit`, `/users/123/name/edit/`, etc.

#### Examples

Here are some practical examples of wildcard URL pattern prefixes.

```html
<!-- HTML
Closes layer when user visits anything underneath "/users/" -->
<a href="/users/" up-accept-location="/users/*" up-layer="new">Users</a>
```

```js
/* JavaScript
Closes layer when user visits anything underneath '/users/new' */
up.layer.open({ acceptLocation: "/users/**" });
```

### Numeric-only wildcard matches

The Dollar Sign (`$`) character will match any number (`0-9`) or numbers.

```text
/users/$/
```

The above URL pattern will match `/users/123`, `/users/123/edit`, etc.

#### Examples

```html
<!-- HTML
Closes layer when user visits any URL beginning with
"/users/" and ends in a number or numbers -->
<a href="/users/" up-accept-location="/users/$" up-layer="new">Users</a>
```

```js
/* JavaScript
Closes layer when user visits any URL beginning with
'/users/' and ends in a number or numbers */
up.layer.open({ acceptLocation: "/users/$" });
```

### Matching one of multiple alternatives

To match one of multiple URL patterns, separate the URLs by a space within the pattern expression.

The URL pattern below will match either the `/users/123` or `/account` URLs:

```text
/users/* /account
```

```html
<!-- HTML
Closes layer when user visits either /account or
anything underneath "/users/" -->
<a href="/users/" up-accept-location="/users/* /account" up-layer="new"
  >Users</a
>
```

JavaScript functions that take URL patterns will accept multiple patterns
as either a space-separated string or as an array of patterns:

```js
// Javascript
up.layer.open({ acceptLocation: "/users/* /account" });
up.layer.open({ acceptLocation: ["/users/*", "/account"] });
```

### Excluding pattern(s) from Matching

To exclude an URL or pattern from matching, prefix the URL pattern with a minus (`-`) character.

The following URL pattern will match the URL `/users/123` but not `/users/456`:

```text
/users/* -/users/456
```

#### Examples

```html
<!-- HTML
Closes layer when user visits any URL beginning with
"/users/" excluding  /users/456 -->
<a href="/users/" up-accept-location="/users/* /users/456" up-layer="new"
  >Users</a
>
```

```js
/* JavaScript
Closes layer when user visits an URL beginning with
'/users/' and ends in a number or numbers */
up.layer.open({ acceptLocation: "/users/* /users/456" });
```

### Capturing named segments

Sometimes it's useful to capture the value of the wildcard that was matched. For example to
[close an overlay once a location is reached](/up.layer.open#options.acceptLocation).

```text
/users/:name
```

#### Examples

```html
<!-- HTML
Closes layer when user visits any URL beginning with
"/users/" and stores the value in userid -->
<a href="/users/" up-accept-location="/users/:userid" up-layer="new">Users</a>
```

The URL the path `/users/alice` would return `{ name: 'alice' }`.

```js
/* JavaScript
Closes layer when user visits an URL beginning with
'/users/' and ends in a number or numbers */
var userID = up.layer.open({ acceptLocation: `{ userid: 'alice' }` });
```

@page url-patterns
