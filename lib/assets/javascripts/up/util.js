var util = (function() {

//    function createDocument(html) {
//      var doc = document.documentElement.cloneNode();
//      doc.innerHTML = html;
////    doc.head = doc.querySelector('head');
//      doc.body = doc.querySelector('body');
//      return doc;
//    }

  function get(url, selector) {
    options = {};
    if (selector) {
      options.headers = { headers: { 'X-Up-Selector': selector }}
    }
    return $.ajax(url, options);
  }

  function normalizeUrl(string) {
    var anchor = $('<a>').attr({ href: string })[0];
    return anchor.protocol + '//' + anchor.hostname + ':' + anchor.port + anchor.pathname + anchor.search;
  }

  function $createElementFromSelector(selector) {
    var path = selector.split(/[ >]/);
    var $element;
    for (var p = 0; p < path.length; p++) {
      var depthSelector = path[p];
      var $parent = $element || $(document.body);
      $element = $parent.find(depthSelector);
      if ($element.length == 0) {
        var conjunction = depthSelector.match(/(^|\.|\#)\w+/g);
        var tag = 'div';
        var classes = [];
        var id = null;
        for (var c = 0; c < conjunction.length; c++) {
          var expression = conjunction[c];
          switch (expression[0]) {
            case '.':
              classes.push(expression.substr(1));
              break;
            case '#':
              id = expression.substr(1);
              break;
            default:
              tag = expression;
          }
        }
        var html = '<' + tag;
        if (classes.length) {
          html += ' class="' + classes.join(' ') + '"';
        }
        if (id) {
          html += ' id="' + id + '"';
        }
        html += '>';
        $element = $(html);
        $element.appendTo($parent);
      }
    }
    return $element;
  }

  function createBody(html) {
    var body = document.createElement('body');
    body.innerHTML = html;
    return body;
  }


  return {
    createBody: createBody,
    normalizeUrl: normalizeUrl,
    $createElementFromSelector: $createElementFromSelector,
    get: get,
    extend: $.extend
  }

})();
