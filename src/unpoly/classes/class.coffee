u = up.util

class up.Class

  @getter: (prop, get) ->
    u.getter(@prototype, prop, get)

  @accessor: (prop, descriptor) ->
    Object.defineProperty(@prototype, prop, descriptor)

#  @delegate: (props, targetProp) ->
#    u.delegate(@prototype, props, -> this[targetProp])

#  @include: (mixin) ->
#    for key in Object.keys(mixin.prototype)
#      descriptor = mixin.getOwnPropertyDescriptor(mixin)
#      Object.defineProperty(@prototype, descritpr)

  @wrap: (args...) ->
    u.wrapValue(this, args...)
