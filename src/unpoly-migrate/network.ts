const u = up.util

type UpEventListener = import('../unpoly/event.js').UpEventListener
type RequestCondition = import('../unpoly/network.js').RequestCondition
type RequestOptions = import('../unpoly/network.js').RequestOptions
type RequestTesterOptions = import('../unpoly/network.js').RequestTesterOptions
type UpResponse = import('../unpoly/network.js').UpResponse

// A deprecated alias has the type of the function or namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    network: CoreApi['network'] & {
      clear(): void
      preload: CoreApi['link']['preload']
      isIdle(): boolean
      shouldReduceRequests(): boolean
    }
    ajax(...args: [url: string, options?: RequestOptions] | [options: RequestOptions]): Promise<string>
    readonly proxy: Up['network']
  }
}

// Adds methods to up.Request, up.Response and up.cache that core doesn't declare, so they exist only with unpoly-migrate.
declare module '../unpoly/network/request.js' {
  interface UpRequest {
    navigate(): void
  }
}

declare module '../unpoly/network/request_cache.js' {
  interface UpRequestCache {
    clear(condition?: RequestCondition, testerOptions?: RequestTesterOptions): void
  }
}

declare module '../unpoly/network/response.js' {
  interface UpResponse {
    isSuccess(): boolean
    getHeader(name: string): string | undefined
    isError(): boolean
  }
}

up.migrate.renamedNamespace('proxy', 'network')
up.migrate.renamedEvent('up:proxy:load',     'up:request:load')    // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:received', 'up:request:loaded')  // renamed in 0.50.0
up.migrate.renamedEvent('up:proxy:loaded',   'up:request:loaded')  // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:fatal',    'up:request:offline')   // renamed in 1.0.0
up.migrate.renamedEvent('up:request:fatal',  'up:request:offline')   // renamed in 3.0.0
up.migrate.renamedEvent('up:proxy:aborted',  'up:request:aborted') // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:slow',     'up:network:late')    // renamed in 1.0.0
up.migrate.renamedEvent('up:proxy:recover',  'up:network:recover') // renamed in 1.0.0
up.migrate.renamedEvent('up:request:late',   'up:network:late')    // renamed in 3.0.0
up.migrate.renamedEvent('up:request:recover', 'up:network:recover') // renamed in 3.0.0

// The `config.preloadDelay` configuration was defined on up.proxy in V1. It was moved to up.link in V2.
up.network.config.patch(function(config) {
  const preloadDelayMoved = () => up.migrate.deprecated('up.proxy.config.preloadDelay', 'up.link.config.preloadDelay')
  Object.defineProperty(config, 'preloadDelay', {
    configurable: true,
    get() {
      preloadDelayMoved()
      return up.link.config.preloadDelay
    },
    set(value) {
      preloadDelayMoved()
      up.link.config.preloadDelay = value
    }
  })
})

up.network.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'maxRequests', 'concurrency', { label: 'up.network.config' })
  up.migrate.renamedProperty(config, 'slowDelay', 'lateDelay', { label: 'up.network.config' })
  up.migrate.renamedProperty(config, 'cacheExpiry', 'cacheExpireAge', { warning: 'The configuration up.network.config.cacheExpiry has been renamed to up.network.config.cacheExpireAge. Note that Unpoly 3+ automatically reloads cached content after rendering to ensure users always see fresh data ("cache revalidation"). Setting a custom expiry may no longer be necessary.' })
  up.migrate.renamedProperty(config, 'clearCache', 'expireCache', { label: 'up.network.config' })

  let cacheSize = config.cacheSize
  Object.defineProperty(config, 'cacheSize', {
    configurable: true,
    get() {
      return cacheSize
    },
    set(newValue) {
      if (newValue === 0) {
        up.migrate.deprecated('up.network.config.cacheSize = 0', 'up.network.config.cacheEnabled = false')
        config.cacheEnabled = false
      }
      cacheSize = newValue
    }
  })

  // Provide a default for the removed property, in case someone pushes into that.
  up.migrate.removedProperty(config, 'requestMetaKeys', { value: [], warning: 'The configuration up.network.config.requestMetaKeys has been removed. Servers that optimize responses based on request headers should instead set a Vary response header.' })
})

/**
Request options with keys that core no longer knows.
@internal
*/
interface LegacyRequestOptions extends RequestOptions {
  solo?: unknown
}

