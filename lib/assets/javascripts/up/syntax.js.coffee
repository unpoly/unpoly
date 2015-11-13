###*
Custom elements
===============
  
Up.js keeps a persistent Javascript environment during page transitions.
To prevent memory leaks it is important to cleanly set up and tear down
event handlers and custom elements.

\#\#\# Incomplete documentation!

We need to work on this page:

- Better class-level introduction for this module

@class up.syntax
###
up.syntax = (($) ->
  
  u = up.util

  DESTROYABLE_CLASS = 'up-destroyable'
  DESTROYER_KEY = 'up-destroyer'


  ###*
  Registers a function to be called whenever an element with
  the given selector is inserted into the DOM.

      $('.action').compiler(function($element) {
        // your code here
      });

  Compiler functions will be called on matching elements when
  the page loads, or whenever a matching fragment is [updated through Up.js](/up.replace)
  later.

  If you have used Angular.js before, this resembles [Angular directives](https://docs.angularjs.org/guide/directive).


  \#\#\#\# Integrating jQuery plugins

  `up.compiler` is a great way to integrate jQuery plugins.
  Let's say your Javascript plugin wants you to call `lightboxify()`
  on links that should open a lightbox. You decide to
  do this for all links with an `[rel=lightbox]` attribute:

      <a href="river.png" rel="lightbox">River</a>
      <a href="ocean.png" rel="lightbox">Ocean</a>

  This Javascript will do exactly that:

      up.compiler('a[rel=lightbox]', function($element) {
        $element.lightboxify();
      });


  \#\#\#\# Custom elements

  You can use `up.compiler` to implement custom elements like this:

      <clock></clock>

  Here is the Javascript that inserts the current time into to these elements:

      up.compiler('clock', function($element) {
        var now = new Date();
        $element.text(now.toString()));
      });


  \#\#\#\# Cleaning up after yourself

  If your compiler returns a function, Up.js will use this as a *destructor* to
  clean up if the element leaves the DOM. Note that in Up.js the same DOM ad Javascript environment
  will persist through many page loads, so it's important to not create
  [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).

  You should clean up after yourself whenever your compilers have global
  side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
  or event handlers bound to the document root.

  Here is a version of `<clock>` that updates
  the time every second, and cleans up once it's done:

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


  \#\#\#\# Attaching structured data

  In case you want to attach structured data to the event you're observing,
  you can serialize the data to JSON and put it into an `[up-data]` attribute.
  For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
  might attach the location and names of its marker pins:

      <div class="google-map" up-data="[
        { lat: 48.36, lng: 10.99, title: 'Friedberg' },
        { lat: 48.75, lng: 11.45, title: 'Ingolstadt' }
      ]"></div>

  The JSON will parsed and handed to your event handler as a second argument:

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


  \#\#\#\# Migrating jQuery event handlers to `up.compiler`

  Within the compiler, Up.js will bind `this` to the
  native DOM element to help you migrate your existing jQuery code to
  this new syntax.

  So if you had this before:

      $(function() {
        $('.action').on('click', function() {
          $(this).something();
        });
      });

  ... you can reuse the event handler like this:

      $('.action').compiler(function($element) {
        $element.on('click', function() {
          $(this).something();
        });
      });

  
  @function up.compiler
  @param {String} selector
    The selector to match.
  @param {Boolean} [options.batch=false]
    If set to `true` and a fragment insertion contains multiple
    elements matching the selector, `compiler` is only called once
    with a jQuery collection containing all matching elements. 
  @param {Function($element, data)} compiler
    The function to call when a matching element is inserted.
    The function takes the new element as the first argument (as a jQuery object).
    If the element has an `up-data` attribute, its value is parsed as JSON
    and passed as a second argument.

    The function may return a destructor function that destroys the compiled
    object before it is removed from the DOM. The destructor is supposed to
    clear global state such as time-outs and event handlers bound to the document.
    The destructor is *not* expected to remove the element from the DOM, which
    is already handled by [`up.destroy`](/up.destroy).
  ###
  compilers = []
  defaultCompilers = null

  compiler = (selector, args...) ->
    # Silently discard any compilers that are registered on unsupported browsers
    return unless up.browser.isSupported()
    compiler = args.pop()
    options = u.options(args[0], batch: false)
    compilers.push
      selector: selector
      callback: compiler
      batch: options.batch
  
  applyCompiler = (compiler, $jqueryElement, nativeElement) ->
    u.debug "Applying compiler %o on %o", compiler.selector, nativeElement
    destroyer = compiler.callback.apply(nativeElement, [$jqueryElement, data($jqueryElement)])
    if u.isFunction(destroyer)
      $jqueryElement.addClass(DESTROYABLE_CLASS)
      $jqueryElement.data(DESTROYER_KEY, destroyer)

  compile = ($fragment) ->
    u.debug "Compiling fragment %o", $fragment
    for compiler in compilers
      $matches = u.findWithSelf($fragment, compiler.selector)
      if $matches.length
        if compiler.batch
          applyCompiler(compiler, $matches, $matches.get())
        else
          $matches.each -> applyCompiler(compiler, $(this), this)

  runDestroyers = ($fragment) ->
    u.findWithSelf($fragment, ".#{DESTROYABLE_CLASS}").each ->
      $element = $(this)
      destroyer = $element.data(DESTROYER_KEY)
      destroyer()

  ###*
  Checks if the given element has an `up-data` attribute.
  If yes, parses the attribute value as JSON and returns the parsed object.

  Returns an empty object if the element has no `up-data` attribute.

  The API of this method is likely to change in the future, so
  we can support getting or setting individual keys.

  @protected
  @function up.syntax.data
  @param {String|Element|jQuery} elementOrSelector
  @return
    The JSON-decoded value of the `up-data` attribute.

    Returns an empty object (`{}`) if the element has no (or an empty) `up-data` attribute.
  ###

  ###
  If an element annotated with [`up-data`] is inserted into the DOM,
  Up will parse the JSON and pass the resulting object to any matching
  [`up.compiler`](/up.syntax.compiler) handlers.

  Similarly, when an event is triggered on an element annotated with
  [`up-data`], the parsed object will be passed to any matching
  [`up.on`](/up.on) handlers.

  @selector [up-data]
  @param {JSON} up-data
    A serialized JSON string
  ###
  data = (elementOrSelector) ->
    $element = $(elementOrSelector)
    json = $element.attr('up-data')
    if u.isString(json) && u.trim(json) != ''
      JSON.parse(json)
    else
      {}

  ###*
  Makes a snapshot of the currently registered event listeners,
  to later be restored through `reset`.
  
  @private
  ###
  snapshot = ->
    defaultCompilers = u.copy(compilers)

  ###*
  Resets the list of registered compiler directives to the
  moment when the framework was booted.
  
  @private
  ###
  reset = ->
    compilers = u.copy(defaultCompilers)

  ###*
  Sends a notification that the given element has been inserted
  into the DOM. This causes Up.js to compile the fragment (apply
  event listeners, etc.).

  **As long as you manipulate the DOM using Up.js, you will never
  need to call this method.** You only need to use `up.hello` if the
  DOM is manipulated without Up.js' involvement, e.g. by plugin code that
  is not aware of Up.js:

      // Add an element with naked jQuery, without going through Upjs:
      $element = $('<div>...</div>').appendTo(document.body);
      up.hello($element);

  This function emits the [`up:fragment:inserted`](/up:fragment:inserted)
  event.

  @function up.hello
  @param {String|Element|jQuery} selectorOrElement
  ###
  hello = (selectorOrElement) ->
    $element = $(selectorOrElement)
    up.emit('up:fragment:inserted', $element: $element)
    $element

  ###*
  When a page fragment has been [inserted or updated](/up.replace),
  this event is [emitted](/up.emit) on the fragment.

  @event up:fragment:inserted
  @param {jQuery} event.$element
    The fragment that has been inserted or updated.
  ###

  up.on 'ready', (-> hello(document.body))
  up.on 'up:fragment:inserted', (event) -> compile(event.$element)
  up.on 'up:fragment:destroy', (event) -> runDestroyers(event.$element)
  up.on 'up:framework:boot', snapshot
  up.on 'up:framework:reset', reset

  compiler: compiler
  hello: hello
  data: data

)(jQuery)

up.compiler = up.syntax.compiler
up.hello = up.syntax.hello

up.ready = -> up.util.error('up.ready no longer exists. Please use up.hello instead.')
up.awaken = -> up.util.error('up.awaken no longer exists. Please use up.compiler instead.')
