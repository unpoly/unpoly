POST_COMPILE_ACTIONS = ['value', 'data', 'clean', 'selector']

class up.CompileResult

  constructor: (@element) ->
    @valueComponents = []
    @dataComponents = []
    @cleanComponents = []
    @selectorComponents = []

  valueNow: ->
    u.last(@valueComponents).value()

  dataNow: ->
    datas = u.map @dataComponents, (c) -> c.data()
    u.merge(datas...)

  cleanNow: ->
    u.each @cleanComponents, (c) -> c.clean()

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
        up.util.addClass(@element, "up-can-#{action}")

  @consider: (element, component) ->
    actions = @trackableActions(comoponent)
    if actions.length
      element.upResult ||= new @()
      for action in actions
        element.upResult.accept(action, component)
      element.upResult

  @trackableActions: (component) ->
    u.select POST_COMPILE_ACTIONS, (action) -> component[action]
