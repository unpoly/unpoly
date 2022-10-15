const u = up.util

/*-
@module up.network
*/

up.migrate.renamedPackage('proxy', 'network')
up.migrate.renamedEvent('up:proxy:load',     'up:request:load');    // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:received', 'up:request:loaded');  // renamed in 0.50.0
up.migrate.renamedEvent('up:proxy:loaded',   'up:request:loaded');  // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:fatal',    'up:request:offline');   // renamed in 1.0.0
up.migrate.renamedEvent('up:request:fatal',  'up:request:offline');   // renamed in 3.0.0
up.migrate.renamedEvent('up:proxy:aborted',  'up:request:aborted'); // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:slow',     'up:network:late');    // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:recover',  'up:network:recover'); // renamed in 1.0.0
up.migrate.renamedEvent('up:request:late',   'up:network:late');    // renamed in 3.0.0
up.migrate.renamedEvent('up:request:recover', 'up:network:recover'); // renamed in 3.0.0

const preloadDelayMoved = () => up.migrate.deprecated('up.proxy.config.preloadDelay', 'up.link.config.preloadDelay')
Object.defineProperty(up.network.config, 'preloadDelay', {
  get() {
    preloadDelayMoved()
    return up.link.config.preloadDelay
  },
  set(value) {
    preloadDelayMoved()
    up.link.config.preloadDelay = value
  }
})

up.migrate.renamedProperty(up.network.config, 'maxRequests', 'concurrency')
up.migrate.renamedProperty(up.network.config, 'slowDelay', 'badResponseTime')
up.migrate.renamedProperty(up.network.config, 'cacheExpiry', 'cacheExpireAge')
up.migrate.renamedProperty(up.network.config, 'clearCache', 'expireCache')

up.migrate.handleRequestOptions = function(options) {
  up.migrate.fixKey(options, 'clearCache', 'expireCache')

  if (options.solo) {
    up.migrate.warn('The option up.request({ solo }) has been removed. Use up.network.abort() or up.fragment.abort() instead.')
  }
}

/*-
Makes an AJAX request to the given URL and caches the response.

The function returns a promise that fulfills with the response text.

### Example

```
up.ajax('/search', { params: { query: 'sunshine' } }).then(function(text) {
  console.log('The response text is %o', text)
}).catch(function() {
  console.error('The request failed')
})
```

@function up.ajax
@param {string} [url]
  The URL for the request.

  Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.
@param {Object} [options]
  See options for `up.request()`.
@return {Promise<string>}
  A promise for the response text.
@deprecated
  Use `up.request()` instead.
*/
up.ajax = function(...args) {
  up.migrate.deprecated('up.ajax()', 'up.request()')
  const pickResponseText = response => response.text
  return up.request(...args).then(pickResponseText)
}

/*-
Expires all cache entries.

@function up.proxy.clear
@deprecated
  Use `up.cache.expire()` instead.
*/
up.network.clear = function() {
  up.migrate.deprecated('up.proxy.clear()', 'up.cache.expire()')
  up.cache.expire()
}

/*-
Expires cache entries.

@function up.cache.clear
@deprecated
  Use `up.cache.expire()` instead.
*/
up.Request.Cache.prototype.clear = function(...args) {
  // up.cache is an up.Request.Cache instance
  up.migrate.deprecated('up.cache.clear()', 'up.cache.expire()')
  this.expire(...args)
}

up.network.preload = function(...args) {
  up.migrate.deprecated('up.proxy.preload(link)', 'up.link.preload(link)')
  return up.link.preload(...args)
}

up.migrate.preprocessAbortArgs = function(args) {
  if (args.length === 2 && u.isString(args[1])) {
    up.migrate.warn('up.network.abort() no longer takes a reason as a second argument. Pass it as { reason } option instead.')
    args[1] = { reason: args[1] }
  }
}

/*-
Returns whether Unpoly is *not* currently loading a [request](/up.request).

The network is also considered [busy](/up.network.isBusy()) while requests are [loading in the background](/up.request#options.background).

@see up.network.isBusy

@function up.network.isIdle
@return {boolean}
@deprecated
  Use `!up.network.isBusy()` instead.
*/
up.network.isIdle = function() {
  up.migrate.deprecated('up.network.isIdle()', '!up.network.isBusy()')
  return !up.network.isBusy()
}

/*-
@class up.Request
*/

up.Request.prototype.navigate = function() {
  up.migrate.deprecated('up.Request#navigate()', 'up.Request#loadPage()')
  this.loadPage()
}

/*-
@class up.Response
*/

/*-
Returns whether the server responded with a 2xx HTTP status.

@function up.Response#isSuccess
@return {boolean}
@deprecated
  Use `up.Response#ok` instead.
*/
up.Response.prototype.isSuccess = function() {
  up.migrate.deprecated('up.Response#isSuccess()', 'up.Response#ok')
  return this.ok
}

/*-
Returns whether the response was not [successful](/up.Response.prototype.ok).

@function up.Response#isError
@return {boolean}
@deprecated
  Use `!up.Response#ok` instead.
*/
up.Response.prototype.isError = function() {
  up.migrate.deprecated('up.Response#isError()', '!up.Response#ok')
  return !this.ok
}

function mayHaveCustomIndicator() {
  const listeners = up.EventListener.allNonDefault(document)
  return u.find(listeners, listener => listener.eventType === 'up:network:late')
}

const progressBarDefault = up.network.config.progressBar

function disableProgressBarIfCustomIndicator() {
  up.network.config.progressBar = function() {
    if (mayHaveCustomIndicator()) {
      up.migrate.warn('Disabled the default progress bar as may have built a custom loading indicator with your up:network:late listener. Please set up.network.config.progressBar to true or false.')
      return false
    } else {
      return progressBarDefault
    }
  }
}

disableProgressBarIfCustomIndicator()
up.on('up:framework:reset', disableProgressBarIfCustomIndicator)
