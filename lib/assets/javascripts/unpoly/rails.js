/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
Play nice with Rails UJS
========================

Unpoly is mostly a superset of Rails UJS, so we convert attributes like `[data-method]` to `[up-method]´.
*/

up.rails = (function() {

  const u = up.util;
  const e = up.element;

  const isRails = () => // legacy rails/jquery-ujs gem
  // legacy rails/rails-ujs gem
  window._rails_loaded || // current rails-ujs integrated with Rails 5.2+
    window.Rails || (window.jQuery != null ? window.jQuery.rails : undefined);

  return u.each(['method', 'confirm'], function(feature) {

    const dataAttribute = `data-${feature}`;
    const upAttribute = `up-${feature}`;

    return up.macro(`a[${dataAttribute}]`, function(link) {
      if (isRails() && up.link.isFollowable(link)) {
        e.setMissingAttr(link, upAttribute, link.getAttribute(dataAttribute));
        return link.removeAttribute(dataAttribute);
      }
    });
  });
})();
