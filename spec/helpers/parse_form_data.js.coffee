beforeEach ->

  jasmine.Ajax.addCustomParamParser
    test: (xhr) ->
      up.util.isFormData(xhr.params)

    parse: (params) ->
      if FormData.prototype.entries
        array = new up.Params(params).toArray()
      else if params.originalArray
        # In browser that don't support FormData#entries(),
        # up.Params#toArray() stores the original array with the generated
        # FormData object.
        array = params.originalArray
      else
        throw "Cannot parse FormData for inspection in tests"

      obj = {}

      for entry in array
        obj[entry.name] ||= []
        obj[entry.name].push(entry.value)

      obj
