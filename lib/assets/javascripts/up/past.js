var past = (function() {

  var pages = {};

  function push(url) {
    var url = up.util.normalizeUrl(url);
    pages[url] = {
      bodyHtml: document.body.innerHTML,
      title: document.title,
      positionY: window.pageYOffset,
      positionX: window.pageXOffset,
      cachedAt: new Date().getTime()
    };
    history.pushState({ fromUp: true, url: url }, '', url);
  }

  function restorePage(page) {
    document.title = page.title;
    document.documentElement.replaceChild(
      up.util.createBody(page.bodyHtml),
      document.body
    );
  }

  function pop(event) {
    var state = event.originalEvent.state;
    var url = up.util.normalizeUrl(state.url);
    if (state && state.fromUp) {
      if (page = pages[url]) {
        restorePage(page);
      } else {
        // page is no longer cached -- just visit the URL
        location.href = url;
      }
      return false;
    }
  }

  $(window).on('popstate', pop);

  return {
    push: push
  }

})();
