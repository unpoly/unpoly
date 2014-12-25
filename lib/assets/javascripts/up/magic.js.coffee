up.magic = (->

  newBehavior = (options) ->

    registered = []
    installed = []

    behavior = (args...) ->
      description = options.register(args...)
      registered.push(description) if description

    behavior.install = ->
      outerArgs = arguments
      up.util.each registered, (description) ->
        args = [description].concat(outerArgs)
        description = options.install.apply(this, args)
        installed.push(description) if description

    behavior.uninstall = ->
      while description = installed.pop()
        options.uninstall.apply(this, description)

    behavior.clear = ->
      behavior.uninstall
      registered = []

    behavior

  newBehaviorRegistry = ->

    timeout = newBehavior(

      register: (delay, callback) ->
        delay: delay
        callback: callback

      install: (description) ->
        setTimeout description.callback, description.delay

      uninstall: window.clearTimeout
    )

    interval = newBehavior(

      register: (delay, callback) ->
        delay: delay
        callback: callback

      install: (description) ->
        setInterval description.callback, description.delay

      uninstall: window.clearInterval
    )

    #    var once = newBehavior({
    #
    #      register: function(callback) {
    #        return { callback: callback };
    #      },
    #
    #      install: function(description) {
    #        description.callback();
    #        return false;
    #      }
    #
    #    });
    live = newBehavior(

      register: (events, selector, callback) ->

        apiTranslator = (event) ->
          callback.apply this, [
            event
            $(this)
          ]

        events: events
        selector: selector
        callback: apiTranslator

      install: (description) ->
        $(document).on description.events, description.selector, description.callback
        description

      uninstall: (description) ->
        $(document).off description.events, description.selector, description.callback
    )

    element = newBehavior(

      register: (selector, callback) ->
        selector: selector
        callback: callback

      install: ($element, description) ->
        $element.find(description.selector).addBack().each ->
          description.callback.apply this, [$(this)]
        false # element behaviors cannot be uninstalled, so we're not tracking them
    )

    clear = ->
      for behavior in [element, live, timeout, interval]
        behavior.clear

    clear: clear
    element: element
    on: live
    timeout: timeout
    interval: interval

  #      once: once
  app = newBehaviorRegistry()
  page = newBehaviorRegistry()

  up.bus.on "app:ready", ->
    app.timeout.install()
    app.interval.install()
    app.on.install()
    up.compile(document.body)

  up.bus.on "page:hibernate", ->
    page.clear()

  # don't need to uninstall element behavior since we will discard the elements anyway
  up.bus.on "fragment:ready", ($fragment) ->
    app.element.install $fragment
    page.element.install $fragment
    page.on.install()
    page.timeout.install()
    page.interval.install()

  app: app
  page: page
)()

up.util.extend up, up.magic
