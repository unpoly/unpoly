import * as u from './util.js'
import * as e from './element.js'
import { newConfig } from './util/config.js'
import { fail, guard } from './error.js'
import { assertEmitted, on } from './event.js'
import { getSmart, getSubtree, type RenderOptions } from './fragment.js'
import { isBooted, isEvaling } from './framework.js'
import { layerStack } from './layer.js'
import { printToStandard } from './log.js'
import { mockable } from './mockable.js'
import type * as t from './script/types.js'
export type * from './script/types.js'
import { CSPInfo, evalCallback, NonceableCallback } from './script/csp.js'
export { CSPInfo, NonceableCallback }
export {
  adoptDetachedHeadAsset, adoptNewFragment, adoptRenderOptionsFromHeader, warnOfUnsafeCSP,
} from './script/csp.js'
import { HelloFragment } from './script/hello_fragment.js'


export const scriptConfig = newConfig('up.script.config', (): t.ScriptConfig => ({
  cspNonce() { return e.metaContent('csp-nonce') },
  cspWarnings: true,
  scriptElementPolicy: 'auto',
  evalCallbackPolicy: 'auto',
  assetSelectors: [
    'link[rel=stylesheet]',
    'script[src]',
    '[up-asset]'
  ],
  noAssetSelectors: [
    '[up-asset=false]',
  ],
  nonceableAttributes: [
    'up-watch',
    'up-on-keep',
    'up-on-hungry',
    'up-on-opened',
    'up-on-accept',
    'up-on-accepted',
    'up-on-dismiss',
    'up-on-dismissed',
    'up-on-loaded',
    'up-on-rendered',
    'up-on-finished',
    'up-on-error',
    'up-on-offline',
  ],
  scriptSelectors: [
    'script:not([type])',
    'script[type="text/javascript"]',
    'script[type="module"]',
    'script[type="importmap"]',
  ],
  noScriptSelectors: [
    'script[type="application/ld+json"]'
  ]
}))

const SYSTEM_MACRO_PRIORITIES: Record<string, number> = {
  '[up-back]': -100,        // sets [up-href] to previous URL
  '[up-clickable]': -200,   // A11y for link-like elements
  '[up-drawer]': -200,      //
  '[up-modal]': -200,       //
  '[up-cover]': -200,       //
  '[up-popup]': -200,       //
  '[up-tooltip]': -200,     //
  '[up-dash]': -200,        // sets [up-href] unless already set, also other [up-*] attributes
  '[up-flashes]': -200,     //
  '[up-expand]': -300,      // distributes [up-*] attributes to parents
  '[data-method]': -400,    // converts [data-method] to [up-method] only if link has followable [up-*] attributes
  '[data-confirm]': -400,   // converts [data-confirm] to [up-confirm] only if link has followable [up-*] attributes
  '[up-keep]': 9999999999,  // cache the identity of e.g. [up-keep="same-html"] before any client-side changes
}

let registeredCompilers: t.Compiler[] = []
let registeredMacros: t.Compiler[] = []

export function registerCompiler<E extends Element = HTMLElement>(selector: t.CompilerSelector, callback: t.CompilerCallback<E>): void
export function registerCompiler<E extends Element = HTMLElement>(selector: t.CompilerSelector, options: t.BatchCompilerOptions, callback: t.BatchCompilerCallback<E>): void
export function registerCompiler<E extends Element = HTMLElement>(selector: t.CompilerSelector, options: t.CompilerOptions, callback: t.CompilerCallback<E>): void
export function registerCompiler(...args: any[]): void {
  registerProcessor(args)
}

export function registerMacro<E extends Element = HTMLElement>(selector: t.CompilerSelector, callback: t.CompilerCallback<E>): void
export function registerMacro<E extends Element = HTMLElement>(selector: t.CompilerSelector, options: t.BatchCompilerOptions, callback: t.BatchCompilerCallback<E>): void
export function registerMacro<E extends Element = HTMLElement>(selector: t.CompilerSelector, options: t.CompilerOptions, callback: t.CompilerCallback<E>): void
export function registerMacro(...args: any[]): void {
  registerProcessor(args, { macro: true })
}

