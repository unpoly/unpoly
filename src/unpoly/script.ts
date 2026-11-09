import {
  cleaner, evalOption, filterList, isDefined, isOptions, map, newOptions, parseArgs, pick,
  scanFunctions,
} from './util.js'
import {
  addClassTemp, booleanOrStringAttr, jsonAttr, metaContent, parseAttr, removeAttrsFromHTML, subtree,
} from './element.js'
import { fail, guard } from './error.js'
import { mockable } from './mockable.js'
import { assertEmitted, on } from './event.js'
import { getSmart } from './fragment.js'
import { isBooted, isEvaling } from './framework.js'
import { layerStack } from './layer.js'
import { printToStandard } from './log.js'
import { NonceableCallback } from './script/csp/nonceable_callback.js'
import { ScriptGate } from './script/csp/script_gate.js'
import { DestructorPass } from './script/destructor_pass.js'
import { HelloFragment } from './script/hello_fragment.js'
import { Config } from './util/config.js'
import type { ConfigWith } from './util/config.js'
import type { Cleaner, List, PlainObject } from './util.js'
import type { ElementOrSelector } from './element.js'
import type { CSPInfo } from './script/csp/csp_info.js'
import type { PolicyString } from './script/csp/script_gate.js'
import type { Compiler, HelloFragmentOptions } from './script/hello_fragment.js'
import type { RenderOptions } from './fragment/render/render_options.js'
import type { Layer } from './layer/base.js'
import type { UpResponse } from './network/response.js'

/**
Options for `up.hello()`.
*/
export interface HelloOptions extends HelloFragmentOptions {
  // Only run these macros and compilers (default: all registered ones).
  macros?: Compiler[]
  compilers?: Compiler[]
  [key: string]: any
}

/**
Options for `up.compiler()` and `up.macro()`.
*/
export interface CompilerOptions {
  priority?: number
  batch?: boolean
  /** @internal Also run on elements that the compiler already compiled. */
  rerun?: boolean
}

/**
[Information about the render pass](/learn/enhancing-elements#meta) that a compiler gets as its
third argument. The `{ meta }` option of `up.hello()` may add more keys.
*/
export interface CompilerMeta {
  layer: Layer
  ok: boolean
  revalidating: boolean
  [key: string]: any
}

/**
The function passed to `up.compiler()` or `up.macro()`. It is called with a matching element, its
[data](/learn/data) and [meta information](/learn/enhancing-elements#meta) about the render pass.
It may return a destructor function, an array of destructors, or a promise.

A compiler gets any element that matches its selector, so the element type is a parameter. It
defaults to `HTMLElement`. A compiler for SVG elements can annotate its argument as `SVGElement`.
*/
export type CompilerCallback<E extends Element = HTMLElement> = (element: E, data: any, meta: CompilerMeta) => unknown

/**
The function passed to `up.compiler()` or `up.macro()` with `{ batch: true }`. It is called once
with all matching elements and their data.

TypeScript only picks this callback type when `batch` is the literal `true`. Options from a
variable need `as const`, or `batch` is widened to `boolean` and the callback gets one element.
*/
export type BatchCompilerCallback<E extends Element = HTMLElement> = (elements: E[], data: any[], meta: CompilerMeta) => unknown

/**
Options for `registerAttrCompiler()`.
@internal
*/
export interface AttrCompilerOptions extends CompilerOptions {
  // The value for an attribute set without a value, or to "true".
  defaultValue?: string
  macro?: boolean
}

/**
A compiler for `registerAttrCompiler()`. It is called with the element and its attribute value.
Without a `{ defaultValue }`, the value of an attribute set without a value (or to "true") is `true`.
@internal
*/
export type AttrCompilerCallback<V = string | true, E extends Element = HTMLElement> = (element: E, value: V) => unknown

/**
Options for `up.script.parseCallback()`.
@internal
*/
export interface ParseCallbackOptions {
  argNames?: string[]
  // Also pass these properties of the first argument as arguments.
  expandObject?: string[] | false
}

// The properties Unpoly sets on elements to remember their data and destructors.
type ScriptedElement = Element & {
  upData?: any
  upTemplateData?: PlainObject
  upCompileData?: PlainObject
  upDestructors?: Cleaner
}

/**
The `up:assets:changed` event.
*/
export type AssetsChangedEvent = Event & {
  newAssets: List<Element>
  oldAssets: List<Element>
  renderOptions: RenderOptions
  response: UpResponse | undefined
}

/*-
Features to attach JavaScript behavior to HTML elements whenever they enter the page.

Register a compiler with `up.compiler()`. It can return a destructor that cleans up when the element is removed, or you register one with `up.destructor()`. Elements pass structured data to their compilers through an `[up-data]` attribute, which `up.data()` reads. Macros registered with `up.macro()` run before all other compilers, usually to set other Unpoly attributes on the element.

When your own code inserts HTML into the page, call `up.hello()` on the new element so its compilers run. Elements marked `[up-asset]` track your scripts and stylesheets, so Unpoly can notice when a new version was deployed.

@learn-ref scripting

@namespace up.script
*/


