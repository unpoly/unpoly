#= require ./record

class up.CompilerLayer extends up.Record

  fields: ->
    [
      'compilers',
    ]

  clean: ($root) ->


  saveData: ($root, state) ->
    for compiler in compilers
      compiler.saveData($root, state)

  compile: ($root, data) ->
    elementDataBySelector = data.elements || {}
    globalData = u.except(data, 'elements')

    # Match elements with argument { data } once before all compilers
    # and hash them in a Map. Otherwise we would have to check #matches()
    # on all compiled elements for all compilers.
    elementDataByElement = new Map()
    for selector, elementData of elementDataBySelector
      $root.find(selector).each ->
        elementDataByElement.set(this, elementData)

    for compiler in compilers
      $matches = $root.find(compiler.selector)
      compiler.compileElements($matches, globalData, elementDataByElement)
