POST_COMPILE_ACTIONS = ['value', 'data', 'clean', 'selector']

class up.CompileResult

  constructor: (@element) ->

  valueNow: ->
    u.last(@valueComponents).value()

  dataNow: ->
    datas = u.map(@dataComponents, (c) -> c.data())
    # Deep-merge hashes so each component can set keys in { data.elements }
    u.deepMerge(datas...)

  cleanNow: ->
    u.each(@cleanComponents, (c) -> c.clean())

  selectorNow: ->
    u.last(@selectorComponents).selector()

  accept: (action, component) ->
    actionComponents = (@["#{action}Components"] ||= [])
    actionComponents.push(component)

  finalize: ->
    # Since CompileRun compiles component after component, it might
    # have collected multiple CompileResults for the same element.
    return if @finalized
    @finalized = true
    u.each POST_COMPILE_ACTIONS, (action) =>
      if @["#{action}Components"]?.length
        # Expose component API
        @[action] = @["#{action}Now"]
        # Mark in DOM so up.syntax can quickly find results supporting an action
        console.debug("Marking %o as can-%s", @element, action)
        u.addClass(@element, "up-can-#{action}")

  @consider: (element, component) ->
    actions = @actionsImplementedByComponent(component)
    # Only if we have at least one implemented action we want to set element.upResult
    if actions.length
      result = (element.upResult ||= new @(element))
      result.accept(action, component) for action in actions
      result

  @actionsImplementedByComponent: (component) ->
    u.select POST_COMPILE_ACTIONS, (action) -> component[action]
