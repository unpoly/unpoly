/*
Play nice with Rails UJS
========================

Unpoly is mostly a superset of Rails UJS, so we convert attributes like `[data-method]` to `[up-method]´.
*/
up.rails = (function() {

  const u = up.util
  const e = up.element

  function isRails() {
    return window._rails_loaded || // current rails-ujs integrated with Rails 5.2+
      window.Rails ||              // legacy rails/rails-ujs gem
      window.jQuery?.rails         // legacy rails/jquery-ujs gem
  }

  return u.each(['method', 'confirm'], function(feature) {

    const dataAttribute = `data-${feature}`
    const upAttribute = `up-${feature}`

    up.macro(`a[${dataAttribute}]`, function(link) {
      if (isRails() && up.link.isFollowable(link)) {
        e.setMissingAttr(link, upAttribute, link.getAttribute(dataAttribute))
        // Remove the [data-...] attribute so links will not be
        // handled a second time after Unpoly.
        return link.removeAttribute(dataAttribute)
      }
    })
  })
})()