/**
The settings in `up.script.config`, described in its doc comment.
*/
export interface ScriptConfig {
  assetSelectors: string[]
  noAssetSelectors: string[]
  scriptSelectors: string[]
  noScriptSelectors: string[]
  evalCallbackPolicy: PolicyString
  scriptElementPolicy: PolicyString
  cspNonce: string | (() => string)
  cspWarnings: boolean
  /**
  Callback attributes like `[up-on-loaded]`, which may carry a CSP nonce.
  @internal
  */
  nonceableAttributes: string[]
}

/*-
Configures defaults for script handling and asset tracking.

@section Assets
  @param {Array<string>} [config.assetSelectors]
    An array of CSS selectors matching default [assets](/api/up-asset).

    By default, all remote scripts and stylesheets in the `<head>` are considered assets.
    [Inline scripts](https://simpledev.io/lesson/inline-script-javascript-1/) and
    [internal styles](https://www.tutorialspoint.com/How-to-use-internal-CSS-Style-Sheet-in-HTML)
    are not tracked by default, but you can include them with an `[up-asset]` attribute.

    Unpoly only tracks assets in the `<head>`. Elements in the `<body>` are never tracked,
    even if they match one of the configured selectors.

    See [Tracking assets](/learn/handling-asset-changes#tracking-assets) for examples.

  @param {Array<string>} [config.noAssetSelectors]
    Exceptions to `up.script.config.assetSelectors`.

    Matching elements will *not* be considered [assets](/api/up-asset),
    even if they match `up.script.config.assetSelectors`.

@section Scripts
  @param {Array<string>} [config.scriptSelectors]
    An array of CSS selectors matching elements that run JavaScript.

    By default, this matches all `<script>` elements with a JavaScript type.

    This configuration does not affect what Unpoly considers [assets](/api/up-asset).
    For this, configure `up.script.config.assetSelectors`.

  @param {Array<string>} [config.noScriptSelectors]
    Exceptions to `up.script.config.scriptSelectors`.

  @param {string} [config.evalCallbackPolicy='auto']
    Whether Unpoly will [run callbacks in HTML attributes](/learn/script-security#attribute-callbacks) like [`[up-on-loaded]`](/api/up-follow#up-on-loaded).

  @param {string} [config.scriptElementPolicy='auto']
    Whether Unpoly will [run `<script>` elements in new fragments](/learn/script-security#script-elements).

  @param {string|Function(): string} [config.cspNonce]
    A [CSP script nonce](https://content-security-policy.com/nonce/)
    for the initial page that [booted](/api/up.boot) Unpoly.

    The nonce lets Unpoly run JavaScript in HTML attributes like
    [`[up-on-loaded]`](/api/up-follow#up-on-loaded) or [`[up-on-accepted]`](/api/up-layer-new#up-on-accepted).
    See [Restricting callbacks with nonces](/learn/script-security#callback-nonces).

    The nonce can either be configured as a string or as a function that returns the nonce.

    Defaults to the `content` attribute of a `<meta>` tag named `csp-nonce`:

    ```
    <meta name='csp-nonce' content='secret4367243'>
    ```

  @param {boolean} [config.cspWarnings=true]
    Whether Unpoly will print a warning when it observes a potentially unsafe `Content-Security-Policy` header.

@property up.script.config
@stable
*/
export const config = new Config('up.script.config', (): ScriptConfig => ({
  cspNonce() { return metaContent('csp-nonce') },
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
})) as ConfigWith<ScriptConfig>

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

let registeredCompilers: Compiler[] = []
let registeredMacros: Compiler[] = []

