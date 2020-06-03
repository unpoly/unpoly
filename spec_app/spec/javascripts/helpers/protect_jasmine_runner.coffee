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

window.safeHistory = new class
  constructor: ->
    @reset()

  back: ->
    @log("safeHistory: back(), cursor before is %o, path before is %o", @cursor, location.pathname)
    if @cursor > 0
      # This will trigger popstate, which we will handle and update @cursor
      window.history.back()
    else
      up.fail('safeHistory: Tried to go too far back in history (prevented)')

  forward: ->
    @log("safeHistory: forward()")
    if @cursor < @stateIndexes.length - 1
      # This will trigger popstate, which we will handle and update @cursor
      window.history.forward()
    else
      up.fail('safeHistory: Tried to go too far forward in history (prevented)')

  pushed: (state) ->
    @log("safeHistory: pushed(%o)", state.up.index)
    if state.up
      @stateIndexes.splice(@cursor + 1, @stateIndexes.length, state.up.index)
      @cursor++
      @log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(@stateIndexes), @cursor, location.pathname)
    else
      up.fail('safeHistory: Pushed a non-Unpoly state: %o', state)

  replaced: (state) ->
    @log("safeHistory: replaced(%o)", state.up.index)
    if state.up
      @stateIndexes[@cursor] = state.up.index
      @log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(@stateIndexes), @cursor, location.pathname)
    else
      up.fail('safeHistory: Replaced a non-Unpoly state: %o', state)

  restored: (state) ->
    @log("safeHistory: restored(%o)", state.up.index)
    if state.up
      @cursor = @stateIndexes.indexOf(state.up.index)
      @log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(@stateIndexes), @cursor, location.pathname)
    else
      up.fail('safeHistory: Restored a non-Unpoly state: %o', state)

  log: (args...) ->
    if @logEnabled
      console.log(args...)

  reset: ->
    @logEnabled = false
    @log("safeHistory: reset()")
    @cursor = -1
    @stateIndexes = []

beforeEach ->
  safeHistory.reset()

  up.on 'up:history:pushed', (event) ->
    safeHistory.pushed(window.history.state)

  up.on 'up:history:replaced', (event) ->
    safeHistory.replaced(window.history.state)

  up.on 'up:history:restored', (event) ->
    safeHistory.restored(window.history.state)

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
  up.layer.config.all.targets = ['default-fallback']
  up.history.config.restoreTargets = ['default-fallback']
  appendDefaultFallback(document.body)

  up.on 'up:layer:opening', (event) ->
    layer = event.layer
    contentSelector = layer.selector('content')
    parent = layer.firstElement(contentSelector) || layer.element
    appendDefaultFallback(parent)

afterEach ->
  for element in document.querySelectorAll('default-fallback')
    up.destroy(element, log: false)
