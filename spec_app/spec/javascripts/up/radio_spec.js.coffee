describe 'up.radio', ->

  describe 'JavaScript functions', ->

  describe 'unobtrusive behavior', ->

    describe '[up-hungry]', ->

      it "replaces the element when it is found in a response, even when the element wasn't targeted", asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')

        up.replace('.target', '/path')

        next =>
          @respondWith """
            <div class="target">
              new target
            </div>
            <div class="between">
              new between
            </div>
            <div class="hungry">
              new hungry
            </div>
          """

        next =>
          expect('.target').toHaveText('new target')
          expect('.hungry').toHaveText('new hungry')

      it "does not impede replacements when the element is not part of a response", asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')

        promise = up.replace('.target', '/path')

        next =>
          @respondWith """
            <div class="target">
              new target
            </div>
          """

        next =>
          expect('.target').toHaveText('new target')
          expect('.hungry').toHaveText('old hungry')

          promiseState(promise).then (result) ->
            expect(result.state).toEqual('fulfilled')

      it 'does not replace the element when the server responds with an error', asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')

        up.replace('.target', '/path', failTarget: '.target')

        next =>
          @respondWith
            status: 500
            responseText: """
              <div class="target">
                new target
              </div>
              <div class="between">
                new between
              </div>
              <div class="hungry">
                new hungry
              </div>
              """

        next =>
          expect('.target').toHaveText('new target')
          expect('.hungry').toHaveText('old hungry')