/*-
Registers a function to be called when Unpoly inserts a matching element.

@learn-ref enhancing-elements

## When compilers are called

A compiler is called for matching elements:

- on the initial page, when Unpoly [boots](/api/up.boot)
- in every new fragment that Unpoly renders
- in elements that you pass to [`up.hello()`](/api/up.hello)

Elements that other code inserts, e.g. a framework like React, are not compiled automatically.
See [compiling elements inserted by other code](/learn/enhancing-elements#hello).

## Anatomy of a compiler

This code registers a function that is called when an element with a `.foo` class
is inserted:

```js
up.compiler('.foo', function(element, data, meta) {
  // do something with `element`
})
```

The compiler function is passed three arguments:

1. The newly inserted `element` matching the selector
2. Any [data attached to the element](/learn/data)
3. [Meta information](/learn/enhancing-elements#meta) about the current render pass

## Destructor functions {#destructor}

When a compiler registers effects *outside* the compiling element's subtree,
it must return a destructor function that reverts the effect. The destructor
function is called automatically when the element is swapped or destroyed later.

Examples of non-local effects are global event handlers bound to
the `document`, or `setInterval()`:

```js
up.compiler('.current-time', function(element) {
  let update = () => element.textContent = new Date().toString()
  let updateInterval = setInterval(update, 1000)
  return () => clearInterval(updateInterval)
})
```

See [cleaning up after yourself](/learn/enhancing-elements#destructor)
for more details and examples.

## Batching multiple elements

When multiple elements in an update match the selector, the compiler function
is called once for each element.

Let's say a fragment with three `.card` elements is inserted and compiled:

```html
<div class="fragment">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

A compiler function for `.card` would be called three separate times:

```js
up.compiler('.card', function(card, data) {
  // chip: called three times
})
```

If you would like the compiler to run *once* for all matches within
a render pass, use the `{ batch: true }` option:

```js
up.compiler('.card', { batch: true }, function(cards, datas) {
  console.debug(`We have ${cards.length} new cards`)
})
```


## Error handling {#errors}

It is safe to throw exceptions from a compiler or its [destructor](#destructor).
A crashing compiler will *not* interrupt a render pass or prevent other compilers on the same element.

Exceptions thrown by compiler functions are logged to the browser's [error console](https://developer.mozilla.org/en-US/docs/Web/API/console/error).
Unpoly also emits an [`error` event on `window`](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event).

See [errors in user code](/learn/render-lifecycle#errors-in-user-code) for details.

## Compilation order {#order}

Compilers are called in the order they were registered.

You can control the order by passing a `{ priority }` option.
The default priority is `0`. Compilers with a higher priority are run first.

```js
up.compiler('.foo', { priority: 999 }, function() {
  // called before compilers with a lower priority
})
```

When a compiler sets an Unpoly attribute, this usually has no effect since attributes have already been evaluated.
Use a [macro](/api/up.macro) instead.

See [Rendering lifecycle](/learn/render-lifecycle) for a full overview of
Unpoly's rendering steps.

## Asynchronous compilers {#async}

Compiler functions can be [`async`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).
This is useful when a compiler needs to fetch network resources
or when calling a library with an asynchronous API:

```js
up.compiler('textarea.wysiwyg', async function(textarea) { // mark: async
  let editor = await import('wysiwyg-editor') // mark: await
  editor.init(textarea)
})
```

You can also use this to split up expensive tasks, giving the browser a chance
to render and process user input:

```js
up.compiler('.element', async function(element) {
  doRenderBlockingWork(element)
  await scheduler.yield() // mark-line
  doUserVisibleWork(element)
})
```

### Cleaning up async work {#async-destructors}

Like synchronous compilers, async compiler functions can return a [destructor function](#destructor):

```js
up.compiler('textarea.wysiwyg', async function(textarea) {
  let editor = await import('wysiwyg-editor')
  editor.init(textarea)
  return () => editor.destroy(textarea) // mark-line
})
```

Unpoly guarantees that the destructor is called even if the element is destroyed
before the compiler function terminates.

### Timing render-blocking mutations {#async-timing}

Unpoly will run the first [task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) of every compiler
function before allowing the browser to render DOM changes. If an async compiler function runs for multiple tasks,
the browser will render between tasks. If you have render-blocking mutations that should be hidden from the user,
they must happen in the first task.

<figure>
  <img src="images/compiler-tasks.svg" alt="Timing diagram of compiler tasks and browser renders" width="670">
  <figcaption>

After Unpoly updates the DOM, it runs synchronous compilers and the first task of each async compiler.
Only then does the browser render. The promise returned by `up.render()` fulfills after this first task.
The second task of an async compiler runs after the browser has rendered.
`up.render().finished` fulfills only after that task is done.

  </figcaption>
</figure>

Async compilers will not delay the promise returned by rendering functions `up.render()` or `up.layer.open()`.\
Async compilers *will* delay the promise returned by [`up.render().finished`](/learn/render-lifecycle#postprocessing)
and `up.hello()`.

## Registering compilers after booting {#late}

When you [deliver your JavaScript in multiple files](https://makandracards.com/makandra/498036-webpacker-loading-code-on-demand),
you may register compilers after Unpoly has booted.

When compilers are registered after Unpoly has booted, they are run
on current elements, but **only** if the compiler has the default priority.

If the compiler has a non-default [priority](#order), it is run on future
fragments only. In this case, either remove the `{ priority }` option
or manually call `up.hello()` on an element that should be
[recompiled](/api/up.hello#recompiling-elements).


@function up.compiler

@param {string} selector
  The selector to match.

@param {number} [options.priority=0]
  The priority of this compiler.

  Compilers with a higher priority are run first.
  Two compilers with the same priority are run in the order they were registered.

@param {boolean} [options.batch=false]
  If set to `true` and a fragment insertion contains multiple
  elements matching `selector`, the `compiler` function is only called once
  with all these elements.

@param {Function(element, data, meta): (Function|Array<Function>|Promise<Function>|undefined)} compiler
  The function to call when an element matching `selector` is inserted.

  Up to three arguments can be accepted:

  1. The newly inserted `element` matching the selector
  2. Any [data attached to the element](/learn/data)
  3. [Meta information](/learn/enhancing-elements#meta) about the current render pass

  The function may return a [destructor function](/learn/enhancing-elements#destructor) that is called
  before it is removed from the DOM. The destructor function is called with the compiled element.

  The compiler function can be [`async`](/api/up.compiler#async).

@stable
@signature
*/
export function registerCompiler<E extends Element = HTMLElement>(selector: Compiler['selector'], callback: CompilerCallback<E>): void
export function registerCompiler<E extends Element = HTMLElement>(selector: Compiler['selector'], options: CompilerOptions & { batch: true }, callback: BatchCompilerCallback<E>): void
export function registerCompiler<E extends Element = HTMLElement>(selector: Compiler['selector'], options: CompilerOptions, callback: CompilerCallback<E>): void
export function registerCompiler(...args: any[]): void {
  registerProcessor(args)
}

