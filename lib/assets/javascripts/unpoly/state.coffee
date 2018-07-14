###**
States
=========

@class up.state
###
up.state = (($) ->

  u = up.util

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

  states = new up.Cache
    size: -> config.cacheSize
    store: new up.store.Session('up.state')

  capture: (options) ->
    options = u.options(options)
    $origin = $(options.origin)
    $root = $rootForCapture($origin, options)
    $form = $formForCapture($origin, $root, options)
    # This will capture all form data except <input type="file">.
    # We don't want to capture into a FormData because that cannot be inspected
    # or extended with nested keys. up.form has a compiler that will save and restore
    # the `files` property of <input type="file">, so nothing lost here.
    formParams = up.params.fromForm($form, nature: 'array')

    state = new up.State(
      url: up.browser.url()
      params: formParams
      focus: focusedSelector($form) # selection and scroll are saved to data by up.form
      submitUrl: $form.attr('action')
      submitMethod: $form.attr('method')
    )
    state.data = up.syntax.saveData(state)
    state

  focusedSelector = ($form) ->
    element = document.activeElement
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

  reset: reset

)(jQuery)
