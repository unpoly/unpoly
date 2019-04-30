class up.Class

  @getter: (prop, get) ->
    u.getter(@prototype, prop, get)

  @delegate: (props, targetProp) ->
    u.delegate(@prototype, props, targetProp)

#  @include: (mixin) ->
#    for key in Object.keys(mixin.prototype)
#      descriptor = mixin.getOwnPropertyDescriptor(mixin)
#      Object.defineProperty(@prototype, descritpr)
