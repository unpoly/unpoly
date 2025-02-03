jasmine.Ajax.addCustomParamParser({
  test(xhr) {
    return up.util.isFormData(xhr.params)
  },

  parse(params) {
    let array
    if (FormData.prototype.entries) {
      array = new up.Params(params).toArray()
    } else if (params.originalArray) {
      // In browser that don't support FormData#entries(),
      // up.Params#toArray() stores the original array with the generated
      // FormData object.
      array = params.originalArray
    } else {
      throw "Cannot parse FormData for inspection in tests"
    }

    const obj = {}

    for (let entry of array) {
      obj[entry.name] ||= []
      obj[entry.name].push(entry.value)
    }

    return obj
  }
})
