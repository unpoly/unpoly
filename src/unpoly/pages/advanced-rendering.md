Advanced rendering
==================

Every link, form, overlay or poll that Unpoly handles ends in the same render pass,
and every render pass takes the same options. This chapter covers those options:
which fragments are updated, what else happens on a navigation, what to do when
the server reports an error, and how your code can hook into the process.


One function behind every update
--------------------------------

When the user clicks this link, Unpoly fetches `/posts/5` and swaps the `.post` element
with its counterpart from the response:

```html
<a href="/posts/5" up-target=".post">Read post</a> <!-- mark: up-target=".post" -->
```

Internally the link becomes a call to `up.render()`. Your own code can make that call directly:

```js
up.render({ target: '.post', url: '/posts/5' })
```

The *target* is a CSS selector that must match in both the current page and the server response.
The link itself is the *origin* of the update: the element the user interacted with.
Everything else that a render pass does, from caching to scrolling, is a *render option*.
An option is available in three forms: as an `[up-*]` attribute on a link or form,
as a camel-cased option for a function like `up.render()`, and as a global default in a config object.

[[more: attributes-and-options]]


Targeting fragments
-------------------

A target can express more than one element. Separate selectors with a comma to update
several fragments from one request, and suffix a selector with `:after` to append to
a fragment instead of replacing it:

```html
<ul class="tasks">
  <li>Wash car</li>
  <li>Fix tent</li>
</ul>

<a href="/tasks?page=2" class="next-page" up-target=".tasks:after, .next-page"> <!-- mark: .tasks:after, .next-page -->
  Load more tasks
</a>
```

Clicking the link appends the next page's `<li>` children to the list and replaces the link.
When a selector like `.card` matches several elements, Unpoly prefers the match closest
to the origin, so a link inside the second card updates the second card.

[[more: targeting-fragments]]


Navigation defaults
-------------------

Following a link or submitting a form is a *navigation*. A navigation adds a preset of render options
that make the update feel like a full page load: responses are cached, and when the main content changes,
the URL updates, the page scrolls to the top and focus moves to the new content.
A plain `up.render()` call has none of these defaults.

Each default can be turned off per element, and your JavaScript can opt in:

```html
<a href="/posts/5" up-target=".post" up-navigate="false">Read post</a> <!-- mark: up-navigate="false" -->
```

```js
up.render({ target: '.post', url: '/posts/5', navigate: true }) // mark: navigate: true
```

To change what navigation means for your entire app, set the defaults in
`up.fragment.config.navigateOptions`.

[[more: navigation-defaults]]


Handling failed responses
-------------------------

When the server responds with an error status, a different fragment often needs to change.
A failed form submission should re-render the form instead of showing the next screen.
Prefix any render option with `fail` to apply it only to failed responses:

```js
up.render({
  url: '/users',
  method: 'post',
  target: '.content', // when the submission succeeds
  failTarget: 'form', // mark: failTarget
})
```

A successful response updates `.content`. A failed response updates the `<form>` instead,
so the user sees the validation errors next to their input. In HTML the same option
is `[up-fail-target]`. For forms, Unpoly already defaults to re-rendering the form itself.

[[more: failed-responses]]


Keeping elements
----------------

Some elements carry state that a swap would lose, like a playing video or a map with its pan and zoom.
Mark such an element with `[up-keep]`, and it survives when the fragment around it is replaced:

```html
<div id="article">
  <p>Article 1</p>
  <audio id="player" up-keep src="song1.mp3"></audio> <!-- mark: up-keep -->
</div>
```

When the response contains a matching `#player`, Unpoly moves the existing element into the new
fragment, so the song keeps playing. You can also keep an element only until its HTML or data changes.

[[more: keeping-elements]]


Hooking into the render lifecycle
---------------------------------

Rendering functions return a promise that fulfills with the inserted fragments:

```js
let result = await up.render({ target: '.post', url: '/posts/5' })
console.log('Updated fragment:', result.fragment) // mark: result.fragment
```

Before a loaded response is rendered, the `up:fragment:loaded` event lets you inspect
it and change the render options, or prevent the update altogether. When a maintenance
page should never be rendered as a fragment, make a full page load instead:

```js
up.on('up:fragment:loaded', function(event) {
  if (event.response.header('X-Maintenance')) {
    event.preventDefault() // mark-line
    event.request.loadPage()
  }
})
```

[[more: render-lifecycle]]


See also
--------

When Unpoly updates an element without being given a selector, it guesses one from the element's
`[id]`, `[name]` or classes. To tune that guess, see [[target-derivation]].

To render HTML that you already have, without a request to the server, see [[providing-html]].

@page advanced-rendering
@menu-title Overview
@signature
