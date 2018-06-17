beforeEach ->

  jasmine.Ajax.addCustomParamParser
    test: (xhr) ->
      up.util.isFormData(xhr.params)

    parse: (params) ->
      if up.browser.canInspectFormData()
        array = up.params.toArray(params)
      else if params.originalArray
        # In browser that don't support FormData#entries(),
        # up.params.toArray() stores the original array with the generated
        # FormData object.
        array = params.originalArray
      else
        throw "Cannot parse FormData for inspection in tests"

      obj = {}

      for entry in array
        obj[entry.name] ||= []
        obj[entry.name].push(entry.value)

      obj
