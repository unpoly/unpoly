Attributes and options
======================

Most of Unpoly's features share one shape: the common case is an HTML attribute,
the same feature is also available as a JavaScript function, and its defaults
can be changed through a global configuration.

This page covers the pattern in detail: how attributes and their modifiers are
parsed, which values they accept, and how JavaScript options and configured
defaults override them.


One feature, three layers {#layers}
-------------------------

You can set most options in three places: a [configuration default](#config) for your entire app,
an attribute on one element, or an [option](#options) in one JavaScript call.
When more than one place sets the same option, the most specific one wins.

Let's say your app animates every navigation with a cross-fade:

```js
up.fragment.config.navigateOptions.transition = 'cross-fade'
```

One link prefers to slide in from the right. Its attribute overrides the default for this link only:

```html
<a href="/next" up-follow up-transition="move-left">Next page</a> <!-- mark: up-transition="move-left" -->
```

When your own script follows that link, it can override the attribute again.
Here the script skips the animation altogether:

```js
up.follow(link, { transition: 'none' }) // mark: transition: 'none'
```

When Unpoly navigates, it starts with the [configured defaults](/navigation-defaults), then applies the attributes
it parsed from the element, and finally the options you passed. Each layer only replaces the
values it actually sets, so the script above still gets the link's URL and every other attribute.


Unpoly attributes
-----------------

Unpoly provides `up-`prefixed attributes that enable additional behavior on HTML elements.
For example, the `[up-follow]` attribute will cause a clicked link to swap the
page's [main element](/main) instead of replacing the full page:

```html
<a href="/path" up-follow>Click me</a> <!-- mark: up-follow -->
```


### Modifying attributes {#attributes}

Most Unpoly attributes have *modifying attributes* to fine-tune their behavior.
For example, the `[up-confirm]` attribute makes an `[up-follow]` link show
a confirmation dialog before it is followed:

```html
<a href="/users/5/delete" up-follow up-confirm="Really delete this user?">Delete user</a> <!-- mark: up-confirm -->
```

Modifying attributes are documented with the main attribute they're modifying.
For example, see [modifying attributes for `[up-follow]`](/up-follow#attributes).


### Boolean attributes {#boolean-attributes}

Most Unpoly attributes can be enabled with a value `"true"` and be disabled with a value `"false"`:

```html
<a href="/path" up-follow="true">Click for single-page navigation</a> <!-- mark: true -->
<a href="/path" up-follow="false">Click for full page load</a> <!-- mark: false -->
```

Instead of setting a `true` value you can also set an empty value:

```html
<a href="/path" up-follow>Click for single-page navigation</a>
<a href="/path" up-follow="">Click for single-page navigation</a>
<a href="/path" up-follow="true">Click for single-page navigation</a>
```

Boolean values can be helpful with a server-side templating language like ERB, Liquid or Haml,
when the attribute value is set from a boolean variable:

```erb
<a href="/path" up-follow="<%= is_signed_in %>">Click me</a> <%# mark: is_signed_in %>
```

This can also help when you're generating HTML from a different programming language
and want to pass a `true` literal as an attribute value:

```ruby
link_to 'Click me', '/path', 'up-follow': true # mark: true
```


### Structured values {#relaxed-json}

A few attributes take a structured value, like an object or an array.
These values are written in [relaxed JSON](/relaxed-json), which allows single quotes
and unquoted keys:

```html
<a href="/path" up-follow up-headers="{ 'X-Requested-From': 'sidebar' }">Click me</a> <!-- mark: up-headers -->
```


Overriding attributes with JavaScript options {#options}
---------------------------------------------

Most Unpoly attributes come with matching JavaScript functions that trigger
the same behavior programmatically.

Let's say you have the following link:

```html
<a href="/path" up-follow up-meta-tags="false">Click me</a>
```

Your scripts can tell Unpoly to follow the link like this:

```js
up.follow(link)
```

The `up.follow()` call will parse all modifying attributes from the given link element
into a JavaScript object with camel-cased keys. So we're implicitly making the following call:

```js
// The options object is parsed from the link and can be omitted
up.follow(link, { url: '/path', metaTags: false })
```

If you pass other options, these will override (or supplement) any options parsed
from the link's attributes:

```js
// This overrides the [up-meta-tags=false] attribute
up.follow(link, { metaTags: true })
```


<a id="defaults"></a>

Changing defaults globally {#config}
--------------------------

Most modules have an `up.*.config` property that adjusts their behavior
for your entire application. For example, this makes every new overlay
open as a drawer instead of a modal dialog:

```js
up.layer.config.mode = 'drawer'
```

A configured value becomes the new default. Elements and function calls
can still override it with their own attributes and options.

Many config properties hold a list of CSS selectors, letting you apply
a behavior to all matching elements. For example, you can tell Unpoly to
[handle every link on the page](/handling-all-links#defaults) without
any `[up-follow]` attributes.


Auto-attributes
---------------

Some attributes default to a value `"auto"`. This indicates a more complex default.

For example, the [`[up-cache=auto]`](/up-follow#up-cache) attribute caches all links with a `GET` method:

```html
<a href="/path" up-follow up-cache="auto">Click me</a> <!-- mark: up-cache="auto" -->
```

You can usually configure auto-behavior. For example, the following will prevent auto-caching
of requests to URLs ending with `/edit`:

```js
let defaultAutoCache = up.network.config.autoCache
up.network.config.autoCache = function(request) {
  return defaultAutoCache(request) && !request.url.endsWith('/edit')
}
```


@page attributes-and-options
@signature
