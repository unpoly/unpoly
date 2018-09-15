beforeEach ->

  jasmine.Ajax.addCustomParamParser
    test: (xhr) ->
      up.util.isFormData(xhr.params)

    parse: (params) ->
      array = up.params.toArray(params)

      obj = {}

      for entry in array
        obj[entry.name] ||= []
        obj[entry.name].push(entry.value)

      obj
