up.mockable = (originalFn) ->
  spy = null
  obj = ->
    (spy || originalFn).apply(null, arguments)
  obj.mock = ->
    return spy = jasmine.createSpy('mockable', originalFn)
  document.addEventListener 'up:framework:reset', -> spy = null
  return obj
