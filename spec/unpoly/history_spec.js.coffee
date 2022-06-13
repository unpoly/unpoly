u = up.util
$ = jQuery

describe 'up.history', ->

  beforeEach ->
    up.history.config.enabled = true

  describe 'JavaScript functions', ->

    describe 'up.history.replace', ->

      it 'should have tests'

    describe 'up.history.location', ->

      it 'returns the current browser location', ->
        expect(up.history.location).toMatchURL(location.href)

      it 'does not strip a trailing slash from the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.location).toMatchURL('/host/path/')

    describe 'up.history.isLocation()', ->

      it 'returns true if the given path is the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isLocation('/host/path/')).toBe(true)

      it 'returns false if the given path is not the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isLocation('/host/other-path/')).toBe(false)

      it 'returns true if the given full URL is the current URL', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isLocation("http://#{location.host}/host/path/")).toBe(true)

      it 'returns true if the given path is the current URL, but without a trailing slash', ->
        history.replaceState?({}, 'title', '/host/path/')
        expect(up.history.isLocation('/host/path')).toBe(true)

      it 'returns true if the given path is the current URL, but with a trailing slash', ->
        history.replaceState?({}, 'title', '/host/path')
        expect(up.history.isLocation('/host/path/')).toBe(true)

      describe 'when either URL contains a #hash', ->

        it 'returns false if the given path is the current URL with a #hash', ->
          history.replaceState?({}, 'title', '/host/path/')
          expect(up.history.isLocation('/host/path/#hash')).toBe(false)

        it 'returns false if the given path is the current URL without a #hash', ->
          history.replaceState?({}, 'title', '/host/path/#hash')
          expect(up.history.isLocation('/host/path/')).toBe(false)

        describe 'with { hash: false }', ->

          it 'returns true if the given path is the current URL with a #hash', ->
            history.replaceState?({}, 'title', '/host/path/')
            expect(up.history.isLocation('/host/path/#hash', hash: false)).toBe(true)

          it 'returns true if the given path is the current URL without a #hash', ->
            history.replaceState?({}, 'title', '/host/path/#hash')
            expect(up.history.isLocation('/host/path/', hash: false)).toBe(true)

    describe 'up.history.previousLocation', ->

      it 'returns the previous location', ->
        initialLocation = location.href
        expect(up.history.previousLocation).toBeMissing()

        up.history.replace('/location2')
        expect(up.history.previousLocation).toMatchURL(initialLocation)

        up.history.replace('/location3')
        expect(up.history.previousLocation).toMatchURL('/location2')

      it 'returns the previous location with a #hash', ->
        initialLocation = location.href
        expect(up.history.previousLocation).toBeMissing()

        up.history.replace('/location2#hash')
        expect(up.history.previousLocation).toMatchURL(initialLocation)

        up.history.replace('/location3')
        expect(up.history.previousLocation).toMatchURL('/location2#hash')

      it 'returns the last previous location that is different from the current URL', ->
        initialLocation = location.href
        up.history.replace('/double-replaced-location')
        up.history.replace('/double-replaced-location')
        expect(up.history.previousLocation).toMatchURL(initialLocation)

  describe 'unobtrusive behavior', ->

    describe 'back button', ->

      it 'calls destructor functions when destroying compiled elements (bugfix)', asyncSpec (next) ->
        waitForBrowser = 100

        # By default, up.history will replace the <body> tag when
        # the user presses the back-button. We reconfigure this
        # so we don't lose the Jasmine runner interface.
        up.history.config.restoreTargets = ['.container']

        constructorSpy = jasmine.createSpy('constructor')
        destructorSpy = jasmine.createSpy('destructor')

        up.$compiler '.example', ($example) ->
          constructorSpy()
          return destructorSpy

        up.history.push('/one')
        up.history.push('/two')

        $container = $fixture('.container')
        $example = $container.affix('.example')
        up.hello($example)

        expect(constructorSpy).toHaveBeenCalled()

        history.back()

        next.after waitForBrowser, =>
          expect(location.pathname).toEqual('/one')
          @respondWith "<div class='container'>restored container text</div>"

        next =>
          expect(destructorSpy).toHaveBeenCalled()

      it 'emits an up:location:restore event that users can prevent and substitute their own restoration logic', asyncSpec (next) ->
        waitForBrowser = 100
        main = fixture('main#main', text: 'original content')
        up.history.config.restoreTargets = [':main']
        restoreListener = jasmine.createSpy('up:location:restore listener').and.callFake -> main.innerText = 'manually restored content'
        up.on('up:location:restore', restoreListener)

        up.history.push("/page1")

        next ->
          up.history.push("/page2")

        next ->
          expect(up.history.location).toMatchURL('/page2')
          expect(restoreListener).not.toHaveBeenCalled()

          history.back()

        next.after waitForBrowser, ->
          expect(up.history.location).toMatchURL('/page1')
          expect(restoreListener).toHaveBeenCalled()

          expect(main).toHaveText('manually restored content')

      describe 'scroll restoration', ->

        afterEach ->
          $('.viewport').remove()

        it 'restores the scroll position of viewports when the user hits the back button', asyncSpec (next) ->
          longContentHTML = """
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px"></div>
            </div>
          """

          respond = => @respondWith(longContentHTML)

          $viewport = $(longContentHTML).appendTo(document.body)

          waitForBrowser = 100

          up.viewport.config.viewportSelectors = ['.viewport']
          up.history.config.restoreTargets = ['.viewport']

          up.history.replace('/scroll-restauration-spec')

          up.navigate('.content', url: '/test-one', history: true)

          next.after waitForBrowser, =>
            respond()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-one')
            $viewport.scrollTop(50)
            up.navigate('.content', url: '/test-two', history: true)

          next.after waitForBrowser, =>
            respond()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-two')
            $('.viewport').scrollTop(150)
            up.navigate('.content', url: '/test-three', history: true)

          next.after waitForBrowser, =>
            respond()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-three')
            $('.viewport').scrollTop(250)
            history.back()

          next.after waitForBrowser, =>
            respond() # we need to respond since we've never requested /test-two with the popTarget

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-two')
            expect($('.viewport').scrollTop()).toBe(150)
            history.back()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-one') # cannot delay the browser from restoring the URL on pop
            respond() # we need to respond since we've never requested /test-one with the popTarget

          next.after waitForBrowser, =>
            expect($('.viewport').scrollTop()).toBe(50)
            history.forward()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-two')
            # No need to respond since we requested /test-two with the popTarget
            # when we went backwards
            expect($('.viewport').scrollTop()).toBe(150)
            history.forward()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-three') # cannot delay the browser from restoring the URL on pop
            respond() # we need to respond since we've never requested /test-three with the popTarget

          next.after waitForBrowser, =>
            expect($('.viewport').scrollTop()).toBe(250)

        it 'restores the scroll position of two viewports marked with [up-viewport], but not configured in up.viewport.config (bugfix)', asyncSpec (next) ->
          up.history.config.restoreTargets = ['.container']

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

          $screen = $fixture('.screen')
          $screen.html(html)

          up.navigate('.content1, .content2', url: '/one', reveal: false, history: true)

          next =>
            respond()

          next =>
            $('.viewport1').scrollTop(3000)
            $('.viewport2').scrollTop(3050)
            expect('.viewport1').toBeScrolledTo(3000)
            expect('.viewport2').toBeScrolledTo(3050)

            up.navigate('.content1, .content2', url: '/two', reveal: false, history: true)

          next =>
            respond()

          next.after 50, =>
            expect(location.href).toMatchURL('/two')
            history.back()

          next.after 100, =>
            # we need to respond since we've never requested the original URL with the popTarget
            respond()

          next =>
            expect('.viewport1').toBeScrolledTo(3000)
            expect('.viewport2').toBeScrolledTo(3050)


    describe '[up-back]', ->

      it 'sets an [up-href] attribute to the previous URL and sets the up-scroll attribute to "scroll"', ->
        up.history.push('/path1')
        up.history.push('/path2')
        element = up.hello($fixture('a[href="/path3"][up-back]').text('text'))
        $element = $(element)
        expect($element.attr('href')).toMatchURL('/path3')
        expect($element.attr('up-href')).toMatchURL('/path1')
        expect($element.attr('up-scroll')).toBe('restore')
        expect($element.attr('up-follow')).toBe('')

      it 'does not overwrite an existing up-href or up-restore-scroll attribute'

      it 'does not set an up-href attribute if there is no previous URL'

    describe 'events', ->

      it 'emits up:location:changed events as the user goes forwards and backwards through history', asyncSpec (next) ->
        up.network.config.cacheSize = 0
        up.history.config.restoreTargets = ['.viewport']

        fixture('.viewport .content')
        respond = =>
          @respondWith """
            <div class="viewport">
              <div class="content">content</div>
            </div>
            """

        normalize = up.history.normalizeURL

        events = []
        up.on 'up:location:changed', (event) ->
          events.push [event.reason, normalize(event.location)]

        up.navigate('.content', url: '/foo', history: true)

        next =>
          respond()

        next =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
          ]

          up.navigate('.content', url: '/bar', history: true)

        next =>
          respond()

        next =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
          ]

          up.navigate('.content', url: '/baz', history: true)

        next =>
          respond()

        next =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
          ]

          history.back()

        next.after 150, =>
          respond()

        next =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
            ['pop', normalize('/bar')]
          ]

          history.back()

        next.after 150, =>
          respond()

        next =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
            ['pop', normalize('/bar')]
            ['pop', normalize('/foo')]
          ]

          history.forward()

        next.after 150, =>
          respond()

        next =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
            ['pop', normalize('/bar')]
            ['pop', normalize('/foo')]
            ['pop', normalize('/bar')]
          ]

          history.forward()

        next.after 150, =>
          respond() # we need to respond since we've never requested /baz with the popTarget

        next =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
            ['pop', normalize('/bar')]
            ['pop', normalize('/foo')]
            ['pop', normalize('/bar')]
            ['pop', normalize('/baz')]
          ]
