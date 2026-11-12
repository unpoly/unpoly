const u = up.util

type FragmentKeepEvent = import('../unpoly/fragment.js').FragmentKeepEvent
type RenderJob = import('../unpoly/fragment.js').RenderJob
type RenderOptions = import('../unpoly/fragment.js').RenderOptions
type PlainObject = import('../unpoly/util.js').PlainObject
type FixKeyOptions = import('./migrate/types.js').FixKeyOptions

// A deprecated alias has the type of the function or namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    fragment: CoreApi['fragment'] & {
      first: CoreApi['fragment']['get']
    }
    first: CoreApi['fragment']['get']
    replace(target: RenderOptions['target'], url: string, options?: RenderOptions): RenderJob
    extract(target: RenderOptions['target'], document: string, options?: RenderOptions): RenderJob
    readonly flow: Up['fragment']
    readonly dom: Up['fragment']
  }
}

up.migrate.renamedNamespace('flow', 'fragment')
up.migrate.renamedNamespace('dom', 'fragment')

up.fragment.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'fallbacks', 'mainTargets', { label: 'up.fragment.config' })
})

// Names the call site of a render pass in a warning about its options.
const renderOptionsSource = (options: RenderOptions): FixKeyOptions => ({ label: 'render options', detail: options.origin || options.url || options.target })

// Core calls this hook (ChangeFromContent).
up.migrate.handleResponseDocOptions = (docOptions) => up.migrate.fixKey(docOptions, 'html', 'document', renderOptionsSource(docOptions))

up.fragment.config.patch(function(config) {
  let matchAroundOriginDeprecated = () => up.migrate.deprecated('up.fragment.config.matchAroundOrigin', 'up.fragment.config.match')
  Object.defineProperty(config, 'matchAroundOrigin', {
    configurable: true,
    get: function() {
      matchAroundOriginDeprecated()
      return this.match === 'region'
    },
    set: function(value) {
      matchAroundOriginDeprecated()
      this.match = value ? 'region' : 'first'
    }
  })
})

up.replace = function(target, url, options) {
  up.migrate.deprecated('up.replace(target, url)', 'up.navigate(target, { url })')
  return up.navigate({ ...options, target, url })
}

up.extract = function(target, document, options) {
  up.migrate.deprecated('up.extract(target, document)', 'up.navigate(target, { document })')
  return up.navigate({ ...options, target, document })
}

up.fragment.first = function(...args: any[]) {
  up.migrate.deprecated('up.fragment.first()', 'up.fragment.get()')
  return (up.fragment.get as any)(...args)
}

up.first = up.fragment.first

// Core calls this hook (RenderOptions).
// The options are a PlainObject, since they may have keys and values that RenderOptions no longer allows,
// like { solo } or { fail: 'auto' }.
up.migrate.preprocessRenderOptions = function(options: PlainObject) {
  // Rewrite deprecated { history: URLString } option
  if (u.isString(options.history) && (options.history !== 'auto')) {
    up.migrate.warn("Passing a URL as { history } option is deprecated. Pass it as { location } instead.")
    options.location = options.history
    // Also the URL in { history } is truthy, keeping a value in there would also inherit to failOptions,
    // where it would be expanded to { failLocation }.
    options.history = 'auto'
  }

  // Rewrite deprecated { target: jQuery } option
  // Rewrite deprecated { origin: jQuery } option
  for (let prop of ['target', 'origin']) {
    if (u.isJQuery(options[prop])) {
      up.migrate.warn('Passing a jQuery collection as { %s } is deprecated. Pass it as a native element instead.', prop)
      options[prop] = up.element.get(options[prop])
    }
  }

  // Rewrite deprecated { fail: 'auto' } option
  if (options.fail === 'auto') {
    up.migrate.warn("The option { fail: 'auto' } is deprecated. Omit the option instead.")
    delete options.fail
  }

  let solo = u.pluckKey(options, 'solo')
  if (u.isString(solo)) {
    // Old { solo } option did not accept a string, but some users were passing a string as a truthy value.
    // This would break the { abort } option, where a string is parsed a CSS selector.
    up.migrate.warn("The up.render() option { solo } has been replaced with { abort } and { abort } no longer accepts a URL pattern. Check if you can use { abort: 'target'} or use up.network.abort(pattern) instead.")
    options.abort = (options: PlainObject) => up.network.abort(solo, options)
  } else if (u.isFunction(solo)) {
    up.migrate.warn("The up.render() option { solo } has been replaced with { abort } and { abort } no longer accepts a Function(up.Request): boolean. Check if you can use { abort: 'target'} or use up.network.abort(fn) instead.")
    options.abort = (options: PlainObject) => { up.network.abort(solo, options) }
  } else if (solo === true) {
    up.migrate.deprecated('Option { solo: true }', "{ abort: 'all' }")
    options.abort = 'all'
  } else if (solo === false) {
    up.migrate.deprecated('Option { solo: false }', "{ abort: false }")
    up.migrate.warn('Unpoly 3+ only aborts requests targeting the same fragment. Setting { solo: false } may no longer be necessary.')
    options.abort = false
  }

  up.migrate.fixKey(options, 'failOnFinished', 'onFailFinished', renderOptionsSource(options))
  up.migrate.fixKey(options, 'badResponseTime', 'lateDelay', renderOptionsSource(options))

  // Rewrite deprecated { reveal } option (it had multiple variants)
  if (u.isString(options.reveal)) {
    up.migrate.deprecated(`Option { reveal: '${options.reveal}' }`, `{ scroll: '${options.reveal}' }`)
    options.scroll = options.reveal
  } else if (options.reveal === true) {
    up.migrate.deprecated('Option { reveal: true }', "{ scroll: 'target' }")
    options.scroll = 'target'
  } else if (options.reveal === false) {
    up.migrate.deprecated('Option { reveal: false }', "{ scroll: false }")
    options.scroll = false
  }

  // Rewrite deprecated { resetScroll } option
  if (options.resetScroll === true) {
    up.migrate.deprecated('Option { resetScroll: true }', "{ scroll: 'top' }")
    options.scroll = 'top'
  } if (options.resetScroll === false) {
    up.migrate.deprecated('Option { resetScroll: false }', "{ scroll: false }")
    options.scroll = false
  }

  // Rewrite deprecated { restoreScroll } option
  if (options.restoreScroll === true) {
    up.migrate.deprecated('Option { restoreScroll: true }', "{ scroll: 'restore' }")
    options.scroll = 'restore'
  } if (options.restoreScroll === false) {
    up.migrate.deprecated('Option { restoreScroll: false }', "{ scroll: false }")
    options.scroll = false
  }

  // Rewrite deprecated { scroll } option values
  if (options.scroll === 'reset') {
    up.migrate.deprecated("Option { scroll: 'reset' }", "{ scroll: 'top' }")
    options.scroll = 'top'
  }

}

