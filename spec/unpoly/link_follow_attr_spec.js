const e = up.element

extendDescribe('up.link', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('[up-follow]', function() {

      it("calls up.follow() with the clicked link", async function() {
        const link = fixture('a[href="/follow-path"][up-follow]')
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(link)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()
      })

      it("calls up.follow() with the closest link if a link child was clicked", async function() {
        const link = fixture('a[href="/follow-path"][up-follow]')
        const linkChild = e.affix(link, '#child', { text: 'label' })
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(linkChild)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()
      })

      it('follows a link with [up-follow=true]', async function() {
        const link = fixture('a[href="/follow-path"][up-follow=true]')
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(link)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()
      })

      it('follows a link that is immediately removed after clicking', async function() {
        fixture('#main')
        const link = fixture('a[href="/follow-path"][up-follow=true][up-target="#main"]')

        Trigger.clickSequence(link)
        link.remove()

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector('#main', { text: 'link content' })

        await wait()

        expect('#main').toHaveText('link content')
      })

      describe('when the server responds with an error', function() {

        it('updates the [up-fail-target] instead')

        it('updates a main target if no [up-fail-target] is given')

        it('updates the [up-fail-target] if the link is immediately removed after clicking', async function() {
          fixture('#success', { text: 'initial content' })
          fixture('#failure', { text: 'initial content' })
          const link = fixture('a[href="/follow-path"][up-follow=true][up-target="#success"][up-fail-target="#failure"]')

          Trigger.clickSequence(link)
          link.remove()

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWithSelector('#failure', { text: 'link content', status: 422 })

          await wait()

          expect('#success').toHaveText('initial content')
          expect('#failure').toHaveText('link content')
        })
      })

      describe('exemptions from following', function() {

        it('never follows a link with [download] (which opens a save-as-dialog)', async function() {
          const link = helloFixture('a[href="/path"][up-target=".target"][download]')

          Trigger.click(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never preloads a link with a [target] attribute (which updates a frame or opens a tab)', async function() {
          const link = helloFixture('a[href="/path"][up-target=".target"][target="_blank"]')

          Trigger.click(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never follows an a[href="#"]', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = helloFixture('a[href="#"][up-target=".target"]')
          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('never follows a link with a "mailto:..." [href] attribute', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          const link = helloFixture('a[href="mailto:foo@bar.com"]')

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never follows a link with a "tel:..." [href] attribute', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          const link = helloFixture('a[href="tel:+49123456"]')

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never follows a link with a "whatsapp://..." attribute', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          const link = helloFixture('a[href="whatsapp://send?text=Hello"]')

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does follow an a[href="#"] if the link also has local content via an [up-content], [up-fragment] or [up-document] attribute', async function() {
          const target = fixture('.target', { text: 'old text' })
          const link = helloFixture('a[href="#"][up-target=".target"][up-content="new text"]')

          Trigger.clickSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(link).not.toHaveBeenDefaultFollowed()
          expect('.target').toHaveText('new text')
        })

        it('does nothing if the right mouse button is used', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { button: 2 })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if shift is pressed during the click', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { shiftKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if ctrl is pressed during the click', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { ctrlKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if meta is pressed during the click', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { metaKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if a listener prevents the up:click event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'up:click', (event) => event.preventDefault())

          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })

        it('does nothing if a listener prevents the click event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'click', (event) => event.preventDefault())

          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })
      })

      describe('handling of up.link.config.followSelectors', function() {

        it('follows matching links even without [up-follow] or [up-target]', async function() {
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = fixture('a[href="/foo"].link')
          up.link.config.followSelectors.push('.link')

          Trigger.click(link)

          await wait()

          expect(this.followSpy).toHaveBeenCalled()
          expect(link).not.toHaveBeenDefaultFollowed()
        })

        it('allows to opt out with [up-follow=false]', async function() {
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = fixture('a[href="/foo"][up-follow="false"].link')
          up.link.config.followSelectors.push('.link')

          Trigger.click(link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })
      })

      describe('with [up-instant] modifier', function() {

        it('follows a link on mousedown (instead of on click)', function() {
          const link = fixture('a[href="/follow-path"][up-follow][up-instant]')
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(link)

          expect(followSpy.calls.mostRecent().args[0]).toEqual(link)
        })

        it('follows a link on mousedown with [up-instant=true]', function() {
          const link = fixture('a[href="/follow-path"][up-follow][up-instant]')
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(link)

          expect(followSpy.calls.mostRecent().args[0]).toEqual(link)
        })

        it('does nothing on mouseup', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mouseup(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing on click if there was an earlier mousedown event', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link)
          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy.calls.count()).toBe(1)
        })

        it('does follow a link on click if there was never a mousedown event (e.g. if the user pressed enter)', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy.calls.mostRecent().args[0]).toEqual(this.$link[0])
        })

        it('does nothing if the right mouse button is pressed down', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { button: 2 })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if shift is pressed during mousedown', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { shiftKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if ctrl is pressed during mousedown', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { ctrlKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if meta is pressed during mousedown', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { metaKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if a listener prevents the up:click event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'up:click', (event) => event.preventDefault())

          Trigger.mousedown(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })

        it('does nothing if a listener prevents the mousedown event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'mousedown', (event) => event.preventDefault())

          Trigger.mousedown(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })

        it('fires a click event on an a[href="#"] link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = helloFixture('a[href="#"][up-instant][up-target=".target"]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('follows a[onclick] links on click instead of mousedown', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = helloFixture('a[href="/foo"][onclick="console.log(\'clicked\')"][up-instant][up-target=".target"]')

          Trigger.mousedown(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          Trigger.click(link)
          await wait()

          expect(followSpy).toHaveBeenCalled()
        })

        it('does not fire a click event on an a[href="#"] link that also has local HTML in [up-content], [up-fragment] or [up-document]', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their "javascript:" links.
          const link = helloFixture('a[href="#"][up-instant][up-target=".target"][up-content="new content"]')
          fixture('.target')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).toHaveBeenCalled()

          expect(clickListener).not.toHaveBeenCalled()
          expect(link).not.toHaveBeenDefaultFollowed()
        })

        it('fires a click event on an a[href="#hash"] link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their #anchor link.s
          const link = helloFixture('a[href="#details"][up-instant]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('fires a click event on an a[href="javascript:..."] link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their "javascript:" links.
          const link = helloFixture('a[href="javascript:console.log(\'hi world\')"][up-instant]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('fires a click event on a cross-origin link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their "javascript:" links.
          const link = helloFixture('a[href="http://other-site.tld/path"][up-instant]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        describe('focus', function() {

          beforeEach(function() {
            up.specUtil.assertTabFocused()
          })

          it('focused the link after the click sequence (like a vanilla link)', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')

            Trigger.clickSequence(link, { focus: false })

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()
          })

          it('hides a focus ring when activated with the mouse', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')
            Trigger.clickSequence(link, { focus: false })

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()

            expect(link).not.toHaveOutline()
          })

          it('shows a focus ring when activated with a non-pointing device (keyboard or unknown)', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')
            Trigger.clickLinkWithKeyboard(link)

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()

            expect(link).toHaveOutline()
          })

          it('hides the focus ring when activated with the mouse, then shows the focus ring when activated with the keyboard', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')

            Trigger.clickSequence(link, { focus: false })
            expect(followSpy.calls.count()).toBe(1)
            expect(link).not.toHaveOutline()

            Trigger.clickLinkWithKeyboard(link)
            expect(followSpy.calls.count()).toBe(2)
            expect(link).toHaveOutline()
          })

          describe('handling of up.link.config.instantSelectors', function() {

            it('follows matching links without an [up-instant] attribute', async function() {
              this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a[up-follow][href="/foo"].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              await wait()

              expect(this.followSpy).toHaveBeenCalled()
            })

            it('allows individual links to opt out with [up-instant=false]', async function() {
              const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a[up-follow][href="/foo"][up-instant=false].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              await wait()

              expect(followSpy).not.toHaveBeenCalled()
            })

            it('allows to configure exceptions in up.link.config.noInstantSelectors', async function() {
              up.link.config.instantSelectors.push('.include')
              up.link.config.noInstantSelectors.push('.exclude')
              const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a.include.exclude[up-follow][href="/foo"]')

              Trigger.mousedown(link)

              await wait()

              expect(followSpy).not.toHaveBeenCalled()
            })

            it('allows individual links to opt out of all Unpoly link handling with [up-follow=false]', async function() {
              this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a[up-follow][href="/foo"][up-follow=false].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              await wait()

              expect(this.followSpy).not.toHaveBeenCalled()
            })
          })
        })
      })


      describe('with [up-preview] modifier', function() {
        it('shows a preview effect while the link is loading', async function() {
          const target = fixture('#target', { text: 'old target' })
          const spinnerContainer = fixture('#other')

          up.preview('my:preview', (preview) => preview.insert(spinnerContainer, '<div id="spinner"></div>'))

          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-preview="my:preview"]', { text: 'label' })

          expect(spinnerContainer).not.toHaveSelector('#spinner')

          Trigger.clickSequence(link)
          await wait()

          expect(spinnerContainer).toHaveSelector('#spinner')

          jasmine.respondWithSelector('#target', { text: 'new target' })
          await wait()

          expect(spinnerContainer).not.toHaveSelector('#spinner')
        })
      })

      describe('with [up-placeholder] modifier', function() {

        it('shows a UI placeholder while the link is loading', async function() {
          fixture('#target', { content: '<p>old target</p>' })
          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-placeholder="<p>placeholder</p>"]', { text: 'label' })
          expect('#target').toHaveVisibleText('old target')

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveVisibleText('placeholder')

          jasmine.respondWithSelector('#target', { content: '<p>new target</p>' })
          await wait()

          expect('#target').toHaveVisibleText('new target')
        })

        it('does not show a UI placeholder while preloading', async function() {
          const placeholderCompilerFn = jasmine.createSpy('placeholder compiler fn')
          up.compiler('#placeholder', placeholderCompilerFn)

          fixture('#target', { content: '<p>old target</p>' })
          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-placeholder="<p id=\'placeholder\'>placeholder</p>"]', { text: 'label' })
          expect('#target').toHaveVisibleText('old target')

          up.link.preload(link)
          await wait()

          expect('#target').toHaveVisibleText('old target')
          expect(placeholderCompilerFn).not.toHaveBeenCalled()
        })

        it('does not show a UI placeholder while revalidating', async function() {
          await jasmine.populateCache('/foo', '<div id="target">expired target</div>')
          up.cache.expire()

          const placeholderCompilerFn = jasmine.createSpy('placeholder compiler fn')
          up.compiler('#placeholder', placeholderCompilerFn)

          fixture('#target', { content: '<p>old target</p>' })
          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-placeholder="<p id=\'placeholder\'>placeholder</p>"]', { text: 'label' })
          expect('#target').toHaveVisibleText('old target')

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveVisibleText('expired target')
          expect(placeholderCompilerFn).not.toHaveBeenCalled()
          expect(up.network.isBusy()).toBe(true)

          jasmine.respondWithSelector('#target', { text: 'revalidated target' })
          await wait()

          expect('#target').toHaveVisibleText('revalidated target')
          expect(placeholderCompilerFn).not.toHaveBeenCalled()
          expect(up.network.isBusy()).toBe(false)
        })
      })

      describe('following non-interactive elements with [up-href]', function() {

        it('makes any element behave like an [up-follow] link', async function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)
          fixture('.target', { text: 'old text' })

          Trigger.click(link)
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

          jasmine.respondWithSelector('.target', { text: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it('gives the element a pointer cursor', function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)

          expect(link).toHaveCursorStyle('pointer')
        })

        it('gives the element a [role=link] so screen readers announce it as interactive', function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)

          expect(link.role).toBe('link')
        })

        it('enables keyboard interaction for the element', async function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)
          fixture('.target', { text: 'old text' })

          expect(link).toBeKeyboardFocusable()

          Trigger.clickLinkWithKeyboard(link)
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

          jasmine.respondWithSelector('.target', { text: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
        })
      })

      describe('[up-href] without [up-follow]', function() {
        if (up.migrate.loaded) {

          it('is made followable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).toBeFollowable()
          })

          it('is keyboard focusable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).toBeKeyboardFocusable()
          })

        } else {

          it('is not followable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).not.toBeFollowable()
          })

          it('gets no pointer cursor', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).toHaveCursorStyle('auto')
          })

          it('is not keyboard focusable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).not.toBeKeyboardFocusable()
          })
        }
      })

    })

  })

})
