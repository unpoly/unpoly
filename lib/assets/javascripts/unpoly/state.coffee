###**
States
=========

@class up.state
###
up.state = (($) ->

  u = up.util

  focusTracker = undefined
  up.on 'up:framework:boot', -> focusTracker = new up.FocusTracker()

  ###**
  Configures behavior for states.

  @property up.state.config
  @param {number} [config.cacheSize=10]
    The maximum number of saved states.

    When additional states are saved, the oldest state will be [forgotten](/up.state.discard).
  @stable
  ###
  config = u.config
    cacheSize: 10

  reset = ->
    config.reset()
    focusTracker.reset()

  states = new up.Cache
    size: -> config.cacheSize
    store: new up.store.Session('up.state')

  capture: (options) ->
    options = u.options(options)
    $origin = $(options.origin)
    $root = $rootForCapture($origin, options)
    $form = $formForCapture($origin, $root, options)

    new up.State(
      url: up.browser.url()
      params: up.params.fromForm($form)
      focus: focusedSelector($form) # selection and scroll are saved to data by up.form
      submitUrl: $form.attr('action')
      submitMethod: $form.attr('method')
      data: up.syntax.clientData($root)
    )

  focusedSelector = ($form) ->
    element = focusTracker.lastField()
    if $form.has(element).length
      u.selectorForElement(element)

  $rootForCapture = ($origin, options) ->
    if givenRoot = u.option(options.root, $origin.attr('up-root'))
      $(givenRoot)
    else if $origin
      # An .up-popup does not make a good root layer.
      # I consider it part of the layer underneath.
      $origin.closest('.up-modal, body')
    else if up.modal.isOpen()
      $('.up-modal')
    else
      $('body')

  $formForCapture = ($origin, $root, options) ->
    if givenForm = u.option(options.form, $origin.attr('up-form'))
      $(givenForm)
    else
      $rootForms = $root.find('form:not([up-savable=false]')
      $rootFormWithOrigin = u.presence($rootForms.has($origin))
      $rootFormWithOrigin || $rootForms.first()

  reset = ->
    config.reset()
    states.clear()

  up.on 'up:framework:reset', reset

  reset: reset
  first: states.first

)(jQuery)
