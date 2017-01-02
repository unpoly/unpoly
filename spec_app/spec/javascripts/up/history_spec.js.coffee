describe 'up.history', ->

  u = up.util
  
  describe 'JavaScript functions', ->
    
    describe 'up.history.replace', ->

      it 'should have tests'
      
    describe 'up.history.push', ->

      it 'should have tests'

  describe 'unobtrusive behavior', ->

    describe '[up-back]', ->

      describeCapability 'canPushState', ->

        it 'sets an [up-href] attribute to the previous URL and sets the up-restore-scroll attribute to "true"', ->
          up.history.push('/one')
          up.history.push('/two')
          $element = up.hello(affix('a[href="/three"][up-back]').text('text'))
          expect($element.attr('href')).toEndWith('/three')
          expect($element.attr('up-href')).toEndWith('/one')
          expect($element.attr('up-restore-scroll')).toBe('')
          expect($element.attr('up-follow')).toBe('')

      it 'does not overwrite an existing up-href or up-restore-scroll attribute'

      it 'does not set an up-href attribute if there is no previous URL'

      describeFallback 'canPushState', ->

        it 'does not change the element', ->
          $element = up.hello(affix('a[href="/three"][up-back]').text('text'))
          expect($element.attr('up-href')).toBeUndefined()

    describe 'scroll restoration', ->

      describeCapability 'canPushState', ->

        afterEach ->
          $('.viewport').remove()

        it 'restores the scroll position of viewports when the user hits the back button', (done) ->

          longContentHtml = """
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px"></div>
            </div>
          """

          respond = => @respondWith(longContentHtml)

          $viewport = $(longContentHtml).appendTo(document.body)

          up.layout.config.viewports = ['.viewport']
          up.history.config.popTargets = ['.viewport']

          $viewport.append(longContentHtml)

          up.replace('.content', '/one')
          respond()

          $viewport.scrollTop(50)

          up.replace('.content', '/two')
          respond()

          $('.viewport').scrollTop(150)

          up.replace('.content', '/three')
          respond()
          $('.viewport').scrollTop(250)

          history.back()
          u.setTimer 50, ->
            respond() # we need to respond since we've never requested /two with the popTarget
            expect($('.viewport').scrollTop()).toBe(150)

            history.back()
            u.setTimer 50, ->
              respond() # we need to respond since we've never requested /one with the popTarget
              expect($('.viewport').scrollTop()).toBe(50)

              history.forward()
              u.setTimer 50, ->
                # No need to respond since we requested /two with the popTarget
                # when we went backwards
                expect($('.viewport').scrollTop()).toBe(150)

                history.forward()
                u.setTimer 50, ->
                  respond() # we need to respond since we've never requested /three with the popTarget
                  expect($('.viewport').scrollTop()).toBe(250)
                  done()

    describe 'events', ->

      describeCapability 'canPushState', ->

        it 'emits up:history:* events as the user goes forwards and backwards through history', (done) ->
          up.proxy.config.cacheSize = 0
          up.history.config.popTargets = ['.viewport']

          affix('.viewport .content')
          respond = =>
            @respondWith """
              <div class="viewport">
                <div class="content">content</div>
              </div>
              """

          events = []
          u.each ['up:history:pushed', 'up:history:restored'], (eventName) ->
            up.on eventName, (event) ->
              events.push [eventName, event.url]

          normalize = up.history.normalizeUrl

          up.replace('.content', '/one')
          respond()

          expect(events).toEqual [
            ['up:history:pushed', normalize('/one')]
          ]

          up.replace('.content', '/two')
          respond()

          expect(events).toEqual [
            ['up:history:pushed', normalize('/one')]
            ['up:history:pushed', normalize('/two')]
          ]

          up.replace('.content', '/three')
          respond()

          expect(events).toEqual [
            ['up:history:pushed', normalize('/one')]
            ['up:history:pushed', normalize('/two')]
            ['up:history:pushed', normalize('/three')]
          ]

          history.back()
          u.setTimer 50, ->
            respond()

            expect(events).toEqual [
              ['up:history:pushed', normalize('/one')]
              ['up:history:pushed', normalize('/two')]
              ['up:history:pushed', normalize('/three')]
              ['up:history:restored', normalize('/two')]
            ]

            history.back()
            u.setTimer 50, ->
              respond()

              expect(events).toEqual [
                ['up:history:pushed', normalize('/one')]
                ['up:history:pushed', normalize('/two')]
                ['up:history:pushed', normalize('/three')]
                ['up:history:restored', normalize('/two')]
                ['up:history:restored', normalize('/one')]
              ]

              history.forward()
              u.setTimer 50, ->
                respond()

                expect(events).toEqual [
                  ['up:history:pushed', normalize('/one')]
                  ['up:history:pushed', normalize('/two')]
                  ['up:history:pushed', normalize('/three')]
                  ['up:history:restored', normalize('/two')]
                  ['up:history:restored', normalize('/one')]
                  ['up:history:restored', normalize('/two')]
                ]

                history.forward()
                u.setTimer 50, ->
                  respond() # we need to respond since we've never requested /three with the popTarget

                  expect(events).toEqual [
                    ['up:history:pushed', normalize('/one')]
                    ['up:history:pushed', normalize('/two')]
                    ['up:history:pushed', normalize('/three')]
                    ['up:history:restored', normalize('/two')]
                    ['up:history:restored', normalize('/one')]
                    ['up:history:restored', normalize('/two')]
                    ['up:history:restored', normalize('/three')]
                  ]

                  done()
