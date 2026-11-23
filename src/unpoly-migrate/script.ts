import type { Compiler, CompilerMeta, CompilerOptions, CompilerSelector } from '../unpoly/script.js'
import type { AnyFunction } from '../unpoly/util.js'

const u = up.util

// The function for up.$compiler() and up.$macro(). Like a compiler function, but it gets a jQuery
// collection instead of the element (or of all elements with { batch: true }). We have no types for jQuery.
// oxlint-disable-next-line typescript/no-explicit-any -- a jQuery collection, and the element's data of any type
type JQueryCompilerCallback = ($element: any, data: any, meta: CompilerMeta) => unknown

// A deprecated alias has the type of the namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    $compiler(selector: CompilerSelector, callback: JQueryCompilerCallback): void
    $compiler(selector: CompilerSelector, options: CompilerOptions, callback: JQueryCompilerCallback): void
    $macro(selector: CompilerSelector, callback: JQueryCompilerCallback): void
    $macro(selector: CompilerSelector, options: CompilerOptions, callback: JQueryCompilerCallback): void
    readonly syntax: Up['script']
  }
}

up.migrate.renamedNamespace('syntax', 'script')

up.script.config.patch(function(config) {
  // The 3.14.0 release notes named this setting wrongly, and apps copied the name.
  up.migrate.renamedProperty(config, 'callbackPolicy', 'evalCallbackPolicy', { warning: 'There is no setting up.script.config.callbackPolicy. Use up.script.config.evalCallbackPolicy instead.' })
})

// A compiler registered with the { keep } option, which core no longer knows.
interface LegacyCompiler extends Compiler {
  keep?: boolean | string
}

// Core calls this hook (HelloFragment).
up.migrate.postCompile = function(elements, compiler: LegacyCompiler) {
  // up.compiler() has a legacy { keep } option that will automatically
  // set [up-keep] on the elements it compiles
  let keepValue
  if (keepValue = compiler.keep) {
    up.migrate.warn('The { keep } option for up.compiler() has been removed. Have the compiler set an [up-keep] attribute instead (found in compiler for "%s").', compiler.selector)
    const value = u.isString(keepValue) ? keepValue : ''
    for (let element of elements) {
      element.setAttribute('up-keep', value)
    }
  }
}

up.migrate.targetMacro = function(queryAttr, fixedResultAttrs, replacement) {
  up.macro(`[${queryAttr}]`, function(link) {
    up.migrate.warn('Attribute [%s] has been deprecated. Use %s instead (found in %o).', queryAttr, replacement, link)
    let optionalTarget
    const resultAttrs = u.copy(fixedResultAttrs)
    if ((optionalTarget = link.getAttribute(queryAttr))) {
      resultAttrs['up-target'] = optionalTarget
    } else {
      resultAttrs['up-follow'] = ''
    }
    up.element.setMissingAttrs(link, resultAttrs)
    link.removeAttribute(queryAttr)
  })
}

up.$compiler = function(...definitionArgs: unknown[]) {
  up.migrate.warn('up.$compiler() has been deprecated. Instead use up.compiler() with a callback that wraps the given native element in a jQuery collection.')

  let $fn = definitionArgs.pop() as AnyFunction

  return (up.compiler as AnyFunction)(...definitionArgs, function(element: Element, ...fnArgs: unknown[]) {
    let $element = jQuery(element)
    return $fn($element, ...fnArgs)
  })
}

up.$macro = function(...definitionArgs: unknown[]) {
  up.migrate.warn('up.$macro() has been deprecated. Instead use up.macro() with a callback that wraps the given native element in a jQuery collection.')

  let $fn = definitionArgs.pop() as AnyFunction

  return (up.macro as AnyFunction)(...definitionArgs, function(element: Element, ...fnArgs: unknown[]) {
    let $element = jQuery(element)
    return $fn($element, ...fnArgs)
  })
}

// Core calls this hook in renderFromResponse().
up.migrate.processHelloMeta = function(meta, response) {
  Object.defineProperty(meta, 'response', { get() {
    up.migrate.warn('Accessing meta.response from a compiler has been deprecated without replacement. Avoid fragments that compile differently for the initial page load vs. subsequent fragment updates.')
      return response
  } })
}

let modernHello = up.hello
let errorMessage = 'up.hello() is now async and returns a promise'

class WasElementIsPromise extends Promise<unknown> {}
up.migrate.defineThrowingProps(WasElementIsPromise.prototype, Element.prototype, errorMessage)
up.migrate.defineThrowingProps(WasElementIsPromise.prototype, Node.prototype, errorMessage)
up.migrate.defineThrowingProps(WasElementIsPromise.prototype, EventTarget.prototype, errorMessage)

up.hello = function(element, ...args) {
  let elementPromise = modernHello(element, ...args)
  return WasElementIsPromise.resolve(elementPromise)
}
