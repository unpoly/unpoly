type ElementOrSelector = import('../unpoly/element.js').ElementOrSelector
type LookupOptions = import('../unpoly/fragment.js').LookupOptions

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

up.viewport.closest = function(...args) {
  up.migrate.deprecated('up.viewport.closest()', 'up.viewport.get()')
  return up.viewport.get(...args)
}

up.viewport.scroll = function(viewport, top, options = {}) {
  up.migrate.deprecated('up.scroll()', 'Element#scrollTo()')

  viewport = up.fragment.get(viewport, options)
  viewport.scrollTo({ ...options, top })
  return up.migrate.formerlyAsync('up.scroll()')
}

up.scroll = up.viewport.scroll
