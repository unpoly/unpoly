import './layer.sass'
import * as u from './util.js'
import { newConfig } from './util/config.js'
import { on } from './event.js'
import { render, RenderOptions } from './fragment.js'
import type * as t from './layer/types.js'
export type * from './layer/types.js'
import { Layer } from './layer/base.js'
export { Layer }
import { LayerStack } from './layer/layer_stack.js'
export { type Overlay } from './layer/modes/overlay.js'
export { OVERLAY_VISUAL_KEYS, UNSET_OVERLAY_VISUALS } from './layer/overlay_visuals.js'
export { Tether } from './layer/tether.js'

// The layer class for each mode, like ModalLayer. The entry passes them to install(), so only
// the entry and the mode classes themselves import a mode class (see the cycle rules in src/unpoly.ts).
let layerClasses: (typeof Layer)[] = []

export const layerConfig = newConfig('up.layer.config', (): t.LayerConfig => ({
  mode: 'modal',
  any: {
    mainTargets: [
      "[up-main='']",
      'main',
      ':layer' // this is <body> for the root layer
    ]
  },
  root: {
    mainTargets: ['[up-main~=root]'],
    history: true
  },
  overlay: {
    mainTargets: ['[up-main~=overlay]'],
    openAnimation: 'fade-in',
    closeAnimation: 'fade-out',
    dismissLabel: '×',
    dismissARIALabel: 'Dismiss dialog',
    dismissible: true,
    history: 'auto',
    trapFocus: true,
  },
  cover: {
    mainTargets: ['[up-main~=cover]']
  },
  drawer: {
    mainTargets: ['[up-main~=drawer]'],
    backdrop: true,
    position: 'left',
    size: 'medium',
    openAnimation(layer: Layer) {
      switch (layer.position) {
        case 'left': return 'move-from-left'
        case 'right': return 'move-from-right'
      }
    },
    closeAnimation(layer: Layer) {
      switch (layer.position) {
        case 'left': return 'move-to-left'
        case 'right': return 'move-to-right'
      }
    }
  },
  modal: {
    mainTargets: ['[up-main~=modal]'],
    backdrop: true,
    size: 'medium'
  },
  popup: {
    mainTargets: ['[up-main~=popup]'],
    position: 'bottom',
    size: 'medium',
    align: 'left',
    dismissible: 'outside key',
    trapFocus: false,
  },
  foreignOverlaySelectors: ['dialog'],
}))

// Set by install().
export let layerStack: LayerStack = null!

let handlers: unknown[] = []

export function mainTargets(mode: t.LayerMode): string[] {
  return u.flatMap(modeConfigs(mode), 'mainTargets')
}

/*
Returns an array of config objects that apply to the given mode name.

The config objects are in descending order of specificity.
*/
function modeConfigs(mode: t.LayerMode): t.LayerDefaults[] {
  if (mode === 'root') {
    return [layerConfig.root, layerConfig.any]
  } else {
    return [layerConfig[mode], layerConfig.overlay, layerConfig.any]
  }
}

function normalizeLayerOption(options: t.LayerLookupOptions): void {
  if (options.layer instanceof Layer) return

  up.migrate.handleLayerOptions?.(options)

  if (u.isGiven(options.layer)) { // might be the number 0, which is falsy
    let match = String(options.layer).match(/^(new|shatter|swap)( (\w+))?/)
    if (match) {
      options.layer = 'new'

      const openMethod = match[1]
      const shorthandMode = match[3]

      // The mode may come from one of these sources:
      // (1) As { mode } option
      // (2) As a { layer } short hand like { layer: 'new popup' }
      // (3) As the default in config.mode
      options.mode ||= shorthandMode || layerConfig.mode

      if (openMethod === 'swap') {
        // If an overlay is already open, we replace that with a new overlay.
        // If we're on the root layer, we open an overlay.
        if (layerStack.current.isOverlay()) {
          options.baseLayer = 'parent'
        }
      } else if (openMethod === 'shatter') {
        // Dismiss all overlays and open a new overlay.
        options.baseLayer = 'root'
      }
    }
  // If no options.layer is given we still want to avoid updating "any" layer.
  // Other options might have a hint for a more appropriate layer.
  } else if (u.isElementLike(options.target)) {
    // If we are targeting an actual Element or jQuery collection (and not
    // a selector string) we operate in that element's layer.
    options.layer = layerStack.get(options.target, { normalizeLayerOptions: false })
  } else if (options.origin) {
    // Links update their own layer by default.
    options.layer = 'origin'
  } else {
    // If nothing is given, we assume the current layer
    options.layer = 'current'
  }
}

function setBaseLayerOption(options: t.LayerLookupOptions): void {
  if (options.baseLayer instanceof Layer) return

  // Remember the layer that was current when the request was made,
  // so changes with `{ layer: 'new' }` will know what to stack on.
  // Note if options.baseLayer is given, up.layer.get('current', options) will
  // return the resolved version of that.
  options.baseLayer = layerStack.get('current', { ...options, normalizeLayerOptions: false })
}

export function normalizeLayerOptions(options: t.LayerLookupOptions): void {
  normalizeLayerOption(options)
  options.context ??= {}
  setBaseLayerOption(options)
}

