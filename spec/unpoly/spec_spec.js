const u = up.util
const $ = jQuery

describe('Jasmine setup', function() {
  it('does not consider a jQuery collection to be equal to its contained element (which is what jasmine-jquery does and which makes out expectations too soft)', function() {
    const element = document.createElement('div')
    const $element = $(element)
    expect($element).not.toEqual(element)
  })
})
