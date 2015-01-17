getJasmineRequireObj().AjaxRequestStub = function() {
  function RequestStub(url, stubData, method) {
    var normalizeQuery = function(query) {
      return query ? query.split('&').sort().join('&') : undefined;
    };

    if (url instanceof RegExp) {
      this.url = url;
      this.query = undefined;
    } else {
      var split = url.split('?');
      this.url = split[0];
      this.query = split.length > 1 ? normalizeQuery(split[1]) : undefined;
    }

    this.data = normalizeQuery(stubData);
    this.method = method;

    this.andReturn = function(options) {
      this.status = options.status || 200;

      this.contentType = options.contentType;
      this.responseText = options.responseText;
    };

    this.matches = function(fullUrl, data, method) {
      var matches = false;
      fullUrl = fullUrl.toString();
      if (this.url instanceof RegExp) {
        matches = this.url.test(fullUrl);
      } else {
        var urlSplit = fullUrl.split('?'),
            url = urlSplit[0],
            query = urlSplit[1];
        matches = this.url === url && this.query === normalizeQuery(query);
      }
      return matches && (!this.data || this.data === normalizeQuery(data)) && (!this.method || this.method === method);
    };
  }

  return RequestStub;
};
