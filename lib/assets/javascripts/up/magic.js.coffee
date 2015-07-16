###*
Registering behavior and custom elements
========================================
  
Up.js keeps a persistent Javascript environment during page transitions.
To prevent memory leaks it is important to cleanly set up and tear down
event handlers and custom elements.

\#\#\# Incomplete documentation!

We need to work on this page:

- Better class-level introduction for this module

@class up.magic
###
up.magic = (->
  
  u = up.util

  DESTROYABLE_CLASS = 'up-destroyable'
  DESTROYER_KEY = 'up-destroyer'

  ###*
  Binds an event handler to the document, which will be executed whenever the
  given event is triggered on the given selector:

      up.on('click', '.button', function(event, $element) {
        console.log("Someone clicked the button %o", $element);
      });

  This is roughly equivalent to binding a jQuery element to `document`.


  \#\#\#\# Attaching structured data

  In case you want to attach structured data to the event you're observing,
  you can serialize the data to JSON and put it into an `[up-data]` attribute:

      <span class="person" up-data="{ age: 18, name: 'Bob' }">Bob</span>
      <span class="person" up-data="{ age: 22, name: 'Jim' }">Jim</span>

  The JSON will parsed and handed to your event handler as a third argument:

      up.on('click', '.person', function(event, $element, data) {
        console.log("This is %o who is %o years old", data.name, data.age);
      });


  \#\#\#\# Migrating jQuery event handlers to `up.on`

  Within the event handler, Up.js will bind `this` to the
  native DOM element to help you migrate your existing jQuery code to
  this new syntax.

  So if you had this before:

      $(document).on('click', '.button', function() {
        $(this).something();
      });

  ... you can simply copy the event handler to `up.on`:

      up.on('click', '.button', function() {
        $(this).something();
      });


  @method up.on
  @param {String} events
    A space-separated list of event names to bind.
  @param {String} selector
    The selector an on which the event must be triggered.
  @param {Function(event, $element, data)} behavior
    The handler that should be called.
    The function takes the affected element as the first argument (as a jQuery object).
    If the element has an `up-data` attribute, its value is parsed as JSON
    and passed as a second argument.
  ###
  liveDescriptions = []
  defaultLiveDescriptions = null

  live = (events, selector, behavior) ->
    # Silently discard any awakeners that are registered on unsupported browsers
    return unless up.browser.isSupported()
    description = [
      events,
      selector,
      (event) ->
        behavior.apply(this, [event, $(this), data(this)])
    ]
    liveDescriptions.push(description)
    $(document).on(description...)
  
  ###*
  Registers a function to be called whenever an element with
  the given selector is inserted into the DOM through Up.js.

  This is a great way to integrate jQuery plugins.
  Let's say your Javascript plugin wants you to call `lightboxify()`
  on links that should open a lightbox. You decide to
  do this for all links with an `[rel=lightbox]` attribute:

      <a href="river.png" rel="lightbox">River</a>
      <a href="ocean.png" rel="lightbox">Ocean</a>

  This Javascript will do exactly that:

      up.awaken('a[rel=lightbox]', function($element) {
        $element.lightboxify();
      });

  Note that within the awakener, Up.js will bind `this` to the
  native DOM element to help you migrate your existing jQuery code to
  this new syntax.


  \#\#\#\# Custom elements

  You can also use `up.awaken` to implement custom elements like this:

      <current-time></current-time>

  Here is the Javascript that inserts the current time into to these elements:

      up.awaken('current-time', function($element) {
        var now = new Date();
        $element.text(now.toString()));
      });


  \#\#\#\# Cleaning up after yourself

  If your awakener returns a function, Up.js will use this as a *destructor* to
  clean up if the element leaves the DOM. Note that in Up.js the same DOM ad Javascript environment
  will persist through many page loads, so it's important to not create
  [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).

  You should clean up after yourself whenever your awakeners have global
  side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
  or event handlers bound to the document root.

  Here is a version of `<current-time>` that updates
  the time every second, and cleans up once it's done:

      up.awaken('current-time', function($element) {

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
  of `<current-time>` elements.


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

      up.awaken('.google-map', function($element, pins) {

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


  \#\#\#\# Migrating jQuery event handlers to `up.on`

  Within the awakener, Up.js will bind `this` to the
  native DOM element to help you migrate your existing jQuery code to
  this new syntax.

  
  @method up.awaken
  @param {String} selector
    The selector to match.
  @param {Boolean} [options.batch=false]
    If set to `true` and a fragment insertion contains multiple
    elements matching the selector, `awakener` is only called once
    with a jQuery collection containing all matching elements. 
  @param {Function($element, data)} awakener
    The function to call when a matching element is inserted.
    The function takes the new element as the first argument (as a jQuery object).
    If the element has an `up-data` attribute, its value is parsed as JSON
    and passed as a second argument.

    The function may return another function that destroys the awakened
    object when it is removed from the DOM, by clearing global state such as
    time-outs and event handlers bound to the document.
  ###
  awakeners = []
  defaultAwakeners = null

  awaken = (selector, args...) ->
    # Silently discard any awakeners that are registered on unsupported browsers
    return unless up.browser.isSupported()
    awakener = args.pop()
    options = u.options(args[0], batch: false)
    awakeners.push
      selector: selector
      callback: awakener
      batch: options.batch
  
  applyAwakener = (awakener, $jqueryElement, nativeElement) ->
    u.debug "Applying awakener %o on %o", awakener.selector, nativeElement
    destroyer = awakener.callback.apply(nativeElement, [$jqueryElement, data($jqueryElement)])
    if u.isFunction(destroyer)
      $jqueryElement.addClass(DESTROYABLE_CLASS)
      $jqueryElement.data(DESTROYER_KEY, destroyer)

  compile = ($fragment) ->
    u.debug "Compiling fragment %o", $fragment
    for awakener in awakeners
      $matches = u.findWithSelf($fragment, awakener.selector)
      if $matches.length
        if awakener.batch
          applyAwakener(awakener, $matches, $matches.get())
        else
          $matches.each -> applyAwakener(awakener, $(this), this)

  destroy = ($fragment) ->
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
  @method up.magic.data
  @param {String|Element|jQuery} elementOrSelector
  ###

  ###
  Stores a JSON-string with the element.

  If an element annotated with [`up-data`] is inserted into the DOM,
  Up will parse the JSON and pass the resulting object to any matching
  [`up.awaken`](/up.magic#up.magic.awaken) handlers.

  Similarly, when an event is triggered on an element annotated with
  [`up-data`], the parsed object will be passed to any matching
  [`up.on`](/up.magic#up.on) handlers.

  @ujs
  @method [up-data]
  @param {JSON} [up-data]
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
  to later be restored through [`up.bus.reset`](/up.bus#up.bus.reset).
  
  @private
  @method up.magic.snapshot
  ###
  snapshot = ->
    defaultLiveDescriptions = u.copy(liveDescriptions) 
    defaultAwakeners = u.copy(awakeners)

  ###*
  Resets the list of registered event listeners to the
  moment when the framework was booted.
  
  @private
  @method up.magic.reset
  ###
  reset = ->
    for description in liveDescriptions
      unless u.contains(defaultLiveDescriptions, description)
        $(document).off(description...)
    liveDescriptions = u.copy(defaultLiveDescriptions)
    awakeners = u.copy(defaultAwakeners)

  ###*
  Sends a notification that the given element has been inserted
  into the DOM. This causes Up.js to compile the fragment (apply
  event listeners, etc.).

  This method is called automatically if you change elements through
  other Up.js methods. You will only need to call this if you
  manipulate the DOM without going through Up.js.

  @method up.ready
  @param {String|Element|jQuery} selectorOrFragment
  ###
  ready = (selectorOrFragment) ->
    $fragment = $(selectorOrFragment)
    up.bus.emit('fragment:ready', $fragment)
    $fragment

  onEscape = (handler) ->
    live('keydown', 'body', (event) ->
      if u.escapePressed(event)
        handler(event)
    )

  up.bus.on 'app:ready', (-> ready(document.body))
  up.bus.on 'fragment:ready', compile
  up.bus.on 'fragment:destroy', destroy
  up.bus.on 'framework:ready', snapshot
  up.bus.on 'framework:reset', reset

  awaken: awaken
  on: live
  ready: ready
  onEscape: onEscape
  data: data

)()

up.awaken = up.magic.awaken
up.on = up.magic.on
up.ready = up.magic.ready
