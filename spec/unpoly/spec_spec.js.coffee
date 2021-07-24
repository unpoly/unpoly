u = up.util
$ = jQuery

describe 'Jasmine setup', ->

  it 'does not consider a jQuery collection to be equal to its contained element (which is what jasmine-jquery does and which makes out expectations too soft)', ->
    element = document.createElement('div')
    $element = $(element)
    expect($element).not.toEqual(element)