export function registerAttrCompiler<E extends Element = HTMLElement>(attr: string, callback: t.AttrCompilerCallback<string | true, E>): void
export function registerAttrCompiler<E extends Element = HTMLElement>(attr: string, options: t.AttrCompilerOptions & { defaultValue: string }, callback: t.AttrCompilerCallback<string, E>): void
export function registerAttrCompiler<E extends Element = HTMLElement>(attr: string, options: t.AttrCompilerOptions, callback: t.AttrCompilerCallback<string | true, E>): void
export function registerAttrCompiler(...args: any[]): void {
  let [attr, options, valueCallback] = parseProcessorArgs(args)

  let selector = `[${attr}]`
  let { defaultValue } = options

  let callback: t.CompilerCallback = (element) => {
    let value = e.booleanOrStringAttr(element, attr)

    // Do nothing in a case like [up-defer=false]
    if (value === false) return

    // Some attributes have a default value in case no value is given.
    // E.g. [up-defer=""] or [up-defer="true"] defaults to [up-defer="insert"].
    if (u.isDefined(defaultValue) && value === true) value = defaultValue

    return valueCallback(element, value)
  }
  registerProcessor([selector, options, callback])
}

function detectSystemMacroPriority(macroSelector: t.CompilerSelector): number {
  macroSelector = u.evalOption(macroSelector)
  for (let substr in SYSTEM_MACRO_PRIORITIES) {
    if (macroSelector.indexOf(substr) >= 0) {
      return SYSTEM_MACRO_PRIORITIES[substr]
    }
  }
  fail('Unregistered priority for system macro %o', macroSelector)
}

function registerProcessor(args: any[], overrides: t.CompilerOptions = {}): void {
  let processor = buildProcessor(args, overrides)

  if (processor.macro) {
    if (isEvaling()) {
      // Don't allow the default priority (0) for Unpoly's own macros.
      processor.priority ||= detectSystemMacroPriority(processor.selector)

    }
    insertProcessor(registeredMacros, processor)
  } else {
    insertProcessor(registeredCompilers, processor)
  }

}

const parseProcessorArgs = function(args: any[]): any[] {
  return u.parseArgs(args, 'val', 'options', 'callback')
}

function buildProcessor(args: any[], overrides: t.CompilerOptions): t.Compiler {
  let [selector, options, callback] = parseProcessorArgs(args)

  options = u.newOptions(options, {
    selector,
    isDefault: isEvaling(),
    priority: 0,
    batch: false,
    rerun: false,
  })
  return Object.assign(callback, options, overrides)
}

function insertProcessor(queue: t.Compiler[], newCompiler: t.Compiler): t.Compiler {
  let existingCompiler
  let index = 0
  while ((existingCompiler = queue[index]) && (existingCompiler.priority >= newCompiler.priority)) {
    index += 1
  }
  queue.splice(index, 0, newCompiler)

  if (isBooted()) {
    if (newCompiler.priority === 0) {
      for (let layer of layerStack.layers) {
        hello(layer.element, { layer, compilers: [newCompiler], macros: [], insertedEvent: false })
      }
    } else {
      printToStandard('up.compiler()', 'Compiler with priority (%s) was registered after booting Unpoly. Compiler will run for future fragments only.', newCompiler.selector)
    }
  }

  return newCompiler
}

export function registerDestructor(element: t.ScriptedElement, value: any): void {
  let fns = u.scanFunctions(value)
  if (!fns.length) return

  // (A) If the element has already been destroyed, registering a destructor function
  //     has no effect. No one will ever look at the destructor registry again.
  //     In this case we immediately call the destructor function.
  // (B) Because destructors are called *after* an destroy animation, we don't need
  //     to check .up-destroying here. We can use the cheaper Element#isConnected instead.
  if (element.isConnected) {
    let registry = (element.upDestructors ||= buildDestructorRegistry(element))
    registry.guard(fns)
  } else {
    // The element was destroyed before an async compiler function resolved.
    printToStandard('up.destructor()', 'Immediately calling destructor for detached element (%o)', element)
    for (let fn of fns) guard(fn, element)
  }
}

function buildDestructorRegistry(element: Element): u.Cleaner {
  let registry = u.cleaner()
  registry(e.addClassTemp(element, 'up-can-clean'))
  return registry
}

export function hello(element: e.ElementOrSelector, options: t.HelloOptions = {}): Promise<Element> {
  // If passed a selector, up.fragment.get() will prefer a match on the current layer.
  element = getSmart(element, options)!

  // We default to running all registered processor fns, but callers
  // can opt to only run given processor arguments.
  let macros = options.macros ?? registeredMacros
  let compilers = options.compilers ?? registeredCompilers

  const pass = new HelloFragment(element, macros, compilers, options)
  return pass.run()
}

