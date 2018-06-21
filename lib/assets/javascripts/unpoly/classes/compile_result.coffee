POST_COMPILE_ACTIONS = ['value', 'data', 'clean', 'selector']

class up.CompileResult

  constructor: (@element) ->
    @valueComponents = []
    @dataComponents = []
    @cleanComponents = []
    @selectorComponents = []

  # If we got any #valueComponents, this will be set to #valueNow in #finalize()
  value: null

  valueNow: ->
    u.last(@valueComponents).value()

  # If we got any #dataComponents, this will be set to #dataNow in #finalize()
  data: null

  dataNow: ->
    datas = u.map @dataComponents, (c) -> c.data()
    u.merge(datas...)

  # If we got any #cleanComponents, this will be set to #cleanNow in #finalize()
  clean: null

  cleanNow: ->
    u.each @cleanComponents, (c) -> c.clean()

  # If we got any #selectorComponents, this will be set to #selectorNow in #finalize()
  selector: null

  selectorNow: ->
    u.last(@selectorComponents).selector()

  accept: (action, component) ->
    @["#{action}Components"].push(component)

  finalize: ->
    u.each POST_COMPILE_ACTIONS, (action) =>
      if @["#{action}Components"].length
        # Expose component API
        @[action] ||= @["#{action}Now"]
        # Mark in DOM so up.syntax can quickly find results supporting an action
        u.addClass(@element, "up-can-#{action}")

  @consider: (element, component) ->
    actions = @trackableActions(comoponent)
    if actions.length
      element.upResult ||= new @()
      for action in actions
        element.upResult.accept(action, component)
      element.upResult

  @trackableActions: (component) ->
    u.select POST_COMPILE_ACTIONS, (action) -> component[action]
