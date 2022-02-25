const u = up.util

/*-
@module up.fragment
*/

up.migrate.renamedPackage('flow', 'fragment')
up.migrate.renamedPackage('dom', 'fragment')

up.migrate.renamedProperty(up.fragment.config, 'fallbacks', 'mainTargets')

up.migrate.handleResponseDocOptions = docOptions => up.migrate.fixKey(docOptions, 'html', 'document')

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

  May be omitted to search through all elements in the `document`.
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

up.migrate.handleScrollOptions = function(options) {
  if (u.isUndefined(options.scroll)) {
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
    if (u.isDefined(options.resetScroll)) {
      up.migrate.deprecated('Option { resetScroll: true }', "{ scroll: 'reset' }")
      options.scroll = 'teset'
    }

    // Rewrite deprecated { restoreScroll } option
    if (u.isDefined(options.restoreScroll)) {
      up.migrate.deprecated('Option { restoreScroll: true }', "{ scroll: 'restore' }")
      options.scroll = 'restore'
    }
  }
}

up.migrate.handleHistoryOption = function(options) {
  if (u.isString(options.history) && (options.history !== 'auto')) {
    up.migrate.warn("Passing a URL as { history } option is deprecated. Pass it as { location } instead.")
    options.location = options.history
    // Also the URL in { history } is truthy, keeping a value in there would also inherit to failOptions,
    // where it would be expanded to { failLocation }.
    options.history = 'auto'
  }
}

up.migrate.preprocessRenderOptions = function(options) {
  up.migrate.handleHistoryOption(options)

  for (let prop of ['target', 'origin']) {
    if (u.isJQuery(options[prop])) {
      up.migrate.warn('Passing a jQuery collection as { %s } is deprecated. Pass it as a native element instead.', prop)
      options[prop] = up.element.get(options[prop])
    }
  }

  if (options.fail === 'auto') {
    up.migrate.warn("The option { fail: 'auto' } is deprecated. Omit the option instead.")
    delete options.fail
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
