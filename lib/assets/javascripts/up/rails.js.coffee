###*
Play nice with Rails UJS
========================
###

up.rails = (($) ->

  u = up.util

  willHandle = ($element) ->
    $element.is('[up-follow], [up-target], [up-modal], [up-popup]')

  up.compiler '[data-method]', ($element) ->
    if $.rails && willHandle($element)
      u.setMissingAttrs($element, 'up-method': $element.attr('data-method'))
      $element.removeAttr('data-method')

)(jQuery)
