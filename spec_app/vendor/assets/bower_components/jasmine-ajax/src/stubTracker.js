getJasmineRequireObj().AjaxStubTracker = function() {
  function StubTracker() {
    var stubs = [];

    this.addStub = function(stub) {
      stubs.push(stub);
    };

    this.reset = function() {
      stubs = [];
    };

    this.findStub = function(url, data, method) {
      for (var i = stubs.length - 1; i >= 0; i--) {
        var stub = stubs[i];
        if (stub.matches(url, data, method)) {
          return stub;
        }
      }
    };
  }

  return StubTracker;
};
