Links
=====

Unpoly enhances links so they update a fragment of the current page,
instead of loading a full new document. The rest of the page keeps its state:
scroll positions, focus, unsaved form fields and running scripts all survive the click.


Updating a fragment
-------------------

To let Unpoly handle a link, set an `[up-follow]` attribute:

```html
<a href="/preferences" up-follow>Preferences</a> <!-- mark: up-follow -->
```

When the user clicks, Unpoly fetches `/preferences`.
The server renders a full HTML page, the same way it would for a regular page load.
Unpoly then extracts the response's [main fragment](/api/main) and swaps it into the current page,
leaving everything around it untouched.

To update a different fragment, add an [`[up-target]`](/api/up-follow#up-target) attribute with a CSS selector:

```html
<nav>
  <a href="/pages/a" up-target="article">A</a> <!-- mark: up-target="article" -->
  <a href="/pages/b" up-target="article">B</a>
</nav>

<article>
  Page A
</article>
```

Clicking *B* fetches `/pages/b` and replaces only the `<article>` element with
its counterpart from the response.

The link stays a standard hyperlink. When the user opens it in a new tab,
or when JavaScript is unavailable, the browser makes a regular full page load.

[[more: following-links]]


Handling all links
------------------

Instead of annotating every link, you can configure Unpoly to follow all links on the page:

```js
up.link.config.followSelectors.push('a[href]')
```

[[more: handling-all-links]]


Preloading links
----------------

A link can request its destination before the user clicks, making the interaction feel instant:

```html
<a href="/stories/5" up-preload>Full story</a> <!-- mark: up-preload -->
```

Hovering over the link already loads the response into the [cache](/learn/caching).

[[more: preloading]]


Highlighting the current location
---------------------------------

Links in a navigation bar are marked with an `.up-current` class when they point to the current page:

```html
<nav>
  <a href="/users" class="up-current">Users</a> <!-- mark: up-current -->
  <a href="/posts">Posts</a>
</nav>
```

Style that class with your CSS to highlight the active menu section.

[[more: navigation-bars]]


See also
--------

To make a `<span>` or a table row act like a hyperlink, see [[faux-interactive-elements]].

@page links
@menu-title Overview
@signature