/*-
Registers a [compiler](/learn/enhancing-elements) that is run before all other compilers.

@learn-ref enhancing-elements#macros

A macro lets you set attributes that will be compiled afterward.

If you want default attributes for *every* link and form, consider customizing your
[navigation options](/learn/navigation-defaults) or configuring Unpoly to [handle everything](/learn/handling-all-links).

## Example

In this example every link opens a modal with a [custom animation](/api/up.animation) `shake`:

```html
<a href="/page1" up-layer="new modal" up-class="warning" up-animation="shake">Page 1</a>
<a href="/page2" up-layer="new modal" up-class="warning" up-animation="shake">Page 2</a>
<a href="/page3" up-layer="new modal" up-class="warning" up-animation="shake">Page 3</a>
```

A new `[shake-modal]` attribute would make the same links shorter:

```html
<a href="/page1" shake-modal>Page 1</a>
<a href="/page2" shake-modal>Page 2</a>
<a href="/page3" shake-modal>Page 3</a>
```

We can define the `[shake-modal]` attribute by registering a macro that
sets the `[up-layer]`, `[up-class]`, and `[up-animation]` attributes for us:

```js
up.macro('[shake-modal]', function(link) {
  link.setAttribute('up-layer', 'new modal')
  link.setAttribute('up-class', 'warning')
  link.setAttribute('up-animation', 'shake')
})
```

@function up.macro

@param selector
  @like up.compiler

@param [options.priority]
  @like up.compiler

@param [options.batch]
  @like up.compiler

@param macro
  @like up.compiler/compiler
@stable
@signature
*/
export function registerMacro<E extends Element = HTMLElement>(selector: Compiler['selector'], callback: CompilerCallback<E>): void
export function registerMacro<E extends Element = HTMLElement>(selector: Compiler['selector'], options: CompilerOptions & { batch: true }, callback: BatchCompilerCallback<E>): void
export function registerMacro<E extends Element = HTMLElement>(selector: Compiler['selector'], options: CompilerOptions, callback: CompilerCallback<E>): void
export function registerMacro(...args: any[]): void {
  registerProcessor(args, { macro: true })
}

export function registerAttrCompiler<E extends Element = HTMLElement>(attr: string, callback: AttrCompilerCallback<string | true, E>): void
export function registerAttrCompiler<E extends Element = HTMLElement>(attr: string, options: AttrCompilerOptions & { defaultValue: string }, callback: AttrCompilerCallback<string, E>): void
export function registerAttrCompiler<E extends Element = HTMLElement>(attr: string, options: AttrCompilerOptions, callback: AttrCompilerCallback<string | true, E>): void
export function registerAttrCompiler(...args: any[]): void {
  let [attr, options, valueCallback] = parseProcessorArgs(args)

  let selector = `[${attr}]`
  let { defaultValue } = options

  let callback = (element: HTMLElement) => {
    let value = booleanOrStringAttr(element, attr)

    // Do nothing in a case like [up-defer=false]
    if (value === false) return

    // Some attributes have a default value in case no value is given.
    // E.g. [up-defer=""] or [up-defer="true"] defaults to [up-defer="insert"].
    if (isDefined(defaultValue) && value === true) value = defaultValue

    return valueCallback(element, value)
  }
  registerProcessor([selector, options, callback])
}

