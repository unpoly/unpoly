u = up.util
e = up.element
$ = jQuery

describe 'up.popup', ->
  return

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.popup.attach', ->

      beforeEach ->
        jasmine.addMatchers
          toSitBelow: (util, customEqualityTesters) ->
            compare: ($popup, $link) ->
              popupDims = $popup.get(0).getBoundingClientRect()
              linkDims = $link.get(0).getBoundingClientRect()
              pass:
                Math.abs(popupDims.left - linkDims.left) < 1.0 && Math.abs(popupDims.top - linkDims.bottom) < 1.0

      beforeEach ->
        @restoreBodyHeight = e.setTemporaryStyle(document.body, minHeight: '3000px')

      afterEach ->
        @restoreBodyHeight()

      it "loads this link's destination in a popup positioned under the given link", asyncSpec (next) ->
        $container = $fixture('.container')
        $container.css
          position: 'absolute'
          left: '100px'
          top: '50px'

        $link = $container.affix('a[href="/path/to"][up-popup=".middle"]').text('link')
        up.hello($link)
        up.popup.attach($link)

        next =>
          expect(@lastRequest().url).toMatch /\/path\/to$/
          @respondWith """
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
            """

        next =>
          $popup = $('.up-overlay[up-mode=popup]')
          expect($popup).toBeAttached()
          expect($popup.find('.middle')).toHaveText('new-middle')
          expect($popup.find('.before')).not.toBeAttached()
          expect($popup.find('.after')).not.toBeAttached()
          expect($popup).toSitBelow($link)

      it 'always makes a request for the given selector, and does not "improve" the selector with a fallback', asyncSpec (next) ->
        $container = $fixture('.container')
        $link = $container.affix('a[href="/path/to"][up-popup=".content"]').text('link')
        up.hello($link)
        up.popup.attach($link)
        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          headers = @lastRequest().requestHeaders
          expect(headers['X-Up-Target']).toEqual('.content')

      it 'never resolves the open() promise and shows no error if close() was called before the response was received', asyncSpec (next) ->
        $span = $fixture('span')
        openPromise = up.popup.attach($span, url: '/foo', target: '.container')

        next =>
          up.popup.close()

        next =>
          respond = => @respondWith('<div class="container">text</div>')
          expect(respond).not.toThrowError()

        next.await =>
          expect($('.up-toast')).not.toBeAttached()
          promise = promiseState(openPromise)
          promise.then (result) => expect(result.state).toEqual('pending')

      describe 'with { html } option', ->

        it 'extracts the selector from the given HTML string', asyncSpec (next) ->
          $span = $fixture('span')
          next.await up.popup.attach($span, target: '.container', html: "<div class='container'>container contents</div>")
          next => expect($('.up-overlay[up-mode=popup]')).toHaveText('container contents')

      describe 'opening a popup while another modal is open', ->

        it 'closes the current popup and wait for its close animation to finish before starting the open animation of a second popup', asyncSpec (next) ->
          $span = $fixture('span')
          up.popup.config.openAnimation = 'fade-in'
          up.popup.config.openDuration = 5
          up.popup.config.closeAnimation = 'fade-out'
          up.popup.config.closeDuration = 60

          events = []
          u.each ['up:popup:open', 'up:popup:opened', 'up:popup:close', 'up:popup:closed'], (event) ->
            up.on event, -> events.push(event)

          up.popup.attach($span, { target: '.target', html: '<div class="target">response1</div>' })

          next =>
            # First popup is starting opening animation
            expect(events).toEqual ['up:popup:open']
            expect($('.target')).toHaveText('response1')

          next.after 80, ->
            # First popup has completed opening animation
            expect(events).toEqual ['up:popup:open', 'up:popup:opened']
            expect($('.target')).toHaveText('response1')

            # We open another popup, which will cause the first modal to start closing
            up.popup.attach($span, { target: '.target', html: '<div class="target">response2</div>' })

          next.after 20, ->
            # Second popup is still waiting for first popup's closing animation to finish.
            expect(events).toEqual ['up:popup:open', 'up:popup:opened', 'up:popup:close']
            expect($('.target')).toHaveText('response1')

          next.after 200, ->
            # First popup has finished closing, second popup has finished opening.
            expect(events).toEqual ['up:popup:open', 'up:popup:opened', 'up:popup:close', 'up:popup:closed', 'up:popup:open', 'up:popup:opened']
            expect($('.target')).toHaveText('response2')

    describe 'up.popup.coveredUrl', ->

      describeCapability 'canPushState', ->

        it 'returns the URL behind the popup', asyncSpec (next) ->
          up.history.config.enabled = true
          up.history.replace('/foo')
          expect(up.popup.coveredUrl()).toBeMissing()

          $popupLink = $fixture('a[href="/bar"][up-popup=".container"][up-history="true"]')
          up.hello($popupLink)
          Trigger.clickSequence($popupLink)

          next =>
            @respondWith('<div class="container">text</div>')
            expect(up.popup.coveredUrl()).toMatchURL('/foo')

            next.await up.popup.close()

          next =>
            expect(up.popup.coveredUrl()).toBeMissing()

    describe 'up.popup.close', ->

      it 'should have tests'

    describe 'up.popup.source', ->

      it 'should have tests'

  describe 'unobtrusive behavior', ->

    describe 'a[up-popup]', ->

      beforeEach ->
        @stubAttach = =>
          @$link = $fixture('a[href="/path"][up-popup=".target"]')
          up.hello(@$link)
          @attachSpy = up.popup.knife.mock('attachAsap').and.returnValue(Promise.resolve())

      it 'opens the clicked link in a popup', asyncSpec (next) ->
        @stubAttach()
        Trigger.click(@$link)
        next => expect(@attachSpy).toHaveBeenCalledWith(@$link[0], {})

      # IE does not call JavaScript and always performs the default action on right clicks
      unless AgentDetector.isIE() || AgentDetector.isEdge()
        it 'does nothing if the right mouse button is used', asyncSpec (next) ->
          @stubAttach()
          Trigger.click(@$link, button: 2)
          next => expect(@attachSpy).not.toHaveBeenCalled()

      it 'does nothing if shift is pressed during the click', asyncSpec (next) ->
        @stubAttach()
        Trigger.click(@$link, shiftKey: true)
        next => expect(@attachSpy).not.toHaveBeenCalled()

      it 'does nothing if ctrl is pressed during the click', asyncSpec (next) ->
        @stubAttach()
        Trigger.click(@$link, ctrlKey: true)
        next => expect(@attachSpy).not.toHaveBeenCalled()

      it 'does nothing if meta is pressed during the click', asyncSpec (next) ->
        @stubAttach()
        Trigger.click(@$link, metaKey: true)
        next => expect(@attachSpy).not.toHaveBeenCalled()

      it 'closes an existing popup before opening the new popup', asyncSpec (next) ->
        up.popup.config.openDuration = 0
        up.popup.config.closeDuration = 0

        $link1 = $fixture('a[href="/path1"][up-popup=".target"]')
        up.hello($link1)
        $link2 = $fixture('a[href="/path2"][up-popup=".target"]')
        up.hello($link2)

        events = []
        u.each ['up:popup:open', 'up:popup:opened', 'up:popup:close', 'up:popup:closed'], (event) ->
          up.on event, -> events.push(event)

        Trigger.click($link1)

        next =>
          expect(events).toEqual ['up:popup:open']
          @respondWith('<div class="target">text1</div>')

        next =>
          expect(events).toEqual ['up:popup:open', 'up:popup:opened']
          Trigger.click($link2)

        next =>
          expect(events).toEqual ['up:popup:open', 'up:popup:opened', 'up:popup:close', 'up:popup:closed', 'up:popup:open']
          @respondWith('<div class="target">text1</div>')

        next =>
          expect(events).toEqual ['up:popup:open', 'up:popup:opened', 'up:popup:close', 'up:popup:closed', 'up:popup:open', 'up:popup:opened']


      describe 'with [up-instant] modifier', ->

        beforeEach ->
          @stubAttach()
          @$link.attr('up-instant', '')

        it 'opens the modal on mousedown (instead of on click)', asyncSpec (next) ->
          Trigger.mousedown(@$link)
          next => expect(@attachSpy.calls.mostRecent().args[0]).toEqual(@$link[0])

        it 'does nothing on mouseup', asyncSpec (next) ->
          Trigger.mouseup(@$link)
          next => expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing on click', asyncSpec (next) ->
          Trigger.click(@$link)
          next => expect(@attachSpy).not.toHaveBeenCalled()

        # IE does not call JavaScript and always performs the default action on right clicks
        unless AgentDetector.isIE() || AgentDetector.isEdge()
          it 'does nothing if the right mouse button is pressed down', asyncSpec (next) ->
            Trigger.mousedown(@$link, button: 2)
            next => expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing if shift is pressed during mousedown', asyncSpec (next) ->
          Trigger.mousedown(@$link, shiftKey: true)
          next => expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing if ctrl is pressed during mousedown', asyncSpec (next) ->
          Trigger.mousedown(@$link, ctrlKey: true)
          next => expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing if meta is pressed during mousedown', asyncSpec (next) ->
          Trigger.mousedown(@$link, metaKey: true)
          next => expect(@attachSpy).not.toHaveBeenCalled()

      describe 'with [up-method] modifier', ->

        it 'honours the given method', asyncSpec (next) ->
          $link = $fixture('a[href="/path"][up-popup=".target"][up-method="post"]')
          up.hello($link)
          Trigger.click($link)

          next =>
            expect(@lastRequest().method).toEqual 'POST'

    describe '[up-close]', ->

      backgroundClicked = undefined

      beforeEach ->
        up.motion.config.enabled = false
        backgroundClicked = jasmine.createSpy('background clicked')
        up.on 'click', backgroundClicked

      describe 'when clicked inside a popup', ->

        it 'closes the open popup and halts the event chain', asyncSpec (next) ->
          $opener = $fixture('a')
          up.popup.attach($opener, html: '<div class="target">text</div>', target: '.target')

          next =>
            $popup = $fixture('.up-overlay[up-mode=popup]')
            $closer = $popup.affix('a[up-close]') # link is within the popup
            up.hello($closer)
            Trigger.clickSequence($closer)

          next =>
            expect(up.popup.isOpen()).toBe(false)
            expect(backgroundClicked).not.toHaveBeenCalled()

      describe 'when clicked inside a popup when a modal is open', ->

        it 'closes the popup, but not the modal', asyncSpec (next) ->
          up.modal.extract '.modalee', '<div class="modalee"></div>'

          next =>
            $modalee = $('.up-overlay[up-mode=modal] .modalee')
            $opener = $modalee.affix('a')
            up.popup.attach($opener, html: '<div class="popupee">text</div>', target: '.popupee')

          next =>
            $popupee = $('.up-overlay[up-mode=popup] .popupee')
            $closer = $popupee.affix('a[up-close]') # link is within the popup
            up.hello($closer)
            Trigger.clickSequence($closer)

          next =>
            expect(up.popup.isOpen()).toBe(false)
            expect(up.modal.isOpen()).toBe(true)
            expect(backgroundClicked).not.toHaveBeenCalled()

      describe 'when no popup is open', ->

        it 'does nothing and allows the event chain to continue', asyncSpec (next) ->
          $link = $fixture('a[up-close]') # link is outside the popup
          up.hello($link)
          Trigger.clickSequence($link)

          next =>
            expect(up.popup.isOpen()).toBe(false)
            expect(backgroundClicked).toHaveBeenCalled()

    describe 'when replacing content', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'prefers to replace a selector within the popup', asyncSpec (next) ->
        $outside = $fixture('.foo').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, target: '.foo', html: "<div class='foo'>old inside</div>")

        next =>
          up.extract('.foo', "<div class='foo'>new text</div>")

        next =>
          expect($outside).toBeAttached()
          expect($outside).toHaveText('old outside')
          expect($('.up-overlay[up-mode=popup]')).toHaveText('new text')

      it 'auto-closes the popup when a replacement from inside the popup affects a selector behind the popup', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, target: '.inside', html: "<div class='inside'>old inside</div>")

        next =>
          up.extract('.outside', "<div class='outside'>new outside</div>", origin: $('.inside'))

        next =>
          expect($('.outside')).toHaveText('new outside')
          expect($('.up-overlay[up-mode=popup]')).not.toBeAttached()

      it 'does not restore the covered URL when auto-closing (since it would override the URL from the triggering update)', asyncSpec (next) ->
        up.history.config.enabled = true
        up.motion.config.enabled = true
        up.popup.config.openDuration = 0
        up.popup.config.closeDuration = 20
        up.popup.config.history = true

        $fixture('.outside').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, url: '/path', target: '.inside')

        next =>
          @respondWith("<div class='inside'>old inside</div>") # Populate pop-up

        next =>
          up.extract('.outside', "<div class='outside'>new outside</div>",
            origin: $('.inside'), history: '/new-location') # Provoke auto-close

        next =>
          expect(location.href).toMatchURL '/new-location'

      it 'does not auto-close the popup when a replacement from inside the popup affects a selector inside the popup', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, html: "<div class='inside'>old inside</div>", target: '.inside')

        next =>
          up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.inside'))

        next =>
          expect($('.inside')).toHaveText('new inside')
          expect($('.up-overlay[up-mode=popup]')).toBeAttached()

      it 'does not auto-close the popup when a replacement from outside the popup affects a selector outside the popup', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, target: '.inside', html: "<div class='inside'>old inside</div>")

        next =>
          up.extract('.outside', "<div class='outside'>new outside</div>", origin: $('.outside'))

        next =>
          expect($('.outside')).toHaveText('new outside')
          expect($('.up-overlay[up-mode=popup]')).toBeAttached()

      it 'does not auto-close the popup when a replacement from outside the popup affects a selector inside the popup', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, target: '.inside', html: "<div class='inside'>old inside</div>")

        next =>
          up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.outside'))

        next =>
          expect($('.inside')).toHaveText('new inside')
          expect($('.up-overlay[up-mode=popup]')).toBeAttached()

    describe 'when clicking on the body', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'closes the popup', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, target: '.inside', html: "<div class='inside'>inside</div>")

        next =>
          expect(up.popup.isOpen()).toBe(true)
          Trigger.clickSequence($('body'))

        next =>
          expect(up.popup.isOpen()).toBe(false)

      it 'closes the popup when a an [up-instant] link removes its parent (and thus a click event never bubbles up to the document)', asyncSpec (next) ->
        $parent = $fixture('.parent')
        $parentReplacingLink = $parent.affix('a[href="/foo"][up-target=".parent"][up-instant]')
        $popupOpener = $fixture('.link')
        up.popup.attach($popupOpener, target: '.inside', html: "<div class='inside'>inside</div>")

        next =>
          expect(up.popup.isOpen()).toBe(true)
          Trigger.clickSequence($parentReplacingLink)

        next =>
          expect(up.popup.isOpen()).toBe(false)

      it 'closes the popup when the user clicks on an [up-target] link outside the popup', asyncSpec (next) ->
        $target = $fixture('.target')
        $outsideLink = $fixture('a[href="/foo"][up-target=".target"]')
        $popupOpener = $fixture('.link')
        up.popup.attach($popupOpener, target: '.inside', html: "<div class='inside'>inside</div>")

        next =>
          expect(up.popup.isOpen()).toBe(true)
          Trigger.clickSequence($outsideLink)

        next =>
          expect(up.popup.isOpen()).toBe(false)

      it 'closes the popup when the user clicks on an [up-instant] link outside the popup', asyncSpec (next) ->
        $target = $fixture('.target')
        $outsideLink = $fixture('a[href="/foo"][up-target=".target"][up-instant]')
        $popupOpener = $fixture('.link')
        up.popup.attach($popupOpener, target: '.inside', html: "<div class='inside'>inside</div>")

        next =>
          expect(up.popup.isOpen()).toBe(true)
          Trigger.clickSequence($outsideLink)

        next =>
          expect(up.popup.isOpen()).toBe(false)

      it 'does not close the popup if #preventDefault() is called on up:popup:close event', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        $link = $fixture('.link')
        up.popup.attach($link, target: '.inside', html: "<div class='inside'>inside</div>")

        up.on 'up:popup:close', (e) -> e.preventDefault()

        next =>
          expect(up.popup.isOpen()).toBe(true)
          Trigger.clickSequence($('body'))

        next =>
          expect(up.popup.isOpen()).toBe(true)

          # Since there isn't anyone who could handle the rejection inside
          # the event handler, our handler mutes the rejection.
          expect(window).not.toHaveUnhandledRejections()

      it 'does not close the popup if a link outside the popup is followed with the up.follow function (bugfix)', asyncSpec (next) ->
        $target = $fixture('.target')
        $outsideLink = $fixture('a[href="/foo"][up-target=".target"]')
        $popupOpener = $fixture('.link')
        up.popup.attach($popupOpener, target: '.inside', html: "<div class='inside'>inside</div>")

        next =>
          expect(up.popup.isOpen()).toBe(true)
          up.follow($outsideLink)

        next =>
          expect(up.popup.isOpen()).toBe(true)

      it 'does not close the popup if a form outside the popup is followed with the up.submit function (bugfix)', asyncSpec (next) ->
        $target = $fixture('.target')
        $outsideForm = $fixture('form[action="/foo"][up-target=".target"]')
        $popupOpener = $fixture('.link')
        up.popup.attach($popupOpener, target: '.inside', html: "<div class='inside'>inside</div>")

        next =>
          expect(up.popup.isOpen()).toBe(true)
          up.submit($outsideForm)

        next =>
          expect(up.popup.isOpen()).toBe(true)
