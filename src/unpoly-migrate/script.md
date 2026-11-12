# up.script

@namespace up.script

-----

# up.$compiler()

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

-----

# up.$macro()

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
