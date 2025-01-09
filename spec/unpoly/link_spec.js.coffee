u = up.util
e = up.element
$ = jQuery

describe 'up.link', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.follow()', ->

      it 'loads the given link via AJAX and replaces the response in the given target', asyncSpec (next) ->
        fixture('.before', text: 'old-before')
        fixture('.middle', text: 'old-middle')
        fixture('.after', text: 'old-after')
        link = fixture('a[href="/path"][up-target=".middle"]')

        up.follow(link)

        next ->
          jasmine.respondWith """
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
            """

        next ->
          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')

      it 'uses the method from a data-method attribute', asyncSpec (next) ->
        link = fixture('a[href="/path"][data-method="PUT"]')
        up.follow(link)

        next ->
          request = jasmine.lastRequest()
          expect(request).toHaveRequestMethod('PUT')

      it 'allows to refer to the link itself as ":origin" in the CSS selector', asyncSpec (next) ->
        container = fixture('div')
        link1 = e.createFromHTML('<a id="first" href="/path" up-target=":origin">first-link</a>')
        container.append(link1)

        link2 = e.createFromHTML('<a id="second" href="/path" up-target=":origin">second-link</a>')
        container.append(link2)
        up.follow(link2)

        next -> jasmine.respondWith '<div id="second">second-div</div>'
        next -> expect(container).toHaveText('first-linksecond-div')

      it 'returns a promise with an up.RenderResult that contains information about the updated fragments and layer', asyncSpec (next) ->
        fixture('.one', text: 'old one')
        fixture('.two', text: 'old two')
        fixture('.three', text: 'old three')

        link = fixture('a[up-target=".one, .three"][href="/path"]')

        promise = up.follow(link)

        next =>
          @respondWith """
            <div class="one">new one</div>
            <div class="two">new two</div>
            <div class="three">new three</div>
          """

        next =>
          next.await promiseState(promise)

        next (result) =>
          expect(result.state).toBe('fulfilled')
          expect(result.value.fragments).toEqual([document.querySelector('.one'), document.querySelector('.three')])
          expect(result.value.layer).toBe(up.layer.root)

      it 'still renders if the link was removed while the request was in flight (e.g. when the user clicked a link in a custom overlay that closes on mouseout)', asyncSpec (next) ->
        fixture('.target', text: 'old text')

        link = fixture('a[up-target=".target"][href="/foo"]')

        promise = up.follow(link)

        next ->
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          link.remove()

        next ->
          jasmine.respondWithSelector('.target', text: 'new text')

        next ->
          expect('.target').toHaveText('new text')
          next.await promiseState(promise)

        next (result) ->
          expect(result.state).toBe('fulfilled')
          # Jasmine will fail if there are unhandled promise rejections

#      it 'does not change focus in a programmatic call', asyncSpec (next) ->
#        input = fixture('input[type=text]')
#        target = fixture('.target')
#        link = fixture('a[href="/path"][up-target=".target"]')
#
#        input.focus()
#        expect(input).toBeFocused()
#        up.follow(link)
#
#        next ->
#          # Assert that focus did not change
#          expect(input).toBeFocused()

      describe 'up:link:follow events', ->

        it 'emits a preventable up:link:follow event', ->
          link = fixture('a[href="/destination"][up-target=".response"]')

          listener = jasmine.createSpy('follow listener').and.callFake (event) ->
            event.preventDefault()

          link.addEventListener('up:link:follow', listener)

          followPromise = up.follow(link)

          await expectAsync(followPromise).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalled()
          event = listener.calls.mostRecent().args[0]
          expect(event.target).toEqual(link)

          # No request should be made because we prevented the event
          expect(jasmine.Ajax.requests.count()).toEqual(0)

        it 'allows listeners to inspect event.renderOptions', ->
          link = fixture('a[href="/destination"][up-target=".response"][up-scroll=".scroll"][up-focus=".focus"]')
          listener = jasmine.createSpy('follow listener')
          link.addEventListener('up:link:follow', listener)

          up.follow(link)
          await wait()

          expect(listener).toHaveBeenCalledWith(
            jasmine.objectContaining(
              renderOptions: jasmine.objectContaining(
                target: '.response',
                scroll: '.scroll',
                focus: '.focus',
              )
            )
          )

