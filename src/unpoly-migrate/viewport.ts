type ElementOrSelector = import('../unpoly/element.js').ElementOrSelector
type LookupOptions = import('../unpoly/fragment.js').LookupOptions

/*-
@namespace up.viewport
*/

/**
Options for up.scroll(): where to look for the viewport, and how to scroll it.
*/
interface ViewportScrollOptions extends LookupOptions, ScrollOptions {}

// A deprecated alias has the type of the function or namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    viewport: CoreApi['viewport'] & {
      closest: CoreApi['viewport']['get']
      scroll(viewport: ElementOrSelector, top: number, options?: ViewportScrollOptions): Promise<void>
    }
    scroll: Up['viewport']['scroll']
    readonly layout: Up['viewport']
  }
}

up.migrate.renamedNamespace('layout', 'viewport')

up.viewport.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'viewports', 'viewportSelectors', { label: 'up.viewport.config' })
  up.migrate.renamedProperty(config, 'fixedTop', 'fixedTopSelectors', { label: 'up.viewport.config' })
  up.migrate.renamedProperty(config, 'fixedBottom', 'fixedBottomSelectors', { label: 'up.viewport.config' })
  up.migrate.renamedProperty(config, 'anchoredRight', 'anchoredRightSelectors', { label: 'up.viewport.config' })
  up.migrate.renamedProperty(config, 'snap', 'revealSnap', { label: 'up.viewport.config' })
  up.migrate.removedProperty(config, 'scrollSpeed', { label: 'up.viewport.config' })
})

/*-
Returns the scrolling container for the given element.

Returns the [document's scrolling element](/api/up.viewport.root)
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
a container with `overflow-y: scroll`.

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
  up.migrate.deprecated('up.scroll()', 'Element#scrollTo()')

  viewport = up.fragment.get(viewport, options)
  viewport.scrollTo({ ...options, top })
  return up.migrate.formerlyAsync('up.scroll()')
}

up.scroll = up.viewport.scroll
