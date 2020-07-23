u = up.util
e = up.element
$ = jQuery

# Make specs fail if a form was submitted without Unpoly.
# This would otherwise navigate away from the spec runner.
beforeEach ->
  window.defaultSubmittedForms = []

  up.on 'submit', (event) ->
    window.defaultSubmittedForms.push(event.target)
    event.preventDefault()

  jasmine.addMatchers
    toHaveBeenDefaultSubmitted: (util, customEqualityTesters) ->
      compare: (link) ->
        link = e.get(link)
        used = !!u.remove(window.defaultSubmittedForms, link)
        pass: used

afterEach ->
  if links = u.presence(window.defaultSubmittedForms)
    up.fail('Unhandled default submit behavior for forms %o', links)


oldPushState = history.pushState
oldReplaceState = history.replaceState
oldBack = history.back
oldForward = history.forward

history.pushState = (args...) -> safeHistory.pushState(args...)
history.replaceState = (args...) -> safeHistory.replaceState(args...)
history.back = (args...) -> safeHistory.back(args...)
history.forward = (args...) -> safeHistory.forward(args...)

window.safeHistory = new class
  constructor: ->
    @logEnabled = false
    @cursor = -1 # we don't know the initial state
    @stateIndexes = []
    @nextIndex = 1000

  back: ->
    @log("safeHistory: back(), cursor before is %o, path before is %o", @cursor, location.pathname)
    if @cursor > 0
      # This will trigger popstate, which we will handle and update @cursor
      oldBack.call(history)
    else
      up.fail('safeHistory: Tried to go too far back in history (prevented)')

  forward: ->
    @log("safeHistory: forward()")
    if @cursor < @stateIndexes.length - 1
      # This will trigger popstate, which we will handle and update @cursor
      oldForward.call(history)
    else
      up.fail('safeHistory: Tried to go too far forward in history (prevented)')

  pushState: (state, title, url) ->
    state ||= { state }
    state._index = @nextIndex++

    @log("safeHistory: pushState(%o, %o, %o)", state, title, url)
    oldPushState.call(history, state, title, url)

    if url && u.normalizeURL(url) != u.normalizeURL(location.href)
      up.fail('safeHistory: Browser did now allow history.pushState() to URL %s (Chrome throttling history changes?)', url)

    @stateIndexes.splice(@cursor + 1, @stateIndexes.length, state._index)
    @cursor++
    @log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(@stateIndexes), @cursor, location.pathname)

  replaceState: (state, title, url) ->
    state ||= { state }
    state._index = @nextIndex++

    @log("safeHistory: replaceState(%o, %o, %o)", state, title, url)
    oldReplaceState.call(history, state, title, url)

    if url && u.normalizeURL(url) != u.normalizeURL(location.href)
      up.fail('safeHistory: Browser did now allow history.replaceState() to URL %s (Chrome throttling history changes?)', url)

    # In case an example uses replaceState to set a known initial URL
    # we can use this to know our initial state.
    @cursor = 0 if @cursor == -1
    @stateIndexes[@cursor] = state._index
    @log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(@stateIndexes), @cursor, location.pathname)

  onPopState: (event) ->
    state = event.state
    @log("safeHistory: Got event %o with state %o", event, state)

    return unless state

    @log("safeHistory: restored(%o)", state._index)
    @cursor = @stateIndexes.indexOf(state._index)

    if @cursor == -1
      up.fail('safeHistory: Could not find position of state %o', state)

    @log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(@stateIndexes), @cursor, location.pathname)

  log: (args...) ->
    if @logEnabled
      console.debug(args...)

  afterEach: ->
    @cursor = 0
    @stateIndexes = [@stateIndexes[@cursor]]

  reset: ->
    @log("safeHistory: reset()")
    @cursor = 0
    @stateIndexes = [0]

window.addEventListener('popstate', (event) -> safeHistory.onPopState(event))

afterEach ->
  safeHistory.afterEach()

# Make specs fail if a link was followed without Unpoly.
# This would otherwise navigate away from the spec runner.
beforeEach ->
  window.defaultClickedLinks = []

  up.on 'click', 'a[href]', (event) ->
    link = event.target
    browserWouldNavigate = !(u.contains(link.href, '#') && up.history.isLocation(link.href))

    if browserWouldNavigate
      window.defaultClickedLinks.push(link)
      event.preventDefault()

  jasmine.addMatchers
    toHaveBeenDefaultFollowed: (util, customEqualityTesters) ->
      compare: (link) ->
        link = e.get(link)
        used = !!u.remove(window.defaultClickedLinks, link)
        pass: used

afterEach ->
  if links = u.presence(window.defaultClickedLinks)
    up.fail('Unhandled default click behavior for links %o', links)


# Add a .default-fallback container to every layer, so we never
# end up swapping the <body> element.
appendDefaultFallback = (parent) ->
  e.affix(parent, 'default-fallback')

beforeEach ->
  up.fragment.config.resetTargets = []
  up.layer.config.any.targets = ['default-fallback']
  up.history.config.restoreTargets = ['default-fallback']
  appendDefaultFallback(document.body)

  up.on 'up:layer:opened', (event) ->
    layer = event.layer
    parent = layer.getContentElement()
    appendDefaultFallback(parent)

afterEach ->
  for element in document.querySelectorAll('default-fallback')
    up.destroy(element, log: false)
