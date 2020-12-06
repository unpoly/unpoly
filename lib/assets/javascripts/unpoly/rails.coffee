###**
Play nice with Rails UJS
========================
###

up.rails = do ->

  u = up.util
  e = up.element

  isRails = ->
    window._rails_loaded || # current rails-ujs integrated with Rails 5.2+
      window.Rails ||       # legacy rails/rails-ujs gem
      window.jQuery?.rails  # legacy rails/jquery-ujs gem

  u.each ['method', 'confirm'], (feature) ->

    dataAttribute = "data-#{feature}"
    upAttribute = "up-#{feature}"

    up.macro "[#{dataAttribute}]", (element) ->
      if isRails() && up.link.isFollowable(element)
        e.setMissingAttr(element, upAttribute, element.getAttribute(dataAttribute))
        element.removeAttribute(dataAttribute)