export function buildLayer(options: u.PlainObject, beforeNew?: (options: u.PlainObject) => u.PlainObject): Layer {
  const { mode } = options
  const Class = layerClasses.find((Class) => Class.mode === mode)

  // modeConfigs() returns the most specific options first,
  // but in merge() below later args override keys from earlier args.
  const configs = modeConfigs(mode).toReversed()

  let handleDeprecatedConfig = up.migrate.handleLayerConfig
  if (handleDeprecatedConfig) {
    configs.forEach(handleDeprecatedConfig)
  }

  // We allow to pass the open animation as up.layer.open({ animation, duration, easing })
  // or a[up-animation][up-duration][up-easing] options.
  options.openAnimation ??= u.pluckKey(options, 'animation')
  options.openDuration ??= u.pluckKey(options, 'duration')
  options.openEasing ??= u.pluckKey(options, 'easing')

  options = u.mergeDefined(...configs, { mode, stack: layerStack }, options)

  if (beforeNew) {
    options = beforeNew(options)
  }

  // An unknown { mode } has no class, and throws a TypeError here.
  return new Class!(options)
}

function reset(): void {
  layerStack.reset()
  handlers = u.filterList(handlers, 'isDefault')
}

export async function open(options?: RenderOptions): Promise<Layer> {
  options = u.newOptions(options, {
    layer: 'new',
    defaultToEmptyContent: true,
    navigate: true
  })

  // Even if we are given { content } we need to pipe this through up.render()
  // since a lot of options processing is happening there.
  //
  // Defaults for the layer mode will be merged in later, by OpenLayer via up.layer.build().
  let result = await render(options)
  return result.layer
}

export function ask(options: RenderOptions = {}): Promise<any> {
  return new Promise(function(resolve, reject) {
    open(RenderOptions.chainCallbacks(options, {
      onAccepted: (event: t.LayerCloseEvent) => resolve(event.value),
      onDismissed: (event: t.LayerCloseEvent) => reject(event.value),
    }))
  })
}

// The layer classes' selectors never change, so we only build this once (in install()).
let anySelector: string

// Returns the closest ancestor (or self) that is a layer element. This looks at the DOM, not the
// layer stack: for an element in a closing overlay it returns that overlay's element, while
// up.layer.get(element) returns nothing.
export function closestLayerElement(element: Element): Element | null {
  return element.closest(anySelector)
}

export function optionToString(option: t.LayerOption): string {
  if (u.isString(option)) {
    return `layer "${option}"`
  } else {
    return option.toString()
  }
}

export function isWithinForeignOverlay(element: Element): boolean {
  let selector = layerConfig.selector('foreignOverlaySelectors')
  return !!(selector && element.closest(selector))
}



export function install(classes: (typeof Layer)[]): void {
  layerClasses = classes
  anySelector = u.map(classes, (Class) => Class.selector()).join()

  on('up:fragment:destroyed', function() {
    layerStack.sync()
  })

  on('up:framework:evaled', function() {
    // Due to circular dependencies we must delay initialization of the stack until all of
    // Unpoly's namespaces have been evaled. We cannot delay initialization until up:framework:boot,
    // since by then user scripts have run and event listeners will no longer register as "default".
    layerStack = new LayerStack()
  })

  on('up:framework:reset', reset)
}

export const api = {
  layer: {
    config: layerConfig,
    open,
    ask,
    get stack() { return layerStack.layers },
    get(...args: t.LayerLookupArgs): Layer | undefined { return layerStack.get(...args) },
    getAll(...args: t.LayerLookupArgs): Layer[] { return layerStack.getAll(...args) },
    get root() { return layerStack.root },
    get overlays() { return layerStack.overlays },
    get current() { return layerStack.current },
    get front() { return layerStack.front },
    get count() { return layerStack.count },
    dismissOverlays(...args: [value?: any, options?: t.LayerCloseOptions]): void { return layerStack.dismissOverlays(...args) },
  },
}

// TypeScript can't see the shortcuts that defineDelegates() adds below, so we declare them on `up`.
// `satisfies` checks that the list below names only these keys, but not that it names all of them.
type LayerShortcut =
  'accept' | 'dismiss' | 'isRoot' | 'isOverlay' | 'isFront' | 'on' | 'off' | 'emit' | 'parent' | 'history' |
  'location' | 'mode' | 'context' | 'element' | 'contains' | 'size' | 'affix'

declare module '../unpoly.js' {
  interface Up {
    // Layer#isOverlay() narrows the layer to an Overlay, but up.layer is never one.
    layer: CoreApi['layer'] & Pick<Layer, Exclude<LayerShortcut, 'isOverlay'>> & { isOverlay(): boolean }
  }
}

// Shortcuts for the current layer, like `up.layer.accept()` for `up.layer.current.accept()`.
// A function is bound to the layer that is current when it is accessed, not when it is called.
u.defineDelegates(api.layer, [
  'accept',
  'dismiss',
  'isRoot',
  'isOverlay',
  'isFront',
  'on',
  'off',
  'emit',
  'parent',
  'history',
  'location',
  'mode',
  'context',
  'element',
  'contains',
  'size',
  'affix'
] satisfies LayerShortcut[], () => layerStack.current)
