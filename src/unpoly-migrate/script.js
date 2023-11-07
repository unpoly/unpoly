/*-
@module up.script
*/

const u = up.util
const e = up.element

up.migrate.renamedPackage('syntax', 'script')

up.migrate.postCompile = function(elements, compiler) {
  // up.compiler() has a legacy { keep } option that will automatically
  // set [up-keep] on the elements it compiles
  let keepValue
  if (keepValue = compiler.keep) {
    up.migrate.warn('The { keep: true } option for up.compiler() has been removed. Have the compiler set [up-keep] attribute instead.')
    const value = u.isString(keepValue) ? keepValue : ''
    for (let element of elements) {
      element.setAttribute('up-keep', value)
    }
  }
}

up.migrate.targetMacro = function(queryAttr, fixedResultAttrs, callback) {
  up.macro(`[${queryAttr}]`, function(link) {
    let optionalTarget
    const resultAttrs = u.copy(fixedResultAttrs)
    if ((optionalTarget = link.getAttribute(queryAttr))) {
      resultAttrs['up-target'] = optionalTarget
    } else {
      resultAttrs['up-follow'] = ''
    }
    e.setMissingAttrs(link, resultAttrs)
    link.removeAttribute(queryAttr)
    callback?.()
  })
}

/*-
Registers a function to be called when an element with
the given selector is inserted into the DOM. The function is called
with each matching element as a
[jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).

If you're not using jQuery, use `up.compiler()` instead, which calls
the compiler function with a native element.

### Example

This jQuery compiler will insert the current time into a
`<div class='current-time'></div>`:

```js
up.$compiler('.current-time', function($element) {
  var now = new Date()
  $element.text(now.toString())
})
```

@function up.$compiler
@param {string} selector
  The selector to match.
@param {Object} [options]
  See [`options` argument for `up.compiler()`](/up.compiler#parameters).
@param {Function($element, data)} compiler
  The function to call when a matching element is inserted.

  See [`compiler` argument for `up.compiler()`](/up.compiler#parameters).
@deprecated
  Use `up.compiler()` with a callback that wraps the given native element in a jQuery collection.
*/
up.$compiler = function(...definitionArgs) {
  up.migrate.warn('up.$compiler() has been deprecated. Instead use up.compiler() with a callback that wraps the given native element in a jQuery collection.')

  let $fn = definitionArgs.pop()

  return up.compiler(...definitionArgs, function(element, ...fnArgs) {
    let $element = jQuery(element)
    return $fn($element, ...fnArgs)
  })
}


/*-
Registers a [compiler](/up.compiler) that is run before all other compilers.
The compiler function is called with each matching element as a
[jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).

If you're not using jQuery, use `up.macro()` instead, which calls
the macro function with a native element.

### Example

```js
up.$macro('[content-link]', function($link) {
  $link.attr(
    'up-target': '.content',
    'up-transition': 'cross-fade',
    'up-duration':'300'
  )
})
```

@function up.$macro
@param {string} selector
  The selector to match.
@param {Object} options
  See [`options` argument for `up.compiler()`](/up.compiler#parameters).
@param {Function(element, data)} macro
  The function to call when a matching element is inserted.

  See [`compiler` argument for `up.compiler()`](/up.compiler#parameters).
@deprecated
  Use `up.macro()` with a callback that wraps the given native element in a jQuery collection.
*/
up.$macro = function(...definitionArgs) {
  up.migrate.warn('up.$macro() has been deprecated. Instead use up.macro() with a callback that wraps the given native element in a jQuery collection.')

  let $fn = definitionArgs.pop()

  return up.macro(...definitionArgs, function(element, ...fnArgs) {
    let $element = jQuery(element)
    return $fn($element, ...fnArgs)
  })
}

up.migrate.processCompilerPassMeta = function(meta, response) {
  Object.defineProperty(meta, 'response', { get() {
    up.migrate.warn('Accessing meta.response from a compiler has been deprecated without replacement. Avoid fragments that compile differently for the initial page load vs. subsequent fragment updates.')
      return response
  }})
}