// Core calls this hook (up.request()).
up.migrate.handleRequestOptions = function(options: LegacyRequestOptions) {
  up.migrate.fixKey(options, 'clearCache', 'expireCache', { label: 'request options', detail: options.url })

  if (options.solo) {
    up.migrate.warn('The option up.request({ solo }) has been removed. Use up.network.abort() or up.fragment.abort() instead.')
  }
}

up.on('up:request:loaded', function(event) {
  if (event.response.header('X-Up-Expire-Cache') === 'false') {
    up.migrate.warn('The server can no longer prevent cache expiration with an `X-Up-Expire-Cache: false` response header. The header has no effect and can be removed.')
  }

  if (event.response.header('X-Up-Evict-Cache') === 'false') {
    up.migrate.warn('The server can no longer prevent cache eviction with an `X-Up-Evict-Cache: false` response header. The header has no effect and can be removed.')
  }
})

up.ajax = function(...args) {
  up.migrate.deprecated('up.ajax()', 'up.request()')
  const pickResponseText = (response: UpResponse) => response.text
  return up.request(...args).then(pickResponseText)
}

up.network.clear = function() {
  up.migrate.deprecated('up.proxy.clear()', 'up.cache.expire()')
  up.cache.expire()
}

// The cache's class isn't on window.up, and importing it here would patch a second copy
// of the class, since unpoly-migrate.js is a separate bundle. So we patch the prototype
// of the up.cache instance.
Object.getPrototypeOf(up.cache).clear = function(...args: any[]) {
  up.migrate.deprecated('up.cache.clear()', 'up.cache.expire()')
  this.expire(...args)
}

up.network.preload = function(...args) {
  up.migrate.deprecated('up.proxy.preload(link)', 'up.link.preload(link)')
  return up.link.preload(...args)
}

// Core calls this hook (up.network.abort()).
up.migrate.preprocessAbortArgs = function(args) {
  if (args.length === 2 && u.isString(args[1])) {
    up.migrate.warn('up.network.abort() no longer takes a reason as a second argument. Pass it as { reason } option instead.')
    args[1] = { reason: args[1] }
  }
}

up.network.isIdle = function() {
  up.migrate.deprecated('up.network.isIdle()', '!up.network.isBusy()')
  return !up.network.isBusy()
}

up.Request.prototype.navigate = function() {
  up.migrate.deprecated('up.Request#navigate()', 'up.Request#loadPage()')
  this.loadPage()
}

up.migrate.renamedProperty(up.Request.prototype, 'preload', 'background', { warning: 'Property up.Request#preload has been renamed to up.Request#background' })

up.migrate.renamedProperty(up.Request.prototype, 'badResponseTime', 'lateDelay', { warning: 'Property up.Request#badResponseTime has been renamed to up.Request#lateDelay' })

up.Response.prototype.isSuccess = function() {
  up.migrate.deprecated('up.Response#isSuccess()', 'up.Response#ok')
  return this.ok
}

up.Response.prototype.getHeader = function(name: string) {
  up.migrate.deprecated('up.Response#getHeader()', 'up.Response#header()')
  return this.header(name)
}

up.Response.prototype.isError = function() {
  up.migrate.deprecated('up.Response#isError()', '!up.Response#ok')
  return !this.ok
}

function mayHaveCustomIndicator(): UpEventListener | undefined {
  const listeners = up.internal.UpEventListener.allNonDefault(document)
  return u.find(listeners, (listener) => listener.eventType === 'up:network:late')
}

// Core's default is a boolean, not a function.
const progressBarDefault = up.network.config.progressBar as boolean
up.network.config.patch(function(config) {
  config.progressBar = function() {
    if (mayHaveCustomIndicator()) {
      up.migrate.warn('Disabled the default progress bar as you may have built a custom loading indicator with your up:network:late listener. Please set up.network.config.progressBar to true or false.')
      return false
    } else {
      return progressBarDefault
    }
  }
})

up.network.shouldReduceRequests = function() {
  up.migrate.warn('up.network.shouldReduceRequests() has been removed without replacement')
  return false
}

up.network.config.patch(function(config) {
  up.migrate.removedProperty(config, 'badRTT', { label: 'up.network.config' })
  up.migrate.removedProperty(config, 'badDownlink', { label: 'up.network.config' })
  up.migrate.renamedProperty(config, 'badResponseTime', 'lateDelay', { label: 'up.network.config' })
})
