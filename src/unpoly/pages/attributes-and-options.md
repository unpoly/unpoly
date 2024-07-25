Attributes and options
======================

## Unpoly attributes

Unpoly provides `up-`prefixed attributes that enable additional behavior on HTML elements.
For example, the [`[up-follow]`](/a-up-follow) attribute will cause a clicked link to swap the `<main>` or `<body>` element
instead of replacing the full page:

```html
<a href="/path" up-follow>Click me</a> <!-- mark-phrase "up-follow" -->
```


### Modifying attributes {#attributes}

Most Unpoly attributes have *modifying attributes* to fine-tune their behavior.
For example, the `[up-transition]` attribute causes an `[up-follow]` to swap
using an [animated transition](/up.motion):

```html
<a href="/path" up-follow up-transition="cross-fade">Click me</a> <!-- mark-phrase "up-transition" -->
```

Modifying attributes are documented with the main attribute they're modifying.
For example, see [modifying attributes for `[up-follow]`](/a-up-follow#attributes).


## Configuring default behavior for all elements {#defaults}

Instead of configuring the same attributes on many elements, you can configure
Unpoly to apply behavior to all elements matching a given CSS selector.

For example, the following configuration will enable single-page navigation for
all hyperlinks:

```js
up.link.config.followSelectors.push('a[href]')
```

Unpoly will now [handle all links](/handling-everything), even those without
an `[up-follow]` attribute:

```html
<a href="/path">Click for single-page navigation</a>
```


> [tip]
> An alternative way to apply default behavior to many elements is a [macro](/up.macro).


### Making exceptions

You can still make exceptions by setting an `[up-follow=false]` attribute:

```html
<a href="/path" up-follow="false">Click for full page load</a> <!-- mark-phrase "false" -->
```



## Overriding attributes with JavaScript options {#options}

Most Unpoly attributes come with matching JavaScript functions that trigger the same behavior programmatically. 

Let's say you have the following link:

```html
<a href="/path" up-follow up-meta-tags="false">Click me</a>
```

Your scripts can tell Unpoly to follow the link like this:

```js
up.follow(link)
```

The `up.follow()` call will parse all modifying attributes from the given link element into a JavaScript object
with camel-cased keys. So we're implicitly making the following call:

```JS
// The options object is parsed from the link and can be omitted
up.follow(link, { url: '/path', metaTags: false })
```

If you pass other options, these will override (or supplement) any options parsed from the link's attributes:

```js
// This overrides the [up-meta-tags=false] attribute
up.follow(link, { metaTags: true })
```


## Auto-attributes

Some attributes default to a value `"auto"`. This indicates a more complex default.

For example, the [`[up-cache=auto]`](/a-up-follow#up-cache) attribute caches all links with a `GET` method:

```
<a href="/path" up-follow up-cache="auto">Click me</a> <!-- mark-phrase "auto" -->
```

You can usually configure auto-behavior. For example, the following will prevent auto-caching
of requests to URLs ending with `/edit`:

```js
let defaultAutoCache = up.network.config.autoCache
up.network.config.autoCache = function(request) {
  defaultAutoCache(request) && !request.url.endsWith('/edit')
}
```

## Boolean attributes

Most Unpoly attributes can be enabled with a value `"true"` and be disabled with a value `"false"`:

```html
<a href="/path" up-follow="true">Click for single-page navigation</a> <!-- mark-phrase "true" -->
<a href="/path" up-follow="false">Click for full page load</a> <!-- mark-phrase "false" -->
```

Instead of setting a `true` you can also set an empty value:

```html
<a href="/path" up-follow>Click for single-page navigation</a>
<a href="/path" up-follow="">Click for single-page navigation</a>
<a href="/path" up-follow="true">Click for single-page navigation</a>
```

Boolean values can be helpful with a server-side templating language like ERB, Liquid or Haml, when the attribute value is 
set from a boolean variable:

```erb
<a href="/path" up-follow="<%= is_signed_in %>">Click me</a> <%# mark-phrase "is_signed_in" %>
```

This can also help when you're generating HTML from a different programming language and want to pass a `true` literal
as an attribute value:  

```ruby
link_to 'Click me', '/path', 'up-follow': true
```



@page attributes-and-options

