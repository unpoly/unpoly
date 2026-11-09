/*-
@namespace up.script
*/

// A deprecated alias has the type of the namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    $compiler: any
    $macro: any
    readonly syntax: Up['script']
  }
}

const u = up.util

up.migrate.renamedNamespace('syntax', 'script')

up.script.config.patch(function(config) {
  // The 3.14.0 release notes named this setting wrongly, and apps copied the name.
  up.migrate.renamedProperty(config, 'callbackPolicy', 'evalCallbackPolicy', { warning: 'There is no setting up.script.config.callbackPolicy. Use up.script.config.evalCallbackPolicy instead.' })
})

// Core calls this hook (HelloFragment).
// The compiler is any because its legacy { keep } option no longer exists in core's types.
up.migrate.postCompile = function(elements: Element[], compiler: any) {
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

up.migrate.targetMacro = function(queryAttr: string, fixedResultAttrs: Record<string, string>, replacement: string) {
  up.macro(`[${queryAttr}]`, function(link: Element) {
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

/*-
Registers a function to be called when an element with
the given selector is inserted into the DOM. The function is called
with each matching element as a
[jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).

If you're not using jQuery, use `up.compiler()` instead, which calls
the compiler function with a native element.

## Example

This jQuery compiler will insert the current time into a
`<div class='current-time'></div>`:

```js
up.$compiler('.current-time', function($element) {
  let now = new Date()
  $element.text(now.toString())
})
```

@function up.$compiler
@param {string} selector
  The selector to match.
@param {Object} [options]
  See [`options` argument for `up.compiler()`](/api/up.compiler#parameters).
@param {Function($element, data)} compiler
  @like up.compiler
@deprecated
  Use `up.compiler()` with a callback that wraps the given native element in a jQuery collection.
*/
up.$compiler = function(...definitionArgs) {
  up.migrate.warn('up.$compiler() has been deprecated. Instead use up.compiler() with a callback that wraps the given native element in a jQuery collection.')

  let $fn = definitionArgs.pop()

  return (up.compiler as any)(...definitionArgs, function(element: Element, ...fnArgs) {
    let $element = jQuery(element)
    return $fn($element, ...fnArgs)
  })
}


/*-
Registers a [compiler](/api/up.compiler) that is run before all other compilers.
The compiler function is called with each matching element as a
[jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).

If you're not using jQuery, use `up.macro()` instead, which calls
the macro function with a native element.

## Example

```js
up.$macro('[content-link]', function($link) {
  $link.attr({
    'up-target': '.content',
    'up-transition': 'cross-fade',
    'up-duration': '300'
  })
})
```

@function up.$macro
@param {string} selector
  The selector to match.
@param {Object} options
  See [`options` argument for `up.compiler()`](/api/up.compiler#parameters).
@param {Function($element, data)} macro
  @like up.macro
@deprecated
  Use `up.macro()` with a callback that wraps the given native element in a jQuery collection.
*/
up.$macro = function(...definitionArgs) {
  up.migrate.warn('up.$macro() has been deprecated. Instead use up.macro() with a callback that wraps the given native element in a jQuery collection.')

  let $fn = definitionArgs.pop()

  return (up.macro as any)(...definitionArgs, function(element: Element, ...fnArgs) {
    let $element = jQuery(element)
    return $fn($element, ...fnArgs)
  })
}

// Core calls this hook (ChangeFromResponse).
up.migrate.processHelloMeta = function(meta: object, response: any) {
  Object.defineProperty(meta, 'response', { get() {
    up.migrate.warn('Accessing meta.response from a compiler has been deprecated without replacement. Avoid fragments that compile differently for the initial page load vs. subsequent fragment updates.')
      return response
  } })
}

let modernHello = up.hello
let errorMessage = 'up.hello() is now async and returns a promise'

class WasElementIsPromise extends Promise<any> {}
up.migrate.defineThrowingProps(WasElementIsPromise.prototype, Element.prototype, errorMessage)
up.migrate.defineThrowingProps(WasElementIsPromise.prototype, Node.prototype, errorMessage)
up.migrate.defineThrowingProps(WasElementIsPromise.prototype, EventTarget.prototype, errorMessage)

up.hello = function(element, ...args) {
  let elementPromise = modernHello(element, ...args)
  return WasElementIsPromise.resolve(elementPromise)
}
