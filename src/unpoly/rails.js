/*
Play nice with Rails UJS
========================

Unpoly is mostly a superset of Rails UJS, so we convert attributes like `[data-method]` to `[up-method]´.
*/
(function() {

  const e = up.element

  function isRails() {
    return window.Rails || // rails-ujs gem
      window.jQuery?.rails // jquery-ujs gem
  }

  for (let feature of ['method', 'confirm']) {
    const upAttribute = `up-${feature}`
    const dataAttribute = `data-${feature}`

    up.macro(`a[${dataAttribute}]`, function(link) {
      if (isRails() && up.link.isFollowable(link)) {
        e.setMissingAttr(link, upAttribute, link.getAttribute(dataAttribute))
        // Remove the [data-...] attribute so links will not be
        // handled a second time by Rails UJS.
        link.removeAttribute(dataAttribute)
      }
    })
  }

})()
