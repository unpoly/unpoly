/*-
@module up.viewport
*/

up.migrate.renamedPackage('layout', 'viewport')

up.migrate.renamedProperty(up.viewport.config, 'viewports', 'viewportSelectors')
up.migrate.renamedProperty(up.viewport.config, 'snap', 'revealSnap')
up.migrate.removedProperty(up.viewport.config, 'scrollSpeed')

/*-
Returns the scrolling container for the given element.

Returns the [document's scrolling element](/up.viewport.root)
if no closer viewport exists.

@function up.viewport.closest
@param {string|Element|jQuery} target
@return {Element}
@deprecated
  Use `up.viewport.get()` instead.
*/
up.viewport.closest = function(...args) {
  up.migrate.deprecated('up.viewport.closest()', 'up.viewport.get()')
  return up.viewport.get(...args)
}

/*-
Scrolls the given viewport to the given Y-position.

A "viewport" is an element that has scrollbars, e.g. `<body>` or
a container with `overflow-x: scroll`.

### Example

This will scroll a `<div class="main">...</div>` to a Y-position of 100 pixels:

```js
up.scroll('.main', 100)
```

### Animating the scrolling motion

The scrolling can (optionally) be animated.

```js
up.scroll('.main', 100, { behavior: 'smooth' })
```

@function up.scroll
@param {string|Element|jQuery} viewport
  The container element to scroll.
@param {number} scrollPos
  The absolute number of pixels to set the vertical scroll position to.
@param {string}[options.behavior='instant']
  When set to `'instant'`, this will immediately scroll to the new position.

  When set to `'smooth'`, this will scroll smoothly to the new position.
@deprecated
  Use [`Element#scrollTo()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo) instead.
*/
up.viewport.scroll = function(viewport, top, options = {}) {
  viewport = up.fragment.get(viewport, options)
  viewport.scrollTo({ ...options, top })
  return up.migrate.formerlyAsync('up.scroll()')
}

up.scroll = up.viewport.scroll
