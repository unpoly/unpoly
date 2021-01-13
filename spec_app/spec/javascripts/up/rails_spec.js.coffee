u = up.util
$ = jQuery

describe 'up.rails', ->

  upAttributes = ['up-follow', 'up-target']
  if up.migrate.loaded
    upAttributes.push('up-modal', 'up-popup')

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
            $element = $fixture("a[href=\"/foo\"][#{upAttribute}][data-method=\"put\"]")
            up.hello($element)
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('put')

          it "does not overwrite an existing up-method attribute, but gets deleted", ->
            $element = $fixture("a[href=\"/foo\"][#{upAttribute}][up-method=\"patch\"][data-method=\"put\"]")
            up.hello($element)
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('patch')

          it 'transforms an element that becomes followable through [up-expand]', ->
            $element = $fixture('a[up-expand][data-method="put"]')
            $child = $element.affix('span[up-href="/foo"][up-follow]')
            up.hello($element)
            expect($element.attr('up-href')).toEqual('/foo')
            expect($element.attr('up-follow')).toEqual('')
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('put')

          it 'transforms an element that becomes followable through a user macro like [content-link]', ->
            up.$macro '[user-make-followable]', ($element) ->
              $element.attr('up-follow', '')
            $element = $fixture('a[href=/foo][user-make-followable][data-method="put"]')
            up.hello($element)
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('put')

      describe 'on an element without Unpoly attributes', ->

        it "is not changed", ->
          $element = $fixture("a[href=\"/foo\"][data-method=\"put\"]")
          up.hello($element)
          expect($element.attr('data-method')).toEqual('put')

    describe 'when Rails UJS is not loaded', ->

      beforeEach ->
        $.rails = undefined

      u.each upAttributes, (upAttribute) ->
        describe "on an [#{upAttribute}] element", ->

          it "is not changed", ->
            $element = $fixture("a[href=\"/foo\"][#{upAttribute}][data-method=\"put\"]")
            up.hello($element)
            expect($element.attr('data-method')).toEqual('put')

  describe '[data-confirm]', ->

    beforeEach ->
      @oldRails = $.rails

    afterEach ->
      $.rails = @oldRails

    describe 'when Rails UJS is loaded', ->

      beforeEach ->
        $.rails = {}

      u.each upAttributes, (upAttribute) ->
        describe "on an [#{upAttribute}] element", ->

          it "is transformed to an up-confirm attribute so the element isn't handled a second time by Rails UJS", ->
            $element = $fixture("a[href=\"/foo\"][#{upAttribute}][data-confirm=\"Really?\"]")
            up.hello($element)
            expect($element.attr('data-confirm')).toBeUndefined()
            expect($element.attr('up-confirm')).toEqual('Really?')

          it "does not overwrite an existing up-confirm attribute, but gets deleted", ->
            $element = $fixture("a[href=\"/foo\"][#{upAttribute}][up-confirm=\"Seriously?\"][data-confirm=\"Really?\"]")
            up.hello($element)
            expect($element.attr('data-confirm')).toBeUndefined()
            expect($element.attr('up-confirm')).toEqual('Seriously?')

      describe 'on an element without Unpoly attributes', ->

        it "is not changed", ->
          $element = $fixture("a[href=\"/foo\"][data-confirm=\"Really?\"]")
          up.hello($element)
          expect($element.attr('data-confirm')).toEqual('Really?')

    describe 'when Rails UJS is not loaded', ->

      beforeEach ->
        $.rails = undefined

      u.each upAttributes, (upAttribute) ->
        describe "on an [#{upAttribute}] element", ->

          it "is not changed", ->
            $element = $fixture("a[href=\"/foo\"][#{upAttribute}][data-confirm=\"Really?\"]")
            up.hello($element)
            expect($element.attr('data-confirm')).toEqual('Really?')
