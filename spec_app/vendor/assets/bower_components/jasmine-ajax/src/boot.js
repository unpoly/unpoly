(function() {
  var jRequire = getJasmineRequireObj(),
      MockAjax = jRequire.ajax(jRequire);
  if (typeof window === "undefined" && typeof exports === "object") {
    exports.MockAjax = MockAjax;
    jasmine.Ajax = new MockAjax(exports);
  } else {
    window.MockAjax = MockAjax;
    jasmine.Ajax = new MockAjax(window);
  }
}());
