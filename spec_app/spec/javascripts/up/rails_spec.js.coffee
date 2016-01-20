describe 'up.rails', ->

  u = up.util

  upAttributes = ['up-follow', 'up-target', 'up-modal', 'up-popup']

  describe '[data-method]', ->

    beforeEach ->
      @oldRails = $.rails

    afterEach ->
      $.rails = @oldRails

    describe 'when Rails UJS is loaded', ->

      beforeEach ->
        $.rails = {}

      u.each upAttributes, (upAttribute) ->
        describe "on an [#{upAttribute}] element", ->

          it "is transformed to an up-method attribute so the element isn't handled a second time by Rails UJS", ->
            $element = affix("span[#{upAttribute}][data-method=\"put\"]")
            up.hello($element)
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('put')

          it "does not overwrite an existing up-method attribute, but gets deleted", ->
            $element = affix("span[#{upAttribute}][up-method=\"patch\"][data-method=\"put\"]")
            up.hello($element)
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('patch')

      describe 'on an element without Up.js attributes', ->

        it "is not changed", ->
          $element = affix("span[data-method=\"put\"]")
          up.hello($element)
          expect($element.attr('data-method')).toEqual('put')

    describe 'when Rails UJS is not loaded', ->

      beforeEach ->
        $.rails = undefined

      u.each upAttributes, (upAttribute) ->
        describe "on an [#{upAttribute}] element", ->

          it "is not changed", ->
            $element = affix("span[#{upAttribute}][data-method=\"put\"]")
            up.hello($element)
            expect($element.attr('data-method')).toEqual('put')
