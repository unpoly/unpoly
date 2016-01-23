###*
Play nice with Rails UJS
========================
###

up.rails = (($) ->

  u = up.util

  willHandle = ($element) ->
    $element.is('[up-follow], [up-target], [up-modal], [up-popup]')

  isRails = ->
    u.isGiven($.rails)

  up.compiler '[data-method]', ($element) ->
    if isRails() && willHandle($element)
      u.setMissingAttrs($element, 'up-method': $element.attr('data-method'))
      $element.removeAttr('data-method')

  csrfField = ->
    if isRails()
      name: $.rails.csrfParam()
      value: $.rails.csrfToken()

  csrfField: csrfField
  isRails: isRails

)(jQuery)
