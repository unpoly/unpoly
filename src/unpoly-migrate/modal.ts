type ElementOrSelector = import('../unpoly/element.js').ElementOrSelector
type RenderJob = import('../unpoly/fragment.js').RenderJob
type RenderOptions = import('../unpoly/fragment.js').RenderOptions
type Layer = import('../unpoly/layer.js').Layer
type LayerCloseOptions = import('../unpoly/layer.js').LayerCloseOptions
type OverlayDefaults = import('../unpoly/layer.js').OverlayDefaults

/**
The type of `up.modal`, whose functions moved to up.layer.
*/
interface ModalApi {
  visit(url: string, options?: RenderOptions): Promise<Layer>
  follow(link: ElementOrSelector, options?: RenderOptions): RenderJob
  extract(target: string, html: string, options?: RenderOptions): Promise<Layer>
  close(options?: LayerCloseOptions): Promise<void>
  url(): string | undefined
  coveredUrl(): string | undefined
  readonly config: OverlayDefaults
  contains(elementOrSelector: ElementOrSelector): boolean
  isOpen(): boolean
  readonly flavors: never
  flavor(): never
}

declare module '../unpoly.js' {
  interface Up {
    modal: ModalApi
  }
}

const FLAVORS_ERROR = new Error('up.modal.flavors has been removed without direct replacement. You may give new layers a { class } or modify layer elements on up:layer:open.')

up.modal = {

  visit(url, options = {}) {
    up.migrate.deprecated('up.modal.visit(url)', 'up.layer.open({ url, mode: "modal" })')
    return up.layer.open({ ...options, url, mode: 'modal' })
  },

  follow(link, options = {}) {
    up.migrate.deprecated('up.modal.follow(link)', 'up.follow(link, { layer: "new modal" })')
    return up.follow(link, { ...options, layer: 'new', mode: 'modal' })
  },

  extract(target, html, options = {}) {
    up.migrate.deprecated('up.modal.extract(target, document)', 'up.layer.open({ document, mode: "modal" })')
    return up.layer.open({ ...options, target, document: html, layer: 'new', mode: 'modal' })
  },

  close(options = {}) {
    up.migrate.deprecated('up.modal.close()', 'up.layer.dismiss()')
    up.layer.dismiss(null, options)
    return up.migrate.formerlyAsync('up.layer.dismiss()')
  },

  url() {
    up.migrate.deprecated('up.modal.url()', 'up.layer.location')
    return up.layer.location
  },

  coveredUrl() {
    up.migrate.deprecated('up.modal.coveredUrl()', 'up.layer.parent.location')
    return up.layer.parent?.location
  },

  get config() {
    up.migrate.deprecated('up.modal.config', 'up.layer.config.modal')
    return up.layer.config.modal
  },

  contains(elementOrSelector) {
    up.migrate.deprecated('up.modal.contains()', 'up.layer.contains()')
    let element = up.fragment.get(elementOrSelector)
    return !!element && up.layer.contains(element)
  },

  isOpen() {
    up.migrate.deprecated('up.modal.isOpen()', 'up.layer.isOverlay()')
    return up.layer.isOverlay()
  },

  get flavors(): never {
    throw FLAVORS_ERROR
  },

  flavor(): never {
    throw FLAVORS_ERROR
  }
}

// Don't warn when a script enumerates up.modal. Getters in an object literal are enumerable.
Object.defineProperty(up.modal, 'config', { enumerable: false })

up.migrate.renamedEvent('up:modal:open', 'up:layer:open')
up.migrate.renamedEvent('up:modal:opened', 'up:layer:opened')
up.migrate.renamedEvent('up:modal:close', 'up:layer:dismiss')
up.migrate.renamedEvent('up:modal:closed', 'up:layer:dismissed')

up.migrate.targetMacro('up-modal', { 'up-layer': 'new modal' }, '[up-layer="new modal"]')

up.migrate.targetMacro('up-drawer', { 'up-layer': 'new drawer' }, '[up-layer="new drawer"]')
