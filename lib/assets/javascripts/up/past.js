up.past = (function() {

  var pages = {};

  function pageSnapshot(bodyHtml) {
    return {
      bodyHtml: bodyHtml || document.body.innerHTML,
      title: document.title,
      positionY: window.pageYOffset,
      positionX: window.pageXOffset,
      cachedAt: new Date().getTime()
    };
  }

  function replace(url, bodyHtml) {
    manipulateHistory('replaceState', url, bodyHtml);
  }

  function push(url, bodyHtml, options) {
    manipulateHistory('pushState', url, bodyHtml);
  }

  function manipulateHistory(method, url, bodyHtml) {
    var url = up.util.normalizeUrl(url || location.href);
    pages[url] = pageSnapshot(bodyHtml);
    history[method]({ fromUp: true, url: url }, '', url);
  }

  function restorePage(page) {
    up.bus.emit('page:hibernate')
    document.title = page.title;
    document.documentElement.replaceChild(
      up.util.createBody(page.bodyHtml),
      document.body
    );
    up.bus.emit('fragment:ready', $(document.body))
  }

  function pop(event) {
    var state = event.originalEvent.state;
    var url;
    console.log("popping state", state);
    console.log("current href", location.href);
    if (state && state.fromUp) {
      var url = up.util.normalizeUrl(state.url);
      if (page = pages[url]) {
        restorePage(page);
        return false;
      } else {
        visit(url)
      }
    } else {
      console.log("null state")
      // not a state we can deal with
    }
//    location.href = location.href; // WAT
  }

  up.app.timeout(300, function() {
    $(window).on('popstate', pop);
    replace()
//    push(location.href)
  });

  return {
    push: push
  }

})();
