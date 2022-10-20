Targeting fragments
===================

This page outlines ways to target and update fragments on your page.


## Swapping a fragment

Unpoly uses CSS selectors like `.content` to match an element in the current page and server response:

```html
<a href="/posts/5" up-target=".content">Read post</a>

<div class=".content">
  Post will appear here!
</div>

<div class=".other">
  This fragment will not change.
</div>
```

The server response is expected to include a `<div class=".content">` element. The response may include other HTML (even an entire HTML document), but only the element matching `.content` will be updated on the page. Other elements from the response will be discarded.

In [JavaScript API](/up.fragment), many Unpoly functions take an `{ target }` option to indicate what fragment should be updated:

```js
up.render({ target: '.content', url: '/posts/5' })
```


### Updating multiple fragments

You can update multiple fragments from a single request by separating
selectors with a comma.

For instance, if opening a post should also update a bubble showing the number of unread posts, you might do this:

```html
<a href="/posts/5" up-target=".content, .unread-count">Read post</a>
```

When one of your target elements is an ancestor of another target,
Unpoly will only request the ancestor.

For instance, the following link would only target `body`, since that
already contains `.unread-count`:

```html
<a href="/home" up-target="body, .unread-count">...</a>
```


### Optional targets

By default Unpoly expects all targeted fragments to be present in
both the current page and the server response.
If a target selector doesn't match in either, an error `up.CannotMatch` is thrown.

You may mark a target as optional by using the `:maybe` pseudo selector.

```html
<a href="/card/5" up-target=".content, .unread-count:maybe">...</a>
```

In this case Unpoly would only require `.content` to match. If `.unread-count` is missing
in the current page or the server response, Unpoly will only update `.content`
without an error.

Instead of including an optional target in your target selector, you can also set an `[up-hungry]` attribute on the element that should optionally be updated. A target derived from the `[up-hungry]` element will be included whenever a matching element will be found in the server response:

```html
<div class=".unread-count" up-hungry>12</div>
  
<!-- Following this link will update .content, .unread-count:maybe -->
<a href="/card/5" up-target=".content">...</a>
```

Common use cases for `[up-hungry]` are unread message counters, notification flashes or page-specific subnavigation bars. Such elements often live in the application layout, outside of the fragment that is being targeted.


### Targeting the main element

Many links and forms update the site's primary content area, called the [main element](/main). You can target the main element using the `:main` selector, or by omitting an target entirely:

```html
<a href="/cards/5" up-follow>Load post</a>

<main>
  Post will appear heare
</main>
```

Similarily when a JavaScript function omits an `{ target }` option, the main target will be rendered:

```js
up.render({ url: '/cards/5' })
```

You may configure main target selectors in `up.fragment.config.mainTargets`.


### Targeting an element object

When you pass an `Element` object to a rendering function, Unpoly will [derive](/target-derivation) a selector that will match the element:

```js
let element = document.querySelector('#foo')

up.reload(element) // Derives the target '#foo' from the given element
```

See [target derivation](/target-derivation) for more details and examples.


## Changing a fragment's content

### Appending or prepending content

Instead of swapping an entire fragment you may *append* content to an existing fragment by using the
`:after` pseudo selector. In the same fashion, you can use `:before` to *prepend* the loaded content.

A practical example would be a paginated list of items. Below the list is
a button to load the next page. You can append to the existing list
by using `:after` in the `[up-target]` selector like this:

```html
<ul class="tasks">
  <li>Wash car</li>
  <li>Purchase supplies</li>
  <li>Fix tent</li>
</ul>

<a href="/page/2" class="next-page" up-target=".tasks:after, .next-page">
  Load more tasks
</a>
```

The server is still expected to render an entire `<ul class="tasks">`, but only its `<li>` children are used to extend the existing list.

### Replacing an element's inner HTML

If you would like to preserve the target element, but replace all of its child content,
use the `:content` pseudo selector:

```html
<div class="card">...</div>

<a href="/cards/5" up-target=".card:content">Show card #5</a>
```

The server is still expected to render an element matching `.card`, but only its child content is used.

For more advanced strategies for preserving elements, see `[up-keep]`.


## Targeting nothing

To make a server request without changing a fragment, target the `:none` selector:

```html
<a href="/ping" up-target=":none">Ping server</a>
```

When a target selector like `.content` is used, the server can still decide to render nothing by responding with HTTP status `304 Not Modified` or `204 No Content`. The render pass will succeed, but no element will be changed.


## Resolving ambiguous selectors

Sometimes there are multiple components with the same selector on the page:

```html
<div class="card">...</div>
<div class="card">...</div>
<div class="card">...</div>
```

While you can [set `[id]` attributes to uniquely identify an element on the page](/target-derivation), this may not be necessary. When an ambiguous selector like `.card` matches more than one element, Unpoly will prefer to match a fragment in the *proximity* of the a link or form that the user interacted with. If there is no match in the proximity, Unpoly will update the first match in the [layer](/up.layer).

Note that when rendering programmatically, you can pass the interaction's origin element as [`{ origin }`](/up.render#options.origin) option.

Below you can find examples of targeting elements with ambiguous selectors, which Unpoly resolves by proximity to the interaction origin. A more elaborate example is the [Tasks list](https://demo.unpoly.com/tasks) of the [Unpoly Demo App](https://demo.unpoly.com/).


### Targeting an ancestor element

Assume we have two links that replace `.card`:

```html
<div class="card">
  Card #1 preview
  <a href="/cards/1" up-target=".card">Show full card #1</a>
</div>

<div class="card">
  Card #2 preview
  <a href="/cards/2" up-target=".card">Show full card #2</a>
</div>
```

When clicking on *"Show full card #2"*, Unpoly will replace the *second* card, since that is a matching ancestor of the link followed.

The interaction origin can only be considered in the current page, but not in the server response. In the example above the server is expected to only render a single `.card` element.


### Targeting a sibling element


```html
<div class="card">
  <div class=".card-text">Card #1 preview</div>
  <a href="/cards/1" up-target=".card .card-text">Show full card #1</a>
</div>

<div class="card">
  <div class="card-text">Card #2 preview</div>
  <a href="/cards/2" up-target=".card .card-text">Show full card #2</a>
</div>
```

When clicking on *"Show full card #2"*, Unpoly will replace the `.card-text` within the second card.

The interaction origin can only be considered in the current page, but not in the server response. In the example above the server is expected to only render a single `.card` element.


## Dealing with missing targets

By default Unpoly requires targets to match in both the current page and the server response. If no matching element is found in either, an error `up.CannotMatch` will be thrown.


### Providing a fallback target

Instead of failing with an error you may also configure a *fallback target* that will be used if the primary target cannot be matched.

A fallback target is a CSS selector in an `[up-fallback]` attribute or `{ fallback }` option:

```js
up.render({ url: '/path', target: '.content', fallback: 'body' })
```

If no element matches `.content` in either page or response, Unpoly will update the `body` element.

If neither primary nor fallback targets can be matched, the render pass will fail with an error `up.CannotMatch`.


### Falling back to the main target

It is often useful to render the [main target](/main) when the primary target cannot be matched. The assumption here is that missing targets are often caused by the server rendering an error message. Falling back to the main target will display the error message, instead of the link or form failing silently.

To fallback to the main target you can set an empty `[up-fallback]` attribute or pass an `{ fallback: true }` option:

```js
up.render({ url: '/path', target: '.content', fallback: true })
```

Falling back to the main target is the default when [navigating](/navigation). Therefore you don't need to include an empty `[up-fallback]` attribute with your links and forms, which are considered navigation by default.

@page targeting-fragments
