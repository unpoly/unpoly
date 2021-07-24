u = up.util
e = up.element

class up.DestructorPass

  constructor: (@fragment, @options) ->
    @errors = []

  run: ->
    for cleanable in @selectCleanables()
      if destructors = u.pluckKey(cleanable, 'upDestructors')
        for destructor in destructors
          @applyDestructorFunction(destructor, cleanable)
      cleanable.classList.remove('up-can-clean')

    if @errors.length
      throw up.error.failed('Errors while destroying', { @errors })

  selectCleanables: ->
    selectOptions = u.merge @options,
      destroying: true # fragment functions usually ignore elements that are being destroyed

    up.fragment.subtree(@fragment, '.up-can-clean', selectOptions)

  applyDestructorFunction: (destructor, element) ->
    try
      destructor()
    catch error
      @errors.push(error)
      up.log.error('up.destroy()', 'While destroying %o: %o', element, error)
      up.error.emitGlobal(error)
