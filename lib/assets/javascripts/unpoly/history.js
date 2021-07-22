/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/***
History
========

The `up.history` module helps you work with the browser history.

@see up.history.location
@see up:location:changed

@module up.history
*/
up.history = (function() {
  
  const u = up.util;
  const e = up.element;

  /***
  Configures behavior when the user goes back or forward in browser history.

  @property up.history.config
  @param {Array} [config.restoreTargets=[]]
    A list of possible CSS selectors to [replace](/up.render) when the user goes back in history.

    By default the [root layer's main target](/up.fragment.config#config.mainTargets).
  @param {boolean} [config.enabled=true]
    Defines whether [fragment updates](/up.render) will update the browser's current URL.

    If set to `false` Unpoly will never change the browser URL.
  @param {boolean} [config.enabled=true]
    Whether to restore the known scroll positions
    when the user goes back or forward in history.
  @stable
  */
  const config = new up.Config(() => ({
    enabled: true,
    restoreTargets: [':main']
  }));

  /***
  Returns a normalized URL for the previous history entry.

  Only history entries pushed by Unpoly will be considered.

  @property up.history.previousLocation
  @param {string} previousLocation
  @experimental
  */
  let previousLocation = undefined;
  let nextPreviousLocation = undefined;

  const reset = function() {
    config.reset();
    previousLocation = undefined;
    nextPreviousLocation = undefined;
    return trackCurrentLocation();
  };

  const normalizeURL = function(url, normalizeOptions = {}) {
    normalizeOptions.hash = true;
    return u.normalizeURL(url, normalizeOptions);
  };

  /***
  Returns a normalized URL for the current browser location.

  Note that if the current [layer](/up.layer) does not have [visible history](/up.Layer.prototype.history),
  the browser's address bar will show the location of an ancestor layer.
  To get the location of the current layer, use `up.layer.location`.

  @property up.history.location
  @param {string} location
  @experimental
  */
  const currentLocation = normalizeOptions => normalizeURL(location.href, normalizeOptions);

  /***
  Remembers the current URL so we can use previousURL on pop.

  @function observeNewURL
  @internal
  */
  var trackCurrentLocation = function() {
    const url = currentLocation();

    if (nextPreviousLocation !== url) {
      previousLocation = nextPreviousLocation;
      return nextPreviousLocation = url;
    }
  };

  trackCurrentLocation();

  const isCurrentLocation = function(url) {
    // Some web frameworks care about a trailing slash, some consider it optional.
    // Only for the equality test (is this the current URL) we consider it optional.
    const normalizeOptions = { stripTrailingSlash: true };
    return normalizeURL(url, normalizeOptions) === currentLocation(normalizeOptions);
  };

  /***
  Replaces the current history entry and updates the
  browser's location bar with the given URL.

  When the user navigates to the replaced history entry at a later time,
  Unpoly will [`replace`](/up.replace) the document body with
  the body from that URL.

  Note that functions like [`up.replace()`](/up.replace) or
  [`up.submit()`](/up.submit) will automatically update the
  browser's location bar for you.

  @function up.history.replace
  @param {string} url
  @internal
  */
  const replace = function(url, options = {}) {
    if (manipulate('replaceState', url) && (options.event !== false)) {
      return emit('up:location:changed', {url, reason: 'replace', log: `Replaced state for ${u.urlWithoutHost(url)}`});
    }
  };

  /***
  Adds a new history entry and updates the browser's
  address bar with the given URL.

  When the user restores the new history entry later,
  Unpoly will replace a selector from `up.history.config.restoreTargets` with the body from that URL.

  Note that [fragment navigation](/navigation) will automatically update the
  browser's location bar for you.

  Emits event `up:location:changed`.

  @function up.history.push
  @param {string} url
    The URL for the history entry to be added.
  @experimental
  */
  const push = function(url) {
    url = normalizeURL(url);
    if (!isCurrentLocation(url) && manipulate('pushState', url)) {
      return up.emit('up:location:changed', {url, reason: 'push', log: `Advanced to location ${u.urlWithoutHost(url)}`});
    }
  };

  /***
  This event is [emitted](/up.emit) after the browser's address bar was updated with a new URL.

  There may be several reasons why the browser location was changed:

  - A fragment update changes history through [navigation](/navigation) or rendering with `{ history: true }`.
  - The user uses the back or forward buttons in their browser UI.
  - Programmatic calls to `up.history.push()`.

  When a [layer](/up.layer) has no [visible history](/up.Layer.prototype.history), following a link
  will not cause the browser's address bar to be updated. In this case no `up:location:changed` event will be emitted.
  However, a `up:layer:location:changed` will be emitted even if the address bar did not change.

  @event up:location:changed
  @param {string} event.url
    The URL for the history entry after the change.
  @param {string} event.reason
    The action that caused this change in [history state](https://developer.mozilla.org/en-US/docs/Web/API/History/state).

    The value of this property is either `'push'`, `'pop'` or `'replace'`.
  @stable
  */

  var manipulate = function(method, url) {
    if (config.enabled) {
      const state = buildState();
      window.history[method](state, '', url);
      trackCurrentLocation();
      return state;
    }
  };

  var buildState = () => ({
    up: {}
  });

  const restoreStateOnPop = function(state) {
    if (state != null ? state.up : undefined) {
      // The earlier URL has now been restored by the browser. This cannot be prevented.
      let url = currentLocation();

      const replaced = up.render({
        url,
        history: true,
        // (1) While the browser has already restored the earlier URL, we must still
        //     pass it to render() so the current layer can track the new URL.
        // (2) Since we're passing the current URL, up.history.push() will not add another state.
        // (2) Pass the current URL to ensure that this exact URL is being rendered
        //     and not something derived from the up.Response.
        location: url,
        // Don't replace elements in a modal that might still be open
        // We will close all overlays and update the root layer.
        peel: true,
        layer: 'root',
        target: config.restoreTargets,
        cache: true,
        keep: false,
        scroll: 'restore',
        // Since the URL was already changed by the browser, don't save scroll state.
        saveScroll: false
      });
      return replaced.then(function() {
        url = currentLocation();
        return emit('up:location:changed', {url, reason: 'pop', log: `Restored location ${url}`});
      });
    } else {
      return up.puts('pop', 'Ignoring a state not pushed by Unpoly (%o)', state);
    }
  };

  const pop = function(event) {
    trackCurrentLocation();
    up.viewport.saveScroll({location: previousLocation});
    const {
      state
    } = event;
    return restoreStateOnPop(state);
  };

  var emit = function(...args) {
    const historyLayer = u.find(up.layer.stack.reversed(), 'history');
    return historyLayer.emit(...Array.from(args || []));
  };

  up.on('up:app:boot', function() {
    const register = function() {
      // Supported by all browser except IE:
      // https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration
      window.history.scrollRestoration = 'manual';
      window.addEventListener('popstate', pop);

      // Unpoly replaces the initial page state so it can later restore it when the user
      // goes back to that initial URL. However, if the initial request was a POST,
      // Unpoly will wrongly assume that it can restore the state by reloading with GET.
      if (up.protocol.initialRequestMethod() === 'GET') {
        // Replace the vanilla state of the initial page load with an Unpoly-enabled state
        return replace(currentLocation(), {event: false});
      }
    };

    if (typeof jasmine !== 'undefined' && jasmine !== null) {
      // Can't delay this in tests.
      return register();
    } else {
      // Defeat an unnecessary popstate that some browsers trigger
      // on pageload (Safari, Chrome < 34).
      // We should check in 2023 if we can remove this.
      return setTimeout(register, 100);
    }
  });

  /***
  Changes the link's destination so it points to the previous URL.

  Note that this will *not* call `location.back()`, but will set
  the link's `[up-href]` attribute to the actual, previous URL.

  If no previous URL is known, the link will not be changed.

  \#\#\# Example

  This link ...

  ```html
  <a href="/default" up-back>
    Go back
  </a>
  ```

  ... will be transformed to:

  ```html
  <a href="/default" up-href="/previous-page" up-scroll="restore" up-follow>
    Go back
  </a>
  ```

  @selector a[up-back]
  @stable
  */
  up.macro('a[up-back], [up-href][up-back]', function(link) {
    if (previousLocation) {
      e.setMissingAttrs(link, {
        'up-href': previousLocation,
        'up-scroll': 'restore'
      }
      );
      link.removeAttribute('up-back');
      return up.link.makeFollowable(link);
    }
  });

  up.on('up:framework:reset', reset);

  return u.literal({
    config,
    push,
    replace,
    get_location: currentLocation,
    get_previousLocation() { return previousLocation; },
    isLocation: isCurrentLocation,
    normalizeURL
  });
})();
