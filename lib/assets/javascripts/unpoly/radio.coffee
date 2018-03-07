###*
Passive updates
===============

This work-in-progress package will contain functionality to
passively receive updates from the server.

@class up.radio
###
up.radio = (($) ->

  u = up.util

  ###*
  Configures defaults for passive updates.

  @property up.radio.config
  @param {Array<string>} [options.hungry]
    An array of CSS selectors that is replaced whenever a matching element is found in a response.
    These elements are replaced even when they were not targeted directly.

    By default this contains the [`[up-hungry]`](/up-hungry) attribute.
  @param {string} [options.hungryTransition=null]
    The transition to use when a [hungry element](/up-hungry) is replacing itself
    while another target is replaced.

    By default this is not set and the original replacement's transition is used.
  @stable
  ###
  config = u.config
    hungry: ['[up-hungry]']
    hungryTransition: null

  reset = ->
    config.reset()

  ###*
  @function up.radio.hungrySelector
  @internal
  ###
  hungrySelector = ->
    u.multiSelector(config.hungry)

  ###*
  Elements with this attribute are [updated](/up.replace) whenever there is a
  matching element found in a successful response. The element is replaced even
  when it isn't [targeted](/a-up-target) directly.

  Use cases for this are unread message counters or notification flashes.
  Such elements often live in the layout, outside of the content area that is
  being replaced.

  @selector [up-hungry]
  @stable
  ###

  up.on 'up:framework:reset', reset

  config: config
  hungrySelector: hungrySelector

)(jQuery)
