/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/***
Custom JavaScript
=================

The `up.syntax` package lets you pair HTML elements with JavaScript behavior.

@see up.compiler
@see [up-data]
@see up.macro

@module up.syntax
*/
up.syntax = (function() {

  const u = up.util;
  const e = up.element;

  const SYSTEM_MACRO_PRIORITIES = {
    '[up-back]': -100,        // sets [up-href] to previous URL
    '[up-content]': -200,     // A11y for link-like elements
    '[up-drawer]': -200,      //
    '[up-modal]': -200,       //
    '[up-cover]': -200,       //
    '[up-popup]': -200,       //
    '[up-tooltip]': -200,     //
    '[up-dash]': -200,        // sets [up-href] unless already set, also other [up-*] attributes
    '[up-expand]': -300,      // distributes [up-*] attributes to parents
    '[data-method]': -400,   // converts [data-method] to [up-method] only if link has followable [up-*] attributes
    '[data-confirm]': -400,  // converts [data-conform] to [up-confirm] only if link has followable [up-*] attributes
  };

  let compilers = [];
  let macros = [];

  /***
  Registers a function to be called when an element with
  the given selector is inserted into the DOM.

  Use compilers to activate your custom Javascript behavior on matching
  elements.

  You should migrate your [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
  callbacks to compilers. This will make sure they run both at page load and
  when a new fragment is inserted later.
  See [Making JavaScripts work with fragment updates](/legacy-scripts) for advice
  on migrating legacy scripts.

  It will also organize your JavaScript snippets by selector.

  \#\#\# Example

  This compiler will insert the current time into a
  `<div class='current-time'></div>`:

  ```js
  up.compiler('.current-time', function(element) {
    var now = new Date()
    element.textContent = now.toString()
  })
  ```

  The compiler function will be called once for each matching element when
  the page loads, or when a matching fragment is [inserted](/up.replace) later.

  \#\#\# Integrating JavaScript libraries

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

  \#\#\# Cleaning up after yourself

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

  If we didn't clean up after ourselves, we would have many ticking intervals
  operating on detached DOM elements after we have created and removed a couple
  of `<clock>` elements.

  An alternative way to register a destructor function is `up.destructor()`.

  \#\#\# Passing parameters to a compiler

  Use the `[up-data]` attribute to attach structured data to a DOM element.
  The data will be parsed and passed to your compiler function.

  Alternatively your compiler may access attributes for the compiled element
  via the standard [`Element#getAttribute()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute)
  method.

  Unpoly also provides utility functions to read an element attribute and
  cast it to a given type:

  - `up.element.booleanAttr(element, attr)`
  - `up.element.numberAttr(element, attr)`
  - `up.element.jsonAttr(element, attr)`

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
  @param {Function(element, data)} compiler
    The function to call when a matching element is inserted.

    The function takes the new element as the first argument.
    If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
    and passed as a second argument.

    The function may return a destructor function that cleans the compiled
    object before it is removed from the DOM. The destructor is supposed to
    [clear global state](/up.compiler#cleaning-up-after-yourself)
    such as timeouts and event handlers bound to the document.
    The destructor is *not* expected to remove the element from the DOM, which
    is already handled by [`up.destroy()`](/up.destroy).
  @stable
  */
  const registerCompiler = function(...args) {
    const compiler = buildCompiler(args);
    return insertCompiler(compilers, compiler);
  };

  /***
  Registers a function to be called when an element with
  the given selector is inserted into the DOM. The function is called
  with each matching element as a
  [jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).

  If you're not using jQuery, use `up.compiler()` instead, which calls
  the compiler function with a native element.

  \#\#\# Example

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
    @stable
  */
  const registerJQueryCompiler = function(...args) {
    const compiler = registerCompiler(...Array.from(args || []));
    compiler.jQuery = true;
    return compiler;
  };

  /***
  Registers a [compiler](/up.compiler) that is run before all other compilers.

  A macro lets you set UJS attributes that will be compiled afterwards.

  If you want default attributes for *every* link and form, consider customizing your
  [navigation options](/navigation).

  \#\#\# Example

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
  sets the `[up-target]`, `[up-transition]` and `[up-duration]` attributes for us:

  ```
  up.macro('[smooth-link]', function(link) {
    link.setAttribute('up-target', '.content')
    link.setAttribute('up-transition', 'cross-fade')
    link.setAttribute('up-duration', '300')
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
  const registerMacro = function(...args) {
    const macro = buildCompiler(args);

    if (up.framework.booting) {
      macro.priority = detectSystemMacroPriority(macro.selector) ||
        up.fail('Unregistered priority for system macro %o', macro.selector);
    }
    return insertCompiler(macros, macro);
  };

  /***
  Registers a [compiler](/up.compiler) that is run before all other compilers.
  The compiler function is called with each matching element as a
  [jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).

  If you're not using jQuery, use `up.macro()` instead, which calls
  the macro function with a native element.

  \#\#\# Example

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
  @stable
  */
  const registerJQueryMacro = function(...args) {
    const macro = registerMacro(...Array.from(args || []));
    macro.jQuery = true;
    return macro;
  };

  var detectSystemMacroPriority = function(macroSelector) {
    macroSelector = u.evalOption(macroSelector);
    for (let substr in SYSTEM_MACRO_PRIORITIES) {
      const priority = SYSTEM_MACRO_PRIORITIES[substr];
      if (macroSelector.indexOf(substr) >= 0) {
        return priority;
      }
    }
  };

  const parseCompilerArgs = function(args) {
    const selector = args.shift();
    const callback = args.pop();
    const options = u.extractOptions(args);
    return [selector, options, callback];
  };

  var buildCompiler = function(args) {
    let [selector, options, callback] = Array.from(parseCompilerArgs(args));
    options = u.options(options, {
      selector,
      isDefault: up.framework.booting,
      priority: 0,
      batch: false,
      keep: false,
      jQuery: false
    }
    );
    return u.assign(callback, options);
  };

  var insertCompiler = function(queue, newCompiler) {
    let existingCompiler;
    let index = 0;
    while ((existingCompiler = queue[index]) && (existingCompiler.priority >= newCompiler.priority)) {
      index += 1;
    }
    queue.splice(index, 0, newCompiler);
    return newCompiler;
  };

  /***
  Applies all compilers on the given element and its descendants.

  Unlike [`up.hello()`](/up.hello), this doesn't emit any events.

  @function up.syntax.compile
  @param {Array<Element>} [options.skip]
    A list of elements whose subtrees should not be compiled.
  @internal
  */
  const compile = function(fragment, options) {
    const orderedCompilers = macros.concat(compilers);
    const pass = new up.CompilerPass(fragment, orderedCompilers, options);
    return pass.run();
  };

  /***
  Registers a function to be called when the given element
  is [destroyed](/up.destroy).

  \#\#\# Example

  ```js
  up.compiler('.current-time', function(element) {
    let update = () => element.textContent = new Date().toString()
    setInterval(update, 1000)
    up.destructor(element, () => clearInterval(update))
  })
  ```

  An alternative way to register a destructor function is to
  [`return` it from your compiler function](/up.compiler#cleaning-up-after-yourself).

  @function up.destructor
  @param {Element} element
  @param {Function|Array<Function>} destructor
    One or more destructor functions.
  @stable
  */
  const registerDestructor = function(element, destructor) {
    let destructors;
    if (!(destructors = element.upDestructors)) {
      destructors = [];
      element.upDestructors = destructors;
      element.classList.add('up-can-clean');
    }
    if (u.isArray(destructor)) {
      return destructors.push(...Array.from(destructor || []));
    } else {
      return destructors.push(destructor);
    }
  };

  /***
  Runs any destructor on the given fragment and its descendants in the same layer.

  Unlike [`up.destroy()`](/up.destroy), this does not emit any events
  and does not remove the element from the DOM.

  @function up.syntax.clean
  @param {Element} fragment
  @param {up.Layer} options.layer
  @internal
  */
  const clean = function(fragment, options = {}) {
    const pass = new up.DestructorPass(fragment, options);
    return pass.run();
  };

  /***
  Returns the given element's `[up-data]`, parsed as a JavaScript object.

  Returns `undefined` if the element has no `[up-data]` attribute.

  \#\#\# Example

  You have an element with JSON data serialized into an `up-data` attribute:

  ```html
  <span class='person' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
  ```

  Calling `up.syntax.data()` will deserialize the JSON string into a JavaScript object:

  ```js
  up.syntax.data('.person') // returns { age: 18, name: 'Bob' }
  ```

  @function up.data
  @param {string|Element|jQuery} element
    The element for which to return data.
  @return
    The JSON-decoded value of the `up-data` attribute.

    Returns `undefined` if the element has no (or an empty) `up-data` attribute.
  @stable
  */

  /***
  Attaches structured data to an element, to be consumed by a compiler.

  If an element with an `[up-data]` attribute enters the DOM,
  Unpoly will parse the JSON and pass the resulting object to any matching
  [`up.compiler()`](/up.compiler) functions.

  \#\#\# Example

  For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
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
    pins.forEach(function(pin) {
      var position = new google.maps.LatLng(pin.lat, pin.lng)
      new google.maps.Marker({
        position: position,
        map: map,
        title: pin.title
      })
    })
  })
  ```

  Similarly, when an event is triggered on an element annotated with
  [`up-data`], the parsed object will be passed to any matching
  [`up.on()`](/up.on) handlers.

  ```js
  up.on('click', '.google-map', function(event, element, pins) {
    console.log("There are %d pins on the clicked map", pins.length)
  })
  ```

  @selector [up-data]
  @param up-data
    A serialized JSON string
  @stable
  */
  const readData = function(element) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    element = up.fragment.get(element);
    return e.jsonAttr(element, 'up-data') || {};
  };

  /*
  Resets the list of registered compiler directives to the
  moment when the framework was booted.
  */
  const reset = function() {
    compilers = u.filter(compilers, 'isDefault');
    return macros = u.filter(macros, 'isDefault');
  };

  up.on('up:framework:reset', reset);

  return {
    compiler: registerCompiler,
    macro: registerMacro,
    $compiler: registerJQueryCompiler,
    $macro: registerJQueryMacro,
    destructor: registerDestructor,
    compile,
    clean,
    data: readData
  };
})();

up.compiler = up.syntax.compiler;
up.$compiler = up.syntax.$compiler;
up.destructor = up.syntax.destructor;
up.macro = up.syntax.macro;
up.$macro = up.syntax.$macro;
up.data = up.syntax.data;
