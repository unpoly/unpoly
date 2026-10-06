Enhancing elements with JavaScript
==================================

Unpoly lets you enhance server-rendered HTML with JavaScript behavior.
For example, every `<div class="map">` could automatically start a map widget.

For this you register *compilers*: functions that are called whenever an element matching
a CSS selector enters the DOM. Compilers run at the initial page load, and again
whenever a new fragment is inserted later. This makes them a reliable home for all your
custom JavaScript, on a page that persists through many navigations.


## Registering compilers {#registration}

We want to insert the current time into elements with a `.current-time` class:

```html
<div class="current-time">
  <!-- chip: insert current time here -->
</div>
```

To achieve this, register a JavaScript function with `up.compiler()`:

```js
up.compiler('.current-time', function(element) {
  let now = new Date()
  element.textContent = now.toString()
})
```

The compiler function is called once for each matching element, when
the page first loads and when a matching fragment is rendered later.

### Integrating JavaScript libraries {#integrating-libraries}

`up.compiler()` is a great way to integrate external JavaScript libraries, like
maps, date pickers or charts.

Let's say your JavaScript plugin wants you to call `lightboxify()`
on links that should open a lightbox. You decide to
do this for all links with a `lightbox` class:

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

To mount components from a frontend framework like React or Vue, see [[islands]].

### Avoid `DOMContentLoaded` {#no-load-event}

Without Unpoly, the `.current-time` enhancement might have been implemented
by listening to a `DOMContentLoaded` (or `load`) event:

```js
document.addEventListener('DOMContentLoaded', function() {
  for (let element of document.querySelectorAll('.current-time')) {
    let now = new Date()
    element.textContent = now.toString()
  }
})
```

A big drawback of this strategy is that elements are only matched once,
during the initial page load. Since Unpoly updates fragments without
a new page load, elements that enter the page later are never enhanced.
Compilers close this gap: they run for the initial page and for every new fragment.

When adding Unpoly to an existing application, we recommend to
[convert your `DOMContentLoaded` listeners to compilers](/legacy-scripts#migrate-to-compiler).


## Passing data to a compiler {#data}

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

See [[data]] for more details and examples.


## Cleaning up after yourself {#destructor}

In Unpoly the JavaScript environment persists through many page navigations.
To prevent memory leaks, it is important that any compiler effects can be
garbage collected when the element is destroyed.

### Element-local effects require no clean-up

When a compiler binds an event listener to the compiling element (or its descendants),
it can be garbage collected once the element leaves the DOM, no further steps required:

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

For example, this compiler registers a `scroll` listener on the global `window` object.
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
  let offScroll = () => window.removeEventListener('scroll', hide)

  window.addEventListener('load', hide)
  let offLoad = () => window.removeEventListener('load', hide)

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
> Unlike `addEventListener()`, the `up.on()` function returns a function that unbinds the listener.


## Accessing information about the render pass {#meta}

Compilers may accept a third argument with information about the current [render pass](/up.render):

```js
up.compiler('.user', function(element, data, meta) { // mark: meta
  console.log(meta.layer.mode)   // result: "root"
  console.log(meta.ok)           // result: true
  console.log(meta.revalidating) // result: false
})
```

The following properties are available:

| Property            | Type          | Description                                                                                                        |
|---------------------|---------------|--------------------------------------------------------------------------------------------------------------------|
| `meta.layer`        | `up.Layer`    | The [layer](/up.layer) of the compiling fragment.<br>This has the same value as `up.layer.current`. |
| `meta.ok`           | `boolean`     | Whether the element was loaded from a [successful response](/failed-responses#fail-options).                       |
| `meta.revalidating` | `boolean`     | Whether the element was reloaded for the purpose of [cache revalidation](/caching#revalidation).                   |


## Defining new attributes with macros {#macros}

A *macro* is a compiler that runs before all other compilers, registered
with `up.macro()`. This lets a macro set `[up-...]` attributes that will be
compiled afterwards. A regular compiler may set such attributes too late,
e.g. when the attribute is itself processed by a compiler, like `[up-poll]`.

Macros are useful to define a shorthand for a combination of attributes
that you keep repeating:

```js
up.macro('[shake-modal]', function(link) {
  link.setAttribute('up-layer', 'new modal')
  link.setAttribute('up-animation', 'shake')
})
```

With this macro, links can open a shaking modal with a single attribute:

```html
<a href="/contracts/new" shake-modal>New contract</a>
```


## Compiling elements inserted by other code {#hello}

When you render with Unpoly — by following a link, submitting a form or calling
a function like `up.render()` — new elements are compiled automatically.

When elements are created by other means, e.g. by setting an `innerHTML` property
or through a third-party library, pass the new element to `up.hello()`:

```js
let element = document.createElement('div')
element.innerHTML = '<a href="/path" up-follow>Click me</a>'
up.hello(element) // mark: up.hello
```

This runs all registered macros and compilers on the element and its subtree.
It is safe to call `up.hello()` multiple times: every compiler function is guaranteed
to run only once for each matching element.


@page enhancing-elements
@signature
