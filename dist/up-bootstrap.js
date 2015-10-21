(function() {
  var defaults;

  defaults = up.layout.defaults();

  up.layout.defaults({
    fixedTop: defaults.fixedTop.concat(['.navbar-fixed-top']),
    fixedBottom: defaults.fixedBottom.concat(['.navbar-fixed-bottom']),
    anchoredRight: defaults.anchoredRight.concat(['.navbar-fixed-top', '.navbar-fixed-bottom', '.footer'])
  });

}).call(this);
(function() {
  up.modal.defaults({
    template: "<div class=\"up-modal\">\n  <div class=\"up-modal-dialog modal-dialog\">\n    <div class=\"up-modal-content modal-content\"></div>\n  </div>\n</div>"
  });

}).call(this);
(function() {
  var defaults;

  defaults = up.navigation.defaults();

  up.navigation.defaults({
    currentClasses: defaults.currentClasses.concat(['active'])
  });

}).call(this);
(function() {


}).call(this);