function detectSystemMacroPriority(macroSelector: string | (() => string)): number {
  macroSelector = evalOption(macroSelector)
  for (let substr in SYSTEM_MACRO_PRIORITIES) {
    if (macroSelector.indexOf(substr) >= 0) {
      return SYSTEM_MACRO_PRIORITIES[substr]
    }
  }
  fail('Unregistered priority for system macro %o', macroSelector)
}

function registerProcessor(args: any[], overrides: PlainObject = {}): void {
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
  return parseArgs(args, 'val', 'options', 'callback')
}

function buildProcessor(args: any[], overrides: PlainObject): Compiler & PlainObject {
  let [selector, options, callback] = parseProcessorArgs(args)

  options = newOptions(options, {
    selector,
    isDefault: isEvaling(),
    priority: 0,
    batch: false,
    rerun: false,
  })
  return Object.assign(callback, options, overrides)
}

function insertProcessor(queue: Compiler[], newCompiler: Compiler & PlainObject): Compiler {
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

/*-
Registers a function to be called when the given element
is destroyed.

@learn-ref enhancing-elements#destructor

Elements are destroyed when they are swapped during a render pass, when their [layer](/api/up.layer)
closes, or when `up.destroy()` is called on the element or its container.

An alternative way to register a destructor function is to
[return it from your compiler function](/learn/enhancing-elements#destructor).

## Example

The code below will log a message when `element` exits the DOM:

```js
let element = document.querySelector('.element')
up.destructor(element, () => console.log('Element was destroyed!'))
```

## Registration time

The element should be attached when the destructor is registered. This is commonly done during
[compilation](/learn/enhancing-elements).

If called on a detached element, Unpoly assumes
an [async compiler](/api/up.compiler#async) has registered the destructor after the element has been destroyed.
The destructor is then run immediately.

## Reusing destructor functions

You may reuse the same destructor function for multiple elements.
The destructor function is called with the element being destroyed:

```js
let fn = (element) => console.log('Element %o was destroyed', element)

for (let element of document.querySelectorAll('div')) {
  up.destructor(element, fn)
}
```

@function up.destructor
@param {Element} element
  The element to observe.
@param {Function(Element)|Array<Function(Element)>} destructor
  One or more destructor functions.
@stable
*/
export function registerDestructor(element: ScriptedElement, value: any): void {
  let fns = scanFunctions(value)
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

function buildDestructorRegistry(element: Element): Cleaner {
  let registry = cleaner()
  registry(addClassTemp(element, 'up-can-clean'))
  return registry
}

/*-
Manually compiles a page fragment that has been inserted into the DOM
by external code.

@learn-ref enhancing-elements#hello

All registered [compilers](/learn/enhancing-elements) and [macros](/api/up.macro) will be called
with matches in the given `element`.

The [`up:fragment:inserted`](/api/up:fragment:inserted) event is emitted on the compiled element.

## Unpoly automatically calls `up.hello()`

When the page is manipulated using Unpoly functions or `[up-*]` attributes,
Unpoly will automatically call `up.hello()` on new fragments:

```js
let link = document.querySelector('a[href]')
let { fragment } = await up.follow(link)
// The fragment is already compiled. No need to call up.hello().
```

You only need to use `up.hello()` after creating DOM elements without Unpoly's involvement, for example:

- Creating elements with `document.createElement()`
- Setting the `innerHTML` property on an existing element
- Parsing HTML into elements using browser APIs like `DOMParser()`
- Elements created by other libraries

In this case, compilers will *not* run automatically and some of Unpoly's own `[up-*]` attributes will not be active.
We can address this by manually calling `up.hello()` on new elements:

```js
let element = document.createElement('div')
element.innerHTML = '<a href="/path" up-follow>click me</a>'
// The element is not compiled yet. We must compile it manually:
up.hello(element)
```

## Recompiling elements

It is safe to call `up.hello()` multiple times with the same elements.
In particular, every compiler function is guaranteed to run only once for each matching element.

If a new compiler is registered after initial compilation,
that new compiler is [run automatically on current elements](/api/up.compiler#late).

## Detecting compiler errors

If a compiler function throws an error, `up.hello()` will still finish the compilation and *not* throw an error.

Instead, compiler errors will print to the [error console](https://developer.mozilla.org/en-US/docs/Web/API/console/error)
and emit an [`error` event on `window`](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event):

```js
window.addEventListener('error', function(event) {
  alert("Got an error " + event.error.name)
})

up.hello(element)
```

See [errors in user code](/learn/render-lifecycle#errors-in-user-code) for details.

## Awaiting asynchronous compilation {#async}

Unpoly supports [`async` compiler functions](/api/up.compiler#async):

```js
up.compiler('textarea.wysiwyg', async function(textarea) { // mark: async
  let editor = await import('wysiwyg-editor') // mark: await
  await editor.init(textarea) // mark: await
  return () => editor.destroy(textarea)
})
```

The `up.hello()` function returns a promise that fulfills when all synchronous and asynchronous
compilers have terminated:

```js
let textarea = up.element.createFromHTML('<textarea class="wysiwyg"></textarea>')
document.body.append(textarea)
await up.hello(textarea) // mark: await
// chip: WYSIWYG editor is now initialized
```

The fulfillment value is the same element that was passed as an argument:

```js
let textarea = up.element.affix(document.body, 'textarea.wysiwyg')
let compiled = await up.hello(textarea) // compiled === textarea
```

@function up.hello

@param {Element|jQuery|string} element
  The root element of the new page fragment.

@param {Object} [options.layer]
  An existing `up.Layer` object can be passed to prevent re-lookup.
  @internal

@param {Object} [options.data]
  Overrides properties from the new fragment's `[up-data]`
  with the given [data object](/learn/data).
  @experimental

@param {Object} [options.dataMap]
  An object mapping selectors to `options.data`.
  @internal

@param {Object} [options.meta={}]
  An object containing [information about this compiler pass](/learn/enhancing-elements#meta).

  This typically contains `{ layer, revalidating }` properties.

  It will be passed as a third [compiler](/learn/enhancing-elements) argument.
  @experimental

@param {Object} [options.compilers]
  A list of compilers to use.

  Defaults to all registered compilers.
  @internal

@param {Object} [options.compilers]
  A list of macros to use.

  Defaults to all registered macros.
  @internal

@param {boolean} [insertedEvent]
  Whether to emit `up:fragment:inserted` after compilation:
  @internal

@return {Promise<Element>}
  A promise that fulfills when the element has finished compilation.

  The fulfillment value is the `element` argument.

@stable
@signature
*/
export function hello(element: ElementOrSelector, options: HelloOptions = {}): Promise<Element> {
  // If passed a selector, up.fragment.get() will prefer a match on the current layer.
  element = getSmart(element, options)

  // We default to running all registered processor fns, but callers
  // can opt to only run given processor arguments.
  let macros = options.macros ?? registeredMacros
  let compilers = options.compilers ?? registeredCompilers

  const pass = new HelloFragment(element, macros, compilers, options)
  return pass.run()
}

/*-
Runs any destructors on the given fragment and its descendants in the same layer.

Unlike [`up.destroy()`](/api/up.destroy), this does not emit any events
and does not remove the element from the DOM.

@function up.script.clean
@param {Element} fragment
@param {up.Layer} options.layer
@internal
*/
export function clean(fragment: Element, options: PlainObject = {}): void {
  new DestructorPass(fragment, options).run()
}

/*-
Returns the [data](/learn/data) attached to the given element.

If the element has no attached data, an empty object is returned.

Multiple `up.data()` calls for the same element always return the same object reference.

@learn-ref data

## Use with `[up-data]`

You have an element with JSON data serialized into an `[up-data]` attribute:

```html
<span class="person" up-data="{ age: 18, name: 'Bob' }">Bob</span>
```

Calling `up.data()` will deserialize the JSON string into a JavaScript object:

```js
up.data('.person') // returns { age: 18, name: 'Bob' }
```

## Use with data attributes

You may also use standard [`[data-*]` attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
to attach data to an element.

```html
<span class='person' data-first-name='Alice' data-last-name='Anderson'>Alice</span>
```

The object returned by `up.data()` will contain all data attributes with camelCased keys:

```js
up.data('.person') // returns { firstName: 'Alice', lastName: 'Anderson' }
```

You may use both `[up-data]` and `[data-*]` attributes on the same element.
The object returned by `up.data()` will contain values from both.

@function up.data
@param {string|Element|jQuery} element
  The element for which to return data.
@return {Object}
  The [data](/learn/data) attached to the element.

  Returns an empty object if the element has no attached data.

  Multiple `up.data()` calls for the same element always return the same object reference.
@stable
*/

/*-
Attaches structured data to an element to be consumed by a compiler or event handler.

If an element with an `[up-data]` attribute enters the DOM,
Unpoly will parse the JSON and pass the resulting object to any matching
`up.compiler()` functions and `up.on()` callbacks.

To programmatically parse an `[up-data]` attribute into an object, use `up.data(element)`.

@learn-ref data

## Example

A container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
might attach the location and names of its marker pins:

```html
<div class="google-map" up-data="{ pins: [
  { lat: 48.36, lng: 10.99, title: 'Friedberg' },
  { lat: 48.75, lng: 11.45, title: 'Ingolstadt' }
] }"></div>
```

The attribute value will be parsed as [relaxed JSON](/api/relaxed-json).
The parsed object is passed to your compiler as a second argument:

```js
up.compiler('.google-map', function(element, data) {
  let map = new google.maps.Map(element)
  for (let pin of data.pins) {
    let position = new google.maps.LatLng(pin.lat, pin.lng)
    new google.maps.Marker({ position, map, title: pin.title })
  }
})
```

Similarly, when an event is triggered on an element annotated with
`[up-data]`, the parsed object will be passed to any matching
[`up.on()`](/api/up.on) handlers:

```js
up.on('click', '.google-map', function(event, element, data) {
  console.log("There are %d pins on the clicked map", data.pins.length)
})
```

You may also parse the data object programmatically using the `up.data()` function:

```js
let data = up.data('.google-map')
data.pins[0].lat // result: 48.36
data.pins[0].lng // result: 10.99
data.pins[0].title // result: 'Friedberg'
```

@selector [up-data]
@param up-data
  A data object serialized as [relaxed JSON](/api/relaxed-json).
@stable
@signature
*/
// The element may also be a selector.
export const readData = mockable(function readData(element: any): any {
  // If passed a selector, up.fragment.get() will prefer a match on the current layer.
  element = getSmart(element)

  return element.upData ||= buildData(element)
})

function buildData(element: ScriptedElement & HTMLElement): any {
  let parsedJSON = jsonAttr(element, 'up-data') ?? {}

  // If the [up-data] JSON isn't an object then we cannot offer live merging
  // of [up-data] and [data-...] attributes.
  //
  // It would be better to parse this lazily, but I don't want to pay
  // the bytes for a second Proxy handler when dealing with this edge case.
  if (!isOptions(parsedJSON)) {
    return parsedJSON
  }

  return {
    ...element.upTemplateData,
    ...element.dataset,
    ...parsedJSON,
    ...element.upCompileData,
  }
}

/*-
@function up.script.assets
@param {Element} [head=document.head]
@return {NodeList}
@internal
*/
export function findAssets(head: ParentNode = document.head): NodeListOf<Element> {
  return head.querySelectorAll(config.selector('assetSelectors'))
}

/*-
Tracks an element as a [frontend asset](/learn/handling-asset-changes), usually JavaScript and stylesheets.

When [rendering](/api/up.render), Unpoly compares the assets on the current page with the new assets
from the server response. If the assets don't match, an `up:assets:changed` event is emitted.

@learn-ref handling-asset-changes


## Default assets

By default, all remote scripts and stylesheets in the `<head>` are considered assets:

```html
<html>
  <head>
    <link rel="stylesheet" href="/assets/frontend-5f3aa101.css"> <!-- mark-line -->
    <script src="/assets/frontend-81ba23a9.js"></script> <!-- mark-line -->
  </head>
  <body>
    ...
  </body>
</html>
```

Unpoly only tracks assets in the `<head>`. Elements in the `<body>` are never tracked.

[Inline scripts](https://simpledev.io/lesson/inline-script-javascript-1/) and
[internal styles](https://www.tutorialspoint.com/How-to-use-internal-CSS-Style-Sheet-in-HTML)
are not tracked by default, but you can [include them explicitly](#including-assets).


## Excluding assets from tracking {#excluding-assets}

To *exclude* an element in the `<head>` from tracking, mark it with an `[up-asset="false"]` attribute:

```html
<script src="/assets/analytics.js" up-asset="false"></script>
```

To exclude assets by default, configure `up.script.config.noAssetSelectors`.


## Tracking additional assets {#including-assets}

To track additional assets in the `<head>`, mark them with an `[up-asset]` attribute.

For example, [inline scripts](https://simpledev.io/lesson/inline-script-javascript-1/) are not tracked by default,
but you can include them explicitly:

```html
<script up-asset>
  window.SALE_START = new Date('2024-05-01')
</script>
```

Only elements in the `<head>` can be matched this way.

To track additional assets by default, configure `up.script.config.assetSelectors`.

## Tracking the backend version {#tracking-backend-versions}

To detect a new deployment of your *backend* code, consider including the deployed commit hash in a `<meta>` tag.

By marking the `<meta>` tag with `[up-asset]`, it will also emit an `up:assets:changed` event when the commit hash changes:

```html
<meta name="backend-version" content="d50c6dd629e9bbc80304e14a6ba99a18c32ba738" up-asset>
```

@selector [up-asset]
@stable
*/

export function assertAssetsOK(newAssets: Iterable<Element> & { length?: number }, renderOptions: PlainObject): void {
  let { response } = renderOptions
  let oldAssets = findAssets()

  if (assetsIdentity(oldAssets) !== assetsIdentity(newAssets)) {
    assertEmitted('up:assets:changed', { oldAssets, newAssets, renderOptions, response })
  }
}

function assetsIdentity(assets: Iterable<Element> & { length?: number }): string {
  return map(assets, assetIdentity).join()
}

function assetIdentity(assetElement: Element): string {
  // Remove the [nonce] attribute which the browser usually masks from the outerHTML of <script> elements.
  // However it isn't masked for inert scripts (e.g. when they fail a CSP check).
  return removeAttrsFromHTML(assetElement.outerHTML, ['nonce'])
}

/*-
This event is emitted when [frontend code](/api/up-asset) changes while the application is running.

When a server response has no `<head>`, this event is never emitted.

The event is emitted on the `document`.

@learn-ref handling-asset-changes

There is no default behavior when assets have changed.
In particular, no asset elements from the response are updated in the current page.
Event listeners may [handle changed frontend code](/learn/handling-asset-changes#tracking-assets),
e.g., by [notifying the user](/learn/handling-asset-changes#notifying-the-user) or [loading new assets](/learn/handling-asset-changes#loading-new-assets).

## Example

The code below inserts a clickable `<div id="new-version">` banner when assets change.
The user can then choose to reload at their convenience by clicking on the notification.

@include new-asset-notification-example

For more examples, see [Handling asset changes](/learn/handling-asset-changes).

## Emission time

The event is emitted at a particular time in the [render lifecycle](/learn/render-lifecycle):

 - *after* new content has been loaded from the server
 - *before* any fragments have been changed on the page
 - *before* the [browser history](/api/up.history) was changed. A future history location may be found in `event.renderOptions.location`.

If you cannot allow the rendering to proceed with changed assets, listeners may abort the render pass by calling `event.preventDefault()`.

@event up:assets:changed

@param {List<Element>} event.newAssets
  A list of all [assets](/api/up-asset) in the new content.

  The list also includes assets that have a matching element on the current page.

  By default, no new assets are inserted into the current page.
  Event listeners must [explicitly load new assets](/learn/handling-asset-changes#loading-new-assets).

@param {List<Element>} event.oldAssets
  A list of [assets](/api/up-asset) in the `<head>` of the current page.

@param {Object} event.renderOptions
  The [render options](/api/up.render#parameters) for the current render pass.

@param {up.Response} [event.response]
  The response that contained new assets.

  When [rendering from a string](/learn/providing-html#string), this property is `undefined`.

  @experimental

@param event.preventDefault()
  Aborts this render pass before new content is inserted.

@stable
*/

export function block(root: ParentNode): void {
  for (let script of findScripts(root)) {
    script.type = 'up-blocked-script'
  }
}

export function findScripts(root: ParentNode, condition = ''): List<HTMLScriptElement> {
  let selector = config.selector('scriptSelectors', condition)
  return subtree(root, selector) as List<HTMLScriptElement>
}

export function isScript(value: Element): boolean {
  return config.matches(value, 'scriptSelectors')
}

export function adoptNewFragment(fragment: Element, cspInfo: CSPInfo): void {
  new ScriptGate(cspInfo).adoptNewFragment(fragment)
}

export function adoptDetachedHeadAsset(script: Element, cspInfo: CSPInfo): void {
  new ScriptGate(cspInfo).adoptDetachedHeadAsset(script)
}

export function adoptRenderOptionsFromHeader(renderOptions: PlainObject, cspInfo: CSPInfo): void {
  new ScriptGate(cspInfo).adoptRenderOptionsFromHeader(renderOptions)
}

export function callbackAttr(element: Element, attrName: string, parseOpts?: ParseCallbackOptions): ((...args: any[]) => any) | undefined {
  return parseAttr(element, attrName, (code) => {
    let fn = parseCallback(code, parseOpts)
    // Emulate the behavior of the `onclick` attribute, where `this` refers to the clicked element.
    return fn.bind(element)
  })
}

export function parseCallback(code: string, { argNames = ['event'], expandObject = false }: ParseCallbackOptions = {}): (...argValues: any[]) => any {
  // Return an unbound function so callers can bind to an object of their choice.
  return function(...argValues) {
    let callArgNames = argNames

    if (expandObject) {
      let object = argValues[0]
      callArgNames = [...argNames, ...expandObject]
      argValues = [object, ...Object.values(pick(object, expandObject))]
    }

    const nonceableCallback = NonceableCallback.fromCallbackString(code)
    const evalEnv = { thisContext: this, argNames: callArgNames, argValues }
    return new ScriptGate().evalCallback(nonceableCallback, evalEnv)
  }
}

export const cspNonce = mockable(function cspNonce(): string | undefined {
  return evalOption(config.cspNonce)
})

export function warnOfUnsafeCSP(cspInfo: CSPInfo): void {
  new ScriptGate(cspInfo).warnOfUnsafeCSP()
}

/*
Resets the list of registered compiler directives to the
moment when the framework was booted.
*/
function reset(): void {
  registeredCompilers = filterList(registeredCompilers, 'isDefault')
  registeredMacros = filterList(registeredMacros, 'isDefault')
}

export function install(): void {
  on('up:framework:reset', reset)
}

export const api = {
  script: {
    config,
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
