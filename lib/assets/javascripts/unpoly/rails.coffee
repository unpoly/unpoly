###**
Play nice with Rails UJS
========================
###

up.rails = (($) ->

  u = up.util

  isRails = ->
    !!$.rails

  u.each ['method', 'confirm'], (feature) ->

    dataAttribute = "data-#{feature}"
    upAttribute = "up-#{feature}"

    up.$macro "[#{dataAttribute}]", ($element) ->
      if isRails() && up.link.isFollowable($element)
        replacement = {}
        replacement[upAttribute] = $element.attr(dataAttribute)
        u.setMissingAttrs($element, replacement)
        $element.removeAttr(dataAttribute)

)(jQuery)
