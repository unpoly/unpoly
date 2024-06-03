/*-
Custom JavaScript
=================

The `up.script` package lets you pair HTML elements with JavaScript behavior.

Unpoly encourages you to migrate all your custom JavaScript from `DOMContentLoaded`
callbacks to [compilers](/up.compiler). This will make sure they run both at page load and
when a new fragment is inserted later. See [Migrating legacy JavaScripts](/legacy-scripts)
for details.

@see data
@see legacy-scripts
@see handling-asset-changes

@see up.compiler
@see [up-data]
@see up.macro
@see up.hello

@module up.script
*/
up.script = (function() {

  const u = up.util
  const e = up.element

  /*-
  Configures defaults for script handling.

  @param [config.assetSelectors]
    An array of CSS selectors matching default [assets](/up-asset).

    By default all remote scripts and stylesheets in the `<head>` are considered assets.
    [Inline scripts](https://simpledev.io/lesson/inline-script-javascript-1/) and
    [internal styles](https://www.tutorialspoint.com/How-to-use-internal-CSS-Style-Sheet-in-HTML)
    are not tracked by default, but you can include them with an `[up-asset]` attribute.

    Unpoly only tracks assets in the `<head>`. Elements in the `<body>` are never tracked,
    even if they match one of the configured selectors.

    See [Tracking assets](/handling-asset-changes#tracking-assets) for examples.

  @param [config.noAssetSelectors]
    Exceptions to `up.script.config.assetSelectors`.

    Matching elements will *not* be considered [assets](/up-asset)
    even if they match `up.script.config.assetSelectors`.

  @param [config.scriptSelectors]
    An array of CSS selectors matching elements that run JavaScript.

    By default this matches all `<script>` tags.

    Matching elements will be removed from new page fragments with `up.fragment.config.runScripts = false`.

    This configuration does not affect what Unpoly considers an [assets](/up-asset).
    For this configure `up.script.config.assetSelectors`.

    @experimental
  @param [config.noScriptSelectors]
    Exceptions to `up.script.config.scriptSelectors`.

    @experimental
  @property up.script.config
  @stable
  */
  const config = new up.Config(() => ({
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
      'up-on-accepted',
      'up-on-dismissed',
      'up-on-loaded',
      'up-on-rendered',
      'up-on-finished',
      'up-on-error',
      'up-on-offline',
    ],
    scriptSelectors: [
      'script'
    ],
    noScriptSelectors: [
      'script[type="application/ld+json"]'
    ]
  }))

  const SYSTEM_MACRO_PRIORITIES = {
    '[up-back]': -100,        // sets [up-href] to previous URL
    '[up-content]': -200,     // A11y for link-like elements
    '[up-drawer]': -200,      //
    '[up-modal]': -200,       //
    '[up-cover]': -200,       //
    '[up-popup]': -200,       //
    '[up-tooltip]': -200,     //
    '[up-dash]': -200,        // sets [up-href] unless already set, also other [up-*] attributes
    '[up-flashes]': -200,     //
    '[up-expand]': -300,      // distributes [up-*] attributes to parents
    '[data-method]': -400,    // converts [data-method] to [up-method] only if link has followable [up-*] attributes
    '[data-confirm]': -400,   // converts [data-conform] to [up-confirm] only if link has followable [up-*] attributes
  }

  let registeredCompilers = []
  let registeredMacros = []

  /*-
  Registers a function to be called when an element with
  the given selector is inserted into the DOM.

  Use compilers to activate your custom JavaScript behavior on matching
  elements.

  You should migrate your [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
  callbacks to compilers. This will make sure they run both at page load and
  when a new fragment is inserted later.
  See [Migrating legacy JavaScripts](/legacy-scripts) for advice on migrating legacy applications.

  ### Example

  This compiler will insert the current time into a
  `<div class='current-time'></div>`:

  ```js
  up.compiler('.current-time', function(element) {
    var now = new Date()
    element.textContent = now.toString()
  })
  ```

  The compiler function will be called once for each matching element when
  the page loads, or when a matching fragment is rendered later.

  ### Integrating JavaScript libraries

  `up.compiler()` is a great way to integrate JavaScript libraries.
  Let's say your JavaScript plugin wants you to call `lightboxify()`
  on links that should open a lightbox. You decide to
  do this for all links with an `lightbox` class:

  ```html
  <a href="river.png" class="lightbox">River</a>
  <a href="ocean.png" class="lightbox">Ocean</a>
  ```

  This JavaScript will do exactly that:

  ```js
  up.compiler('a.lightbox', function(element) {
    lightboxify(element)
  })
  ```

  ### Cleaning up after yourself {#destructor}

  If your compiler returns a function, Unpoly will use this as a *destructor* to
  clean up if the element leaves the DOM. Note that in Unpoly the same DOM and JavaScript environment
  will persist through many page loads, so it's important to not create
  [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).

  You should clean up after yourself whenever your compilers have global
  side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
  or [event handlers bound to the document root](/up.on).

  Here is a version of `.current-time` that updates
  the time every second, and cleans up once it's done. Note how it returns
  a function that calls `clearInterval`:

  ```js
  up.compiler('.current-time', function(element) {
    let update = () => element.textContent = new Date().toString()
    setInterval(update, 1000)
    return () => clearInterval(update)
  })
  ```

  If we didn't clean up after ourselves, we would have many ticking intervals
  operating on detached DOM elements after we have created and removed a couple
  of `.current-time` elements.

  An alternative way to register a destructor function is `up.destructor()`.

  > [important]
  > The destructor function is *not* expected to remove the element from the DOM.

  ### Passing parameters to a compiler

  You may attach data to an element using HTML5 data attributes
  or encoded as JSON in an `[up-data]` attribute:

  ```html
  <span class='user' up-data='{ "age": 31, "name": "Alice" }'>Alice</span>
  ```

  An object with the element's attached data will be passed to your [compilers](/up.compiler)
  as a second argument:

  ```js
  up.compiler('.user', function(element, data) { // mark-phrase "data"
    console.log(data.age)  // => 31
    console.log(data.name) // => "Alice"
  })
  ```

  See [attaching data to elements](/data) for more details and examples.


  ### Throwing exceptions from compilers

  It is safe to throw exceptions from a compiler or its [destructor](#destructor).
  A crashing compiler will *not* interrupt a render pass, or prevent other compilers on the same element.

  Exceptions thrown by compiler functions are logged to the browser's [error console](https://developer.mozilla.org/en-US/docs/Web/API/console/error).
  Unpoly also emits an [`error` event on `window`](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event).

  See [errors in user code](/render-hooks#errors-in-user-code) for details.


  ### Accessing information about the render pass

  Compilers may accept a third argument with information about the current [render pass](/up.render):

  ```js
  up.compiler('.user', function(element, data, meta) { // mark-phrase "meta"
    console.log(meta.layer.mode)   // => "root"
    console.log(meta.revalidating) // => boolean
  })
  ```

  The following properties are available:

  | Property               | Type          |                                                 | Description                                               |
  |------------------------|---------------|-------------------------------------------------|-----------------------------------------------------------|
  | `meta.layer`           | `up.Layer`    |                                                 | The [layer](/up.layer) of the fragment being compiled.<br>This has the same value as `up.layer.current`. |
  | `meta.revalidating`    | `boolean`     | <span class="tag is_light_gray">optional</span> | Whether the element was reloaded for the purpose of [cache revalidation](/caching#revalidation). |

  ### Registering compilers after booting

  When you [deliver your JavaScript in multiple files](https://makandracards.com/makandra/498036-webpacker-loading-code-on-demand),
  you may register compilers after Unpoly was booted.

  When compilers are registered after Unpoly was booted, it is run
  on current elements, but **only** if the compiler has the default priority.

  If the compiler has a non-default priority, it is run on future
  fragments only. In this case either remove the `{ priority }` option
  or manually call `up.hello()` on an element that should be
  [recompiled](/up.hello#recompiling-elements).

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
  @param {Function(element, data, meta): Function(element)} compiler
    The function to call when an element matching `selector` is inserted.

    The function may accept up to three arguments:

    1. The new element being compiled.
    2. Any [attached data](/data).
    3. [Information about the current render pass](#accessing-information-about-the-render-pass).

    The function may return a [destructor](/up.destructor) function that [cleans the compiled object](#destructor)
    before it is removed from the DOM. The destructor function is called with the compiled element.
  @stable
  */
  function registerCompiler(...args) {
    registerProcessor(args)
  }

  /*-
  Registers a [compiler](/up.compiler) that is run before all other compilers.

  A macro lets you set UJS attributes that will be compiled afterwards.

  If you want default attributes for *every* link and form, consider customizing your
  [navigation options](/navigation).

  ### Example

  You will sometimes find yourself setting the same combination of UJS attributes again and again:

  ```html
  <a href="/page1" up-layer="new modal" up-class="warning" up-animation="shake">Page 1</a>
  <a href="/page1" up-layer="new modal" up-class="warning" up-animation="shake">Page 1</a>
  <a href="/page1" up-layer="new modal" up-class="warning" up-animation="shake">Page 1</a>
  ```

  We would much rather define a new `[smooth-link]` attribute that let's us
  write the same links like this:

  ```html
  <a href="/page1" smooth-link>Page 1</a>
  <a href="/page2" smooth-link>Page 2</a>
  <a href="/page3" smooth-link>Page 3</a>
  ```

  We can define the `[content-link]` attribute by registering a macro that
  sets the `[up-layer]`, `[up-class]` and `[up-animation]` attributes for us:

  ```js
  up.macro('[smooth-link]', function(link) {
    link.setAttribute('up-layer', 'new modal')
    link.setAttribute('up-class', 'warning')
    link.setAttribute('up-animation', 'shake')
  })
  ```

  @function up.macro
  @param {string} selector
    The selector to match.
  @param {Object} options
    See options for [`up.compiler()`](/up.compiler).
  @param {Function(element, data)} macro
    The function to call when a matching element is inserted.

    See [`up.compiler()`](/up.compiler#parameters) for details.
  @stable
  */
  function registerMacro(...args) {
    registerProcessor(args, { macro: true })
  }

  function registerAttrCompiler(...args) {
    let [attr, options, valueCallback] = parseProcessorArgs(args)

    let selector = `[${attr}]`
    let callback = (element) => {
      let value = e.booleanOrStringAttr(element, attr, options.defaultValue)
      if (!value) return
      return valueCallback(element, value)
    }
    registerProcessor([selector, options, callback])
  }

  function detectSystemMacroPriority(macroSelector) {
    macroSelector = u.evalOption(macroSelector)
    for (let substr in SYSTEM_MACRO_PRIORITIES) {
      if (macroSelector.indexOf(substr) >= 0) {
        return SYSTEM_MACRO_PRIORITIES[substr]
      }
    }
    up.fail('Unregistered priority for system macro %o', macroSelector)
  }

  function registerProcessor(args, overrides = {}) {
    let processor = buildProcessor(args, overrides)

    if (processor.macro) {
      if (up.framework.evaling) {
        // Don't allow the default priority (0) for Unpoly's own macros.
        processor.priority ||= detectSystemMacroPriority(processor.selector)

      }
      insertProcessor(registeredMacros, processor)
    } else {
      insertProcessor(registeredCompilers, processor)
    }

  }

  const parseProcessorArgs = function(args) {
    const defaults = u.extractOptions(args)
    const selector = args.shift()
    const callback = args.pop()
    const options = { ...defaults, ...u.extractOptions(args) }
    return [selector, options, callback]
  }

  function buildProcessor(args, overrides) {
    let [selector, options, callback] = parseProcessorArgs(args)

    options = u.options(options, {
      selector,
      isDefault: up.framework.evaling,
      priority: 0,
      batch: false,
    })
    return Object.assign(callback, options, overrides)
  }

  function insertProcessor(queue, newCompiler) {
    let existingCompiler
    let index = 0
    while ((existingCompiler = queue[index]) && (existingCompiler.priority >= newCompiler.priority)) {
      index += 1
    }
    queue.splice(index, 0, newCompiler)

    if (up.framework.booted) {
      if (newCompiler.priority === 0) {
        for (let layer of up.layer.stack) {
          compile(layer.element, { layer, compilers: [newCompiler] })
        }
      } else {
        up.puts('up.compiler()', 'Compiler %s was registered after booting Unpoly. Compiler will run for future fragments only.', newCompiler.selector)
      }
    }

    return newCompiler
  }

  /*-
  Applies all compilers on the given element and its descendants.

  Unlike [`up.hello()`](/up.hello), this doesn't emit `up:fragment:inserted`.

  @function up.script.compile
  @param {Element} target
  @param {Array<Element>} [options.skip]
    A list of elements whose subtrees should not be compiled.
  @param {Object} [options.data]
    Override data for `target`
  @param {Object} [options.dataMap]
    An object mapping selectors to data-override in subtree of `target`.
  @param {Object} [options.compilers]
    A list of compilers to use.

    Defaults to all registered macros and compilers.
  @internal
  */
  function compile(fragment, options) {
    up.emit(fragment, 'up:fragment:compile', { log: false })
    let compilers = options.compilers || registeredMacros.concat(registeredCompilers)
    const pass = new up.CompilerPass(fragment, compilers, options)
    pass.run()
  }

  /*-
  Registers a function to be called when the given element
  is destroyed.

  Elements are destroyed when they are swapped during render pass, when their [layer](/up.layer)
  closes, or when `up.destroy()` is called on the element or its container.

  An alternative way to register a destructor function is to
  [`return` it from your compiler function](/up.compiler#destructor).

  ### Example

  The code below will log a message when `element` exits the DOM:

  ```js
  let element = document.querySelector('.element')
  up.destructor(element, () => console.log('Element was destroyed!'))
  ```

  ### Reusing destructor functions

  You may reuse the same destructor function for multiple element.
  The destructor function is called with the element being destroyed:

  ```js
  let fn = (element) => console.log('Element %o was destroyed', element)

  for (let element of document.querySelector('div')) {
    up.destructor(fn)
  }
  ```

  @function up.destructor
  @param {Element} element
    The element to observe.
  @param {Function(Element)|Array<Function(Element)>} destructor
    One or more destructor functions.
  @stable
  */
  function registerDestructor(element, destructor) {
    let destructors = element.upDestructors
    if (!destructors) {
      destructors = []
      element.upDestructors = destructors
      element.classList.add('up-can-clean')
    }
    if (u.isArray(destructor)) {
      destructors.push(...destructor)
    } else {
      destructors.push(destructor)
    }
  }

  /*-
  Manually compiles a page fragment that has been inserted into the DOM
  by external code.

  All registered [compilers](/up.compiler) and [macros](/up.macro) will be called
  with matches in the given `element`.

  The [`up:fragment:inserted`](/up:fragment:inserted) event is emitted on the compiled element.

  ### Unpoly automatically calls `up.hello()`

  When the page is manipulated using Unpoly functions or HTML selectors,
  Unpoly will automatically call `up.hello()` on new fragments:

  ```js
  let link = document.querySelector('a[href]')
  let { fragment } = await up.follow(link)
  // The fragment is already compiled. No need to call up.hello().
  ```

  You only ever need to use `up.hello()` after creating DOM elements without Unpoly's involvement, for example:

  - Creating elements with `document.createElement()`.
  - Setting the `innerHTML` property on an existing element
  - Parsing HTML into elements using browser APIs like `DOMParser()`.
  - Elements created by other libraries

  In this case compilers will *not* run automatically  and some of Unpoly's own HTML selectors will not be active.
  We can address this by manually calling `up.hello()` on new elements:

  ```js
  let element = document.createElement('div')
  element.innerHTML = '<a href="/path" up-follow>click me</a>'
  // The element is not compiled yet. We must compile it manually:
  up.hello(element)
  ```

  ### Recompiling elements

  It is safe to call `up.hello()` multiple times with the same elements.
  In particular every compiler function is guaranteed to only run once for each matching element.

  If a new compiler is registered after initial compilation,
  that new compiler is [run automatically on current elements](/up.compiler#registering-compilers-after-booting).

  ### Detecting compiler errors

  If a compiler function throws an error, `up.hello()` will still finish the compilation and *not* throw an error.

  Instead compiler errors will print to the [error console](https://developer.mozilla.org/en-US/docs/Web/API/console/error)
  and emit an [`error` event on `window`](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event):

  ```js
  window.addEventListener('error', function(error) {
    alert("Got an error " + error.name)
  })

  up.hello(element)
  ```

  See [errors in user code](/render-hooks#errors-in-user-code) for details.

  @function up.hello
  @param {Element|jQuery|string} element
    The root element of the new page fragment.
  @param {Object} [options.layer]
    An existing `up.Layer` object can be passed to prevent re-lookup.
    @internal
  @param {Object} [options.data]
    Overrides properties from the new fragment's `[up-data]`
    with the given [data object](/data).
    @experimental
  @param {Object} [options.dataMap]
    An object mapping selectors to `options.data`.
    @internal
  @param {Object} [options.meta={}]
    An object containing information about this compiler pass.

    This typically contains `{ request, response, revalidating }` properties.

    It will be passed as a third [compiler](/up.compiler) argument.
    @experimental
  @return {Element}
    The compiled element
  @stable
  */
  function hello(element, options = {}) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    element = up.fragment.get(element, options)

    up.puts('up.hello()', "Compiling fragment %o", element)
    compile(element, options)
    up.fragment.emitInserted(element)

    return element
  }

  /*-
  Runs any destructor on the given fragment and its descendants in the same layer.

  Unlike [`up.destroy()`](/up.destroy), this does not emit any events
  and does not remove the element from the DOM.

  @function up.script.clean
  @param {Element} fragment
  @param {up.Layer} options.layer
  @internal
  */
  function clean(fragment, options = {}) {
    new up.DestructorPass(fragment, options).run()
  }

  /*-
  Returns the [data](/data) attached to the given element.

  Returns an empty object if the element has no attached data.

  Multiple `up.data()` calls for the same object always return the same object reference.

  ### Use with `[up-data]`

  You have an element with JSON data serialized into an `[up-data]` attribute:

  ```html
  <span class='person' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
  ```

  Calling `up.script.data()` will deserialize the JSON string into a JavaScript object:

  ```js
  up.data('.person') // returns { age: 18, name: 'Bob' }
  ```

  ### Use with data attributes

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
    The [data](/data) attached to the element.

    Returns an empty object if the element has no attached data.

    Multiple `up.data()` calls for the same object always return the same object reference.
  @stable
  */

  /*-
  Attaches structured data to an element, to be consumed by a compiler or event handler.

  If an element with an `[up-data]` attribute enters the DOM,
  Unpoly will parse the JSON and pass the resulting object to any matching
  `up.compiler()` functions and `up.on()` callbacks.

  To programmatically parse an `[up-data]` attribute into an object, use `up.data(element)`.

  ### Example

  A container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
  might attach the location and names of its marker pins:

  ```html
  <div class='google-map' up-data='[
    { "lat": 48.36, "lng": 10.99, "title": "Friedberg" },
    { "lat": 48.75, "lng": 11.45, "title": "Ingolstadt" }
  ]'></div>
  ```

  The JSON will be parsed and handed to your compiler as a second argument:

  ```js
  up.compiler('.google-map', function(element, pins) {
    var map = new google.maps.Map(element)
    for (let pin of pins) {
      var position = new google.maps.LatLng(pin.lat, pin.lng)
      new google.maps.Marker({ position, map, title: pin.title })
    }
  })
  ```

  Similarly, when an event is triggered on an element annotated with
  [`up-data`], the parsed object will be passed to any matching
  [`up.on()`](/up.on) handlers:

  ```js
  up.on('click', '.google-map', function(event, element, data) {
    console.log("There are %d pins on the clicked map", data.pins.length)
  })
  ```

  You may also parse the data object programmatically using the `up.data()` function:

  ```
  let data = up.data('.google-map')
  data[0].lat // => 48.36
  data[0].lng // => 10.99
  data[0].title // => 'Friedberg'
  ```

  ### Alternatives

  See [attaching data to elements](/data).

  @selector [up-data]
  @param up-data
    A serialized JSON string
  @stable
  */
  function readData(element) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    element = up.fragment.get(element)

    return element.upData ||= buildData(element)
  }

  function buildData(element) {
    // up.on(document) and up.on(window) may call this with a non-element.
    if (!element.getAttribute) {
      return {}
    }

    let rawJSON = element.getAttribute('up-data')
    let parsedJSON

    if (rawJSON) {
      parsedJSON = JSON.parse(rawJSON)

      // If the [up-data] JSON isn't an object then we cannot offer live merging
      // of [up-data] and [data-...] attributes.
      //
      // It would be better to parse this lazily, but I don't want to pay
      // the bytes for a second Proxy handler when dealing with this edge case.
      if (!u.isOptions(parsedJSON)) {
        return parsedJSON
      }
    }

    return {
      ...element.dataset,
      ...parsedJSON,
      ...element.upCompileData,
    }
  }

  function findAssets(head = document.head) {
    return head.querySelectorAll(config.selector('assetSelectors'))
  }

  /*-
  Tracks an element as a [frontend asset](/handling-asset-changes), usually JavaScripts and stylesheets.

  When [rendering](/up.render), Unpoly compares the assets on the current page with the new assets
  from the server response. If the assets don't match, an `up:assets:changed` event is emitted.


  ### Default assets

  By default all remote scripts and stylesheets in the `<head>` are considered assets:

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


  ### Excluding assets from tracking {#excluding-assets}

  To *exclude* an element in the `<head>` from tracking, mark it with an `[up-asset="false"]` attribute:

  ```html
  <script src="/assets/analytics.js" up-asset="false"></script>
  ```

  To exclude assets by default, configure `up.script.config.noAssetSelectors`.


  ### Tracking additional assets {#including-assets}

  To track additional assets in the `<head>`, mark them with an `[up-asset]` attribute.

  For example, [inline scripts](https://simpledev.io/lesson/inline-script-javascript-1/) are not tracked by default,
  but you can include them explictily:

  ```html
  <script up-asset>
    window.SALE_START = new Date('2024-05-01')
  </script>
  ```

  Only elements in the `<head>` can be matched this way.

  To track additional assets by default, configure `up.script.config.assetSelectors`.

  ### Tracking the backend version {#tracking-backend-versions}

  To detect a new deployment of your *backend* code, consider including the deployed commit hash in a `<meta>` tag.

  By marking the `<meta>` tag with `[up-asset]` it will also emit an `up:assets:changed` event when the commit hash changes:

  ```html
  <meta name="backend-version" value="d50c6dd629e9bbc80304e14a6ba99a18c32ba738" up-asset>
  ```


  @selector [up-asset]
  @stable
  */

  function assertAssetsOK(newAssets, renderOptions) {
    let oldAssets = findAssets()

    let oldHTML = u.map(oldAssets, 'outerHTML').join()
    let newHTML = u.map(newAssets, 'outerHTML').join()

    if (oldHTML !== newHTML) {
      up.event.assertEmitted('up:assets:changed', { oldAssets, newAssets, renderOptions })
    }
  }

  /*-
  This event is emitted when [frontend code](/up-asset) changes while the application is running.

  There is no default behavior when assets have changed.
  In particular no asset elements from the response are updated in the current page.
  Even listeners may [handle changed frontend code](/handling-asset-changes#handling-changed-assets),
  e.g. by [notifying the user](/handling-asset-changes#notifying-the-user) or [loading new assets](/handling-asset-changes#loading-new-assets).

  When a server response has no `<head>`, this event is never emitted.

  The event is emitted on the `document`.


  ### Example

  The code below inserts a clickable `<div id="new-version">` banner when assets change.
  The user can then choose to reload at their convenience, by clicking on the notification.

  @include new-asset-notification-example

  For more examples see [Handling asset changes](/handling-asset-changes).


  ### Emission time

  The event is emitted at a particular time in the [render lifecycle](/render-hooks):

   - *after* new content has been loaded from the server
   - *before* any fragments have been changed on the page.
   - *before* the [browser history](/up.history) was changed. A future history location may be found in `event.renderOptions.location`.

  If you cannot allow the rendering to proceed with changed assets, listeners may abort the render pass by calling `event.preventDefault()`.

  @event up:assets:changed
  @param {List<Element>} event.newAssets
    A list of all [assets](/up-asset) in the new content.

    The list also includes asset that have a matching element on the current page.

    By default no new asset are inserted into the current page.
    Event listeners must [explicitly load new assets](/handling-asset-changes#loading-new-assets).
  @param {List<Element>} event.oldAssets
    A list of [assets](/up-asset) in the `<head>` of the current page.
  @param {Object} event.renderOptions
    The [render options](/up.render#parameters) for the current render pass.
  @param event.preventDefault()
    Aborts this render pass before new content is inserted.

    @experimental
  @stable
  */

  function disableScript(scriptElement) {
    scriptElement.type = 'up-disabled-script'
  }

  function disableScriptsInSubtree(root) {
    let selector = config.selector('scriptSelectors')
    u.each(e.subtree(root, selector), disableScript)
  }

  /*
  Resets the list of registered compiler directives to the
  moment when the framework was booted.
  */
  function reset() {
    registeredCompilers = u.filter(registeredCompilers, 'isDefault')
    registeredMacros = u.filter(registeredMacros, 'isDefault')
  }

  up.on('up:framework:reset', reset)

  return {
    config,
    compiler: registerCompiler,
    macro: registerMacro,
    attrCompiler: registerAttrCompiler,
    destructor: registerDestructor,
    hello,
    clean,
    data: readData,
    findAssets,
    assertAssetsOK,
    disableSubtree: disableScriptsInSubtree,
  }
})()

up.compiler = up.script.compiler
up.destructor = up.script.destructor
up.macro = up.script.macro
up.data = up.script.data
up.hello = up.script.hello
up.attribute = up.script.attrCompiler

