type ElementOrSelector = import('../unpoly/element.js').ElementOrSelector
type RenderOptions = import('../unpoly/fragment.js').RenderOptions
type Layer = import('../unpoly/layer.js').Layer
type LayerCloseOptions = import('../unpoly/layer.js').LayerCloseOptions
type OverlayDefaults = import('../unpoly/layer.js').OverlayDefaults

/**
The type of `up.popup`, whose functions moved to up.layer.
*/
interface PopupApi {
  attach(origin: ElementOrSelector, options?: RenderOptions): Promise<Layer>
  close(options?: LayerCloseOptions): Promise<void>
  url(): string | undefined
  coveredUrl(): string | undefined
  readonly config: OverlayDefaults
  contains(elementOrSelector: ElementOrSelector): boolean
  isOpen(): boolean
  sync(): void
}

declare module '../unpoly.js' {
  interface Up {
    popup: PopupApi
  }
}

up.popup = {
  attach(origin, options = {}) {
    origin = up.fragment.get(origin)
    up.migrate.deprecated('up.popup.attach(origin)', "up.layer.open({ origin, mode: 'popup' })")
    return up.layer.open({ ...options, origin, layer: 'new', mode: 'popup' })
  },

  close(options = {}) {
    up.migrate.deprecated('up.popup.close()', 'up.layer.dismiss()')
    up.layer.dismiss(null, options)
    return up.migrate.formerlyAsync('up.layer.dismiss()')
  },

  url() {
    up.migrate.deprecated('up.popup.url()', 'up.layer.location')
    return up.layer.location
  },

  coveredUrl() {
    up.migrate.deprecated('up.popup.coveredUrl()', 'up.layer.parent.location')
    return up.layer.parent?.location
  },

  get config() {
    up.migrate.deprecated('up.popup.config', 'up.layer.config.popup')
    return up.layer.config.popup
  },

  contains(elementOrSelector) {
    up.migrate.deprecated('up.popup.contains()', 'up.layer.contains()')
    let element = up.fragment.get(elementOrSelector)
    return !!element && up.layer.contains(element)
  },

  isOpen() {
    up.migrate.deprecated('up.popup.isOpen()', 'up.layer.isOverlay()')
    return up.layer.isOverlay()
  },

  sync() {
    up.migrate.deprecated('up.popup.sync()', 'up.Layer#sync()')
    for (let layer of up.layer.stack) {
      layer.sync()
    }
  }
}

// Don't warn when a script enumerates up.popup. Getters in an object literal are enumerable.
Object.defineProperty(up.popup, 'config', { enumerable: false })

up.migrate.renamedEvent('up:popup:open', 'up:layer:open')
up.migrate.renamedEvent('up:popup:opened', 'up:layer:opened')
up.migrate.renamedEvent('up:popup:close', 'up:layer:dismiss')
up.migrate.renamedEvent('up:popup:closed', 'up:layer:dismissed')

up.migrate.targetMacro('up-popup', { 'up-layer': 'new popup' }, '[up-layer="new popup"]')
