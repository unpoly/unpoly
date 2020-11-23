###**
Passive updates
===============

This work-in-progress package will contain functionality to
passively receive updates from the server.

@module up.radio
###
up.radio = do ->

  u = up.util
  e = up.element

  ###**
  Configures defaults for passive updates.

  @property up.radio.config
  @param {Array<string>} [config.hungrySelectors]
    An array of CSS selectors that is replaced whenever a matching element is found in a response.
    These elements are replaced even when they were not targeted directly.

    By default this contains the [`[up-hungry]`](/up-hungry) attribute.
  @stable
  ###
  config = new up.Config ->
    hungrySelectors: ['[up-hungry]']
    pollInterval: 30000

  up.legacy.renamedProperty(config, 'hungry', 'hungrySelectors')

  reset = ->
    config.reset()

  ###**
  @function up.radio.hungrySelector
  @internal
  ###
  hungrySelector = ->
    config.hungrySelectors.join(',')

  ###**
  Elements with an `[up-hungry]` attribute are [updated](/up.replace) whenever there is a
  matching element found in a successful response. The element is replaced even
  when it isn't [targeted](/a-up-target) directly.

  Use cases for this are unread message counters or notification flashes.
  Such elements often live in the layout, outside of the content area that is
  being replaced.

  @selector [up-hungry]
  @param [up-transition]
    The transition to use when this element is updated.
  @stable
  ###

  # TODO: Docs for up.radio.startPolling()
  startPolling = (element, options = {}) ->
    interval = options.interval ? e.numberAttr(element, 'up-interval') ? config.pollInterval
    timer = null

    doReload = ->
      if document.hidden
        doSchedule()
      else
        u.always(up.reload(element, options), doSchedule)

    doSchedule = ->
      timer = setTimeout(doReload, interval)

    doSchedule()

    return -> clearTimeout(timer)

  ###**
  Elements with an `[up-poll]` attribute are [reloaded](/up.reload) from the server periodically.

  \#\#\# Example

      <div class="unread-count" up-poll>
        2 new messages
      </div>

  \#\#\# Controlling the reload interval

  You may set an optional `[up-interval]` attribute to set the reload interval in milliseconds:

      <div class="unread-count" up-poll up-interval="10000">
        2 new messages
      </div>

  If the value is omitted, a global default is used. You may configure the default like this:

      up.radio.config.pollInterval = 10000

  \#\#\# Controlling the source URL

  The element will be reloaded from the URL from which it was originally loaded.



  @selector [up-poll]
  @param [up-interval]
    The reload interval in milliseconds.
    Defaults to `up.radio.config.pollInterval`.
  ###
  up.compiler '[up-poll]', startPolling

  up.on 'up:framework:reset', reset

  config: config
  hungrySelector: hungrySelector
  startPolling: startPolling
