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

  u.each ['method', 'confirm'], (feature) ->

    dataAttribute = "data-#{feature}"
    upAttribute = "up-#{feature}"

    up.compiler "[#{dataAttribute}]", ($element) ->
      if isRails() && willHandle($element)
        replacement = {}
        replacement[upAttribute] = $element.attr(dataAttribute)
        u.setMissingAttrs($element, replacement)
        $element.removeAttr(dataAttribute)

  csrfField = ->
    if isRails()
      name: $.rails.csrfParam()
      value: $.rails.csrfToken()

  csrfField: csrfField
  isRails: isRails

)(jQuery)
