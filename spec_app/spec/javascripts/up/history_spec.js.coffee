describe 'up.history', ->

  u = up.util
  
  describe 'JavaScript functions', ->
    
    describe 'up.history.replace', ->

      it 'should have tests'

    describe 'up.history.url', ->

      it 'does not strip a trailing slash from the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.url()).toEqualUrl('/host/path/')

    describe 'up.history.isUrl', ->

      it 'returns true if the given path is the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isUrl('/host/path/')).toBe(true)

      it 'returns false if the given path is not the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isUrl('/host/other-path/')).toBe(false)

      it 'returns true if the given full URL is the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isUrl("http://#{location.host}/host/path/")).toBe(true)

      it 'returns true if the given path is the current URL, but without a trailing slash', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isUrl('/host/path')).toBe(true)

      it 'returns true if the given path is the current URL, but with a trailing slash', ->
        history.replaceState?({}, 'title', '/host/path')
        expect(up.history.isUrl('/host/path/')).toBe(true)

  describe 'unobtrusive behavior', ->

    describe '[up-back]', ->

      it 'sets an [up-href] attribute to the previous URL and sets the up-restore-scroll attribute to "true"', ->
        up.history.push('/one')
        up.history.push('/two')
        $element = up.hello(affix('a[href="/three"][up-back]').text('text'))
        expect($element.attr('href')).toEqualUrl('/three')
        expect($element.attr('up-href')).toEqualUrl('/one')
        expect($element.attr('up-restore-scroll')).toBe('')
        expect($element.attr('up-follow')).toBe('')

      it 'does not overwrite an existing up-href or up-restore-scroll attribute'

      it 'does not set an up-href attribute if there is no previous URL'

    describe 'scroll restoration', ->

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

      it 'restores the scroll position of two viewports marked with [up-viewport], but not configured in up.layout.config (bugfix)', (done) ->
        up.history.config.popTargets = ['.container']

        html = """
          <div class="container">
            <div class="viewport1" up-viewport style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content1" style="height: 5000px">content1</div>
            </div>
            <div class="viewport2" up-viewport style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content2" style="height: 5000px">content2</div>
            </div>
          </div>
        """

        respond = => @respondWith(html)

        $screen = affix('.screen')
        $screen.html(html)

        up.replace('.content1, .content2', '/one', reveal: false)
        respond()

        $('.viewport1').scrollTop(3000)
        $('.viewport2').scrollTop(3050)

        expect('.viewport1').toBeScrolledTo(3000)
        expect('.viewport2').toBeScrolledTo(3050)

        up.replace('.content1, .content2', '/two', reveal: false)
        respond()

        u.setTimer 50, ->

          expect(location.href).toEqualUrl('/two')

          history.back()

          u.setTimer 50, ->
            # we need to respond since we've never requested the original URL with the popTarget
            respond()

            u.nextFrame ->
              expect('.viewport1').toBeScrolledTo(3000)
              expect('.viewport2').toBeScrolledTo(3050)
              done()


    describe 'events', ->

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
