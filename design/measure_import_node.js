ITERATIONS = 100;
CHUNK_SIZE = 10;

HTML = "<body>" + document.body.innerHTML + "</body>";

QUEUE = [];

function pokeQueue() {
  var job;
  if (job = QUEUE.shift()) {
    job();
    setTimeout(pokeQueue, 15);
  }
}

function queue(fn) {
  QUEUE.push(fn);
}


ESCAPE_HTML_ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;'
};

/***
Escapes the given string of HTML by replacing control chars with their HTML entities.

@function up.util.escapeHtml
@param {string} string
  The text that should be escaped
@experimental
 */
escapeHtml = function(string) {
  return string.replace(/[&<>"]/g, function(char) {
    return ESCAPE_HTML_ENTITY_MAP[char];
  });
};



function experiment(name, fn) {
  performance.clearMarks();
  performance.clearMeasures();

  queue(function() {
    // warm-up
    for (var i = 0; i < 100; i++) {
      fn();
    }
  })

  var chunkCount = Math.floor(ITERATIONS / CHUNK_SIZE);

  for (var i = 0; i < chunkCount; i++) {
    queue(function() {
      performance.mark(name + "-start");
      for (var j = 0; j < CHUNK_SIZE; j++) {
        fn();
      }
      performance.mark(name + "-end");
      performance.measure(name, name + "-start", name + "-end");
    })
  }

  queue(function() {
    var entries = performance.getEntriesByName(name);
    var durations = entries.map(function (e) {
      return e.duration
    });

    var outlyerLength = Math.floor(chunkCount * 0.01);

    durations = durations.slice(outlyerLength, durations.length - outlyerLength);

    durations.sort(function (a, b,) {
      return a - b
    });

    var times = {
      minimum: durations[0],
      maximum: durations[durations.length - 1],
      median: durations[Math.floor(durations.length / 2)],
      total: durations.reduce(function (total, num) {
        return total + num
      }),
      setSize: durations.length
    }

    console.debug("Experiment %s: %o", name, times);
  })
}


fixScripts = function(element) {
  var fix, fixes, i, len, results;
  fixes = [];
  detectScriptFixes(element, fixes);
  for (i = 0, len = fixes.length; i < len; i++) {
    fix = fixes[i];
    fix();
  }
};

detectScriptFixes = function(element, fixes) {
  var child, clone, i, len, ref, results;
  if (element.tagName === 'NOSCRIPT') {
    clone = document.createElement('noscript');
    clone.textContent = element.innerHTML;
    return fixes.push(function() {
      return element.parentNode.replaceChild(clone, element);
    });
  } else if (element.tagName === 'SCRIPT') {
    return fixes.push(function() {
      return element.parentNode.removeChild(element);
    });
  } else {
    ref = element.children;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      results.push(detectScriptFixes(child, fixes));
    }
    return results;
  }
};

function removeScripts(doc) {
  doc.querySelectorAll('script').forEach(function(e) { e.remove() })
}







domParser = new DOMParser();


/*
experiment('PlainDOMParser', function() {
  var doc = domParser.parseFromString(HTML, "text/html");
  var body = doc.querySelector('body');
  if (!body) {
    throw "parsing failed";
  }
});
*/

experiment('DOMParserWithFixScripts', function() {
  var doc = domParser.parseFromString(HTML, "text/html");
  var body = doc.querySelector('body');
  if (!body) {
    throw "parsing failed";
  }
  fixScripts(body);
});


/*
experiment('DOMParserWithImport', function() {
  var doc = domParser.parseFromString(HTML, "text/html");
  var body = doc.querySelector('body');
  if (!body) {
    throw "no body in imported";
  }
  var importedNode = document.importNode(body, true);
});
*/


var noScriptPattern = /<noscript[^>]*>(.*?)<\/noscript>/i

experiment('DOMParserWitSmartFixScripts', function() {
  var requiresNoscriptFix = true;

  var html = HTML;

  if (requiresNoscriptFix) {
    html = html.replace(noScriptPattern, function (match, content) {
      return '<div class="up-noscript" data-html="' + escapeHtml(content) + '"></div>'
    })
  }

  var doc = domParser.parseFromString(html, "text/html");

  var body = doc.querySelector('body');
  if (!body) {
    throw "no body in imported";
  }
  removeScripts(body);

  if (requiresNoscriptFix) {
    var noscripts = body.querySelectorAll('.up-noscript');
    noscripts.forEach(function(noscript) {
      var html = noscript.getAttribute('data-html');
      noscript.outerHTML = html;
    })
  }
});






experiment('DOMParserWithImportAndFixScripts', function() {
  var doc = domParser.parseFromString(HTML, "text/html");
  var body = doc.querySelector('body');
  if (!body) {
    throw "no body in imported";
  }
  var importedNode = document.importNode(body, true);
  fixScripts(importedNode);
});





var noScriptPattern = /<noscript[^>]*>(.*?)<\/noscript>/i
// var customElementPattern = /<[^!\->\s\/]+\-/;
var customElementPattern = /<\w+-\w+/;

experiment('DOMParserWithOnDemandImportAndFixScript', function() {
  var requiresNoscriptFix = true;

  var html = HTML;

  if (requiresNoscriptFix) {
    html = html.replace(noScriptPattern, function (match, content) {
      return '<div class="up-noscript" data-html="' + escapeHtml(content) + '"></div>'
    })
  }

  var doc = domParser.parseFromString(html, "text/html");

  var body = doc.querySelector('body');
  if (!body) {
    throw "no body in imported";
  }

  var importedNode;

  if (customElementPattern.test(html)) {
    console.debug("importing because found custom element: ", customElementPattern.exec(html));
    importedNode = document.importNode(body, true);
  } else {
    importedNode = body;
  }

  // removeScripts(importedNode);

  if (requiresNoscriptFix) {
    var noscripts = importedNode.querySelectorAll('.up-noscript');
    noscripts.forEach(function(noscript) {
      var html = noscript.getAttribute('data-html');
      noscript.outerHTML = html;
    })
  }
});



experiment('DocumentFragmentInnerHTMLWithRemoveScripts', function() {

  var doc = document.createDocumentFragment();
  var htmlNode = document.createElement('html');
  doc.appendChild(htmlNode);

  htmlNode.innerHTML = HTML;
  
  var body = doc.querySelector('body');
  if (!body) {
    throw "no body in imported";
  }
  
  removeScripts(body);
});


var htmlPattern = /<html[^>]*>(.*?)<\/html>/i;
var bodyPattern = /<body[^>]*>/i;


experiment('SmartInnerHTMLWithRemoveScripts', function() {

  var doc = undefined;
  
  if (match = htmlPattern.exec(HTML)) {
    var htmlNode = document.createElement('html');
    htmlNode.innerHTML = match[1];
    doc = htmlNode;
    
  } else if (bodyPattern.test(HTML)) {
    var htmlNode = document.createElement('html');
    htmlNode.innerHTML = HTML;
    doc = htmlNode;
  } else {
    var divNode = document.createElement('div');
    divNode.innerHTML = HTML;
    doc = divNode;
  }
  
  var body = doc.querySelector('body');
  if (!body) {
    throw "no body in imported";
  }
  
  removeScripts(body);
  
});



pokeQueue();