// Core calls this hook (up.reload()).
up.migrate.postprocessReloadOptions = function(options) {
  let lastModified = options.headers?.['If-Modified-Since']
  let legacyHeader
  if (lastModified) {
    // A date converts to its timestamp in arithmetic. TypeScript wants getTime(), which would change the emitted code.
    legacyHeader = Math.floor((new Date(lastModified) as any) * 0.001).toString()
  } else {
    legacyHeader = '0'
  }

  options.headers[up.internal.headerize('reloadFromTime')] = legacyHeader
}

// Modern versions only support ":origin". This legacy implementation
// also supports the old shorthand "&".
// Core uses this instead of its own implementation when unpoly-migrate is loaded (up.fragment).
/**
An element that may be a form field or button, which has a `form` property.
@internal
*/
interface FormFieldElement extends Element {
  form?: HTMLFormElement | null
}

up.migrate.resolveOrigin = function(target, { origin }: { origin?: FormFieldElement } = {}) {
  // We skip over attribute selector values, which may contain an ampersand, e.g. 'a[href="/notes?page=2&order=created"]'
  let pattern = /"[^"]*"|'[^']*'|&|:origin\b/g

  return target.replace(pattern, function(variant) {
    if (variant === ':origin' || variant === '&') {
      if (variant === '&') {
        // We only explain the changed :origin of form submissions when the origin is a form element.
        // Validation origins also get the hint, which we accept as noise.
        let formHint = origin?.form ? "A form submission's :origin is now the button or changed field, not the form. To target the form, use form:has(:origin). " : ''
        up.migrate.warn("Origin shorthand '&' has been deprecated. Use :origin instead. " + formHint + "Found in %s (origin %o).", target, origin)
      }
      if (origin) {
        return up.fragment.toTarget(origin)
      } else {
        up.internal.fail('Missing { origin } element to resolve "%s" reference (found in %s)', variant, target)
      }
    } else {
      // Skip over quoted attribute selector values, which may contain an ampersand
      return variant
    }
  })
}

up.fragment.config.patch(function() {
  Object.defineProperty(this, 'runScripts', {
    configurable: true,
    get() {
      up.migrate.deprecated('up.fragment.config.runScripts', 'up.script.config.scriptElementPolicy = "auto"')
      switch(up.script.config.scriptElementPolicy) {
        case 'auto': return true
        case 'pass': return true
        case 'block': return false
        case 'nonce': return (script: HTMLScriptElement) => !!script.nonce
      }
    },
    set(value) {
      if (value === true) {
        up.migrate.deprecated('up.fragment.config.runScripts = true', 'up.script.config.scriptElementPolicy = "auto"')
        up.script.config.scriptElementPolicy = 'auto'
      } else if (value === false) {
        up.migrate.deprecated('up.fragment.config.runScripts = false', 'up.script.config.scriptElementPolicy = "block"')
        up.script.config.scriptElementPolicy = 'block'
      } else if (u.isFunction(value)) {
        up.migrate.warn('up.fragment.config.runScripts has been replaced by up.script.config.scriptElementPolicy, but no longer supports a function value.')
        up.script.config.scriptElementPolicy = 'block'
      }
    }
  })
})

// up.compiler('[up-keep]:not([up-keep=true]):not([up-keep=""])', function(element) {
up.compiler('[up-keep]', function(element) {
  let selector = up.internal.booleanOrStringAttr(element, 'up-keep')
  if (u.isString(selector) && /[.[#]/.test(selector)) {
    up.migrate.warn('The [up-keep] attribute no longer supports a selector value (found in %o). Elements will be matched by their derived target. You may prevent keeping with [up-on-keep="if(condition) event.preventDefault()"].', element)
    // The best we can do here is prevent matching of the old and new element if the new element
    // does not match the selector.
    element.addEventListener('up:fragment:keep', function(event: FragmentKeepEvent) {
      if (event.target === element && !event.newFragment.matches(selector)) {
        event.preventDefault()
      }
    })
    element.setAttribute('up-keep', '')
  }
})
