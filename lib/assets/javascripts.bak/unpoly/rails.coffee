###
Play nice with Rails UJS
========================

Unpoly is mostly a superset of Rails UJS, so we convert attributes like `[data-method]` to `[up-method]´.
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

    up.macro "a[#{dataAttribute}]", (link) ->
      if isRails() && up.link.isFollowable(link)
        e.setMissingAttr(link, upAttribute, link.getAttribute(dataAttribute))
        link.removeAttribute(dataAttribute)
