###**
Play nice with Rails UJS
========================
###

up.rails = do ->

  u = up.util
  e = up.element

  isRails = ->
    !!(window.Rails || (window.jQuery?.rails))

  u.each ['method', 'confirm'], (feature) ->

    dataAttribute = "data-#{feature}"
    upAttribute = "up-#{feature}"

    up.macro "[#{dataAttribute}]", (element) ->
      if isRails() && up.link.isFollowable(element)
        replacement = {}
        replacement[upAttribute] = element.getAttribute(dataAttribute)
        u.setMissingAttrs(element, replacement)
        element.removeAttribute(dataAttribute)
