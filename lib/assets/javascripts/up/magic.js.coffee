up.magic = (->

  newBehavior = (options) ->

    registered = []
    installed = []

    behavior = (args...) ->
      console.log("self function called", args)
      description = options.register(args...)
      console.log("Got back description", description)
      registered.push(description) if description
      console.log("current registered", registered)

    behavior.install = ->
      outerArgs = arguments
      console.log "installing registered", registered, outerArgs
      up.util.each registered, (description) ->
        args = [description] + outerArgs
        description = options.install.apply(this, args)
        installed.push(description) if description

    behavior.uninstall = ->
      description = undefined
      while description = installed.pop()
        options.uninstall.apply(this, arguments)

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

        console.log "Registering", events, selector

        apiTranslator = (event) ->
          callback.apply this, [
            event
            $(this)
          ]

        events: events
        selector: selector
        callback: apiTranslator

      install: (description) ->
        console.log "Installting description", description
        $(document).on description.events, description.selector, description.callback
        description

      uninstall: (description) ->
        $(document).off description.events, description.selector, description.callback
        return
    )

    element = newBehavior(

      register: (selector, callback) ->
        selector: selector
        callback: callback

      install: ($element, description) ->
        $element.find(description.selector).addBack().each ->
          description.callback.apply this, [$(this)]
          return
        false
    )

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
    up.bus.emit "fragment:ready", $(document.body)
    return

  up.bus.on "page:hibernate", ->
    page.on.uninstall()
    page.timeout.uninstall()
    page.interval.uninstall()
    return

  # don't need to uninstall element behavior since we will discard the elements anyway
  up.bus.on "fragment:ready", ($fragment) ->
    app.element.install $fragment
    page.element.install $fragment
    page.on.install()
    page.timeout.install()
    page.interval.install()
    return

  app: newBehaviorRegistry()
  page: newBehaviorRegistry()
)()

up.util.extend up, up.magic
