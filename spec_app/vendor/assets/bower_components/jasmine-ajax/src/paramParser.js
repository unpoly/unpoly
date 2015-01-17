getJasmineRequireObj().AjaxParamParser = function() {
  function ParamParser() {
    var defaults = [
      {
        test: function(xhr) {
          return (/^application\/json/).test(xhr.contentType());
        },
        parse: function jsonParser(paramString) {
          return JSON.parse(paramString);
        }
      },
      {
        test: function(xhr) {
          return true;
        },
        parse: function naiveParser(paramString) {
          var data = {};
          var params = paramString.split('&');

          for (var i = 0; i < params.length; ++i) {
            var kv = params[i].replace(/\+/g, ' ').split('=');
            var key = decodeURIComponent(kv[0]);
            data[key] = data[key] || [];
            data[key].push(decodeURIComponent(kv[1]));
          }
          return data;
        }
      }
    ];
    var paramParsers = [];

    this.add = function(parser) {
      paramParsers.unshift(parser);
    };

    this.findParser = function(xhr) {
        for(var i in paramParsers) {
          var parser = paramParsers[i];
          if (parser.test(xhr)) {
            return parser;
          }
        }
    };

    this.reset = function() {
      paramParsers = [];
      for(var i in defaults) {
        paramParsers.push(defaults[i]);
      }
    };

    this.reset();
  }

  return ParamParser;
};
