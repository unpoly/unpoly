###*
Enhancing elements
==================

Unpoly keeps a persistent Javascript environment during page transitions.
If you wire Javascript to run on `ready` or `onload` events, those scripts will
only run during the initial page load. Subsequently [inserted](/up.replace)
page fragments will not be compiled.

Let's say your Javascript plugin wants you to call `lightboxify()`
on links that should open a lightbox. You decide to
do this for all links with an `lightbox` class:

    <a href="river.png" class="lightbox">River</a>
    <a href="ocean.png" class="lightbox">Ocean</a>

You should **avoid** doing this on page load:

    $(document).on('ready', function() {
      $('a.lightbox').lightboxify();
    });

Instead you should register a [`compiler`](/up.compiler) for the `a.lightbox` selector:

    up.compiler('a.lightbox', function($element) {
      $element.lightboxify();
    });

The compiler function will be called on matching elements when
the page loads, or whenever a matching fragment is [updated through Unpoly](/up.replace)
later.

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
  the page loads, or whenever a matching fragment is [updated through Unpoly](/up.replace)
  later.

  If you have used Angular.js before, this resembles
  [Angular directives](https://docs.angularjs.org/guide/directive).


  \#\#\#\# Integrating jQuery plugins

  `up.compiler` is a great way to integrate jQuery plugins.
  Let's say your Javascript plugin wants you to call `lightboxify()`
  on links that should open a lightbox. You decide to
  do this for all links with an `lightbox` class:

      <a href="river.png" class="lightbox">River</a>
      <a href="ocean.png" class="lightbox">Ocean</a>

  This Javascript will do exactly that:

      up.compiler('a.lightbox', function($element) {
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

  If your compiler returns a function, Unpoly will use this as a *destructor* to
  clean up if the element leaves the DOM. Note that in Unpoly the same DOM ad Javascript environment
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

  Within the compiler, Unpoly will bind `this` to the
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
  @param {Boolean} [options.keep=false]
    If set to `true` compiled fragment will be [persisted](/up-keep) during
    [page updates](/a-up-target).

    This has the same effect as setting an `up-keep` attribute on the element.
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
  @stable
  ###
  compilers = []

  compiler = (selector, args...) ->
    # Silently discard any compilers that are registered on unsupported browsers
    return unless up.browser.isSupported()
    compiler = args.pop()
    options = u.options(args[0])
    compilers.push
      selector: selector
      callback: compiler
      batch: options.batch
      keep: options.keep

  applyCompiler = (compiler, $jqueryElement, nativeElement) ->
    up.puts ("Compiling '%s' on %o" unless compiler.isDefault), compiler.selector, nativeElement
    if compiler.keep
      value = if u.isString(compiler.keep) then compiler.keep else ''
      $jqueryElement.attr('up-keep', value)
    destroyer = compiler.callback.apply(nativeElement, [$jqueryElement, data($jqueryElement)])
    if u.isFunction(destroyer)
      $jqueryElement.addClass(DESTROYABLE_CLASS)
      $jqueryElement.data(DESTROYER_KEY, destroyer)

  ###*
  Applies all compilers on the given element and its descendants.
  Unlike [`up.hello`](/up.hello), this doesn't emit any events.

  @function up.syntax.compile
  @param {Array<Element>} [options.skip]
    A list of elements whose subtrees should not be compiled.
  @internal
  ###
  compile = ($fragment, options) ->
    options = u.options(options)
    $skipSubtrees = $(options.skip)

    up.log.group "Compiling fragment %o", $fragment.get(0), ->
      for compiler in compilers
        $matches = u.findWithSelf($fragment, compiler.selector)

        $matches = $matches.filter ->
          $match = $(this)
          u.all $skipSubtrees, (element) ->
            $match.closest(element).length == 0

        if $matches.length
          up.log.group ("Compiling '%s' on %d element(s)" unless compiler.isDefault), compiler.selector, $matches.length, ->
            if compiler.batch
              applyCompiler(compiler, $matches, $matches.get())
            else
              $matches.each -> applyCompiler(compiler, $(this), this)

  ###*
  Runs any destroyers on the given fragment and its descendants.
  Unlike [`up.destroy`](/up.destroy), this doesn't emit any events
  and does not remove the element from the DOM.

  @function up.syntax.clean
  @internal
  ###
  clean = ($fragment) ->
    u.findWithSelf($fragment, ".#{DESTROYABLE_CLASS}").each ->
      $element = $(this)
      destroyer = $element.data(DESTROYER_KEY)
      destroyer()

  ###*
  Checks if the given element has an `up-data` attribute.
  If yes, parses the attribute value as JSON and returns the parsed object.

  Returns an empty object if the element has no `up-data` attribute.

  @function up.syntax.data
  @param {String|Element|jQuery} elementOrSelector
  @return
    The JSON-decoded value of the `up-data` attribute.

    Returns an empty object (`{}`) if the element has no (or an empty) `up-data` attribute.
  @experimental
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
  @stable
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
  
  @internal
  ###
  snapshot = ->
    for compiler in compilers
      compiler.isDefault = true

  ###*
  Resets the list of registered compiler directives to the
  moment when the framework was booted.
  
  @internal
  ###
  reset = ->
    compilers = u.select compilers, (compiler) -> compiler.isDefault

  up.on 'up:framework:boot', snapshot
  up.on 'up:framework:reset', reset

  compiler: compiler
  compile: compile
  clean: clean
  data: data

)(jQuery)

up.compiler = up.syntax.compiler

up.ready = -> up.util.error('up.ready no longer exists. Please use up.hello instead.')
up.awaken = -> up.util.error('up.awaken no longer exists. Please use up.compiler instead.')