export function clean(fragment: Element, options: u.PlainObject = {}): void {
  // fragment functions usually ignore elements that are being destroyed
  let cleanables = getSubtree(fragment, '.up-can-clean', { ...options, destroying: true })

  for (let cleanable of cleanables) {
    // In the case of [up-keep] elements we may run on a clone that matches .up-can-clean
    // but has no { upDestructors } property.
    let registry = u.pluckKey(cleanable, 'upDestructors')
    registry?.clean(cleanable)
  }
}

// The element may also be a selector.
export const readData = mockable(function readData(element: any): any {
  // If passed a selector, up.fragment.get() will prefer a match on the current layer.
  element = getSmart(element)

  return element.upData ||= buildData(element)
})

function buildData(element: t.ScriptedElement & HTMLElement): any {
  let parsedJSON = e.jsonAttr(element, 'up-data') ?? {}

  // If the [up-data] JSON isn't an object then we cannot offer live merging
  // of [up-data] and [data-...] attributes.
  //
  // It would be better to parse this lazily, but I don't want to pay
  // the bytes for a second Proxy handler when dealing with this edge case.
  if (!u.isOptions(parsedJSON)) {
    return parsedJSON
  }

  return {
    ...element.upTemplateData,
    ...element.dataset,
    ...parsedJSON,
    ...element.upCompileData,
  }
}

export function findAssets(head: ParentNode = document.head): NodeListOf<Element> {
  return head.querySelectorAll(scriptConfig.selector('assetSelectors'))
}

export function assertAssetsOK(newAssets: u.List<Element>, renderOptions: RenderOptions): void {
  let { response } = renderOptions
  let oldAssets = findAssets()

  if (assetsIdentity(oldAssets) !== assetsIdentity(newAssets)) {
    assertEmitted('up:assets:changed', { oldAssets, newAssets, renderOptions, response })
  }
}

function assetsIdentity(assets: u.List<Element>): string {
  return u.map(assets, assetIdentity).join()
}

function assetIdentity(assetElement: Element): string {
  // Remove the [nonce] attribute which the browser usually masks from the outerHTML of <script> elements.
  // However it isn't masked for inert scripts (e.g. when they fail a CSP check).
  return e.removeAttrsFromHTML(assetElement.outerHTML, ['nonce'])
}

export function block(root: ParentNode): void {
  for (let script of findScripts(root)) {
    script.type = 'up-blocked-script'
  }
}

export function findScripts(root: ParentNode, condition = ''): u.List<HTMLScriptElement> {
  let selector = scriptConfig.selector('scriptSelectors', condition)
  return e.subtree(root, selector) as u.List<HTMLScriptElement>
}

export function isScript(value: Element): value is HTMLScriptElement {
  return scriptConfig.matches(value, 'scriptSelectors')
}

export function callbackAttr(element: Element, attrName: string, parseOpts?: t.ParseCallbackOptions): u.AnyFunction | undefined {
  return e.parseAttr(element, attrName, (code) => {
    let fn = parseCallback(code, parseOpts)
    // Emulate the behavior of the `onclick` attribute, where `this` refers to the clicked element.
    return fn.bind(element)
  })
}

export function parseCallback(code: string, { argNames = ['event'], expandObject = false }: t.ParseCallbackOptions = {}): u.AnyFunction {
  // Return an unbound function so callers can bind to an object of their choice.
  return function(...argValues) {
    let callArgNames = argNames

    if (expandObject) {
      let object = argValues[0]
      callArgNames = [...argNames, ...expandObject]
      argValues = [object, ...Object.values(u.pick(object, expandObject))]
    }

    const nonceableCallback = NonceableCallback.fromCallbackString(code)
    const evalEnv = { thisContext: this, argNames: callArgNames, argValues }
    return evalCallback(nonceableCallback, evalEnv)
  }
}

export const cspNonce = mockable(function cspNonce(): string | undefined {
  return u.evalOption(scriptConfig.cspNonce)
})

/*
Resets the list of registered compiler directives to the
moment when the framework was booted.
*/
function reset(): void {
  registeredCompilers = u.filterList(registeredCompilers, 'isDefault')
  registeredMacros = u.filterList(registeredMacros, 'isDefault')
}

export function install(): void {
  on('up:framework:reset', reset)
}

export const api = {
  script: {
    config: scriptConfig,
    compiler: registerCompiler,
    macro: registerMacro,
    destructor: registerDestructor,
    hello,
    data: readData,
  },
  compiler: registerCompiler,
  destructor: registerDestructor,
  macro: registerMacro,
  data: readData,
  hello,
}
