u = up.util
e = up.element

describe 'up.tooltip', ->

  describe 'unobtrusive behavior', ->
    
    describe '[up-tooltip] (deprecated)', ->

      it 'sets a [title] attribute', ->
        div = fixture('[up-tooltip=Help]')
        up.hello(div)
        expect(div.getAttribute('title')).toEqual('Help')

