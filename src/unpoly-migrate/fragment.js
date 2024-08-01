const u = up.util

/*-
@module up.fragment
*/

up.migrate.renamedPackage('flow', 'fragment')
up.migrate.renamedPackage('dom', 'fragment')

up.fragment.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'fallbacks', 'mainTargets')
})

up.migrate.handleResponseDocOptions = docOptions => up.migrate.fixKey(docOptions, 'html', 'document')

up.fragment.config.patch(function(config) {
  let matchAroundOriginDeprecated = () => up.migrate.deprecated('up.fragment.config.matchAroundOrigin', 'up.fragment.config.match')
  Object.defineProperty(config, 'matchAroundOrigin', {
    configurable: true,
    get: function() {
      matchAroundOriginDeprecated()
      return this.match === 'closest'
    },
    set: function(value) {
      matchAroundOriginDeprecated()
      this.match = value ? 'region' : 'first'
    }
  })
})

/*-
Replaces elements on the current page with corresponding elements
from a new page fetched from the server.

@function up.replace
@param {string|Element|jQuery} target
  The CSS selector to update. You can also pass a DOM element or jQuery element
  here, in which case a selector will be inferred from the element's class and ID.
@param {string} url
  The URL to fetch from the server.
@param {Object} [options]
  See `options` for `up.render()`.
@return {Promise}
  A promise that fulfills when the page has been updated.
@deprecated
  Use `up.render()` or `up.navigate()` instead.
*/
up.replace = function(target, url, options) {
  up.migrate.deprecated('up.replace(target, url)', 'up.navigate(target, { url })')
  return up.navigate({ ...options, target, url })
}

/*-
Updates a selector on the current page with the
same selector from the given HTML string.

### Example

Let's say your current HTML looks like this:

    <div class="one">old one</div>
    <div class="two">old two</div>

We now replace the second `<div>`, using an HTML string
as the source:

    html = '<div class="one">new one</div>' +
           '<div class="two">new two</div>'

    up.extract('.two', html)

Unpoly looks for the selector `.two` in the strings and updates its
contents in the current page. The current page now looks like this:

    <div class="one">old one</div>
    <div class="two">new two</div>

Note how only `.two` has changed. The update for `.one` was
discarded, since it didn't match the selector.

@function up.extract
@param {string|Element|jQuery} target
@param {string} html
@param {Object} [options]
  See options for [`up.render()`](/up.render).
@return {Promise}
  A promise that will be fulfilled when the selector was updated.
@deprecated
  Use `up.render()` or `up.navigate()` instead.
*/
up.extract = function(target, document, options) {
  up.migrate.deprecated('up.extract(target, document)', 'up.navigate(target, { document })')
  return up.navigate({ ...options, target, document })
}

/*-
Returns the first element matching the given selector, but
ignores elements that are being [destroyed](/up.destroy) or that are being
removed by a [transition](/up.morph).

Returns `undefined` if no element matches these conditions.

@function up.fragment.first
@param {Element|jQuery} [root=document]
  The root element for the search. Only the root's children will be matched.

  May be omitted to search through all elements in the current `document`.
@param {string} selector
  The selector to match
@param {string} [options.layer='current']
  The the layer in which to find the element.

  @see layer-option
@param {string|Element|jQuery} [options.origin]
  An second element or selector that can be referenced as `:origin` in the first selector:
@return {Element|undefined}
  The first element that is neither a ghost or being destroyed,
  or `undefined` if no such element was found.
@deprecated
  Use `up.fragment.get()` instead.
*/
up.fragment.first = function(...args) {
  up.migrate.deprecated('up.fragment.first()', 'up.fragment.get()')
  return up.fragment.get(...args)
}

up.first = up.fragment.first

up.migrate.preprocessRenderOptions = function(options) {
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
    options.abort = (options) => up.network.abort(solo, options)
  } else if (u.isFunction(solo)) {
    up.migrate.warn("The up.render() option { solo } has been replaced with { abort } and { abort } no longer accepts a Function(up.Request): boolean. Check if you can use { abort: 'target'} or use up.network.abort(fn) instead.")
    options.abort = (options) => { up.network.abort(solo, options) }
  } else if (solo === true) {
    up.migrate.deprecated('Option { solo: true }', "{ abort: 'all' }")
    options.abort = 'all'
  } else if (solo === false) {
    up.migrate.deprecated('Option { solo: false }', "{ abort: false }")
    up.migrate.warn('Unpoly 3+ only aborts requests targeting the same fragment. Setting { solo: false } may no longer be necessary.')
    options.abort = false
  }

  up.migrate.fixKey(options, 'keep', 'useKeep')
  up.migrate.fixKey(options, 'hungry', 'useHungry')
  up.migrate.fixKey(options, 'failOnFinished', 'onFailFinished')

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
    up.migrate.deprecated('Option { resetScroll: true }', "{ scroll: 'reset' }")
    options.scroll = 'reset'
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
}

up.migrate.postprocessReloadOptions = function(options) {
  let lastModified = options.headers?.['If-Modified-Since']
  let legacyHeader
  if (lastModified) {
    legacyHeader = Math.floor(new Date(lastModified) * 0.001).toString()
  } else {
    legacyHeader = '0'
  }

  options.headers[up.protocol.headerize('reloadFromTime')] = legacyHeader
}

// Modern versions only support ":origin". This legacy implementation
// also supports the old shorthand "&".
up.migrate.resolveOrigin = function(target, { origin } = {}) {
  // We skip over attribute selector values, which may contain an ampersand, e.g. 'a[href="/notes?page=2&order=created"]'
  let pattern = /"[^"]*"|'[^']*'|&|:origin\b/g

  return target.replace(pattern, function(variant) {
    if (variant === ':origin' || variant === '&') {
      if (variant === '&') {
        up.migrate.deprecated("Origin shorthand '&'", ':origin')
      }
      if (origin) {
        return up.fragment.toTarget(origin)
      } else {
        up.fail('Missing { origin } element to resolve "%s" reference (found in %s)', variant, target)
      }
    } else {
      // Skip over quoted attribute selector values, which may contain an ampersand
      return variant
    }
  })
}

up.migrate.removedEvent('up:fragment:kept', 'up:fragment:keep')

up.fragment.config.patch(function() {
  this.runScriptsValue = this.runScripts
  this.runScriptsSet = false

  Object.defineProperty(this, 'runScripts', {
    configurable: true,
    get() {
      return this.runScriptsValue
    },
    set(value) {
      this.runScriptsValue = value
      this.runScriptsSet = true
    }
  })
})

up.on('up:framework:boot', function() {
  if (!up.fragment.config.runScriptsSet) {
    up.migrate.warn('Scripts within fragments are now executed. Configure up.fragment.config.runScripts to remove this warning.')
  }
})

// up.compiler('[up-keep]:not([up-keep=true]):not([up-keep=""])', function(element) {
up.compiler('[up-keep]', function(element) {
  let selector = up.element.booleanOrStringAttr(element, 'up-keep')
  if (u.isString(selector)) {
    up.migrate.warn('The [up-keep] attribute no longer supports a selector value. Elements will be matched by their derived target. You may prevent keeping with [up-on-keep="if(condition) event.preventDefault()"]. ')
    // The best we can do here is prevent matching of the old and new element if the new element
    // does not match the selector.
    up.element.setMissingAttr(element, 'up-on-keep', `if (!newFragment.matches(${JSON.stringify(selector)})) event.preventDefault()`)
    element.setAttribute('up-keep', '')
  }
})
