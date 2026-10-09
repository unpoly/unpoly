Targeting fragments
===================

A *target* is a CSS selector that names the fragment to update. Unpoly matches it in both the
current page and the server response, then swaps the old element for the new one.
A target can also address several fragments, append to a list, or pick the match closest
to the link the user clicked.


Swapping a fragment {#swapping}
-------------------

Set an `[up-target]` attribute with a CSS selector on a link or form:

```html
<a href="/posts/5" up-target=".content">Read post</a> <!-- mark: up-target=".content" -->

<div class="content">
  Post will appear here
</div>

<div class="other">
  This fragment will not change.
</div>
```

The server response is expected to include an element matching `.content`.
The response may include other HTML, even an entire HTML document, but only the
element matching `.content` is updated on the page. Other elements from the response are discarded.

Many [JavaScript functions](/up.fragment) take a `{ target }` option to indicate what fragment should be updated:

```js
up.render({ target: '.content', url: '/posts/5' })
```


Targeting the main element {#targeting-the-main-element}
--------------------------

Most links and forms update the site's primary content area, called the [main element](/main).
Omit the target to update it:

```html
<a href="/posts/5" up-follow>Read post</a>

<main>
  Post will appear here
</main>
```

The `:main` selector names the main element explicitly, which is useful when it is one of multiple targets.
Likewise, a JavaScript function that omits its `{ target }` option updates the main element:

```js
up.render({ url: '/posts/5' })
```

By default the main element is any element with an `[up-main]` attribute, the HTML5 `<main>` element,
or the layer's [topmost swappable element](#targeting-the-entire-layer).
You can configure other selectors in `up.fragment.config.mainTargets`.


Updating multiple fragments {#multiple}
---------------------------

Separate selectors with a comma to update multiple fragments from a single request.
Here opening a post also updates a bubble showing the number of unread posts:

```html
<a href="/posts/5" up-target=".content, .unread-count">Read post</a> <!-- mark: .content, .unread-count -->
```

When one of your target elements is an ancestor of another target, Unpoly only updates the ancestor.
The following link would only update `body`, since that already contains `.unread-count`:

```html
<a href="/home" up-target="body, .unread-count">...</a>
```


Optional targets {#optional-targets}
----------------

By default Unpoly expects all targeted fragments to be present in both the current page and the server response.
If a target selector doesn't match in either, an error `up.CannotMatch` is thrown.

Mark a target as optional with the `:maybe` pseudo-selector:

```html
<a href="/posts/5" up-target=".content, .unread-count:maybe">Read post</a> <!-- mark: :maybe -->
```

Now only `.content` is required to match. If `.unread-count` is missing in the current page
or in the server response, Unpoly only updates `.content` without an error.

Instead of listing an optional element in every link's target, you can set an `[up-hungry]` attribute
on the element itself. A hungry element is updated whenever a response contains a matching element,
regardless of what was targeted:

```html
<div class="unread-count" up-hungry>12</div> <!-- mark: up-hungry -->

<!-- Following this link will update .content, .unread-count:maybe -->
<a href="/posts/5" up-target=".content">Read post</a>
```

Common use cases for `[up-hungry]` are unread message counters or page-specific subnavigation.
Such elements often live in the application layout, outside of the fragment that is being targeted.
See [[hungry-elements]] for details.


Appending or prepending children {#appending-or-prepending}
--------------------------------

Instead of swapping an entire fragment, you can *append* children to an existing fragment
with the `:after` pseudo-selector. In the same fashion, `:before` *prepends* the loaded content.

A practical example is a paginated list of items. Below the list is a link to load the next page.
With `:after` in the `[up-target]`, the next items are appended to the existing list:

```html
<ul class="tasks">
  <li>Wash car</li>
  <li>Purchase supplies</li>
  <li>Fix tent</li>
</ul>

<a href="/tasks?page=2" class="next-page" up-target=".tasks:after, .next-page"> <!-- mark: .tasks:after -->
  Load more tasks
</a>
```

The server is still expected to render an entire `<ul class="tasks">`, but only its `<li>` children
are used to extend the existing list. The second target, `.next-page`, replaces the link
with one pointing to the page after.


Replacing all children {#content}
----------------------

To keep the target element, but replace all of its child content, use the `:content` pseudo-selector:

```html
<div class="card">...</div>

<a href="/cards/5" up-target=".card:content">Show card #5</a> <!-- mark: :content -->
```

The server is still expected to render an element matching `.card`, but only its child content is used.
The `.card` element itself keeps its attributes, event listeners and any state your scripts attached to it.

For more advanced strategies for keeping elements, see [[preserving-elements]].


Targeting nothing {#targeting-nothing}
-----------------

To make a server request without changing a fragment, target the `:none` selector:

```html
<a href="/ping" up-target=":none">Ping server</a> <!-- mark: :none -->
```


Targeting the entire layer {#targeting-the-entire-layer}
--------------------------

To replace all visible elements of a [layer](/up.layer), use the `:layer` selector.
It targets the layer's topmost swappable element:

```html
<a href="/admin" up-follow up-target=":layer">Admin area</a> <!-- mark: :layer -->
```

@include topmost-swappable-layer-element


Resolving ambiguous selectors {#ambiguous-selectors}
-----------------------------

Sometimes there are multiple components with the same selector on the page:

```html
<div class="card">...</div>
<div class="card">...</div>
<div class="card">...</div>
```

While you can [set `[id]` attributes to uniquely identify an element](/target-derivation),
this is often not necessary. When an ambiguous selector like `.card` matches more than one element,
Unpoly prefers to match a fragment near the link or form that the user interacted with (the *origin*).
If there is no match in close proximity, Unpoly updates the first match in the [layer](/up.layer).

When rendering programmatically, pass the interaction's origin element as [`{ origin }`](/up.render#options.origin) option.

Below are examples of ambiguous selectors that Unpoly resolves by proximity to the origin.
A more elaborate example is the [Tasks list](https://demo.unpoly.com/tasks) of the [Unpoly Demo App](https://demo.unpoly.com/).


### Targeting an ancestor element {#targeting-an-ancestor-element}

Assume we have two links that replace `.card`:

```html
<div class="card">
  Card #1 preview
  <a href="/cards/1" up-target=".card">Show full card #1</a>
</div>

<div class="card">
  Card #2 preview
  <a href="/cards/2" up-target=".card">Show full card #2</a> <!-- mark-line -->
</div>
```

When clicking *"Show full card #2"*, Unpoly replaces the *second* card, since that is a matching ancestor of the followed link.

The origin can only be considered in the current page, not in the server response.
In the example above the server is expected to render a single `.card` element.


### Targeting a sibling element {#targeting-a-sibling-element}

```html
<div class="card">
  <div class="card-text">Card #1 preview</div>
  <a href="/cards/1" up-target=".card .card-text">Show full card #1</a>
</div>

<div class="card">
  <div class="card-text">Card #2 preview</div>
  <a href="/cards/2" up-target=".card .card-text">Show full card #2</a> <!-- mark-line -->
</div>
```

When clicking *"Show full card #2"*, Unpoly replaces the `.card-text` within the second card.

Again the server is expected to render a single `.card` element, since the origin is
only known in the current page.


### Referring to the origin element {#referring-to-the-origin-element}

Instead of relying on proximity, your targets can use `:origin` to refer to the
interaction's origin element. The `:origin` placeholder is replaced with a target [derived](/target-derivation)
from the origin element.

@include origin-selector-example


### Disabling region-aware fragment matching {#disabling-region-aware-fragment-matching}

If matching fragments around the origin does not work for you, you can tell Unpoly to always use
the first fragment matching the target selector:

- Pass a `{ match: 'first' }` option to a function that matches a fragment.
- Set an `[up-match=first]` attribute on a link or form.
- Configure `up.fragment.config.match = 'first'` to disable region-aware matching for all functions and elements.
  You can then opt in again with `{ match: 'region' }` or `[up-match=region]`.


Dealing with missing targets {#missing-targets}
----------------------------

By default Unpoly requires targets to match in both the current page and the server response.
If no matching element is found in either, an error `up.CannotMatch` is thrown.

For individual fragments that may be missing, [make the target optional](#optional-targets) with `:maybe`.
When the *primary* target may be missing, configure a fallback instead.


### Providing a fallback target {#providing-a-fallback-target}

A *fallback target* is used when the primary target cannot be matched.
Pass it as an `[up-fallback]` attribute or `{ fallback }` option:

```js
up.render({ url: '/path', target: '.content', fallback: 'body' }) // mark: fallback: 'body'
```

If no element matches `.content` in either page or response, Unpoly updates the `body` element.

If neither the primary nor the fallback target can be matched, the render pass fails with an error `up.CannotMatch`.


### Falling back to the main target {#falling-back-to-the-main-target}

It is often useful to render the [main target](/main) when the primary target cannot be matched.
Missing targets are often caused by the server rendering an error message, or an unexpected
screen like a login form. Falling back to the main target shows that screen,
instead of the link or form failing silently.

To fall back to the main target, set an empty `[up-fallback]` attribute or pass a `{ fallback: true }` option:

```js
up.render({ url: '/path', target: '.content', fallback: true }) // mark: fallback: true
```

Falling back to the main target is the default when [navigating](/navigation-defaults).
Links and forms navigate by default, so they don't need an `[up-fallback]` attribute.


Targeting an element object {#targeting-an-element-object}
---------------------------

When you pass an `Element` object to a rendering function, Unpoly [derives](/target-derivation)
a selector that matches the element:

```js
let element = document.querySelector('#foo')

up.reload(element) // Derives the target '#foo' from the given element
```

The element is also used as the [origin](#ambiguous-selectors) of the update.
See [[target-derivation]] for details and examples.


Changing the target in-flight {#changing-target}
-----------------------------

The server may elect to render a different target by setting an `X-Up-Target` response header.

Events like `up:link:follow`, `up:form:submit` and `up:fragment:loaded` also let you change the target
by setting `event.renderOptions.target` to a new selector.
See [Changing options before rendering](/render-lifecycle#changing-options-before-rendering) for an example.


@page targeting-fragments
@signature
