##
# Knife: Get, set or mock inaccessible variables in a Javascript closure
# ======================================================================
#
# Requires [Jasmine](http://jasmine.github.io/) 2+.
#
# Usage:
#
#     klass = (->
#
#       privateVariable = 0
#
#       privateMethod = ->
#         privateVariable += 1
#
#       publicMethod = ->
#         privateMethod()
#
#       add: add
#       knife: eval(Knife.point)
#
#     )()
#
#     klass.knife.get('privateVariable') => 0
#     klass.knife.set('privateCounter', 5)
#     klass.knife.get('privateCounter') => 5
#     spy = klass.knife.mock('privateMethod').and.returnValue("mocked!")
#     klass.publicMethod() # => 'mocked!'
#     expect(spy).toHaveBeenCalled()
#
@Knife = (->

  contextBleeder = ->

    get = (symbol) ->
      eval(symbol)

    set = (symbol, value) ->
      eval("#{symbol} = value")

    mock = (symbol) ->
      oldImpl = get(symbol)
      spy = jasmine.createSpy(symbol)
      set(symbol, spy)
      cleaner = -> set(symbol, oldImpl)
      Knife.cleaners.push(cleaner)
      spy

    get: get
    set: set
    mock: mock

  reset = ->
    for cleaner in Knife.cleaners
      cleaner()
    Knife.cleaners = []

  me = {}
  me.reset = reset
  me.cleaners = []

  if jasmine
    me.point = "(#{contextBleeder.toString()})()"
    # Jasmine defines afterEach on window
    afterEach reset
  else
    me.point = "undefined"

  me

)()
