u = up.util
e = up.element
$ = jQuery

describe 'up.history', ->

  beforeEach ->
    up.history.config.enabled = true

  describe 'JavaScript functions', ->

    describe 'up.history.push()', ->

      it 'emits an up:location:changed event with a string { location } property (issue #490)', ->
        listener = jasmine.createSpy('event listener')
        up.on('up:location:changed', listener)

        up.history.push('/new-location')

        expect(listener).toHaveBeenCalled()
        expect(listener.calls.mostRecent().args[0].location).toEqual(jasmine.any(String))
        expect(listener.calls.mostRecent().args[0].location).toMatchURL('/new-location')

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

        console.log(1)

      it 'returns the last previous location that is different from the current URL', ->
        initialLocation = location.href
        up.history.replace('/double-replaced-location')
        up.history.replace('/double-replaced-location')
        expect(up.history.previousLocation).toMatchURL(initialLocation)

  describe 'unobtrusive behavior', ->

    describe 'back button', ->

      it 'emits up:location:changed events as the user goes forwards and backwards through history', asyncSpec (next) ->
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

        tolerance = 150

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

        next.after tolerance, =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
            ['pop', normalize('/bar')]
          ]

          history.back()

        next.after 150, =>
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
            ['pop', normalize('/bar')]
            ['pop', normalize('/foo')]
          ]

          history.forward()

        next.after 150, =>
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
          expect(events).toEqual [
            ['push', normalize('/foo')]
            ['push', normalize('/bar')]
            ['push', normalize('/baz')]
            ['pop', normalize('/bar')]
            ['pop', normalize('/foo')]
            ['pop', normalize('/bar')]
            ['pop', normalize('/baz')]
          ]

      it 'emits an up:location:changed event with a string { location } property (issue #490)', ->
        waitForBrowser = 100
        # fixture('.content')
        # up.history.config.restoreTargets = ['.content']
        up.history.push('/page1')
        await wait(waitForBrowser)
        up.history.push('/page2')
        await wait(waitForBrowser)

        listener = jasmine.createSpy('event listener')
        up.on('up:location:changed', listener)

        history.back()
        await wait(waitForBrowser)

        expect(listener).toHaveBeenCalled()
        expect(listener.calls.mostRecent().args[0].location).toEqual(jasmine.any(String))
        expect(listener.calls.mostRecent().args[0].location).toMatchURL('/page1')

      it 'calls destructor functions when destroying compiled elements (bugfix)', asyncSpec (next) ->
        waitForBrowser = 100

        # By default, up.history will replace the <body> tag when
        # the user presses the back-button. We reconfigure this
        # so we don't lose the Jasmine runner interface.
        up.history.config.restoreTargets = ['.container']

        constructorSpy = jasmine.createSpy('constructor')
        destructorSpy = jasmine.createSpy('destructor')

        up.compiler '.example', (example) ->
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

      describe 'focus restoration', ->

        it 'restores element focus when the user hits the back button', asyncSpec (next) ->
          waitForBrowser = 100
          up.fragment.config.mainTargets = ['main']
          up.history.config.restoreTargets = [':main']
          main = fixture('main')
          link = e.affix(main, 'a[href="/focus-path2"][up-follow]', text: 'link label')

          up.history.replace('/focus-path1')

          next ->
            Trigger.clickSequence(link)

          next ->
            expect(link).toBeFocused()
            expect(jasmine.Ajax.requests.count()).toBe(1)

            jasmine.respondWithSelector('main', text: 'new text')

          next ->
            expect('main').toHaveText('new text')
            expect('main').toBeFocused()

            history.back()

          next.after waitForBrowser, ->
            expect(jasmine.Ajax.requests.count()).toBe(2)

          next ->
            jasmine.respondWithSelector('main a[href="/focus-path2"]')

          next ->
            expect(document).toHaveSelector('main a[href="/focus-path2"]')
            expect('a[href="/focus-path2"]').toBeFocused()

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
            expect(location.href).toMatchURL('/test-two')
            expect($('.viewport').scrollTop()).toBe(150)
            history.back()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-one') # cannot delay the browser from restoring the URL on pop
            expect($('.viewport').scrollTop()).toBe(50)
            history.forward()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-two')
            expect($('.viewport').scrollTop()).toBe(150)
            history.forward()

          next.after waitForBrowser, =>
            expect(location.href).toMatchURL('/test-three') # cannot delay the browser from restoring the URL on pop
            expect($('.viewport').scrollTop()).toBe(250)

        it 'resets the scroll position of no earlier scroll position is known', asyncSpec (next) ->
          longContentHTML = """
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px">text</div>
            </div>
          """

          respond = -> jasmine.respondWith(longContentHTML)

          $viewport = $(longContentHTML).appendTo(document.body)

          waitForBrowser = 100

          up.viewport.config.viewportSelectors = ['.viewport']
          up.history.config.restoreTargets = ['.viewport']

          up.history.replace('/restore-path1')

          up.navigate('.content', url: '/restore-path2', history: true)

          next ->
            respond()

          next ->
            expect(location.href).toMatchURL('/restore-path2')
            $('.viewport').scrollTop(50)

            # Emulate a cache miss
            up.layer.root.lastScrollTops.clear()

            history.back()

          next.after waitForBrowser, ->
            respond()

          next ->
            expect(location.href).toMatchURL('/restore-path1')
            expect($('.viewport').scrollTop()).toBe(0)

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

          next.after 50, =>
            expect('.viewport1').toBeScrolledTo(3000)
            expect('.viewport2').toBeScrolledTo(3050)


    describe '[up-back]', ->

      it 'sets an [up-href] attribute to the previous URL and sets the up-scroll attribute to "restore"', ->
        up.history.push('/path1')
        up.history.push('/path2')
        element = up.hello(fixture('a[href="/path3"][up-back]', text: 'text'))
        expect(element.getAttribute('href')).toMatchURL('/path3')
        expect(element.getAttribute('up-href')).toMatchURL('/path1')
        expect(element.getAttribute('up-scroll')).toBe('restore')
        expect(element).toBeFollowable()

      it 'does not overwrite an existing up-href or up-restore-scroll attribute'

      it 'does not set an up-href attribute if there is no previous URL'