#        it 'allows listeners to inspect event.renderLayer when updating an existing layer', ->
#          makeLayers([
#            { target: '#target' },
#            { target: '#target' },
#            { target: '#target' },
#          ])
#          expect(up.layer.current).toBeOverlay()
#
#          link = up.layer.current.affix('a[href="/destination"][up-target="#target"][up-layer="parent"]')
#          expect(up.layer.get(link).index).toBe(2)
#
#          listener = jasmine.createSpy('follow listener')
#          link.addEventListener('up:link:follow', listener)
#
#          up.follow(link)
#          await wait()
#
#          expect(listener).toHaveBeenCalledWith(
#            jasmine.objectContaining(
#              renderLayer: up.layer.get(1)
#            )
#          )
#
#        it 'allows listeners to inspect event.renderLayer when opening a new layer', ->
#          link = fixture('a[href="/destination"][up-target="#target"][up-layer="new drawer"]')
#          expect(up.layer.get(link).index).toBe(2)
#
#          listener = jasmine.createSpy('follow listener')
#          link.addEventListener('up:link:follow', listener)
#
#          up.follow(link)
#          await wait()
#
#          expect(listener).toHaveBeenCalledWith(
#            jasmine.objectContaining(
#              renderLayer: 'new',
#              renderOptions: jasmine.objectContaining(
#                mode: 'drawer',
#              )
#            )
#          )

        it 'allows listeners to mutate event.renderOptions', ->
          fixture('#foo', text: 'old foo')
          fixture('#bar', text: 'old bar')

          link = fixture('a[href="/path"][up-target="#foo"]')

          listener = jasmine.createSpy('follow listener').and.callFake (event) ->
            expect(event.renderOptions.target).toBe('#foo')
            event.renderOptions.target = '#bar'

          link.addEventListener('up:link:follow', listener)

          up.follow(link)

          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#bar')

          jasmine.respondWithSelector('#bar', text: 'new bar')

          await wait()

          expect('#foo').toHaveText('old foo')
          expect('#bar').toHaveText('new bar')

        it 'allows listeners to update another layer by mutating event.renderOptions.layer', ->
          makeLayers([
            { target: '.target', content: 'old text' },
            { target: '.target', content: 'old text' },
          ])

          link = fixture('a[href="/path"][up-target=".target"]')

          listener = jasmine.createSpy('follow listener').and.callFake (event) ->
            event.renderOptions.layer = 1

          link.addEventListener('up:link:follow', listener)

          up.follow(link, peel: false)

          await wait()

          jasmine.respondWithSelector('.target', text: 'new text')

          await wait()

          expect(up.fragment.get('.target', layer: 0)).toHaveText('old text')
          expect(up.fragment.get('.target', layer: 1)).toHaveText('new text')

        it 'allows listeners to open a new layer, using the shorthand { layer: "new" } with an implicit mode', ->
          fixture('#foo', text: 'old foo in root')
          link = fixture('a[href="/path"][up-target="#foo"]')

          listener = jasmine.createSpy('follow listener').and.callFake (event) ->
            event.renderOptions.layer = 'new'

          link.addEventListener('up:link:follow', listener)

          up.follow(link)

          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Mode']).toBe('modal')

          jasmine.respondWithSelector('#foo', text: 'new foo in overlay')

          await wait()

          expect(up.layer.count).toBe(2)
          expect(up.fragment.get('#foo', layer: 0)).toHaveText('old foo in root')
          expect(up.fragment.get('#foo', layer: 1)).toHaveText('new foo in overlay')

        it 'allows listeners to open a new layer for a failed response', ->
          fixture('#foo', text: 'old foo in root')
          link = fixture('a[href="/path"][up-target="#foo"][up-fail-target="#foo"]')

          listener = jasmine.createSpy('follow listener').and.callFake (event) ->
            event.renderOptions.failLayer = 'new'

          link.addEventListener('up:link:follow', listener)

          up.follow(link)

          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Mode']).toBe('root')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Fail-Mode']).toBe('modal')

          jasmine.respondWithSelector('#foo', text: 'new foo in overlay', status: 422)

          await wait()

          expect(up.layer.count).toBe(2)
          expect(up.fragment.get('#foo', layer: 0)).toHaveText('old foo in root')
          expect(up.fragment.get('#foo', layer: 1)).toHaveText('new foo in overlay')

      describe 'history', ->

        it 'adds history entries and allows the user to use the back and forward buttons', asyncSpec (next) ->
          up.history.config.enabled = true

          waitForBrowser = 300

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          respondWith = (html, title) =>
            @respondWith
              status: 200
              contentType: 'text/html'
              responseText: "<div class='container'><div class='target'>#{html}</div></div>"
              responseHeaders: { 'X-Up-Title': JSON.stringify(title) }

  #          followAndRespond = ($link, html, title) ->
  #            promise = up.follow($link)
  #            respondWith(html, title)
  #            promise

          up.fragment.config.navigateOptions.history = true

          $link1 = $fixture('a[href="/one"][up-target=".target"]')
          $link2 = $fixture('a[href="/two"][up-target=".target"]')
          $link3 = $fixture('a[href="/three"][up-target=".target"]')
          $container = $fixture('.container')
          $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1.get(0))

          next =>
            respondWith('text from one', 'title from one')

          next =>
            expect('.target').toHaveText('text from one')
            expect(location.pathname).toEqual('/one')
            expect(document.title).toEqual('title from one')

            up.follow($link2.get(0))

          next =>
            respondWith('text from two', 'title from two')

          next =>
            expect('.target').toHaveText('text from two')
            expect(location.pathname).toEqual('/two')
            expect(document.title).toEqual('title from two')

            up.follow($link3.get(0))

          next =>
            respondWith('text from three', 'title from three')

          next =>
            expect('.target').toHaveText('text from three')
            expect(location.pathname).toEqual('/three')
            expect(document.title).toEqual('title from three')

            history.back()

          next.after waitForBrowser, =>
            expect('.target').toHaveText('text from two')
            expect(location.pathname).toEqual('/two')
            expect(document.title).toEqual('title from two')

            history.back()

          next.after waitForBrowser, =>
            expect('.target').toHaveText('text from one')
            expect(location.pathname).toEqual('/one')
            expect(document.title).toEqual('title from one')

            history.forward()

          next.after waitForBrowser, =>
            expect('.target').toHaveText('text from two')
            expect(location.pathname).toEqual('/two')
            expect(document.title).toEqual('title from two')

        it 'renders history when the user clicks on a link, goes back and then clicks on the same link (bugfix)', asyncSpec (next) ->
          up.history.config.enabled = true
          up.history.config.restoreTargets = ['.target']
          waitForBrowser = 300

          linkHTML = """
            <a href="/next" up-target=".target" up-history="false">label</a>
          """
          target = fixture('.target', text: 'old text')
          link = fixture('a[href="/next"][up-target=".target"][up-history=true]')
          up.history.replace('/original')

          next ->
            expect(up.history.location).toMatchURL('/original')
            expect('.target').toHaveText('old text')

            Trigger.clickSequence(link)

          next ->
            jasmine.respondWithSelector('.target', text: 'new text')

          next ->
            expect(up.history.location).toMatchURL('/next')
            expect('.target').toHaveText('new text')

            history.back()

          next.after waitForBrowser, ->
            jasmine.respondWithSelector('.target', text: 'old text')

          next ->
            expect(up.history.location).toMatchURL('/original')
            expect('.target').toHaveText('old text')

            Trigger.clickSequence(link)

          next ->
            # Response was already cached
            expect(up.history.location).toMatchURL('/next')
            expect('.target').toHaveText('new text')

        it 'does not add additional history entries when linking to the current URL', asyncSpec (next) ->
          up.history.config.enabled = true

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          up.fragment.config.navigateOptions.history = true

          up.network.config.cacheEvictAge = 0

          waitForBrowser = 150

          respondWith = (text) =>
            @respondWith """
              <div class="container">
                <div class='target'>#{text}</div>
              </div>
            """

          $link1 = $fixture('a[href="/one"][up-target=".target"]')
          $link2 = $fixture('a[href="/two"][up-target=".target"]')
          $container = $fixture('.container')
          $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1.get(0))

          next =>
            respondWith('text from one')

          next =>
            expect('.target').toHaveText('text from one')
            expect(location.pathname).toEqual('/one')

            up.follow($link2.get(0))

          next =>
            respondWith('text from two')

          next =>
            expect('.target').toHaveText('text from two')
            expect(location.pathname).toEqual('/two')

            up.follow($link2.get(0))

          next =>
            respondWith('text from two')

          next =>
            expect('.target').toHaveText('text from two')
            expect(location.pathname).toEqual('/two')

            history.back()

          next.after waitForBrowser, =>
            respondWith('restored text from one')

          next =>
            expect('.target').toHaveText('restored text from one')
            expect(location.pathname).toEqual('/one')

            history.forward()

          next.after waitForBrowser, =>
            respondWith('restored text from two')

          next =>
            expect('.target').toHaveText('restored text from two')
            expect(location.pathname).toEqual('/two')

        it 'does add additional history entries when linking to the current URL, but with a different hash', asyncSpec (next) ->
          up.history.config.enabled = true

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          up.fragment.config.navigateOptions.history = true

          up.network.config.cacheEvictAge = 0

          waitForBrowser = 150

          respondWith = (text) =>
            @respondWith """
              <div class="container">
                <div class='target'>#{text}</div>
              </div>
            """

          $link1 = $fixture('a[href="/one"][up-target=".target"]')
          $link2 = $fixture('a[href="/two"][up-target=".target"]')
          $link2WithHash = $fixture('a[href="/two#hash"][up-target=".target"]')
          $container = $fixture('.container')
          $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1.get(0))

          next =>
            respondWith('text from one')

          next =>
            expect('.target').toHaveText('text from one')
            expect(location.pathname).toEqual('/one')
            expect(location.hash).toEqual('')

            up.follow($link2)

          next =>
            respondWith('text from two')

          next =>
            expect('.target').toHaveText('text from two')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('')

            up.follow($link2WithHash.get(0))

          next =>
            respondWith('text from two with hash')

          next =>
            expect('.target').toHaveText('text from two with hash')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('#hash')

            history.back()

          next.after waitForBrowser, =>
            respondWith('restored text from two')

          next =>
            expect('.target').toHaveText('restored text from two')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('')

            history.forward()

          next.after waitForBrowser, =>
            respondWith('restored text from two with hash')

          next =>
            expect('.target').toHaveText('restored text from two with hash')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('#hash')

        it 'does add additional history entries when the user clicks a link, changes the URL with history.replaceState(), then clicks the same link again (bugfix)', asyncSpec (next) ->
          up.history.config.enabled = true
          up.fragment.config.navigateOptions.history = true

          fixture('.target', text: 'old text')
          link = fixture('a[href="/link-path"][up-target=".target"]')

          up.follow(link)

          next ->
            jasmine.respondWithSelector('.target', text: 'new text')

          next ->
            expect('.target').toHaveText('new text')
            expect(location.pathname).toEqual('/link-path')

            history.replaceState({}, '', '/user-path')

            expect(location.pathname).toEqual('/user-path')

            up.follow(link)

          next ->
            expect(location.pathname).toEqual('/link-path')

      describe 'scrolling', ->

        describe 'with { scroll: "target" }', ->

          it 'reveals the target fragment', asyncSpec (next) ->
            $link = $fixture('a[href="/action"][up-target=".target"]')
            $target = $fixture('.target')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            up.follow($link.get(0), scroll: 'target')

            next =>
              @respondWith('<div class="target">new text</div>')

            next =>
              expect(revealStub).toHaveBeenCalled()
              expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.target')

        describe 'with { failScroll: "target" }', ->

          it 'reveals the { failTarget } if the server responds with an error', ->
            link = fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
            target = fixture('.target')
            failTarget = fixture('.fail-target')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())
            renderJob = up.follow(link, failScroll: "target")

            await wait()

            jasmine.respondWith
              status: 500,
              responseText: """
                <div class="fail-target">
                  Errors here
                </div>
                """

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.fail-target')

        describe 'with { scroll: string } option', ->

          it 'allows to reveal a different selector', asyncSpec (next) ->
            link = fixture('a[href="/action"][up-target=".target"]')
            target = fixture('.target')
            other = fixture('.other')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            up.follow(link, scroll: '.other')

            next ->
              jasmine.respondWith """
                <div class="target">
                  new text
                </div>
                <div class="other">
                  new other
                </div>
              """

            next ->
              expect(revealStub).toHaveBeenCalled()
              expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.other')

          it 'ignores the { scroll } option for a failed response', ->
            link = fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
            target = fixture('.target')
            failTarget = fixture('.fail-target')
            other = fixture('.other')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())
            renderJob = up.follow(link, scroll: '.other', failTarget: '.fail-target')

            await wait()

            jasmine.respondWith
              status: 500,
              responseText: """
                <div class="fail-target">
                  Errors here
                </div>
                """

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            expect(revealStub).not.toHaveBeenCalled()

        describe 'with { failScroll } option', ->

          it 'reveals the given selector when the server responds with an error', asyncSpec (next) ->
            link = fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
            target = fixture('.target')
            failTarget = fixture('.fail-target')
            other = fixture('.other')
            failOther = fixture('.fail-other')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())
            renderJob = up.follow(link, reveal: '.other', failScroll: '.fail-other')

            await wait()

            jasmine.respondWith
              status: 500,
              responseText: """
                <div class="fail-target">
                  Errors here
                </div>
                <div class="fail-other">
                  Fail other here
                </div>
                """

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.fail-other')

        describe 'with { scroll: "restore" } option', ->

          beforeEach ->
            up.history.config.enabled = true

          it "does not reveal, but instead restores the scroll positions of the target's viewport", asyncSpec (next) ->

            $viewport = $fixture('.viewport[up-viewport] .element').css
              'height': '100px'
              'width': '100px'
              'overflow-y': 'scroll'

            followLink = (options = {}) ->
              $link = $viewport.find('.link')
              up.follow($link.get(0), options)

            respond = (linkDestination) =>
              @respondWith """
                <div class="element" style="height: 300px">
                  <a class="link" href="#{linkDestination}" up-target=".element">Link</a>
                </div>
                """

            up.navigate('.element', url: '/foo')

            next =>
              # Provide the content at /foo with a link to /bar in the HTML
              respond('/bar')

            next =>
              $viewport.scrollTop(65)

              # Follow the link to /bar
              followLink()

            next =>
              # Provide the content at /bar with a link back to /foo in the HTML
              respond('/foo')

            next =>
              # Follow the link back to /foo, restoring the scroll position of 65px
              followLink(scroll: 'restore')
              # No need to respond because /foo has been cached before

            next =>
              expect($viewport.scrollTop()).toBeAround(65, 1)

        describe "when the browser is already on the link's destination", ->

          it "doesn't make a request and reveals the target container"

          it "doesn't make a request and reveals the target of a #hash in the URL"

      describe 'with { confirm } option', ->

        it 'follows the link after the user OKs a confirmation dialog', ->
          spyOn(window, 'confirm').and.returnValue(true)
          link = fixture('a[href="/danger"][up-target=".middle"]')
          up.follow(link, confirm: 'Do you really want to go there?')

          await wait()

          expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')
          expect(jasmine.Ajax.requests.count()).toBe(1)

        it 'does not follow the link if the user cancels the confirmation dialog', ->
          spyOn(window, 'confirm').and.returnValue(false)
          link = fixture('a[href="/danger"][up-target=".middle"]')

          renderJob = up.follow(link, confirm: 'Do you really want to go there?')

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')

        it 'does not show a confirmation dialog if the option is not a present string', asyncSpec (next) ->
          spyOn(up, 'render').and.returnValue(Promise.resolve())
          spyOn(window, 'confirm')
          link = fixture('a[href="/danger"][up-target=".middle"]')
          up.follow(link, confirm: '')

          next =>
            expect(window.confirm).not.toHaveBeenCalled()
            expect(up.render).toHaveBeenCalled()

        it 'does not show a confirmation dialog when preloading', asyncSpec (next) ->
          spyOn(up, 'render').and.returnValue(Promise.resolve())
          spyOn(window, 'confirm')
          link = fixture('a[href="/danger"][up-target=".middle"]')
          up.follow(link, confirm: 'Are you sure?', preload: true)

          next =>
            expect(window.confirm).not.toHaveBeenCalled()
            expect(up.render).toHaveBeenCalled()

    describe "when the link's [href] is '#'", ->

      it 'does not follow the link', ->
        fixture('.target', text: 'old text')

        link = fixture('a[href="#"][up-target=".target"]')
        renderJob = up.follow(link)

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Error))
        expect('.target').toHaveText('old text')

      it 'does follow the link if it has a local content attribute', ->
        fixture('.target', text: 'old text')

        link = fixture('a[href="#"][up-target=".target"][up-content="new text"]')
        promise = up.follow(link)

        await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
        expect('.target').toHaveText('new text')

    describe 'up.link.followOptions()', ->

      it 'parses the render options that would be used to follow the given link', ->
        link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        options = up.link.followOptions(link)
        expect(options.url).toEqual('/path')
        expect(options.method).toEqual('PUT')
        expect(options.layer).toEqual('new')

      it 'does not render', ->
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        options = up.link.followOptions(link)
        expect(up.render).not.toHaveBeenCalled()

      it 'parses the link method from a [data-method] attribute so we can replace the Rails UJS adapter with Unpoly', ->
        link = fixture('a[href="/path"][data-method="patch"]')
        options = up.link.followOptions(link)
        expect(options.method).toEqual('PATCH')

      it "prefers a link's [up-href] attribute to its [href] attribute", ->
        link = fixture('a[href="/foo"][up-href="/bar"]')
        options = up.link.followOptions(link)
        expect(options.url).toEqual('/bar')

      it 'parses an [up-on-finished] attribute', ->
        window.onFinishedCallback = jasmine.createSpy('onFinished callback')
        link = fixture('a[href="/path"][up-on-finished="window.onFinishedCallback(this)"]')
        options = up.link.followOptions(link)

        expect(u.isFunction(options.onFinished)).toBe(true)
        options.onFinished()

        expect(window.onFinishedCallback).toHaveBeenCalledWith(link)

        delete window.onFinishedCallback

      it 'parses an [up-background] attribute', ->
        link = fixture('a[href="/foo"][up-background="true"]')
        options = up.link.followOptions(link)
        expect(options.background).toBe(true)

      it 'parses an [up-use-keep] attribute', ->
        link = fixture('a[href="/foo"][up-use-keep="false"]')
        options = up.link.followOptions(link)
        expect(options.useKeep).toBe(false)

      it 'parses an [up-use-hungry] attribute', ->
        link = fixture('a[href="/foo"][up-use-hungry="false"]')
        options = up.link.followOptions(link)
        expect(options.useHungry).toBe(false)

      it 'parses an [up-timeout] attribute', ->
        link = fixture('a[href="/foo"][up-timeout="20_000"]')
        options = up.link.followOptions(link)
        expect(options.timeout).toBe(20000)

      it 'parses an [up-animation] attribute', ->
        link = fixture('a[href="/foo"][up-animation="move-from-top"]')
        options = up.link.followOptions(link)
        expect(options.animation).toBe('move-from-top')

      it 'parses an [up-scroll] attribute', ->
        link = fixture('a[href="/foo"][up-scroll="reset"]')
        options = up.link.followOptions(link)
        expect(options.scroll).toBe('reset')

      it 'parses an [up-scroll-behavior] attribute', ->
        link = fixture('a[href="/foo"][up-scroll-behavior="instant"]')
        options = up.link.followOptions(link)
        expect(options.scrollBehavior).toBe('instant')

      it 'parses an [up-content] attribute', ->
        link = fixture('a[href="/foo"][up-content="new text"]')
        options = up.link.followOptions(link)
        expect(options.content).toBe('new text')

      it 'parses an [up-history] attribute', ->
        link = fixture('a[href="/foo"][up-history="false"]')
        options = up.link.followOptions(link)
        expect(options.history).toBe(false)

      it 'parses an [up-title] attribute', ->
        link = fixture('a[href="/foo"][up-title="false"]')
        options = up.link.followOptions(link)
        expect(options.title).toBe(false)

      it 'parses an [up-location] attribute', ->
        link = fixture('a[href="/foo"][up-location="false"]')
        options = up.link.followOptions(link)
        expect(options.location).toBe(false)

      it 'parses an [up-meta-tags] attribute', ->
        link = fixture('a[href="/foo"][up-meta-tags="false"]')
        options = up.link.followOptions(link)
        expect(options.metaTags).toBe(false)

      it 'parses an [up-lang=false] attribute as boolean', ->
        link = fixture('a[href="/foo"][up-lang="false"]')
        options = up.link.followOptions(link)
        expect(options.lang).toBe(false)

      it 'parses an [up-lang="string"] attribute as string', ->
        link = fixture('a[href="/foo"][up-lang="fr"]')
        options = up.link.followOptions(link)
        expect(options.lang).toBe('fr')

      it 'parses an [up-match] attribute', ->
        link = fixture('a[href="/foo"][up-match="first"]')
        options = up.link.followOptions(link)
        expect(options.match).toBe('first')

      it 'parses an [up-preview] attribute', ->
        link = fixture('a[href="/foo"][up-preview="foo bar"]')
        options = up.link.followOptions(link)
        expect(options.preview).toBe('foo bar')

      it 'parses an [up-preview=false] attribute as boolean', ->
        link = fixture('a[href="/foo"][up-preview="false"]')
        options = up.link.followOptions(link)
        expect(options.preview).toBe(false)

      if up.migrate.loaded
        it 'parses an [up-reset-scroll] attribute', ->
          link = fixture('a[href="/foo"][up-reset-scroll]')
          up.hello(link)

          options = up.link.followOptions(link)
          expect(options.scroll).toBe('reset')

        it 'parses an [up-restore-scroll] attribute', ->
          link = fixture('a[href="/foo"][up-restore-scroll]')
          up.hello(link)

          options = up.link.followOptions(link)
          expect(options.scroll).toBe('restore')

        it 'parses an [up-reveal] attribute', ->
          link = fixture('a[href="/foo"][up-reveal=false]')
          up.hello(link)

          options = up.link.followOptions(link)
          expect(options.scroll).toBe(false)

    describe 'up.link.shouldFollowEvent', ->

      buildEvent = (target, attrs) ->
        event = Trigger.createMouseEvent('mousedown', attrs)
        # Cannot change event.target on a native event property, but we can with Object.defineProperty()
        Object.defineProperty(event, 'target', get: -> target)
        event

      it "returns true when the given event's target is the given link itself", ->
        $link = $fixture('a[href="/foo"]')
        event = buildEvent($link[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)

      it "returns true when the given event's target is a non-link child of the given link", ->
        $link = $fixture('a[href="/foo"]')
        $span = $link.affix('span')
        event = buildEvent($span[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)

      it "returns false when the given event's target is a child link of the given link (think [up-expand])", ->
        $link = $fixture('div[up-href="/foo"]')
        $childLink = $link.affix('a[href="/bar"]')
        event = buildEvent($childLink[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

      it "returns false when the given event's target is a child input of the given link (think [up-expand])", ->
        $link = $fixture('div[up-href="/foo"]')
        $childInput = $link.affix('input[type="text"]')
        event = buildEvent($childInput[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

    describe 'up.link.makeFollowable', ->

      it "adds [up-follow] to a link that wouldn't otherwise be handled by Unpoly", ->
        $link = $fixture('a[href="/path"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toEqual('')

      it "does not add [up-follow] to a link that is already [up-target]", ->
        $link = $fixture('a[href="/path"][up-target=".target"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toBeMissing()

    describe 'up.visit', ->

      it 'should have tests'

    describe 'up.link.isFollowable', ->

      it 'returns true for an [up-target] link', ->
        link = fixture('a[href="/foo"][up-target=".target"]')
        up.hello link
        expect(up.link.isFollowable(link)).toBe(true)

      it 'returns true for an [up-follow] link', ->
        link = fixture('a[href="/foo"][up-follow]')
        up.hello link
        expect(up.link.isFollowable(link)).toBe(true)

      it 'returns true for an [up-layer] link', ->
        $link = $fixture('a[href="/foo"][up-layer="modal"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      it 'returns true for an [up-follow] link', ->
        $link = $fixture('a[href="/foo"][up-follow]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      it 'returns true for an [up-preload] link', ->
        $link = $fixture('a[href="/foo"][up-preload]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      if up.migrate.loaded
        it 'returns true for an [up-instant][href] link', ->
          $link = $fixture('a[href="/foo"][up-instant]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

        it 'returns true for a faux [up-instant][up-href] link', ->
          $link = $fixture('span[up-href="/foo"][up-instant]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)
      else
        it 'returns false for an [up-instant] link (because we also have a[up-emit][up-instant])', ->
          $link = $fixture('a[href="/foo"][up-instant]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(false)

      if up.migrate.loaded
        it 'returns true for an [up-modal] link', ->
          $link = $fixture('a[href="/foo"][up-modal=".target"]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

        it 'returns true for an [up-popup] link', ->
          $link = $fixture('a[href="/foo"][up-popup=".target"]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

        it 'returns true for an [up-drawer] link', ->
          $link = $fixture('a[href="/foo"][up-drawer=".target"]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

      if up.migrate.loaded
        it 'returns true for an [up-target] span with [up-href]', ->
          $link = $fixture('span[up-href="/foo"][up-target=".target"]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

      it 'returns false if the given link will be handled by the browser', ->
        $link = $fixture('a[href="/foo"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(false)

      it 'returns false if the given link will be handled by Rails UJS', ->
        $link = $fixture('a[href="/foo"][data-method="put"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(false)

      it 'returns true if the given link matches a custom up.link.config.followSelectors', ->
        link = fixture('a.hyperlink[href="/foo"]')
        up.link.config.followSelectors.push('.hyperlink')
        expect(up.link.isFollowable(link)).toBe(true)

      it 'returns false if the given link matches a custom up.link.config.followSelectors, but also has [up-follow=false]', ->
        link = fixture('a.hyperlink[href="/foo"][up-follow="false"]')
        up.link.config.followSelectors.push('.hyperlink')
        expect(up.link.isFollowable(link)).toBe(false)

      it 'returns false for a link with a [href] to another host ("cross origin")', ->
        link = fixture('a[up-follow][href="https://other-host/path"]')
        expect(up.link.isFollowable(link)).toBe(false)

      it 'returns true for a link with a [href] to this host when it also includes this port explicitly', ->
        link = fixture("a[up-follow][href=//#{location.hostname}:#{location.port}/path]")
        expect(up.link.isFollowable(link)).toBe(true)

      it 'returns false for a link with a [href] to this host, but another port', ->
        link = fixture("a[up-follow][href=//#{location.hostname}:97334/path]")
        expect(up.link.isFollowable(link)).toBe(false)

      it 'returns false for a link with a [up-href] to another host', ->
        link = fixture('a[up-follow][href="/path"][up-href="https://other-host/path"]')
        expect(up.link.isFollowable(link)).toBe(false)

      it 'returns true for a link with a [up-href] to a fully qualified URL on this host', ->
        link = fixture("a[up-follow][href='/path'][up-href=//#{location.host}/path]")
        expect(up.link.isFollowable(link)).toBe(true)

      it 'returns false for a link with a [up-href] to this host, but another port', ->
        link = fixture("a[up-follow][href='/path'][up-href=//#{location.host}:97334/path]")
        expect(up.link.isFollowable(link)).toBe(false)

      it 'returns false for an #anchor link without a path, even if the link has [up-follow]', ->
        link = fixture('a[up-follow][href="#details"]')
        expect(up.link.isFollowable(link)).toBe(false)

      it 'returns false for an #anchor link with a path, even if the link has [up-follow]', ->
        link = fixture('a[up-follow][href="/other/page#details"]')
        expect(up.link.isFollowable(link)).toBe(true)

      it 'returns false for a link with a "javascript:..." [href] attribute, even if the link has [up-follow]', ->
        link = fixture('a[up-follow][href="javascript:foo()"]')
        expect(up.link.isFollowable(link)).toBe(false)

      it 'returns false for a link with [up-follow] that also matches up.link.config.noFollowSelectors', ->
        up.link.config.noFollowSelectors.push('.foo')
        link = fixture('a.foo[up-follow][href="/foo"]')
        expect(up.link.isFollowable(link)).toBe(false)

    describe 'up.link.preload', ->

      beforeEach ->
        @requestTarget = => @lastRequest().requestHeaders['X-Up-Target']

      it "loads and caches the given link's destination", ->
        fixture('.target')
        link = fixture('a[href="/path"][up-target=".target"]')

        up.link.preload(link)

        await wait()

        expect(
          url: '/path'
          target: '.target'
          failTarget: 'default-fallback'
          origin: link
        ).toBeCached()

      it 'accepts options that overrides those options that were parsed from the link', ->
        fixture('.target')
        link = fixture('a[href="/path"][up-target=".target"]')
        up.link.preload(link, url: '/options-path')

        await wait()

        expect(
          url: '/options-path'
          target: '.target'
          failTarget: 'default-fallback'
          origin: link
        ).toBeCached()

      it 'does not dispatch another request for a link that is currently loading', ->
        link = fixture('a[href="/path"][up-target=".target"]')
        up.follow(link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)

        up.link.preload(link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)

      it 'does not update fragments for a link with local content (bugfix)', ->
        target = fixture('.target', text: 'old text')
        link = fixture('a[up-content="new text"][up-target=".target"]')

        up.link.preload(link)

        await wait()

        expect('.target').toHaveText('old text')

      it 'does not call an { onRendered } callback', ->
        onRendered = jasmine.createSpy('{ onRendered } callback')
        fixture('.target')
        link = fixture('a[up-href="/path"][up-target=".target"]')

        promise = up.link.preload(link, { onRendered })

        await wait()

        jasmine.respondWithSelector('.target')

        await expectAsync(promise).toBeResolved()

        expect(onRendered).not.toHaveBeenCalled()
        # Jasmine will fail if there are unhandled promise rejections

      describe 'for an [up-target] link', ->

        it 'includes the [up-target] selector as an X-Up-Target header if the targeted element is currently on the page', ->
          fixture('.target')
          link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          expect(@requestTarget()).toEqual('.target')

        it 'replaces the [up-target] selector as with a fallback and uses that as an X-Up-Target header if the targeted element is not currently on the page', ->
          link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          # The default fallback would usually be `body`, but in Jasmine specs we change
          # it to protect the test runner during failures.
          expect(@requestTarget()).toEqual('default-fallback')

      describe 'for a link opening a new layer', ->

        beforeEach ->
          up.motion.config.enabled = false

        it 'includes the selector as an X-Up-Target header and does not replace it with a fallback, since the layer frame always exists', ->
          link = fixture('a[href="/path"][up-target=".target"][up-layer="new"]')
          up.hello(link)

          up.link.preload(link)

          await wait()

          expect(@requestTarget()).toEqual('.target')

        it 'does not create layer elements', ->
          link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)

          up.link.preload(link)

          await wait()

          expect('up-modal').not.toBeAttached()

        it 'does not emit an up:layer:open event', ->
          link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          openListener = jasmine.createSpy('listener')
          up.on('up:layer:open', openListener)

          up.link.preload(link)

          await wait()

          expect(openListener).not.toHaveBeenCalled()

        it 'does not close a currently open overlay', ->
          link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          closeListener = jasmine.createSpy('listener')
          up.on('up:layer:dismiss', closeListener)

          up.layer.open(mode: 'modal', fragment: '<div class="content">Modal content</div>')

          await wait()

          expect('up-modal .content').toBeAttached()

          up.link.preload(link)

          await wait()

          expect('up-modal .content').toBeAttached()
          expect(closeListener).not.toHaveBeenCalled()

          up.layer.dismiss()

          await wait()

          expect('up-modal .content').not.toBeAttached()
          expect(closeListener).toHaveBeenCalled()

        it 'does not prevent the opening of other overlays while the request is still pending', ->
          link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          up.link.preload(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          up.layer.open(mode: 'modal', fragment: '<div class="content">Modal content</div>')

          await wait()

          expect('up-modal .content').toBeAttached()

        it 'calls up.request() with a { preload: true } option', ->
          requestSpy = spyOn(up, 'request').and.callThrough()

          $link = $fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello($link)
          up.link.preload($link)

          await wait()

          expect(requestSpy).toHaveBeenCalledWith(jasmine.objectContaining(preload: true))

      describe 'aborting', ->

        it 'is not abortable by default', asyncSpec (next) ->
          link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          next ->
            expect(up.network.isBusy()).toBe(true)

            up.fragment.abort()

          next ->
            expect(up.network.isBusy()).toBe(true)

        it 'is abortable with { abortable: true }', ->
          link = fixture('a[href="/path"][up-target=".target"]')
          preloadJob = up.link.preload(link, abortable: true)

          await wait()

          expect(up.network.isBusy()).toBe(true)

          up.fragment.abort()

          await expectAsync(preloadJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(up.network.isBusy()).toBe(false)

        it 'does not abort other requests for the same target', ->
          link1 = fixture('a[href="/path1"][up-target=".target"]')
          link2 = fixture('a[href="/path2"][up-target=".target"]')

          up.link.follow(link1)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          preloadJob = up.link.preload(link2)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)

    describe 'up.deferred.load()', ->

      it 'loads a partial that deferred loading to the user with [up-defer="manual"]', ->
        partial = fixture('a#slow[href="/slow-path"][up-defer="manual"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(0)

        up.deferred.load(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

        jasmine.respondWithSelector('#slow', text: 'partial content')

        await wait()

        expect('#slow').toHaveText('partial content')

      it 'returns an up.RenderJob that resolves with the render pass'

  describe 'unobtrusive behavior', ->

    describe 'a[up-target]', ->

      it 'does not follow a form with up-target attribute (bugfix)', asyncSpec (next) ->
        $form = $fixture('form[up-target]')
        up.hello($form)
        followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($form)

        next =>
          expect(followSpy).not.toHaveBeenCalled()

      it 'requests the [href] with AJAX and replaces the [up-target] selector', asyncSpec (next) ->
        $fixture('.target')
        $link = $fixture('a[href="/path"][up-target=".target"]')
        Trigger.clickSequence($link)

        next =>
          @respondWith('<div class="target">new text</div>')

        next =>
          expect('.target').toHaveText('new text')


      it 'adds a history entry', asyncSpec (next) ->
        up.history.config.enabled = true
        up.fragment.config.navigateOptions.history = true

        $fixture('.target')
        $link = $fixture('a[href="/new-path"][up-target=".target"]')
        Trigger.clickSequence($link)

        next =>
          @respondWith('<div class="target">new text</div>')

        next.after 1000, =>
          expect('.target').toHaveText('new text')
          expect(location.pathname).toEqual('/new-path')

      it 'respects a X-Up-Location header that the server sends in case of a redirect', asyncSpec (next) ->
        up.history.config.enabled = true

        $fixture('.target')
        $link = $fixture('a[href="/path"][up-target=".target"][up-history]')
        Trigger.clickSequence($link)

        next =>
          @respondWith
            responseText: '<div class="target">new text</div>'
            responseHeaders: { 'X-Up-Location': '/other/path' }

        next =>
          expect('.target').toHaveText('new text')
          expect(location.pathname).toEqual('/other/path')

      describe 'caching', ->

        it 'instantly shows cached content', ->
          fixture('#target', text: 'initial target')
          up.request('/path', target: '#target', cache: true)

          await wait()

          jasmine.respondWithSelector('#target', text: 'cached target')

          await wait()

          expect(url: '/path', target: '#target').toBeCached()

          link = fixture('a[href="/path"][up-target="#target"][up-revalidate="false"]')

          Trigger.clickSequence(link)

          await wait()

          expect('#target').toHaveText('cached target')
          expect(up.network.isBusy()).toBe(false)

        it 'revalidates cached content', ->
          fixture('#target', text: 'initial target')
          up.request('/path', target: '#target', cache: true)

          await wait()

          jasmine.respondWithSelector('#target', text: 'cached target')

          await wait()

          expect(url: '/path', target: '#target').toBeCached()

          link = fixture('a[href="/path"][up-target="#target"][up-revalidate="true"]')

          Trigger.clickSequence(link)

          await wait()

          expect('#target').toHaveText('cached target')
          expect(up.network.isBusy()).toBe(true)
          expect(jasmine.lastRequest().url).toMatchURL('/path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#target')

          jasmine.respondWithSelector('#target', text: 'revalidated target')

          await wait()

          expect('#target').toHaveText('revalidated target')
          expect(up.network.isBusy()).toBe(false)

        it 'revalidates cached content including hungry fragments (E2E)', ->
          fixture('#target', text: 'initial target')
          fixture('#hungry[up-hungry]', text: 'initial hungry')

          up.request('/path', target: '#target', cache: true)

          await wait()

          jasmine.respondWith """
            <div id="target">cached target</div>
            <div id="hungry">cached hungry</div>
          """

          await wait()

          expect(url: '/path', target: '#target').toBeCached()

          link = fixture('a[href="/path"][up-target="#target"][up-revalidate="true"]')

          Trigger.clickSequence(link)

          await wait()

          expect('#target').toHaveText('cached target')
          expect('#hungry').toHaveText('cached hungry')
          expect(up.network.isBusy()).toBe(true)
          expect(jasmine.lastRequest().url).toMatchURL('/path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#target, #hungry')

          jasmine.respondWith """
            <div id="target">revalidated target</div>
            <div id="hungry">revalidated hungry</div>
          """

          await wait()

          expect('#target').toHaveText('revalidated target')
          expect('#hungry').toHaveText('revalidated hungry')
          expect(up.network.isBusy()).toBe(false)

      describe 'choice of target layer', ->

        beforeEach ->
          up.motion.config.enabled = false

        it 'updates a target in the same layer as the clicked link', asyncSpec (next) ->
          $fixture('.document').affix('.target').text('old document text')
          up.layer.open(fragment: "<div class='target'>old modal text</div>")

          next =>
            expect('.document .target').toHaveText('old document text')
            expect('up-modal .target').toHaveText('old modal text')

            $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"]').text('link label')
            Trigger.clickSequence($linkInModal)

          next =>
            @respondWith '<div class="target">new text from modal link</div>'

          next =>
            expect('.document .target').toHaveText('old document text')
            expect('up-modal .target').toHaveText('new text from modal link')

        describe 'with [up-layer] modifier', ->

          beforeEach ->
            up.motion.config.enabled = false

          it 'allows to name a layer for the update', asyncSpec (next) ->
            $fixture('.document').affix('.target').text('old document text')
            up.layer.open(fragment: "<div class='target'>old modal text</div>")

            next =>
              expect('.document .target').toHaveText('old document text')
              expect('up-modal .target').toHaveText('old modal text')

              $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-layer="parent"][up-peel="false"]')
              Trigger.clickSequence($linkInModal)

            next =>
              @respondWith '<div class="target">new text from modal link</div>'

            next =>
              expect('.document .target').toHaveText('new text from modal link')
              expect('up-modal .target').toHaveText('old modal text')

          it 'ignores [up-layer] if the server responds with an error', asyncSpec (next) ->
            $fixture('.document').affix('.target').text('old document text')
            up.layer.open(fragment: "<div class='target'>old modal text</div>")

            next =>
              expect('.document .target').toHaveText('old document text')
              expect('up-modal .target').toHaveText('old modal text')

              $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-fail-target=".target"][up-layer="parent"][up-peel="false"]')
              Trigger.clickSequence($linkInModal)

            next =>
              @respondWith
                responseText: '<div class="target">new failure text from modal link</div>'
                status: 500

            next =>
              expect('.document .target').toHaveText('old document text')
              expect('up-modal .target').toHaveText('new failure text from modal link')

          it 'allows to name a layer for a non-200 response using an [up-fail-layer] modifier', asyncSpec (next) ->
            $fixture('.document').affix('.target').text('old document text')
            up.layer.open(fragment: "<div class='target'>old modal text</div>")

            next =>
              expect('.document .target').toHaveText('old document text')
              expect('up-modal .target').toHaveText('old modal text')

              $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-fail-target=".target"][up-fail-layer="parent"][up-fail-peel="false"]')
              Trigger.clickSequence($linkInModal)

            next =>
              @respondWith
                responseText: '<div class="target">new failure text from modal link</div>'
                status: 500

            next =>
              expect('.document .target').toHaveText('new failure text from modal link')
              expect('up-modal .target').toHaveText('old modal text')

          it 'does not crash when targeting and revalidating cached content in the parent layer (bugfix)', ->
            up.motion.config.enabled = true
            up.layer.config.modal.closeAnimation = 'fade-out'

            fixture('main', text: 'old main')
            up.navigate('main', url: '/page')

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWithSelector('main', text: 'new main')

            await wait()

            expect('main').toHaveText('new main')
            expect(target: 'main', url: '/page').toBeCached()

            up.layer.open(target: '#overlay', content: '<a id="overlay-link" up-layer="parent" href="/page">link label</a>')

            expect(up.layer.isOverlay()).toBe(true)

            up.cache.expire()
            Trigger.clickSequence('#overlay-link')

            await wait()

            expect(up.layer.isOverlay()).toBe(false)

            expect(jasmine.Ajax.requests.count()).toBe(2)
            jasmine.respondWithSelector('main', text: 'revalidated main')

            await wait()

            expect('main').toHaveText('revalidated main')

          describe 'with [up-layer=new]', ->

            it 'opens the target in a new overlay', ->
              link = fixture('a[href="/overlay"][up-layer=new][up-target="#content"]')
              Trigger.clickSequence(link)

              await wait()

              jasmine.respondWithSelector('#content', text: ' overlay content')

              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveText('overlay content')

            it 'focus the new overlay, but hides the focus ring when the link is activated with the mouse', ->
              up.specUtil.assertTabFocused()

              link = fixture('a[href="/overlay"][up-layer=new][up-target="#content"]')
              Trigger.clickSequence(link)

              await wait()

              jasmine.respondWithSelector('#content', text:' overlay content')

              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current.getFocusElement()).toHaveFocus()
              expect(up.layer.current.getFocusElement()).not.toHaveOutline()

            it 'shows the focus ring for the new overlay when the link is activated with the keyboard', ->
              up.specUtil.assertTabFocused()

              link = fixture('a[href="/overlay"][up-layer=new][up-target="#content"]', text: 'link')

              await wait()

              Trigger.clickLinkWithKeyboard(link)

              await wait()

              jasmine.respondWithSelector('#content', text:' overlay content')

              await wait(0)

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current.getFocusElement()).toHaveFocus()
              expect(up.layer.current.getFocusElement()).toHaveOutline()

            it 'opens a failed response in a new overlay with [up-fail-layer="new"]', ->
              link = fixture('a[href="/overlay"][up-target="#content"][up-fail-target="#content"][up-fail-layer="new"]')
              Trigger.clickSequence(link)

              await wait()

              jasmine.respondWithSelector('#content', text: ' overlay content', status: 422)

              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveText('overlay content')

      describe 'with [up-focus] modifier', ->

        beforeEach(up.specUtil.assertTabFocused)

        it 'focuses the given selector', ->
          fixture('div#focus')
          fixture('#target', text: 'old content')
          link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('#target', text:' new content')

          await wait()

          expect('#target').toHaveText('new content')
          expect('#focus').toHaveFocus()

        it 'hides the focus ring when the link is activated with the mouse', ->
          fixture('div#focus')
          fixture('#target', text: 'old content')
          link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('#target', text:' new content')

          await wait()

          expect('#focus').toHaveFocus()
          expect('#focus').not.toHaveOutline()

        it 'shows the focus ring when the link is activated with the keyboard', ->
          fixture('div#focus', text: 'focus')
          fixture('#target', text: 'old content')
          link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
          Trigger.clickLinkWithKeyboard(link)

          await wait()

          jasmine.respondWithSelector('#target', text:' new content')

          await wait(1000)

          expect('#focus').toHaveFocus()
          expect('#focus').toHaveOutline()

        it 'shows the focus ring when the link is activated with the mouse and the focused element is an input', ->
          form = fixture('form')
          e.affix(form, 'input#focus[name="email"]')
          fixture('#target', text: 'old content')
          link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('#target', text:' new content')

          await wait()

          expect('#focus').toHaveFocus()
          expect('#focus').toHaveOutline()

      describe 'with [up-fail-target] modifier', ->

        beforeEach ->
          $fixture('.success-target').text('old success text')
          $fixture('.failure-target').text('old failure text')
          @$link = $fixture('a[href="/path"][up-target=".success-target"][up-fail-target=".failure-target"]')

        it 'uses the [up-fail-target] selector for a failed response', asyncSpec (next) ->
          Trigger.clickSequence(@$link)

          next =>
            @respondWith('<div class="failure-target">new failure text</div>', status: 500)

          next =>
            expect('.success-target').toHaveText('old success text')
            expect('.failure-target').toHaveText('new failure text')

            # Since there isn't anyone who could handle the rejection inside
            # the event handler, our handler mutes the rejection.
            # Jasmine will fail if there are unhandled promise rejections


        it 'uses the [up-target] selector for a successful response', asyncSpec (next) ->
          Trigger.clickSequence(@$link)

          next =>
            @respondWith('<div class="success-target">new success text</div>', status: 200)

          next =>
            expect('.success-target').toHaveText('new success text')
            expect('.failure-target').toHaveText('old failure text')

      describe 'with [up-transition] modifier', ->

        it 'morphs between the old and new target element', asyncSpec (next) ->
          fixture('.target.old')
          link = fixture('a[href="/path"][up-target=".target"][up-transition="cross-fade"][up-duration="600"][up-easing="linear"]')
          Trigger.clickSequence(link)

          next =>
            jasmine.respondWith '<div class="target new">new text</div>'

          next =>
            @oldGhost = document.querySelector('.target.old')
            @newGhost = document.querySelector('.target.new')
            expect(@oldGhost).toBeAttached()
            expect(@newGhost).toBeAttached()
            expect(@oldGhost).toHaveOpacity(1, 0.15)
            expect(@newGhost).toHaveOpacity(0, 0.15)

          next.after 300, =>
            expect(@oldGhost).toHaveOpacity(0.5, 0.15)
            expect(@newGhost).toHaveOpacity(0.5, 0.15)

        it 'does not crash when updating a main element (fix for issue #187)', asyncSpec (next) ->
          fixture('main.target.old')
          link = fixture('a[href="/path"][up-target="main"][up-transition="cross-fade"][up-duration="600"]')
          Trigger.clickSequence(link)

          next ->
            jasmine.respondWith '<main class="target new">new text</main>'

          next.after 300, ->
            oldGhost = document.querySelector('main.target.old')
            newGhost = document.querySelector('main.target.new')
            expect(oldGhost).toBeAttached()
            expect(newGhost).toBeAttached()
            expect(oldGhost).toHaveOpacity(0.5, 0.45)
            expect(newGhost).toHaveOpacity(0.5, 0.45)

          next.after 600, ->
            expect(document).toHaveSelector('main.target.new')
            expect(document).not.toHaveSelector('main.target.old')

        it 'does not crash when updating an element that is being transitioned', asyncSpec (next) ->
          $fixture('.target.old', text: 'text 1')
          $link = $fixture('a[href="/path"][up-target=".target"][up-transition="cross-fade"][up-duration="600"][up-easing="linear"]')
          Trigger.clickSequence($link)

          next =>
            jasmine.respondWith('<div class="target">text 2</div>')

          next =>
            expect('.target.old').toBeAttached()
            expect('.target.old').toHaveOpacity(1, 0.15)
            expect('.target.old').toHaveText('text 1')

            expect('.target:not(.old)').toBeAttached()
            expect('.target:not(.old)').toHaveOpacity(0, 0.15)
            expect('.target:not(.old)').toHaveText('text 2')

            up.render('.target', content: 'text 3')

          next.after 300, =>
            expect('.target.old').toHaveOpacity(0.5, 0.15)
            expect('.target.old').toHaveText('text 1')

            expect('.target:not(.old)').toHaveOpacity(0.5, 0.15)
            expect('.target:not(.old)').toHaveText('text 3')

        # https://github.com/unpoly/unpoly/issues/439
        it 'does not leave a `transform` CSS property once the transition finishes, as to not affect the positioning of child elements', ->
          element = fixture('.target.old', text: 'v1')
          link = fixture('a[href="/path"][up-target=".target"][up-transition="move-left"][up-duration="10"]')

          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('.target.new', text: 'v2')

          await wait(50)

          newElement = document.querySelector('.target')
          expect(newElement).toHaveText('v2')
          expect(newElement.style.transform).toBeBlank()


      describe 'wih a CSS selector in the [up-fallback] attribute', ->

        it 'uses the fallback selector if the [up-target] CSS does not exist on the page', asyncSpec (next) ->
          $fixture('.fallback').text('old fallback')
          $link = $fixture('a[href="/path"][up-target=".target"][up-fallback=".fallback"]')
          Trigger.clickSequence($link)

          next =>
            @respondWith """
              <div class="target">new target</div>
              <div class="fallback">new fallback</div>
            """

          next =>
            expect('.fallback').toHaveText('new fallback')

        it 'ignores the fallback selector if the [up-target] CSS exists on the page', asyncSpec (next) ->
          $fixture('.target').text('old target')
          $fixture('.fallback').text('old fallback')
          $link = $fixture('a[href="/path"][up-target=".target"][up-fallback=".fallback"]')
          Trigger.clickSequence($link)

          next =>
            @respondWith """
              <div class="target">new target</div>
              <div class="fallback">new fallback</div>
            """

          next =>
            expect('.target').toHaveText('new target')
            expect('.fallback').toHaveText('old fallback')

      describe 'with [up-content] modifier', ->

        it 'updates a fragment with the given inner HTML string', ->
          target = fixture('.target', text: 'old content')
          link = up.hello(fixture('a[up-target=".target"][up-content="new content"]'))

          Trigger.clickSequence(link)
          await wait()

          expect('.target').toHaveText('new content')

        it 'gives the link a pointer cursor', ->
          target = fixture('.target', text: 'old content')
          link = up.hello(fixture('a[up-target=".target"][up-content="new content"]'))

          expect(link).toHaveCursorStyle('pointer')

        it 'enables keyboard interaction for the link', ->
          target = fixture('.target', text: 'old content')
          link = up.hello(fixture('a[up-target=".target"][up-content="new content"]'))

          expect(link).toBeKeyboardFocusable()

          Trigger.clickLinkWithKeyboard(link)
          await wait()

          expect('.target').toHaveText('new content')

        it 'updates a fragment with the given inner HTML string when the element also has an [href="#"] attribute (bugfix)', asyncSpec (next) ->
          target = fixture('.target', text: 'old content')
          link = fixture('a[href="#"][up-target=".target"][up-content="new content"]')

          Trigger.clickSequence(link)

          next ->
            expect('.target').toHaveText('new content')

        it "removes the target's inner HTML with [up-content='']", asyncSpec (next) ->
          target = fixture('.target', text: 'old content')
          link = fixture('a[up-target=".target"][up-content=""]')

          Trigger.clickSequence(link)

          next ->
            expect(document.querySelector('.target').innerHTML).toBe('')

      it 'does not add a history entry when replacing a main target but the up-history attribute is set to "false"', asyncSpec (next) ->
        up.history.config.enabled = true
        up.layer.config.any.mainTargets = ['.target']

        oldPathname = location.pathname
        $fixture('.target')
        $link = $fixture('a[href="/path"][up-target=".target"][up-history="false"]')
        Trigger.clickSequence($link)

        next =>
          @respondWith
            responseText: '<div class="target">new text</div>'
            responseHeaders: { 'X-Up-Location': '/other/path' }

        next =>
          expect('.target').toHaveText('new text')
          expect(location.pathname).toEqual(oldPathname)

    describe '[up-follow]', ->

      it "calls up.follow with the clicked link", ->
        link = fixture('a[href="/follow-path"][up-follow]')
        followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(link)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()

      it 'follows a link with [up-follow=true]', ->
        link = fixture('a[href="/follow-path"][up-follow=true]')
        followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(link)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()

      it 'follows a link that is immediately removed after clicking', ->
        fixture('#main')
        link = fixture('a[href="/follow-path"][up-follow=true][up-target="#main"]')

        Trigger.clickSequence(link)
        link.remove()

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector('#main', text: 'link content')

        await wait()

        expect('#main').toHaveText('link content')

      describe 'when the server reponds with an error', ->

        it 'updates the [up-fail-target] instead'

        it 'updates a main target if no [up-fail-target] is given'

        it 'updates the [up-fail-target] if the link is immediately removed after clicking', ->
          fixture('#success', text: 'initial content')
          fixture('#failure', text: 'initial content')
          link = fixture('a[href="/follow-path"][up-follow=true][up-target="#success"][up-fail-target="#failure"]')

          Trigger.clickSequence(link)
          link.remove()

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWithSelector('#failure', text: 'link content', status: 422)

          await wait()

          expect('#success').toHaveText('initial content')
          expect('#failure').toHaveText('link content')

      describe 'exemptions from following', ->

        it 'never follows a link with [download] (which opens a save-as-dialog)', asyncSpec (next) ->
          link = up.hello fixture('a[href="/path"][up-target=".target"][download]')

          Trigger.click(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)
            expect(link).toHaveBeenDefaultFollowed()

        it 'never preloads a link with a [target] attribute (which updates a frame or opens a tab)', asyncSpec (next) ->
          link = up.hello fixture('a[href="/path"][up-target=".target"][target="_blank"]')

          Trigger.click(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)
            expect(link).toHaveBeenDefaultFollowed()

        it 'never follows an a[href="#"]', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          link = up.hello fixture('a[href="#"][up-target=".target"]')
          clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.click(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()
            expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)

        it 'never follows a link with a "mailto:..." [href] attribute', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          link = up.hello fixture('a[href="mailto:foo@bar.com"]')

          Trigger.click(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'never follows a link with a "tel:..." [href] attribute', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          link = up.hello fixture('a[href="tel:+49123456"]')

          Trigger.click(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'never follows a link with a "whatsapp://..." attribute', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          link = up.hello fixture('a[href="whatsapp://send?text=Hello"]')

          Trigger.click(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'does follow an a[href="#"] if the link also has local content via an [up-content], [up-fragment] or [up-document] attribute', asyncSpec (next) ->
          target = fixture('.target', text: 'old text')
          link = up.hello fixture('a[href="#"][up-target=".target"][up-content="new text"]')

          Trigger.clickSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)
            expect(link).not.toHaveBeenDefaultFollowed()
            expect('.target').toHaveText('new text')

        it 'does nothing if the right mouse button is used', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(@$link, button: 2)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).toHaveBeenDefaultFollowed()

        it 'does nothing if shift is pressed during the click', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(@$link, shiftKey: true)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).toHaveBeenDefaultFollowed()

        it 'does nothing if ctrl is pressed during the click', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(@$link, ctrlKey: true)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).toHaveBeenDefaultFollowed()

        it 'does nothing if meta is pressed during the click', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(@$link, metaKey: true)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).toHaveBeenDefaultFollowed()

        it 'does nothing if a listener prevents the up:click event on the link', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(@$link, 'up:click', (event) -> event.preventDefault())

          Trigger.click(@$link)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).not.toHaveBeenDefaultFollowed()

        it 'does nothing if a listener prevents the click event on the link', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(@$link, 'click', (event) -> event.preventDefault())

          Trigger.click(@$link)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).not.toHaveBeenDefaultFollowed()

      describe 'handling of up.link.config.followSelectors', ->

        it 'follows matching links even without [up-follow] or [up-target]', asyncSpec (next) ->
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          link = fixture('a[href="/foo"].link')
          up.link.config.followSelectors.push('.link')

          Trigger.click(link)

          next =>
            expect(@followSpy).toHaveBeenCalled()
            expect(link).not.toHaveBeenDefaultFollowed()

        it 'allows to opt out with [up-follow=false]', asyncSpec (next) ->
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          link = fixture('a[href="/foo"][up-follow="false"].link')
          up.link.config.followSelectors.push('.link')

          Trigger.click(link)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

      describe 'with [up-instant] modifier', ->

        it 'follows a link on mousedown (instead of on click)', ->
          link = fixture('a[href="/follow-path"][up-follow][up-instant]')
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(link)

          expect(followSpy.calls.mostRecent().args[0]).toEqual(link)

        it 'follows a link on mousedown with [up-instant=true]', ->
          link = fixture('a[href="/follow-path"][up-follow][up-instant]')
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(link)

          expect(followSpy.calls.mostRecent().args[0]).toEqual(link)

        it 'does nothing on mouseup', asyncSpec (next)->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mouseup(@$link)

          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing on click if there was an earlier mousedown event', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(@$link)
          Trigger.click(@$link)

          next => expect(@followSpy.calls.count()).toBe(1)

        it 'does follow a link on click if there was never a mousedown event (e.g. if the user pressed enter)', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(@$link)

          next => expect(@followSpy.calls.mostRecent().args[0]).toEqual(@$link[0])

        it 'does nothing if the right mouse button is pressed down', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(@$link, button: 2)

          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if shift is pressed during mousedown', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(@$link, shiftKey: true)

          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if ctrl is pressed during mousedown', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(@$link, ctrlKey: true)

          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if meta is pressed during mousedown', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(@$link, metaKey: true)

          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if a listener prevents the up:click event on the link', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(@$link, 'up:click', (event) -> event.preventDefault())

          Trigger.mousedown(@$link)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).not.toHaveBeenDefaultFollowed()

        it 'does nothing if a listener prevents the mousedown event on the link', asyncSpec (next) ->
          @$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(@$link, 'mousedown', (event) -> event.preventDefault())

          Trigger.mousedown(@$link)

          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).not.toHaveBeenDefaultFollowed()

        it 'fires a click event on an a[href="#"] link that will be handled by the browser', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          link = up.hello fixture('a[href="#"][up-instant][up-target=".target"]')

          clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()

            expect(clickListener).toHaveBeenCalled()
            expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)

        it 'follows a[onclick] links on click instead of mousedown', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          link = up.hello fixture('a[href="/foo"][onclick="console.log(\'clicked\')"][up-instant][up-target=".target"]')

          Trigger.mousedown(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()

            Trigger.click(link)

          next ->
            expect(followSpy).toHaveBeenCalled()

        it 'does not fire a click event on an a[href="#"] link that also has local HTML in [up-content], [up-fragment] or [up-document]', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          # In reality the user will have configured an overly greedy selector like
          # up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          # not break all their "javascript:" links.
          link = up.hello fixture('a[href="#"][up-instant][up-target=".target"][up-content="new content"]')
          fixture('.target')

          clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)

          next ->
            expect(followSpy).toHaveBeenCalled()

            expect(clickListener).not.toHaveBeenCalled()
            expect(link).not.toHaveBeenDefaultFollowed()

        it 'fires a click event on an a[href="#hash"] link that will be handled by the browser', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          # In reality the user will have configured an overly greedy selector like
          # up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          # not break all their #anchor link.s
          link = up.hello fixture('a[href="#details"][up-instant]')

          clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()

            expect(clickListener).toHaveBeenCalled()
            expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)

        it 'fires a click event on an a[href="javascript:..."] link that will be handled by the browser', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          # In reality the user will have configured an overly greedy selector like
          # up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          # not break all their "javascript:" links.
          link = up.hello fixture('a[href="javascript:console.log(\'hi world\')"][up-instant]')

          clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()

            expect(clickListener).toHaveBeenCalled()
            expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)

        it 'fires a click event on a cross-origin link that will be handled by the browser', asyncSpec (next) ->
          followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          # In reality the user will have configured an overly greedy selector like
          # up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          # not break all their "javascript:" links.
          link = up.hello fixture('a[href="http://other-site.tld/path"][up-instant]')

          clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)

          next ->
            expect(followSpy).not.toHaveBeenCalled()

            expect(clickListener).toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        describe 'focus', ->

          beforeEach(up.specUtil.assertTabFocused)

          it 'focused the link after the click sequence (like a vanilla link)', ->
            followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            link = up.hello fixture('a[href="/path"][up-follow][up-instant]')

            Trigger.clickSequence(link, focus: false)

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()

          it 'hides a focus ring when activated with the mouse', ->
            followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            link = up.hello fixture('a[href="/path"][up-follow][up-instant]')
            Trigger.clickSequence(link, focus: false)

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()

            expect(link).not.toHaveOutline()

          it 'shows a focus ring when activated with a non-pointing device (keyboard or unknown)', ->
            followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            link = up.hello fixture('a[href="/path"][up-follow][up-instant]')
            Trigger.clickLinkWithKeyboard(link)

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()

            expect(link).toHaveOutline()

          it 'hides the focus ring when activated with the mouse, then shows the focus ring when activated with the keyboard', ->
            followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            link = up.hello fixture('a[href="/path"][up-follow][up-instant]')

            Trigger.clickSequence(link, focus: false)
            expect(followSpy.calls.count()).toBe(1)
            expect(link).not.toHaveOutline()

            Trigger.clickLinkWithKeyboard(link)
            expect(followSpy.calls.count()).toBe(2)
            expect(link).toHaveOutline()

          describe 'handling of up.link.config.instantSelectors', ->

            it 'follows matching links without an [up-instant] attribute', asyncSpec (next) ->
              @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              link = fixture('a[up-follow][href="/foo"].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              next =>
                expect(@followSpy).toHaveBeenCalled()

            it 'allows individual links to opt out with [up-instant=false]', ->
              followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              link = fixture('a[up-follow][href="/foo"][up-instant=false].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              await wait()

              expect(followSpy).not.toHaveBeenCalled()

            it 'allows to configure exceptions in up.link.config.noInstantSelectors', ->
              up.link.config.instantSelectors.push('.include')
              up.link.config.noInstantSelectors.push('.exclude')
              followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              link = fixture('a.include.exclude[up-follow][href="/foo"]')

              Trigger.mousedown(link)

              await wait()

              expect(followSpy).not.toHaveBeenCalled()

            it 'allows individual links to opt out of all Unpoly link handling with [up-follow=false]', asyncSpec (next) ->
              @followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              link = fixture('a[up-follow][href="/foo"][up-follow=false].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              next =>
                expect(@followSpy).not.toHaveBeenCalled()


      describe 'with [up-preview] modifier', ->

        it 'shows a preview effect while the link is loading', ->
          target = fixture('#target', text: 'old target')
          spinnerContainer = fixture('#other')

          up.preview 'my:preview', (preview) ->
            preview.insert(spinnerContainer, '<div id="spinner"></div>')

          link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-preview="my:preview"]', text: 'label')

          expect(spinnerContainer).not.toHaveSelector('#spinner')

          Trigger.clickSequence(link)
          await wait()

          expect(spinnerContainer).toHaveSelector('#spinner')

          jasmine.respondWithSelector('#target', text: 'new target')
          await wait()

          expect(spinnerContainer).not.toHaveSelector('#spinner')

      describe 'with [up-skeleton] modifier', ->

        it 'shows a UI skeleton while the link is loading', ->
          fixture('#target', content: '<p>old target</p>')
          link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-skeleton="<p>skeleton</p>"]', text: 'label')
          expect('#target').toHaveVisibleText('old target')

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveVisibleText('skeleton')

          jasmine.respondWithSelector('#target', content: '<p>new target</p>')
          await wait()

          expect('#target').toHaveVisibleText('new target')

      describe 'following non-interactive elements with [up-href]', ->

        it 'makes any element behave like an [up-follow] link', ->
          link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)
          fixture('.target', text: 'old text')

          Trigger.click(link)
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

          jasmine.respondWithSelector('.target', text: 'new text')
          await wait()

          expect('.target').toHaveText('new text')

        it 'gives the element a pointer cursor', ->
          link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)

          expect(link).toHaveCursorStyle('pointer')

        it 'gives the element a [role=link] so screen readers announce it as interactive', ->
          link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)

          expect(link.role).toBe('link')

        it 'enables keyboard interaction for the element', ->
          link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)
          fixture('.target', text: 'old text')

          expect(link).toBeKeyboardFocusable()

          Trigger.clickLinkWithKeyboard(link)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

          jasmine.respondWithSelector('.target', text: 'new text')
          await wait()

          expect('.target').toHaveText('new text')

      describe '[up-href] without [up-follow]', ->
        if up.migrate.loaded

          it 'is made followable', ->
            fauxLink = up.hello(fixture('span[up-href="/path"]'))
            expect(fauxLink).toBeFollowable()

          it 'is keyboard focusable', ->
            fauxLink = up.hello(fixture('span[up-href="/path"]'))
            expect(fauxLink).toBeKeyboardFocusable()

        else

          it 'is not followable', ->
            fauxLink = up.hello(fixture('span[up-href="/path"]'))
            expect(fauxLink).not.toBeFollowable()

          it 'gets no pointer cursor', ->
            fauxLink = up.hello(fixture('span[up-href="/path"]'))
            expect(fauxLink).toHaveCursorStyle('auto')

          it 'is not keyboard focusable', ->
            fauxLink = up.hello(fixture('span[up-href="/path"]'))
            expect(fauxLink).not.toBeKeyboardFocusable()

    if up.migrate.loaded

      describe '[up-dash]', ->

        it "is a shortcut for [up-preload], [up-instant] and [up-target], using [up-dash]'s value as [up-target]", ->
          $link = $fixture('a[href="/path"][up-dash=".target"]').text('label')
          up.hello($link)
          expect($link.attr('up-preload')).toEqual('')
          expect($link.attr('up-instant')).toEqual('')
          expect($link.attr('up-target')).toEqual('.target')

        it 'sets [up-follow] instead of [up-target] if no target is given (bugfix)', ->
          link = fixture('a[href="/path"][up-dash]', text: 'label')
          up.hello(link)

          expect(link).not.toHaveAttribute('up-target')
          expect(link).toHaveAttribute('up-follow')

  #      it "adds [up-follow] attribute if [up-dash]'s value is 'true'", ->
  #        $link = $fixture('a[href="/path"][up-dash="true"]').text('label')
  #        up.hello($link)
  #        expect($link.attr('up-follow')).toEqual('')
  #
  #      it "adds [up-follow] attribute if [up-dash] is present, but has no value", ->
  #        $link = $fixture('a[href="/path"][up-dash]').text('label')
  #        up.hello($link)
  #        expect($link.attr('up-follow')).toEqual('')
  #
  #      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-target] is present", ->
  #        $link = $fixture('a[href="/path"][up-dash="true"][up-target=".target"]').text('label')
  #        up.hello($link)
  #        expect($link.attr('up-follow')).toBeMissing()
  #        expect($link.attr('up-target')).toEqual('.target')
  #
  #      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-modal] is present", ->
  #        $link = $fixture('a[href="/path"][up-dash="true"][up-modal=".target"]').text('label')
  #        up.hello($link)
  #        expect($link.attr('up-follow')).toBeMissing()
  #        expect($link.attr('up-modal')).toEqual('.target')
  #
  #      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-popup] is present", ->
  #        $link = $fixture('a[href="/path"][up-dash="true"][up-popup=".target"]').text('label')
  #        up.hello($link)
  #        expect($link.attr('up-follow')).toBeMissing()
  #        expect($link.attr('up-popup')).toEqual('.target')

        it "removes the [up-dash] attribute when it's done", ->
          $link = $fixture('a[href="/path"]').text('label')
          up.hello($link)
          expect($link.attr('up-dash')).toBeMissing()

    describe '[up-expand]', ->

      it 'makes the element followable to the same destination as the first contained link', ->
        up.fragment.config.mainTargets = ['main']
        fixture('main', text: 'old text')
        area = fixture('div[up-expand] a[href="/path"]')
        up.hello(area)

        expect(area).toBeFollowable()

        Trigger.clickSequence(area)

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('main')

        jasmine.respondWithSelector('main', text: 'new text')

        await wait()

        expect('main').toHaveText('new text')

      it 'is not keyboard-accessible, as screen readers will already announce the contained link', ->
        area = fixture('div[up-expand]')
        link = e.affix(area, 'a[href="/path1"]')
        up.hello(area)

        expect(area).not.toBeKeyboardFocusable()
        expect(area.role).toBeBlank()

      it 'has a pointer cursor for visually abled mouse users', ->
        area = fixture('div[up-expand]')
        link = e.affix(area, 'a[href="/path1"]')
        up.hello(area)

        expect(area).toHaveCursorStyle('pointer')

      it 'does not enlarge an area with [up-expand=false]', ->
        area = fixture('div[up-expand=false] a[href="/path"]')
        up.hello(area)

        expect(area).not.toBeFollowable()

      it 'copies up-related attributes of a contained link', ->
        $area = $fixture('div[up-expand] a[href="/path"][up-target="selector"][up-instant][up-preload]')
        up.hello($area)
        expect($area.attr('up-target')).toEqual('selector')
        expect($area.attr('up-instant')).toEqual('')
        expect($area.attr('up-preload')).toEqual('')

      it "renames a contained link's [href] attribute to [up-href] so the container is considered a link", ->
        $area = $fixture('div[up-expand] a[up-follow][href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')

      it 'copies attributes from the first link if there are multiple links', ->
        $area = $fixture('div[up-expand]')
        $link1 = $area.affix('a[href="/path1"]')
        $link2 = $area.affix('a[href="/path2"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path1')

      it "copies an contained non-link element with [up-href] attribute", ->
        $area = $fixture('div[up-expand] span[up-follow][up-href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')

      it 'can be used to enlarge the click area of a link', asyncSpec (next) ->
        $area = $fixture('div[up-expand] a[href="/path"]')
        up.hello($area)
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        Trigger.clickSequence($area)
        next =>
          expect(up.render).toHaveBeenCalled()

      it 'does nothing when the user clicks another link in the expanded area', asyncSpec (next) ->
        $area = $fixture('div[up-expand]')
        $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        $otherLink = $area.affix('a[href="/other-path"][up-follow]')
        up.hello($area)
        followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($otherLink)
        next =>
          expect(followSpy.calls.count()).toEqual(1)
          expect(followSpy.calls.mostRecent().args[0]).toEqual($otherLink[0])

      it 'does nothing when the user clicks on an input in the expanded area', asyncSpec (next) ->
        $area = $fixture('div[up-expand]')
        $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        $input = $area.affix('input[name=email][type=text]')
        up.hello($area)
        followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($input)
        next =>
          expect(followSpy).not.toHaveBeenCalled()

      it 'does not trigger multiple replaces when the user clicks on the expanded area of an [up-instant] link (bugfix)', asyncSpec (next) ->
        $area = $fixture('div[up-expand] a[href="/path"][up-follow][up-instant]')
        up.hello($area)
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        Trigger.clickSequence($area)
        next =>
          expect(up.render.calls.count()).toEqual(1)

      if up.migrate.loaded
        it 'makes the expanded area followable if the expanded link is [up-dash] with a selector (bugfix)', ->
          $area = $fixture('div[up-expand] a[href="/path"][up-dash=".element"]')
          up.hello($area)
          expect($area).toBeFollowable()
          expect($area.attr('up-target')).toEqual('.element')

        it 'makes the expanded area followable if the expanded link is [up-dash] without a selector (bugfix)', ->
          $area = $fixture('div[up-expand] a[href="/path"][up-dash]')
          up.hello($area)
          expect($area).toBeFollowable()

      describe 'with a CSS selector in the property value', ->

        it "expands the contained link that matches the selector", ->
          $area = $fixture('div[up-expand=".second"]')
          $link1 = $area.affix('a.first[href="/path1"]')
          $link2 = $area.affix('a.second[href="/path2"]')
          up.hello($area)
          expect($area.attr('up-href')).toEqual('/path2')

        it 'does nothing if no contained link matches the selector', ->
          $area = $fixture('div[up-expand=".foo"]')
          $link = $area.affix('a[href="/path1"]')
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()

        it 'does not match an element that is not a descendant', ->
          $area = $fixture('div[up-expand=".second"]')
          $link1 = $area.affix('a.first[href="/path1"]')
          $link2 = $fixture('a.second[href="/path2"]') # not a child of $area
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()

    describe '[up-preload]', ->

      it 'preloads the link destination when hovering, after a delay', ->
        up.link.config.preloadDelay = 100

        fixture('.target', text: 'old text')

        link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello(link)

        Trigger.hoverSequence(link)

        await wait(50)

        # It's still too early
        expect(jasmine.Ajax.requests.count()).toEqual(0)

        await wait(75)

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/foo')
        expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

        jasmine.respondWith """
          <div class="target">
            new text
          </div>
          """

        await wait()
        # We only preloaded, so the target isn't replaced yet.

        expect('.target').toHaveText('old text')

        Trigger.clickSequence(link)

        await wait()

        # No additional request has been sent since we already preloaded
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        # The target is replaced instantly
        expect('.target').toHaveText('new text')

      it 'does not send a request if the user stops hovering before the delay is over', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.hoverSequence($link)

        next.after 40, =>
          # It's still too early
          expect(jasmine.Ajax.requests.count()).toEqual(0)

          Trigger.unhoverSequence($link)

        next.after 90, =>
          expect(jasmine.Ajax.requests.count()).toEqual(0)

      it 'does not send a request if the link was destroyed before the delay is over', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        fixture('.target', text: 'old text')

        link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello(link)

        Trigger.hoverSequence(link)

        next.after 40, =>
          # It's still too early
          expect(jasmine.Ajax.requests.count()).toEqual(0)

          up.destroy(link)

        next.after 90, =>
          expect(jasmine.Ajax.requests.count()).toEqual(0)
          # Jasmine will fail if there are unhandled promise rejections

      it 'aborts a preload request if the user stops hovering before the response was received', asyncSpec (next) ->
        up.link.config.preloadDelay = 10
        $fixture('.target').text('old text')
        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)
        abortListener = jasmine.createSpy('up:request:aborted listener')
        up.on('up:request:aborted', abortListener)

        Trigger.hoverSequence($link)

        next.after 50, ->
          expect(abortListener).not.toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          Trigger.unhoverSequence($link)

        next.after 50, ->
          expect(abortListener).toHaveBeenCalled()

      it 'does not abort a request if the user followed the link while it was preloading, and then stopped hovering', asyncSpec (next) ->
        up.link.config.preloadDelay = 10
        $fixture('.target').text('old text')
        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)
        abortListener = jasmine.createSpy('up:request:aborted listener')
        up.on('up:request:aborted', abortListener)

        Trigger.hoverSequence($link)

        next.after 50, ->
          expect(abortListener).not.toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          Trigger.click($link)

        next ->
          expect(abortListener).not.toHaveBeenCalled()

          Trigger.unhoverSequence($link)

        next ->
          expect(abortListener).not.toHaveBeenCalled()

      it 'preloads the link destination on touchstart (without delay)', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.touchstart($link)

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().url).toMatchURL('/foo')
          expect(@lastRequest()).toHaveRequestMethod('GET')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

          @respondWith """
            <div class="target">
              new text
            </div>
            """

        next =>
          # We only preloaded, so the target isn't replaced yet.
          expect('.target').toHaveText('old text')

          Trigger.click($link)

        next =>
          # No additional request has been sent since we already preloaded
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          # The target is replaced instantly
          expect('.target').toHaveText('new text')

      it 'registers the touchstart callback as a passive event listener', ->
        fixture('.target')
        link = fixture('a[href="/foo"][up-target=".target"][up-preload]')

        spyOn(link, 'addEventListener')

        up.hello(link)

        expect(link.addEventListener).toHaveBeenCalledWith('touchstart', jasmine.any(Function), { passive: true })

      it 'preloads the link destination on mousedown (without delay)', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.mousedown($link)

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().url).toMatchURL('/foo')
          expect(@lastRequest()).toHaveRequestMethod('GET')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

          @respondWith """
            <div class="target">
              new text
            </div>
            """

        next =>
          # We only preloaded, so the target isn't replaced yet.
          expect('.target').toHaveText('old text')

          Trigger.click($link)

        next =>
          # No additional request has been sent since we already preloaded
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          # The target is replaced instantly
          expect('.target').toHaveText('new text')

      describe 'caching', ->

        it 'caches the preloaded content', ->
          up.link.config.preloadDelay = 0

          fixture('.target', text: 'old text')

          link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
          up.hello(link)
          cacheEntry = { url: '/foo' }

          await wait()

          expect(cacheEntry).not.toBeCached()

          Trigger.hoverSequence(link)

          await wait(30)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(cacheEntry).toBeCachedWithoutResponse()

          jasmine.respondWith('<div class="target">new text</div>')

          await wait()

          expect(cacheEntry).toBeCachedWithResponse(text: '<div class="target">new text</div>')

        it 'does not cache a failed response', ->
          up.link.config.preloadDelay = 0

          fixture('.target', text: 'old text')

          link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
          up.hello(link)

          Trigger.hoverSequence(link)

          await wait(30)

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          jasmine.respondWith
            status: 500
            responseText: """
              <div class="target">
                new text
              </div>
              """

          await wait()

          # We only preloaded, so the target isn't replaced yet.
          expect('.target').toHaveText('old text')

          Trigger.click(link)

          await wait()

          # Since the preloading failed, we send another request
          expect(jasmine.Ajax.requests.count()).toEqual(2)

          # Since there isn't anyone who could handle the rejection inside
          # the event handler, our handler mutes the rejection.
          # Jasmine will fail if there are unhandled promise rejections

        describe 'when the link destination is already cached', ->

          it 'does not send a request if the link destination is already cached', ->
            up.link.config.preloadDelay = 0

            await jasmine.populateCache('/destination', '<div class="target">new text</div>')

            expect(jasmine.Ajax.requests.count()).toEqual(1)

            fixture('.target', text: 'old text')

            link = fixture('a[href="/destination"][up-target=".target"][up-preload]')
            up.hello(link)

            await wait()

            Trigger.hoverSequence(link)

            await wait(30)

            # No additional request was sent
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(up.network.isBusy()).toBe(false)

          it 'waits for revalidation of stale content until the link is clicked', ->
            up.link.config.preloadDelay = 0

            # Create an expired cache entry
            cacheEntry = { url: '/destination' }
            await jasmine.populateCache(cacheEntry, '<div class="target">new text</div>')
            up.cache.expire(cacheEntry)
            expect(cacheEntry).toBeCached()
            expect(cacheEntry).toBeExpired()
            expect(jasmine.Ajax.requests.count()).toEqual(1)

            fixture('.target', text: 'old text')

            link = fixture('a[href="/destination"][up-target=".target"][up-preload]')
            up.hello(link)

            await wait()

            Trigger.hoverSequence(link)

            await wait(30)

            # No revalidation request was sent
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(up.network.isBusy()).toBe(false)

            Trigger.clickSequence(link)
            await wait()

            # The stale content is rendered immediately
            expect('.target').toHaveText('new text')

            # Now that the link is clicked we're revalidating
            expect(jasmine.Ajax.requests.count()).toEqual(2)
            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWith('<div class="target">revalidated text</div>')

            await wait()

            expect('.target').toHaveText('revalidated text')

            expect(cacheEntry).toBeCached()
            expect(cacheEntry).not.toBeExpired()

      describe 'exemptions from preloading', ->

        beforeEach ->
          up.link.config.preloadDelay = 0
          $fixture('.target')

        it "never preloads a link with an unsafe method", asyncSpec (next) ->
          link = up.hello fixture('a[href="/path"][up-target=".target"][up-preload][data-method="post"]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it 'never preloads a link that has been marked with [up-cache=false]', asyncSpec (next) ->
          link = up.hello fixture('a[href="/no-auto-caching-path"][up-cache=false]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it 'never preloads a link that does not auto-cache', asyncSpec (next) ->
          up.network.config.autoCache = (request) ->
            expect(request).toEqual jasmine.any(up.Request)
            return request.url != '/no-auto-caching-path'

          link = up.hello fixture('a[href="/no-auto-caching-path"][up-preload][up-target=".target"]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it "never preloads a link with cross-origin [href]", asyncSpec (next) ->
          link = up.hello fixture('a[href="https://other-domain.com/path"][up-preload][up-target=".target"]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it 'never preloads a link with [download] (which opens a save-as-dialog)', asyncSpec (next) ->
          link = up.hello fixture('a[href="/path"][up-target=".target"][up-preload][download]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it 'never preloads a link with a [target] attribute (which updates a frame or opens a tab)', asyncSpec (next) ->
          link = up.hello fixture('a[href="/path"][up-target=".target"][up-preload][target="_blank"]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it 'never preloads a link with [href="#"]', asyncSpec (next) ->
          link = up.hello fixture('a[href="#"][up-preload]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it 'never preloads a link with local content via [up-content]', asyncSpec (next) ->
          fixture('.target', text: 'old text')
          link = up.hello fixture('a[up-preload][up-content="new text"][up-target=".target"]')

          Trigger.hoverSequence(link)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

            Trigger.clickSequence(link)

          next ->
            expect('.target').toHaveText('new text')

        describeFallback 'canPushState', ->

          it "does not preload a link", asyncSpec (next) ->
            fixture('.target')
            link = up.hello fixture('a[href="/path"][up-target=".target"][up-preload]')

            Trigger.hoverSequence(link)

            next ->
              expect(jasmine.Ajax.requests.count()).toBe(0)

      describe 'handling of up.link.config.preloadSelectors', ->

        beforeEach ->
          up.link.config.preloadDelay = 0

        it 'preload matching links without an [up-preload] attribute', asyncSpec (next) ->
          up.link.config.preloadSelectors.push('.link')
          link = fixture('a[up-follow][href="/foo"].link')
          up.hello(link)

          Trigger.hoverSequence(link)
          next ->
            expect(jasmine.Ajax.requests.count()).toEqual(1)

        it 'allows individual links to opt out with [up-preload=false]', ->
          up.link.config.preloadSelectors.push('.link')
          link = fixture('a[up-follow][href="/foo"][up-preload=false].link')
          up.hello(link)

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)

        it 'allows to configure exceptions in up.link.config.noPreloadSelectors', ->
          up.link.config.preloadSelectors.push('.include')
          up.link.config.noPreloadSelectors.push('.exclude')
          link = fixture('a.include.exclude[up-follow][href="/foo"]')
          up.hello(link)

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)

        it 'allows individual links to opt out of all Unpoly link handling with [up-follow=false]', asyncSpec (next) ->
          up.link.config.preloadSelectors.push('.link')
          link = fixture('a[up-follow][href="/foo"][up-follow=false].link')
          up.hello(link)

          Trigger.hoverSequence(link)
          next ->
            expect(jasmine.Ajax.requests.count()).toEqual(0)

      describe 'defining when to preload', ->

        describe "with [up-preload=insert]", ->

          it 'preloads the link as soon as it is inserted into the DOM', ->
            link = fixture('a[href="/foo"][up-follow][up-preload="insert"]', text: 'label')
            up.hello(link)

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')

        describe "with [up-preload=reveal]", ->

          # MutationObserver does not fire within a task
          MUTATION_OBSERVER_LAG = 30

          it 'preloads the link when it is scrolled into the document viewport', ->
            before = fixture('#before', text: 'before', style: 'height: 50000px')

            link = fixture('a[href="/foo"][up-follow][up-preload="reveal"]', text: 'label')
            up.hello(link)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            link.scrollIntoView()

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')

          it 'immediately preloads that link that is already visible within the document viewport', ->
            link = fixture('a[href="/foo"][up-follow][up-preload="reveal"]', text: 'label')
            up.hello(link)

            # MutationObserver has a delay even for the initial intersection check.
            # We have additional code in place to call it synchronously during compilation,
            # so we don't get a "flash of empty partial" when the content is already cached.
            await wait(0)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')

          it 'only sends a single request as the link enters and leaves the viewport repeatedly', ->
            before = fixture('#before', text: 'before', style: 'height: 50000px')

            link = fixture('a[href="/foo"][up-follow][up-preload="reveal"]', text: 'label')
            up.hello(link)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            link.scrollIntoView()

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)

            # Abort the request so we can observe whether another request will be sent.
            up.network.abort()
            await wait(MUTATION_OBSERVER_LAG)

            document.scrollingElement.scrollTop = 0
            await wait(MUTATION_OBSERVER_LAG)
            link.scrollIntoView()
            await wait(MUTATION_OBSERVER_LAG)

            # No additional request was sent
            expect(jasmine.Ajax.requests.count()).toEqual(1)

          it 'detects visibility for a link in an element with scroll overflow', ->
            viewport = fixture('#viewport', style: 'height: 500px; width: 300px; overflow-y: scroll')
            before = e.affix(viewport, '#before', text: 'before', style: 'height: 50000px')

            link = e.affix(viewport, 'a[href="/foo"][up-follow][up-preload="reveal"]', text: 'label')
            up.hello(link)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            link.scrollIntoView()

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)

        describe "with [up-preload=hover]", ->

          it 'preloads the link when the user hovers over it for a while (default)', ->
            up.link.config.preloadDelay = 20

            fixture('.target', text: 'old text')

            link = fixture('a[href="/foo"][up-target=".target"][up-preload="hover"]')
            up.hello(link)

            Trigger.hoverSequence(link)

            await wait(60)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')
            expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

        describe "with [up-preload=true]", ->

          it 'preloads the link when the user hovers over it for a while (default)', ->
            up.link.config.preloadDelay = 20

            fixture('.target', text: 'old text')

            link = fixture('a[href="/foo"][up-target=".target"][up-preload="true"]')
            up.hello(link)

            Trigger.hoverSequence(link)

            await wait(60)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')
            expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')


    describe '[up-defer]', ->

      it 'loads a partial in a new request and replaces itself', ->
        partial = fixture('a#slow[up-defer][href="/slow-path"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

        jasmine.respondWithSelector('#slow', text: 'partial content')

        await wait()

        expect('#slow').toHaveText('partial content')

      it 'loads a partial in a new request and replaces a selector from [up-target] attribute', ->
        target = fixture('#target', text: 'old target')
        partial = fixture('a#slow[up-defer][href="/slow-path"][up-target="#target"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#target')

        jasmine.respondWithSelector('#target', text: 'new target')

        await wait()

        expect('#target').toHaveText('new target')

      describe 'progress bar', ->

        it 'makes a foreground request by default', ->
          partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          event = await jasmine.nextEvent('up:request:load')

          expect(event.request.background).not.toBe(true)

        it 'makes a background request with [up-background=true]', ->
          partial = fixture('a#slow[up-defer][href="/slow-path"][up-background=true]')
          up.hello(partial)

          event = await jasmine.nextEvent('up:request:load')

          expect(event.request.background).toBe(true)

      it 'does not update history, even when targeting an auto-history-target', ->
        up.history.config.enabled = true
        up.fragment.config.autoHistoryTargets.unshift('#slow')
        up.history.replace('/original-path')

        expect(up.history.location).toMatchURL('/original-path')

        partial = fixture('a#slow[up-defer][href="/slow-path"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        jasmine.respondWithSelector('#slow', text: 'partial content')

        await wait()

        expect('#slow').toHaveText('partial content')
        expect(up.history.location).toMatchURL('/original-path')

      it 'aborts loading the deferred when another render pass targets the link container', ->
        container = fixture('#container')
        partial = e.affix(container, 'a#slow[up-defer][href="/slow-path"]', text: 'initial content')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

        up.fragment.abort(container)

        await wait()

        expect(up.network.isBusy()).toBe(false)
        expect('#slow').toHaveText('initial content')

      it 'does not update the main element if the response has no matching elements', ->
        up.fragment.config.mainTargets = ['#main']
        fixture('#main', text: 'old main content')

        partial = fixture('a#partial[up-defer][href="/partial-path"]', text: 'old partial content')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/partial-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#partial')

        await jasmine.expectGlobalError 'up.CannotMatch', ->
          # Server unexpectedly responds with #main instead of #partial
          jasmine.respondWithSelector('#main', text: 'new main content')

          # For some reason we need to wait a second task to be able to observe the global error.
          await jasmine.waitTasks(2)

        expect('#partial').toHaveText('old partial content')
        expect('#main').toHaveText('old main content')

      describe 'on a non-interactive element', ->

        it 'works on a div[up-href][up-defer]', ->
          partial = fixture('div#slow[up-defer][up-href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', text: 'partial content')

          await wait()

          expect('#slow').toHaveText('partial content')

        it 'does not have a pointer cursor from an [up-href] attribute', ->
          partial = fixture('span#slow[up-defer=manual][up-href="/slow-path"]')
          up.hello(partial)

          expect(partial).not.toHaveCursorStyle('pointer')

      describe 'when the URL is already cached', ->

        it 'does not show a flash of unloaded partial and immediately renders the cached content', ->
          await jasmine.populateCache('/slow-path', '<div id="partial">partial content</div>')

          partial = fixture('a#partial[up-defer][href="/slow-path"]')
          up.hello(partial)

          # Rendering from cached content happens after a chain of microtasks.
          # We do not know the length of that chain. We only care that happens before the next paint.
          await jasmine.waitMicrotasks(5)

          expect('div#partial').toHaveText('partial content')

          await wait()

          # No additional request was made
          expect(up.network.isBusy()).toBe(false)

        it 'revalidates the cached content', ->
          up.network.config.cacheExpireAge = 5
          await jasmine.populateCache('/slow-path', '<div id="partial">cached partial</div>')

          # Let the cache entry expire
          await wait(30)
          expect(up.cache.get({ url: '/slow-path' }).response.expired).toBe(true)

          partial = fixture('a#partial[up-defer][href="/slow-path"]')
          up.hello(partial)

          # Rendering from cached content happens after a chain of microtasks.
          # We do not know the length of that chain. We only care that happens before the next paint.
          await jasmine.waitMicrotasks(5)

          expect('div#partial').toHaveText('cached partial')

          await wait()

          expect(up.network.isBusy()).toBe(true)
          jasmine.respondWith('<div id="partial">revalidated partial</div>')

          await wait()

          expect('div#partial').toHaveText('revalidated partial')

        it 'does not use the cache with [up-cache=false]', ->
          await jasmine.populateCache('/slow-path', '<div id="partial">partial content</div>')

          partial = fixture('a#partial[up-defer][href="/slow-path"][up-cache="false"]', text: 'initial content')
          up.hello(partial)

          await wait()

          expect('#partial').toHaveText('initial content')
          expect(up.network.isBusy()).toBe(true)

          jasmine.respondWithSelector('#partial', text: 'fresh content')

          await wait()

          expect('div#partial').toHaveText('fresh content')
          expect(up.network.isBusy()).toBe(false)

      describe 'multiple partials in a single render pass', ->

        it 'makes a single request with merged targets to the same URL', ->
          container = fixture('#container')
          e.affix(container, 'a#partial1[up-defer][href="/slow-path"]')
          e.affix(container, 'a#partial2[up-defer][href="/slow-path"]')
          up.hello(container)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#partial1, #partial2')

          jasmine.respondWith """
            <div id="partial1">partial1 content</div>
            <div id="partial2">partial2 content</div>
          """

          await wait()

          expect('#partial1').toHaveText('partial1 content')
          expect('#partial2').toHaveText('partial2 content')

        it 'makes separate requests to different URLs', ->
          container = fixture('#container')
          e.affix(container, 'a#partial1[up-defer][href="/partial1-path"]')
          e.affix(container, 'a#partial2[up-defer][href="/partial2-path"]')
          up.hello(container)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(2)
          expect(jasmine.Ajax.requests.at(0).url).toMatchURL('/partial1-path')
          expect(jasmine.Ajax.requests.at(0).requestHeaders['X-Up-Target']).toBe('#partial1')
          expect(jasmine.Ajax.requests.at(1).url).toMatchURL('/partial2-path')
          expect(jasmine.Ajax.requests.at(1).requestHeaders['X-Up-Target']).toBe('#partial2')

          jasmine.Ajax.requests.at(0).respondWith(responseText: '<div id="partial1">partial1 content</div>')
          jasmine.Ajax.requests.at(1).respondWith(responseText: '<div id="partial2">partial2 content</div>')

          await wait()

          expect('#partial1').toHaveText('partial1 content')
          expect('#partial2').toHaveText('partial2 content')

      describe 'navigation feedback', ->

        it 'receives an .up-active class while loading', ->
          partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect('#slow').toHaveClass('up-active')

          jasmine.respondWithSelector('#slow', text: 'partial content')

          await wait()

          expect('#slow').toHaveText('partial content')
          expect('#slow').not.toHaveClass('up-active')

        it 'receives no .up-active class with [up-feedback=false]', ->
          partial = fixture('a#slow[up-defer][href="/slow-path"][up-feedback="false"]')
          up.hello(partial)

          await wait()

          expect('#slow').not.toHaveClass('up-active')

      describe "with [up-defer=insert]", ->

        it 'loads the partial as soon as it is inserted into the DOM (default)', ->
          partial = fixture('a#slow[up-defer="insert"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', text: 'partial content')

          await wait()

          expect('#slow').toHaveText('partial content')

      describe "with [up-defer=true]", ->

        it 'loads the partial as soon as it is inserted into the DOM (default)', ->
          partial = fixture('a#slow[up-defer="true"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', text: 'partial content')

          await wait()

          expect('#slow').toHaveText('partial content')

      describe "with [up-defer=reveal]", ->

        # MutationObserver does not fire within a task
        MUTATION_OBSERVER_LAG = 30

        it 'loads the partial when it is scrolled into the document viewport', ->
          before = fixture('#before', text: 'before', style: 'height: 50000px')
          partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]')
          up.hello(partial)

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(0)

          partial.scrollIntoView()

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          jasmine.respondWithSelector('#slow', text: 'partial content')

          await wait()

          expect('#slow').toHaveText('partial content')

        it 'immediately loads a partial that is already visible within the document viewport', ->
          partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]')
          up.hello(partial)

          # MutationObserver has a delay even for the initial intersection check.
          # We have additional code in place to call it synchronously during compilation,
          # so we don't get a "flash of empty partial" when the content is already cached.
          await wait(0)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', text: 'partial content')

          await wait()

          expect('#slow').toHaveText('partial content')

        describe 'with [up-intersect-margin]', ->

          it 'allows to load the partial earlier with a positive [up-intersect-margin]', ->
            beforeHeight = 50_000
            clientHeight = up.viewport.rootHeight()
            partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]',
              text: 'label',
              style: "position: absolute; top: #{beforeHeight}px; height: 100px; background-color: green;",
              'up-intersect-margin': '20'
            )
            up.hello(partial)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            up.viewport.root.scrollTop = beforeHeight - clientHeight - 10

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)

          it 'immediately honors the [up-intersect-margin] if the element is already in the viewport', ->
            clientHeight = up.viewport.rootHeight()
            partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]',
              text: 'label',
              style: "position: absolute; top: #{clientHeight + 10}px; height: 100px; background-color: green;",
              'up-intersect-margin': '20'
            )
            up.hello(partial)

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)

          it 'allows to load the partial later with a negative [up-intersect-margin]', ->
            beforeHeight = 50_000
            clientHeight = up.viewport.rootHeight()
            partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]',
              text: 'label',
              style: "position: absolute; top: #{beforeHeight}px; height: 100px; background-color: green;",
              'up-intersect-margin': '-20'
            )
            up.hello(partial)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            up.viewport.root.scrollTop = beforeHeight - clientHeight + 10

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            up.viewport.root.scrollTop = beforeHeight - clientHeight + 30

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)

        it 'only sends a single request as the partial enters and leaves the viewport repeatedly', ->
          before = fixture('#before', text: 'before', style: 'height: 50000px')

          partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]')
          up.hello(partial)

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(0)

          partial.scrollIntoView()

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          # Abort the request so we can observe whether another request will be sent.
          up.network.abort()
          await wait(MUTATION_OBSERVER_LAG)

          document.scrollingElement.scrollTop = 0
          await wait(MUTATION_OBSERVER_LAG)
          partial.scrollIntoView()
          await wait(MUTATION_OBSERVER_LAG)

          # No additional request was sent
          expect(jasmine.Ajax.requests.count()).toEqual(1)

        it 'detects visibility for a partial in an element with scroll overflow', ->
          viewport = fixture('#viewport', style: 'height: 500px; width: 300px; overflow-y: scroll')
          before = e.affix(viewport, '#before', text: 'before', style: 'height: 50000px')

          partial = e.affix(viewport, 'a#slow[up-defer="reveal"][href="/slow-path"]', text: 'label')
          up.hello(partial)

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(0)

          partial.scrollIntoView()

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(1)

      describe "with [up-defer=manual]", ->

        it 'does not load the partial by default', ->
          partial = fixture('a#slow[up-defer="manual"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)

      describe "with [up-defer=false]", ->

        it 'does not load the partial by default', ->
          partial = fixture('a#slow[up-defer="false"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)

      describe 'with [up-preview]', ->

        it 'shows previews while the deferred is loading', ->
          undoFn = jasmine.createSpy('apply preview')
          previewFn = jasmine.createSpy('apply preview').and.returnValue(undoFn)
          up.preview('my:preview', previewFn)

          partial = fixture('a#partial[up-defer="manual"][href="/slow-path"][up-preview="my:preview"]', text: 'old text')
          up.hello(partial)

          await wait()

          expect('#partial').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toEqual(0)
          expect(previewFn).not.toHaveBeenCalled()

          up.deferred.load(partial)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(previewFn).toHaveBeenCalledWith(jasmine.objectContaining(fragment: partial))
          expect(undoFn).not.toHaveBeenCalled()

          jasmine.respondWithSelector('#partial', text: 'new text')
          await wait()

          expect(undoFn).toHaveBeenCalled()
          expect('#partial').toHaveText('new text')

        it 'shows previews when merging selectors into a single request', ->
          undo1Fn = jasmine.createSpy('preview1 undo fn')
          preview1Fn = jasmine.createSpy('preview1 apply fn').and.returnValue(undo1Fn)
          up.preview('preview1', preview1Fn)
          undo2Fn = jasmine.createSpy('preview2 undo fn')
          preview2Fn = jasmine.createSpy('preview2 apply fn').and.returnValue(undo2Fn)
          up.preview('preview2', preview2Fn)

          container = fixture('#container')
          partial1 = e.affix(container, 'a#partial1[up-defer="manual"][href="/slow-path"][up-preview="preview1"]')
          partial2 = e.affix(container, 'a#partial2[up-defer="manual"][href="/slow-path"][up-preview="preview2"]')
          up.hello(container)

          await wait()

          expect(preview1Fn).not.toHaveBeenCalled()
          expect(preview2Fn).not.toHaveBeenCalled()

          up.deferred.load(partial1)
          up.deferred.load(partial2)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#partial1, #partial2')
          expect(preview1Fn).toHaveBeenCalledWith(jasmine.objectContaining(fragment: partial1))
          expect(preview2Fn).toHaveBeenCalledWith(jasmine.objectContaining(fragment: partial2))
          expect(undo1Fn).not.toHaveBeenCalled()
          expect(undo2Fn).not.toHaveBeenCalled()

          jasmine.respondWith """
            <div id="partial1">partial1 content</div>
            <div id="partial2">partial2 content</div>
          """

          await wait()

          expect('#partial1').toHaveText('partial1 content')
          expect('#partial2').toHaveText('partial2 content')
          expect(undo1Fn).toHaveBeenCalled()
          expect(undo2Fn).toHaveBeenCalled()

      describe 'with [up-skeleton]', ->

        it 'shows a skeleton while the deferred is loading', ->
          partial = fixture('a#partial[up-defer="manual"][href="/slow-path"][up-skeleton="<span>skeleton text</span>"]', text: 'initial text')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)
          expect('#partial').toHaveVisibleText('initial text')

          up.deferred.load(partial)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect('#partial').toHaveVisibleText('skeleton text')

          jasmine.respondWithSelector('#partial', text: 'new text')
          await wait()

          expect('#partial').toHaveVisibleText('new text')

      describe 'up:deferred:load event', ->

        it 'emits an up:deferred:load event before hitting the network', ->
          listener = jasmine.createSpy('up:deferred:load listener').and.callFake ->
            expect(jasmine.Ajax.requests.count()).toEqual(0)
          up.on('up:deferred:load', listener)

          partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(listener).toHaveBeenCalled()

        it 'does not load the partial when up:deferred:load is prevented', ->
          listener = jasmine.createSpy('up:deferred:load listener').and.callFake (event) ->
            event.preventDefault()
          up.on('up:deferred:load', listener)

          partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(0)

        it 'allows listener to change render options', ->
          listener = jasmine.createSpy('up:deferred:load listener').and.callFake (event) ->
            event.renderOptions.url = '/other-path'
            event.renderOptions.target = '#other'

          up.on('up:deferred:load', listener)

          fixture('#other')
          partial = fixture('a#slow[up-defer][href="/slow-path"]', text: 'initial content')
          up.hello(partial)

          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/other-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#other')

          jasmine.respondWithSelector('#other', text: 'partial content')

          await wait()

          expect('#slow').toHaveText('initial content')
          expect('#other').toHaveText('partial content')

    describe 'up:click', ->

      describe 'on a link that is not [up-instant]', ->

        it 'emits an up:click event on click', ->
          link = fixture('a[href="/path"]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()

        it 'does not crash with a synthetic click event that may not have all properties defined (bugfix)', ->
          link = fixture('a[href="/path"]', text: 'label')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          event = new Event('click', { bubbles: true, cancelable: true })
          link.dispatchEvent(event)

          expect(listener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()

        it 'prevents the click event when the up:click event is prevented', ->
          clickEvent = null
          link = fixture('a[href="/path"]')
          link.addEventListener('click', (event) -> clickEvent = event)
          link.addEventListener('up:click', (event) -> event.preventDefault())
          Trigger.click(link)
          expect(clickEvent.defaultPrevented).toBe(true)

        it 'does not emit an up:click event if an element has covered the click coordinates on mousedown, which would cause browsers to create a click event on body', asyncSpec (next) ->
          link = fixture('a[href="/path"]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          link.addEventListener('mousedown', ->
            up.layer.open(mode: 'cover', content: 'cover text')
          )
          Trigger.mousedown(link)

          next ->
            expect(up.layer.mode).toBe('cover')
            Trigger.click(link)

          next ->
            expect(listener).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'emits an up:click event when an element within a popup overlay is clicked with the keyboard', ->
          anchor = fixture('span', text: 'label')
          layer = await up.layer.open({ mode: 'popup', text: 'initial text', origin: anchor })
          link = layer.affix('a[href="/path"]', text: 'label')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          await wait()

          expect(link).toHaveBeenDefaultFollowed()
          expect(listener).toHaveBeenCalled()

        it 'does not emit an up:click event if the right mouse button is used', asyncSpec (next) ->
          link = fixture('a[href="/path"]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, button: 2)
          next ->
            expect(listener).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'does not emit an up:click event if shift is pressed during the click', asyncSpec (next) ->
          link = fixture('a[href="/path"]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, shiftKey: true)
          next ->
            expect(listener).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'does not emit an up:click event if ctrl is pressed during the click', asyncSpec (next) ->
          link = fixture('a[href="/path"]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, ctrlKey: true)
          next ->
            expect(listener).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'does not emit an up:click event if meta is pressed during the click', asyncSpec (next) ->
          link = fixture('a[href="/path"]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, metaKey: true)
          next ->
            expect(listener).not.toHaveBeenCalled()
            expect(link).toHaveBeenDefaultFollowed()

        it 'emits a prevented up:click event if the click was already prevented', asyncSpec (next) ->
          link = fixture('a[href="/path"]')
          link.addEventListener('click', (event) -> event.preventDefault())
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
          expect(listener.calls.argsFor(0)[0].defaultPrevented).toBe(true)

      describe 'on a link that is [up-instant]', ->

        it 'emits an up:click event on mousedown', ->
          link = fixture('a[href="/path"][up-instant]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.mousedown(link)
          expect(listener).toHaveBeenCalled()

        it 'does not emit an up:click event on click if there was an earlier mousedown event that was default-prevented', ->
          link = fixture('a[href="/path"][up-instant]')
          listener = jasmine.createSpy('up:click listener')
          Trigger.mousedown(link)
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).not.toHaveBeenCalled()

        it 'prevents a click event if there was an earlier mousedown event that was converted to an up:click', ->
          link = fixture('a[href="/path"][up-instant]')
          clickListener = jasmine.createSpy('click listener')
          link.addEventListener('click', clickListener)
          Trigger.mousedown(link)
          Trigger.click(link)
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(true)

        it 'does not emit multiple up:click events in a click sequence', ->
          link = fixture('a[href="/path"][up-instant]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.clickSequence(link)
          expect(listener.calls.count()).toBe(1)

        it "does emit an up:click event on click if there was an earlier mousedown event that was not default-prevented (happens when the user CTRL+clicks and Unpoly won't follow)", ->
          link = fixture('a[href="/path"][up-instant]')
          listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.mousedown(link)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()

        it 'does emit an up:click event if there was a click without mousedown (happens when a link is activated with the Enter key)', ->
          link = fixture('a[href="/path"][up-instant]')
          listener = jasmine.createSpy('up:click listener').and.callFake (event) ->
            # With unpoly-migrate.js this would a followable link. We don't want to follow in this test.
            event.preventDefault()
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()

        it 'prevents the mousedown event when the up:click event is prevented', ->
          mousedownEvent = null
          link = fixture('a[href="/path"][up-instant]')
          link.addEventListener('mousedown', (event) -> mousedownEvent = event)
          link.addEventListener('up:click', (event) -> event.preventDefault())
          Trigger.mousedown(link)
          expect(mousedownEvent.defaultPrevented).toBe(true)

      describe 'on a non-interactive element that is not [up-instant]', ->

        it 'emits an up:click event on click', ->
          div = fixture('div')
          listener = jasmine.createSpy('up:click listener')
          div.addEventListener('up:click', listener)
          Trigger.click(div)
          expect(listener).toHaveBeenCalled()

        it 'does not emit an up:click event on ANY element if the user has dragged away between mousedown and mouseup', ->
          div = fixture('div')
          other = fixture('div')
          listener = jasmine.createSpy('up:click listener')
          up.on('up:click', listener) # use up.on() instead of addEventListener(), since up.on() cleans up after each test
          Trigger.mousedown(other)
          Trigger.mouseup(div)
          Trigger.click(document.body) # this is the behavior of Chrome and Firefox
          expect(listener).not.toHaveBeenCalled()

        it 'prevents the click event when the up:click event is prevented', ->
          clickEvent = null
          div = fixture('div')
          div.addEventListener('click', (event) -> clickEvent = event)
          div.addEventListener('up:click', (event) -> event.preventDefault())
          Trigger.click(div)
          expect(clickEvent.defaultPrevented).toBe(true)

      describe 'on a non-interactive element that is [up-instant]', ->

        it 'emits an up:click event on mousedown', ->
          div = fixture('div[up-instant]')
          listener = jasmine.createSpy('up:click listener')
          div.addEventListener('up:click', listener)
          Trigger.mousedown(div)
          expect(listener).toHaveBeenCalled()

      describe 'on a button[type=submit]', ->

        it 'emits an up:click event on click', ->
          [form, button] = htmlFixtureList """
            <form>
              <button type="submit">label</button>
            </form>
          """
          form.addEventListener('submit', (event) => event.preventDefault())
          buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)

        it 'does not emit up:click if the button is [disabled]', ->
          [form, button] = htmlFixtureList """
            <form>
              <button type="submit" disabled>label</button>
            </form>
          """
          form.addEventListener('submit', (event) => event.preventDefault())
          listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)

      describe 'on a button[type=button]', ->

        it 'emits an up:click event on click', ->
          [form, button] = htmlFixtureList """
            <form>
              <button type="button">label</button>
            </form>
          """
          buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)

        it 'does not emit up:click if the button is [disabled]', ->
          [form, button] = htmlFixtureList """
            <form>
              <button type="button" disabled>label</button>
            </form>
          """
          listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)

      describe 'on a input[type=submit]', ->

        it 'emits an up:click event on click', ->
          [form, button] = htmlFixtureList """
            <form>
              <input type="submit">label</input>
            </form>
          """
          form.addEventListener('submit', (event) => event.preventDefault())
          buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)

        it 'does not emit up:click if the button is [disabled]', ->
          [form, button] = htmlFixtureList """
            <form>
              <input type="submit" disabled>label</input>
            </form>
          """
          form.addEventListener('submit', (event) => event.preventDefault())
          listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)

    describe '[up-clickable]', ->

      it 'makes the element emit up:click events on click', ->
        fauxButton = up.hello(fixture('.hyperlink[up-clickable]'))
        clickListener = jasmine.createSpy('up:click listener')
        fauxButton.addEventListener('up:click', clickListener)

        Trigger.clickSequence(fauxButton)

        expect(clickListener.calls.count()).toBe(1)

      it 'makes the element emit up:click events on Enter', ->
        fauxButton = up.hello(fixture('.hyperlink[up-clickable]'))
        clickListener = jasmine.createSpy('up:click listener')
        fauxButton.addEventListener('up:click', clickListener)

        Trigger.keySequence(fauxButton, 'Enter')

        expect(clickListener).toHaveBeenCalled()

      it 'makes the element focusable for keyboard users', ->
        fauxButton = up.hello(fixture('.hyperlink[up-clickable]'))

        expect(fauxButton).toBeKeyboardFocusable()

      it 'gives the element a pointer cursor if it has [up-follow] and hence looks like a link', ->
        fauxButton = up.hello(fixture('.hyperlink[up-clickable][up-follow]'))

        expect(getComputedStyle(fauxButton).cursor).toEqual('pointer')

      it 'gives the element a pointer cursor if it has [role=link] and hence looks like a link', ->
        fauxButton = up.hello(fixture('.hyperlink[up-clickable][role=link]'))

        expect(getComputedStyle(fauxButton).cursor).toEqual('pointer')

      it 'gives the element a default cursor if it does not look like a link', ->
        fauxButton = up.hello(fixture('.hyperlink[up-clickable]'))

        expect(getComputedStyle(fauxButton).cursor).toEqual('auto')

      it 'makes other selectors clickable via up.link.config.clickableSelectors', ->
        up.link.config.clickableSelectors.push('.foo')
        fauxButton = up.hello(fixture('.foo'))

        expect(fauxButton).toBeKeyboardFocusable()
        expect(fauxButton).toHaveAttribute('up-clickable')
        expect(fauxButton.role).toBe('button')

      it 'does not set clickable-related attributes on a form with an [up-target] attribute (bugfix)', ->
        form = fixture('form[method=post][action="/action"][up-target="#target"]')
        up.hello(form)
        expect(form).not.toHaveAttribute('role')
        expect(form).not.toHaveAttribute('up-clickable')

      describe 'when applied on a link (which is already interactive)', ->

        it 'does not set a [role] attribute', ->
          link = up.hello(fixture('a[href="/path"][up-clickable]', text: 'label'))
          expect(link).not.toHaveAttribute('role')

        it 'does not cause duplicate up:click events when activated with the keyboard', ->
          link = up.hello(fixture('a[href="/path"][up-clickable]', text: 'label'))
          listener = jasmine.createSpy('up:click listener').and.callFake((event) -> event.preventDefault())
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          expect(listener.calls.count()).toBe(1)

      describe '[role] attribute', ->

        it 'sets [role=button] on a non-interactive element', ->
          fauxButton = up.hello(fixture('.hyperlink[up-clickable]'))
          expect(fauxButton).toHaveAttribute('role', 'button')

        it 'does not override an existing [role] attribute', ->
          fauxButton = up.hello(fixture('.hyperlink[up-clickable][role="existing-role"]'))
          expect(fauxButton).toHaveAttribute('role', 'existing-role')

        it 'sets [role=link] for an a:not([href]) element, like a[up-content]', ->
          fauxLink = up.hello(fixture('a[up-content="inner"][up-target="#target"]'))
          expect(fauxLink).toHaveAttribute('role', 'link')

        it 'sets [role=link] for an [up-follow][up-href] element', ->
          fauxLink = up.hello(fixture('a[up-follow][up-href="/path"]'))
          expect(fauxLink).toHaveAttribute('role', 'link')

      describe 'with [up-instant]', ->

        it 'emits up:click on mousedown instead of click', ->
          fauxButton = up.hello(fixture('.hyperlink[up-clickable][up-instant]'))
          clickListener = jasmine.createSpy('up:click listener')
          fauxButton.addEventListener('up:click', clickListener)

          Trigger.mousedown(fauxButton)
          expect(clickListener.calls.count()).toBe(1)

          # No additional up:click is emitted
          Trigger.click(fauxButton)
          expect(clickListener.calls.count()).toBe(1)

      describe 'on an element that is already interactive', ->

        it 'does not set attributes on an a[href] element', ->
          realLink = up.hello(fixture('a[href="/path"][up-clickable]'))
          expect(realLink).not.toHaveAttribute('role')
          expect(realLink).not.toHaveAttribute('tabindex')

        it 'does not set attributes on a button element', ->
          realButton = up.hello(fixture('button[up-clickable]'))
          expect(realButton).not.toHaveAttribute('role')
          expect(realButton).not.toHaveAttribute('tabindex')

        it 'does not cause duplicate up:click events when activated with the keyboard', ->
          link = up.hello(fixture('a[href="/path"][up-clickable]', text: 'label'))
          listener = jasmine.createSpy('up:click listener').and.callFake((event) -> event.preventDefault())
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          expect(listener.calls.count()).toBe(1)

    describe 'a[up-disable]', ->

      describe 'without an attribute value', ->

        it 'disables fields of an enclosing form', ->
          fixture('#target', text: 'old text')
          form = fixture('#form')
          input = e.affix(form, 'input[type=next][name=foo]')
          link = e.affix(form, 'a[href="/path"][up-target="#target"][up-disable]', text: 'label')

          Trigger.clickSequence(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).toBeDisabled()

      describe 'with a selector value', ->

        it 'disables fields and buttons within the given selector', ->
          fixture('#target', text: 'old text')
          form = fixture('#form')
          input = e.affix(form, 'input[type=next][name=foo]')
          button = e.affix(form, 'button[type=submit]', text: 'button label')
          link = fixture('a[href="/path"][up-target="#target"][up-disable="#form"]', text: 'label')

          Trigger.clickSequence(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).toBeDisabled()
          expect(button).toBeDisabled()

          jasmine.respondWithSelector('#target', text: 'new text')
          await wait()

          expect('#target').toHaveText('new text')
          expect(input).not.toBeDisabled()
          expect(button).not.toBeDisabled()

