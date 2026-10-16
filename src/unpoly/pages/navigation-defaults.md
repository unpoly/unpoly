Navigation defaults
===================

Following a link or submitting a form is a *navigation*. Navigation adds a preset of render options
that make the update feel like a full page load: responses are cached, and when the main content changes,
the URL updates, the page scrolls to the top and focus moves to the new content.
A plain `up.render()` call only swaps the fragment, and you opt into each side effect on your own.


What counts as navigation {#navigating-features}
-------------------------

A user who clicks a standard hyperlink or submits a form expects what browsers have always done:
the address bar shows the new location, the Back button returns
to the previous screen, the new page starts at the top, and focus is not stranded on an element
that no longer exists. When an Unpoly feature *navigates*, it mimics all of this.

Following a link, submitting a form or opening an overlay is considered navigation by default.
Other features only render a fragment: a validation request re-renders a form field, and a
polling fragment refreshes itself in the background. Neither should move the user's scroll
position or add a history entry.

| Feature           | Navigates by default? |
|-------------------|-----------------------|
| `[up-follow]`     | yes                   |
| `up.follow()`     | yes                   |
| `up.navigate()`   | yes                   |
| `up.visit()`      | yes                   |
| `[up-layer=new]`  | yes                   |
| `up.layer.open()` | yes                   |
| `[up-submit]`     | yes                   |
| `up.submit()`     | yes                   |
| `up.render()`     | no                    |
| `up.reload()`     | no                    |
| `[up-validate]`   | no                    |
| `up.validate()`   | no                    |
| `[up-poll]`       | no                    |


The defaults {#navigation-defaults}
------------

When navigating, Unpoly applies the following render options:

| Option                   | Effect                                                                                    |
|--------------------------|-------------------------------------------------------------------------------------------|
| `{ history: 'auto' }`    | [Update history](/updating-history) if rendering a [main target](/main)                   |
| `{ scroll: 'auto' }`     | [Reset scroll positions](/scrolling#auto) if rendering a main target                      |
| `{ focus: 'auto' }`      | [Focus](/focus#auto) the new fragment if rendering a main target                          |
| `{ fallback: true }`     | Render a main target if the response doesn't contain the given [target](/targeting-fragments#missing-targets) |
| `{ cache: 'auto' }`      | [Cache](/caching) responses to `GET` requests                                             |
| `{ revalidate: 'auto' }` | Reload [expired](/caching#revalidation) cache entries after rendering                     |
| `{ peel: 'dismiss' }`    | Dismiss overlays when [targeting a background layer](/closing-overlays#peeling)           |

Most of these options have an `'auto'` value, meaning the effect only applies when the update
is significant. A link that swaps the layer's main element gets a new history entry and
scrolls to the top. A link that only updates a sidebar keeps the URL and the scroll position,
even though it navigates.

The same defaults also apply when the server responds with an [error code](/error-responses),
so a failed form submission gets the same `'auto'` scroll and focus behavior.


Opting out of navigation {#opting-out}
------------------------

To follow a link or submit a form without navigation defaults, set an `[up-navigate=false]` attribute:

```html
<a href="/users?sort=name" up-target=".users" up-navigate="false">Sort by name</a> <!-- mark: up-navigate="false" -->
```

Clicking the link updates the `.users` list and nothing else. The URL stays the same,
the scroll position is kept and the response is not cached.
The link also no longer falls back to the main element. When the server responds with an error,
nothing is rendered unless you set an [`[up-fail-target]`](/error-responses#fail-options).

With `[up-navigate=false]` you can still enable individual effects, like `[up-history=true]`
or `[up-scroll=top]`. See the attributes for [links](/up-follow) and [forms](/up-submit) for all options.


Opting into navigation {#opting-in}
----------------------

Rendering functions like `up.render()` or `up.reload()` don't navigate by default.
To update a fragment with navigation defaults, pass a `{ navigate: true }` option:

```js
up.render({ target: '.content', url: '/posts/5', navigate: true }) // mark: navigate: true
```

The `up.navigate()` function does the same with less typing:

```js
up.navigate({ target: '.content', url: '/posts/5' })
```

Explicit options always win over the defaults, so you can navigate and still keep the scroll position:

```js
up.navigate({ target: '.content', url: '/posts/5', scroll: 'keep' })
```


Customizing defaults {#customizing-defaults}
--------------------

The navigation defaults live in `up.fragment.config.navigateOptions`.
Change an option there to change it for every navigation in your app.
For instance, this animates every navigation with a cross-fade:

```js
up.fragment.config.navigateOptions.transition = 'cross-fade'
```

Links and forms can still override a configured default with their own attributes,
like `[up-transition=move-left]` or `[up-transition=false]`.


Defaults that depend on the origin {#origin-dependent-defaults}
----------------------------------

Sometimes a default should depend on the link or form that was activated.

Events like `up:link:follow` or `up:form:submit` have a `{ renderOptions }` property
that lets you change the render options for the coming fragment update.

The code below keeps the scroll position when the user switches tabs, even though each tab swaps the main element:

```js
up.on('up:link:follow', '.tabs a', function(event) {
  event.renderOptions.scroll = false // mark-line
})
```

See [changing options before rendering](/render-lifecycle#changing-options-before-rendering) for more.

@page navigation-defaults
