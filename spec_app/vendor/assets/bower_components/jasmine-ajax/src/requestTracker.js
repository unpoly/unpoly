getJasmineRequireObj().AjaxRequestTracker = function() {
  function RequestTracker() {
    var requests = [];

    this.track = function(request) {
      requests.push(request);
    };

    this.first = function() {
      return requests[0];
    };

    this.count = function() {
      return requests.length;
    };

    this.reset = function() {
      requests = [];
    };

    this.mostRecent = function() {
      return requests[requests.length - 1];
    };

    this.at = function(index) {
      return requests[index];
    };

    this.filter = function(url_to_match) {
      var matching_requests = [];

      for (var i = 0; i < requests.length; i++) {
        if (url_to_match instanceof RegExp &&
            url_to_match.test(requests[i].url)) {
            matching_requests.push(requests[i]);
        } else if (url_to_match instanceof Function &&
            url_to_match(requests[i])) {
            matching_requests.push(requests[i]);
        } else {
          if (requests[i].url === url_to_match) {
            matching_requests.push(requests[i]);
          }
        }
      }

      return matching_requests;
    };
  }

  return RequestTracker;
};
