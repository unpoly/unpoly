beforeEach ->

  jasmine.Ajax.addCustomParamParser
    test: (xhr) ->
      up.util.isFormData(xhr.params)

    parse: (params) ->
      # Just return it
      params
