Enhancing elements with JavaScript
==================================

Unpoly apps often want to. E.g. a `<div class="map">` should automatically start a Google Map widget.

Unpoly offers *compilers* to call JavaScript snippets when an element is inserted the DOM, and
that element is matching a CSS selectors.

Compiler functions run both at the initial page load and when a new fragment is inserted later.
This makes them a great tool to activate JavaScript snippets in a single-page environment
that can persist through many user navigations.

## Registering compilers {#registration}

We want to insert the current time into elements with a `.current-time` class:

```html
<div class='current-time'>
  <!-- chip: insert current time here -->
</div>
```

To achieve this, register a JavaScript function with `up.compiler()`:

```js
up.compiler('.current-time', function(element) {
  var now = new Date()
  element.textContent = now.toString()
})
```

The compiler function will be called once for each matching element when
the page loads, or when a matching fragment is rendered later.

### Avoid `DOMContentLoaded` {#no-load-event}

Old school web developers might have implemented the `.current-time` compilers
by listening to a `DOMContentLoaded` (or `load`) events:

```js
document.addEventListener('DOMContentLoaded', function() {
  for (let element of document.querySelector('.current-time')) {
    var now = new Date()
    element.textContent = now.toString()
  }
})
```

A big drawback to this strategy is that elements are only matched once,
during the initial page load. Your JavaScript enhancements will not be applied to elements
that enter the page later. Compiler functions run both at the initial page load
and when a new fragment is inserted later.

When adding Unpoly to an existing application, we recommend to
[convert your `DOMContentLoaded` listeners to compilers](/legacy-scripts#migrate-to-compiler).

### Integrating JavaScript libraries {#integrating-libraries}

`up.compiler()` is a great way to integrate external JavaScript libraries, like
maps, date pickers or charts.

Let's say your JavaScript plugin wants you to call `lightboxify()`
on links that should open a lightbox. You decide to
do this for all links with an `lightbox` class:

```html
<a href="river.png" class="lightbox">River</a>
<a href="ocean.png" class="lightbox">Ocean</a>
```

We can register a compiler that calls `lightboxify()` on all matching elements:

```js
up.compiler('a.lightbox', function(element) {
  lightboxify(element)
})
```

## Cleaning up after yourself {#destructor}

In Unpoly the JavaScript environment can persist through many page navigation.
To prevent memory leaks, is important that any compiler effects can be garbage collected when the element is destroyed.

### Element-local effects require no clean-up

When a compiler binds an event listener to the compiling element (or its descendants),
they can be garbage collected once the element leaves the DOM, no further steps required:

```js
// label: ✔️ Garbage collectable
up.compiler('.click-to-hide', function(element) {
  let hide = () => element.style.display = 'none'
  element.addEventListener('click', hide)
})
```

### Global effects require a destructor function

When your compiler registers effects *outside* the compiling element's subtree,
that effect is *not* cleaned up automatically.

For example, this compiler registers a global `scroll` listener to the global `window` object.
Every compilation will subscribe another listener that is never removed, causing a memory leak:

```js
// label: ❌ Memory leak
up.compiler('.scroll-to-hide', function(element) {
  let hide = () => element.style.display = 'none'
  window.addEventListener('scroll', hide)
})
```

To address this, a compiler can return a destructor function that reverts its non-local effect.
Unpoly will call this destructor when the element is destroyed:

```js
// label: ✔️ Garbage collectable
up.compiler('.scroll-to-hide', function(element) {
  let hide = () => element.style.display = 'none'
  window.addEventListener('scroll', hide)
  return () => window.removeEventListener('scroll', hide) // mark: return
})
```

This compiler function is now safe for garbage collection.

> [important]
> The destructor function is *not* expected to remove the element from the DOM.

### Alternative ways to register destructors

To run multiple functions when the element is destroyed, return an array of functions:

```js
up.compiler('.auto-hide', function(element) {
  let hide = () => element.style.display = 'none'

  window.addEventListener('scroll', hide)
  let offScroll = () => window.removeEventListener('scroll', hide))

  window.addEventListener('load', hide)
  let offLoad = () => window.removeEventListener('load', hide))

  return [offScroll, offLoad]
})
```

Instead of returning a destructor function, you can register it with `up.destructor()`.
This helps placing the clean-up logic close to the effect that it reverts:

```js
up.compiler('.auto-hide', function(element) {
  let hide = () => element.style.display = 'none'

  window.addEventListener('scroll', hide)
  up.destructor(element, () => window.removeEventListener('scroll', hide))

  window.addEventListener('load', hide)
  up.destructor(element, () => window.removeEventListener('load', hide))
})
```

> [tip]
> Other than `addEventListener()`, `up.on()` returns a function that unbinds the listener.


## Passing parameters to a compiler {#data}

You may attach data to an element using HTML5 data attributes
or encoded as [relaxed JSON](/relaxed-json) in an `[up-data]` attribute:

```html
<span class="user" up-data="{ age: 31, name: 'Alice' }">Alice</span>
```

An object with the element's attached data will be passed to your [compilers](/up.compiler)
as a second argument:

```js
up.compiler('.user', function(element, data) { // mark: data
  console.log(data.age)  // result: 31
  console.log(data.name) // result: "Alice"
})
```

See [attaching data to elements](/data) for more details and examples.


## Accessing information about the render pass {#meta}

Compilers may accept a third argument with information about the current [render pass](/up.render):

```js
up.compiler('.user', function(element, data, meta) { // mark: meta
  console.log(meta.layer.mode)   // result: "root"
  console.log(meta.revalidating) // result: true
})
```

The following properties are available:

| Property               | Type          |                                                 | Description                                               |
|------------------------|---------------|-------------------------------------------------|-----------------------------------------------------------|
| `meta.layer`           | `up.Layer`    |                                                 | The [layer](/up.layer) of the fragment being compiled.<br>This has the same value as `up.layer.current`. |
| `meta.revalidating`    | `boolean`     | <span class="tag is_light_gray">optional</span> | Whether the element was reloaded for the purpose of [cache revalidation](/caching#revalidation). |



@page enhancing-elements
