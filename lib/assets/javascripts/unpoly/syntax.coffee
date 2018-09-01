###**
Custom JavaScript
=================

Every app needs a way to pair JavaScript snippets with certain HTML elements,
in order to integrate libraries or implement custom behavior.

Unpoly lets you organize your JavaScript snippets using [compilers](/up.compiler).

For instance, to activate the [Masonry](http://masonry.desandro.com/) jQuery plugin for every element
with a `grid` class, use this compiler:

    up.compiler('.grid', function($element) {
      $element.masonry();
    });

The compiler function will be called on matching elements when the page loads
or when a matching fragment is [inserted via AJAX](/up.link) later.

@class up.syntax
###
up.syntax = (($) ->

  u = up.util

  SYSTEM_MACRO_PRIORITIES = {
    '[up-back]': -100        # sets [up-href] to previous URL
    '[up-drawer]': -200      # sets [up-modal] and makes link followable
    '[up-dash]': -200        # sets [up-href] unless already set, also other [up-*] attributes
    '[up-expand]': -300      # distributes [up-*] attributes to parents
    '[data-method]': -400,   # converts [data-method] to [up-method] only if link has followable [up-*] attributes
    '[data-confirm]': -400,  # converts [data-conform] to [up-confirm] only if link has followable [up-*] attributes
  }

  isBooting = true
  componentClasses = []
  macroClasses = []

  ###**
  Registers a function to be called whenever an element with
  the given selector is inserted into the DOM.

  Use compilers to activate your custom Javascript behavior on matching
  elements.

  You should migrate your [jQuery ready callbacks](https://api.jquery.com/ready/)
  to compilers.


  \#\#\# Example

  Let's say that any element with the `action` class should alert a message when clicked.
  We can implement this behavior as a compiler function that is called on all elements matching
  the `.action` selector:

      up.compiler('.action', function($element) {
        $element.on('click', function() {
          alert('Action was clicked!');
        });
      });

  The compiler function will be called once for each matching element when
  the page loads, or when a matching fragment is [inserted](/up.replace) later.


  \#\#\# Integrating jQuery plugins

  `up.compiler()` is a great way to integrate jQuery plugins.
  Let's say your JavaScript plugin wants you to call `lightboxify()`
  on links that should open a lightbox. You decide to
  do this for all links with an `lightbox` class:

      <a href="river.png" class="lightbox">River</a>
      <a href="ocean.png" class="lightbox">Ocean</a>

  This JavaScript will do exactly that:

      up.compiler('a.lightbox', function($element) {
        $element.lightboxify();
      });


  \#\#\# Custom elements

  You can use `up.compiler()` to implement custom elements like this:

      <clock></clock>

  Here is the JavaScript that inserts the current time into to these elements:

      up.compiler('clock', function($element) {
        var now = new Date();
        $element.text(now.toString()));
      });


  \#\#\# Cleaning up after yourself

  If your compiler returns a function, Unpoly will use this as a *destructor* to
  clean up if the element leaves the DOM. Note that in Unpoly the same DOM ad JavaScript environment
  will persist through many page loads, so it's important to not create
  [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).

  You should clean up after yourself whenever your compilers have global
  side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
  or [event handlers bound to the document root](/up.on).

  Here is a version of `<clock>` that updates
  the time every second, and cleans up once it's done. Note how it returns
  a function that calls `clearInterval`:

      up.compiler('clock', function($element) {

        function update() {
          var now = new Date();
          $element.text(now.toString()));
        }

        setInterval(update, 1000);

        return function() {
          clearInterval(update);
        };

      });

  If we didn't clean up after ourselves, we would have many ticking intervals
  operating on detached DOM elements after we have created and removed a couple
  of `<clock>` elements.


  \#\#\# Attaching structured data

  In case you want to attach structured data to the event you're observing,
  you can serialize the data to JSON and put it into an `[up-data]` attribute.
  For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
  might attach the location and names of its marker pins:

      <div class='google-map' up-data='[
        { "lat": 48.36, "lng": 10.99, "title": "Friedberg" },
        { "lat": 48.75, "lng": 11.45, "title": "Ingolstadt" }
      ]'></div>

  The JSON will parsed and handed to your compiler as a second argument:

      up.compiler('.google-map', function($element, pins) {

        var map = new google.maps.Map($element);

        pins.forEach(function(pin) {
          var position = new google.maps.LatLng(pin.lat, pin.lng);
          new google.maps.Marker({
            position: position,
            map: map,
            title: pin.title
          });
        });

      });


  \#\#\# Migrating jQuery event handlers to `up.compiler()`

  Within the compiler, Unpoly will bind `this` to the
  native DOM element to help you migrate your existing jQuery code to
  this new syntax.

  So if you had this before:

      $(function() {
        $('.action').on('click', function() {
          $(this).something();
        });
      });

  ... you can reuse the callback function like this:

      up.compiler('.action', function($element) {
        $element.on('click', function() {
          $(this).something();
        });
      });

  
  @function up.compiler
  @param {string} selector
    The selector to match.
  @param {number} [options.priority=0]
    The priority of this compiler.
    Compilers with a higher priority are run first.
    Two compilers with the same priority are run in the order they were registered.
  @param {boolean} [options.batch=false]
    If set to `true` and a fragment insertion contains multiple
    elements matching the selector, `compiler` is only called once
    with a jQuery collection containing all matching elements. 
  @param {boolean} [options.keep=false]
    If set to `true` compiled fragment will be [persisted](/up-keep) during
    [page updates](/a-up-target).

    This has the same effect as setting an `up-keep` attribute on the element.
  @param {Function($element, data)} compiler
    The function to call when a matching element is inserted.
    The function takes the new element as the first argument (as a jQuery object).
    If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
    and passed as a second argument.

    The function may return a destructor function that destroys the compiled
    object before it is removed from the DOM. The destructor is supposed to
    [clear global state](/up.compiler#cleaning-up-after-yourself)
    such as timeouts and event handlers bound to the document.
    The destructor is *not* expected to remove the element from the DOM, which
    is already handled by [`up.destroy()`](/up.destroy).

    The function may also return an array of destructor functions.
  @stable
  ###
  registerCompilerFunction = (args...) ->
    console.debug("registerCompilerFunction(%o, %o)", args)
    lastIndex = args.length - 1
    args[lastIndex] = up.CompilerComponent.buildClass(args[lastIndex])
    registerComponentClass(args...)

  ###**
  Registers a [compiler](/up.compiler) that is run before all other compilers.

  You can use `up.macro()` to register a compiler that sets other UJS attributes.

  \#\#\# Example

  You will sometimes find yourself setting the same combination of UJS attributes again and again:

      <a href="/page1" up-target=".content" up-transition="cross-fade" up-duration="300">Page 1</a>
      <a href="/page2" up-target=".content" up-transition="cross-fade" up-duration="300">Page 2</a>
      <a href="/page3" up-target=".content" up-transition="cross-fade" up-duration="300">Page 3</a>

  We would much rather define a new `content-link` attribute that let's us
  write the same links like this:

      <a href="/page1" content-link>Page 1</a>
      <a href="/page2" content-link>Page 2</a>
      <a href="/page3" content-link>Page 3</a>

  We can define the `content-link` attribute by registering a macro that
  sets the `up-target`, `up-transition` and `up-duration` attributes for us:

      up.macro('[content-link]', function($link) {
        $link.attr('up-target', '.content');
        $link.attr('up-transition', 'cross-fade');
        $link.attr('up-duration', '300');
      });

  Examples for built-in macros are [`a[up-dash]`](/a-up-dash) and [`[up-expand]`](/up-expand).

  @function up.macro
  @param {string} selector
    The selector to match.
  @param {Object} options
    See options for [`up.compiler()`](/up.compiler).
  @param {Function($element, data)} macro
    The function to call when a matching element is inserted.
    See [`up.compiler()`](/up.compiler) for details.
  @stable
  ###
  registerMacroFunction = (selector, args...) ->
    fn = args.pop()
    options = u.options(args[0], macro: true)
    console.debug('calling registerCompilerFunction(%o, %o)', options, fn)
    registerCompilerFunction(selector, options, fn)

  detectSystemMacroPriority = (macroSelector) ->
    for substr, priority of SYSTEM_MACRO_PRIORITIES
      if macroSelector.indexOf(substr) >= 0
        return priority

  registerComponentClass = (selector, args...) ->
    console.debug("registerComponentClass(%o, %o)", selector, args)

    klass = args.pop()
    options = u.options(args[0])

    if options.macro
      classList = macroClasses
      if isBooting
        options.priority = detectSystemMacroPriority(selector) ||
          up.fail('Unregistered priority for system macro %o', selector)
    else
      classList = componentClasses

    insertComponentClass(classList, selector, options, klass)

  annotateComponentClass = (klass, selector, options) ->
    options = u.options(options,
      selector: selector,
      isSystem: isBooting,
      priority: 0,
      batch: false
      keep: false
    )
    for key, value of options
      if u.isUndefined(klass[key])
        klass[key] = value

  insertComponentClass = (queue, selector, options, newClass) ->
    annotateComponentClass(newClass, selector, options)
    index = 0
    while (existingClass = queue[index]) && (existingClass.priority >= newClass.priority)
      index += 1
    queue.splice(index, 0, newClass)

  ###**
  Applies all compilers on the given element and its descendants.
  Unlike [`up.hello()`](/up.hello), this doesn't emit any events.

  @function up.syntax.compile
  @param {Array<Element>} [options.skip]
    A list of elements whose subtrees should not be compiled.
  @internal
  ###
  compile = ($fragment, options) ->
    allClasses = macroClasses.concat(componentClasses)
    compileRun = new up.CompileRun($fragment, allClasses, options)
    compileRun.compile()

  ###**
  Runs any destroyers on the given fragment and its descendants.
  Unlike [`up.destroy()`](/up.destroy), this doesn't emit any events
  and does not remove the element from the DOM.

  @function up.syntax.clean
  @internal
  ###
  clean = ($fragment) ->
    cleanables = u.selectInSubtree($fragment, '.up-can-clean')
    console.debug('/// got cleanables: %o', cleanables.get())
    u.each cleanables, (cleanable) ->
      cleanable.upResult?.clean()
      # We do not actually remove the $.data key or .up-can-* classes for performance reasons.
      # The element we just cleaned is about to be removed from the DOM.

  ###**
  Checks if the given element has an [`up-data`](/up-data) attribute.
  If yes, parses the attribute value as JSON and returns the parsed object.

  Returns `undefined` if the element has no `up-data` attribute.

  \#\#\# Example

  You have an element with JSON data serialized into an `up-data` attribute:

      <span class='person' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>

  Calling `up.syntax.data()` will deserialize the JSON string into a JavaScript object:

      up.syntax.data('.person') // returns { age: 18, name: 'Bob' }

  @function up.syntax.serverData
  @param {string|Element|jQuery} elementOrSelector
  @return
    The JSON-decoded value of the `up-data` attribute.

    Returns `undefined` if the element has no (or an empty) `up-data` attribute.
  @experimental
  ###

  ###**
  If an element with an `up-data` attribute enters the DOM,
  Unpoly will parse the JSON and pass the resulting object to any matching
  [`up.compiler()`](/up.compiler) handlers.

  For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
  might attach the location and names of its marker pins:

      <div class='google-map' up-data='[
        { "lat": 48.36, "lng": 10.99, "title": "Friedberg" },
        { "lat": 48.75, "lng": 11.45, "title": "Ingolstadt" }
      ]'></div>

  The JSON will parsed and handed to your compiler as a second argument:

      up.compiler('.google-map', function($element, pins) {

        var map = new google.maps.Map($element);

        pins.forEach(function(pin) {
          var position = new google.maps.LatLng(pin.lat, pin.lng);
          new google.maps.Marker({
            position: position,
            map: map,
            title: pin.title
          });
        });

      });

  Similarly, when an event is triggered on an element annotated with
  [`up-data`], the parsed object will be passed to any matching
  [`up.on()`](/up.on) handlers.

      up.on('click', '.google-map', function(event, $element, pins) {
        console.log("There are %d pins on the clicked map", pins.length);
      });

  @selector [up-data]
  @param {JSON} up-data
    A serialized JSON string
  @stable
  ###
  readServerData = (elementOrSelector) ->
    if element = u.element(elementOrSelector)
      u.jsonAttr(element, 'up-data') || {}

  readServerValue = (elementOrSelector) ->
    if element = u.element(elementOrSelector)
      u.jsonAttr(element, 'up-value') || element.getAttribute('value')

  readClientValue = (elementOrSelector) ->
    if input = u.element(elementOrSelector)
      tagName = input.tagName
      type = input.type

      if u.hasClass(input, 'up-can-value')
        return input.upResult?.value()

      else if tagName == 'SELECT'
        if input.getAttribute('multiple')
          return u.map(input.querySelectorAll('option:selected'), 'value')
        else
          return input.value

      else if type == 'checkbox' || type == 'radio'
        return input.value if input.checked

      else if type == 'file'
         # The value of an input[type=file] is the local path displayed in the form.
         # The actual File objects are in the #files property.
        files = input.files
        if input.getAttribute('multiple')
          return u.toArray(files)
        else
          return files[0]

      else
        return input.value

  readClientData = (elementOrSelector) ->
    element = u.element(elementOrSelector)
    element?.upResult?.data()

  persistProps = (selector, propNames) ->
    up.component selector, class
      pickProps: (obj) ->
        u.pickBy(u.only(obj, propNames), u.isGiven)
      compile: (opts) ->
        u.assign(@input, @pickProps(opts.data))
      data: ->
        @pickProps(@input)

  ###**
  @function up.syntax.clientData
  @internal
  ###
  readClientData2 = (fragment = document) ->
    $fragment = $(fragment)
    savables = u.selectInSubtree($fragment, '.up-can-data')
    data = {}
    elementsData = data.elements = {}
    for savable in savables
      if savableData = savable.upResult?.data()
        selector = u.selectorForElement(savable)
        unless u.isGoodSelector(selector)
          up.warn('Saving state for possibly ambiguous selector "%o". Consider using [id] or [up-id] attributes.', selector)
        selectorData = (elementsData[selector] ||= {})
        u.deepAssign(selectorData, savableData)

  ###**
  Resets the list of registered compiler directives to the
  moment when the framework was booted.
  
  @internal
  ###
  reset = ->
    componentClasses = u.select(componentClasses, 'isSystem')
    macroClasses = u.select(macroClasses, 'isSystem')

  up.on 'up:framework:booted', -> isBooting = false
  up.on 'up:framework:reset', reset

  compiler: registerCompilerFunction
  macro: registerMacroFunction
  component: registerComponentClass
  compile: compile
  clean: clean
  persistProps: persistProps
  serverData: readServerData
  clientData: readClientData
  serverValue: readServerValue
  clientValue: readClientValue
  data: (element) ->
    up.warn('Deprecated: up.syntax.data() has been renamed to up.syntax.serverData()')
    readServerData(element)


)(jQuery)

up.component = up.syntax.component
up.compiler = up.syntax.compiler
up.macro = up.syntax.macro
