const u = up.util

extendDescribe('up.layer', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.layer.open()', function() {

      describe('closing', function() {

        beforeEach(function() {
          up.motion.config.enabled = false
        })

        describe('{ dismissible }', function() {

          describe('with { dismissible: true }', function() {
            it('sets all other dismissible options to true', async function() {
              const layer = await up.layer.open({ dismissible: true })
              expect(layer.dismissible).toMatchList(['button', 'key', 'outside'])
            })
          })

          describe('with { dismissible: false }', function() {
            it('sets all other dismissible options to false if passed { dismissible: false }', async function() {
              const layer = await up.layer.open({ dismissible: false })
              expect(layer.dismissible).toEqual([])
            })
          })

          describe('with { dismissible } set to a space-separated string', function() {
            it('sets only the given dismiss methods', async function() {
              const layer = await up.layer.open({ dismissible: 'button outside' })
              expect(layer.dismissible).toMatchList(['button', 'outside'])
            })
          })

          describe('with { dismissible } set to a comma-separated string', function() {
            it('sets only the given dismiss methods', async function() {
              const layer = await up.layer.open({ dismissible: 'button, outside' })
              expect(layer.dismissible).toMatchList(['button', 'outside'])
            })
          })

          describe('with { dismissible: "button" }', function() {

            it('adds a button that dimisses the layer', async function() {
              const layer = await up.layer.open({ dismissible: 'button' })
              expect(layer.element).toHaveSelector('up-modal-dismiss[up-dismiss]')
            })

            it('allows to customize the button using { dismissLabel, dismissARIALabel }', async function() {
              const layer = await up.layer.open({
                dismissible: 'button',
                dismissLabel: 'CLOSE ME',
                dismissARIALabel: 'Close this overlay'
              })
              const button = layer.element.querySelector('up-modal-dismiss[up-dismiss]')
              expect(button).toHaveText('CLOSE ME')
              expect(button).toHaveAttribute('aria-label', 'Close this overlay')
            })

            if (up.migrate.loaded) {
              it('allows to customize the button using { dismissLabel, dismissAriaLabel }', async function() {
                const layer = await up.layer.open({
                  dismissible: 'button',
                  dismissLabel: 'CLOSE ME',
                  dismissAriaLabel: 'Close this overlay'
                })
                const button = layer.element.querySelector('up-modal-dismiss[up-dismiss]')
                expect(button).toHaveText('CLOSE ME')
                expect(button).toHaveAttribute('aria-label', 'Close this overlay')
              })
            }

            it('emits an up:layer:dismissed event with { value: ":button" } and other details', async function() {
              up.layer.open({ dismissible: 'button', mode: 'modal' })
              let buttonElement = null
              const listener = jasmine.createSpy('up:layer:dismissed listener')
              up.on('up:layer:dismissed', listener)

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              buttonElement = up.fragment.get('up-modal-dismiss')
              Trigger.clickSequence(buttonElement, { clientX: 0, clientY: 0 })

              await wait()

              expect(up.layer.isOverlay()).toBe(false)

              expect(listener).toHaveBeenCalledWith(
                jasmine.objectContaining({ value: ':button', origin: buttonElement }),
                jasmine.anything(),
                jasmine.anything()
              )
            })

            it('does not emit a global error if the button is clicked and up:layer:dismiss is prevented', async function() {
              up.layer.open({ dismissible: 'button', mode: 'modal' })
              up.on('up:layer:dismiss', (event) => event.preventDefault())

              await wait()

              await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
                const buttonElement = up.fragment.get('up-modal-dismiss')
                Trigger.clickSequence(buttonElement, { clientX: 0, clientY: 0 })

                await wait()
                expect(globalErrorSpy).not.toHaveBeenCalled()
              })
            })

            it('returns focus to the link that opened the overlay, hiding a focus ring as it is a mouse interaction', async function() {
              const opener = fixture('a[href="/overlay"][up-layer="new"][up-target="#content"][up-dismissible="button"]')
              Trigger.clickSequence(opener)

              await wait()

              jasmine.respondWithSelector('#content', { text: 'overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()

              Trigger.clickSequence('up-modal-dismiss')

              await wait()

              expect(up.layer.current).not.toBeOverlay()
              expect(opener).toHaveFocus()
              expect(opener).not.toHaveOutline()
            })

            it('returns focus to the link that opened the overlay, showing a focus ring when the button was activated with a keyboard', async function() {
              const opener = fixture('a[href="/overlay"][up-layer="new"][up-target="#content"][up-dismissible="button"]')
              Trigger.clickSequence(opener)

              await wait()

              jasmine.respondWithSelector('#content', { text: 'overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()

              Trigger.clickLinkWithKeyboard('up-modal-dismiss')

              await wait()

              expect(up.layer.current).not.toBeOverlay()
              expect(opener).toHaveFocus()
              expect(opener).toHaveOutline()
            })
          })

          describe('without { dismissible: "button" }', function() {
            it('does not add a button that dimisses the layer', async function() {
              const layer = await up.layer.open({ dismissible: false })
              expect(layer.element).not.toHaveSelector('up-modal-dismiss[up-dismiss]')
            })
          })

          describe('with { dismissible: "key" }', function() {

            it('lets the user close the layer by pressing Escape', async function() {
              up.layer.open({ dismissible: "key" })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.isOverlay()).toBe(false)
            })

            it('does not emit a global error when Escape is pressed and up:layer:dismiss is prevented', async function() {
              up.layer.open({ dismissible: "key" })
              up.on('up:layer:dismiss', (event) => event.preventDefault())

              await wait()

              await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
                Trigger.escapeSequence(document.body)

                await wait()
                expect(globalErrorSpy).not.toHaveBeenCalled()
              })
            })

            it('returns focus to the link that opened the overlay, showing a focus ring as it is a keyboard interaction', async function() {
              const opener = fixture('a[href="/overlay"][up-target="#content"][up-layer="new"][up-dismissible="key"]')
              Trigger.clickSequence(opener)

              await wait()

              jasmine.respondWithSelector('#content', { text: 'overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.current).not.toBeOverlay()
              expect(opener).toHaveFocus()
              expect(opener).toHaveOutline()
            })

            it('emits an up:layer:dismissed event with { value: ":key" } and other details', async function() {
              up.layer.open({ dismissible: 'key', mode: 'modal' })
              const listener = jasmine.createSpy('up:layer:dismissed listener')
              up.on('up:layer:dismissed', listener)

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.isOverlay()).toBe(false)

              expect(listener).toHaveBeenCalledWith(
                jasmine.objectContaining({ value: ':key' }),
                jasmine.anything(),
                jasmine.anything()
              )
            })
          })

          describe('without { dismissible: "key" }', function() {
            it('does not let the user close the layer by pressing escape', async function() {
              up.layer.open({ dismissible: false })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.isOverlay()).toBe(true)
            })
          })

          describe('with { dismissible: "outside" }', function() {

            describe('for an overlay with viewport', function() {

              it('dismisses the overlay when the user clicks on the viewport (which sits over the backdrop and will receive all clicks outside the frame)', async function() {
                up.layer.open({ dismissible: 'outside', mode: 'modal' })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(up.layer.current.viewportElement, { clientX: 0, clientY: 0 })

                await wait()

                expect(up.layer.isOverlay()).toBe(false)
              })

              it('emits an up:layer:dismissed event with { value: ":outside" } and other details', async function() {
                up.layer.open({ dismissible: 'outside', mode: 'modal' })
                let viewportElement = null
                const listener = jasmine.createSpy('up:layer:dismissed listener')
                up.on('up:layer:dismissed', listener)

                await wait()

                expect(up.layer.isOverlay()).toBe(true);

                ({
                  viewportElement
                } = up.layer.current)
                Trigger.clickSequence(viewportElement, { clientX: 0, clientY: 0 })

                await wait()

                expect(up.layer.isOverlay()).toBe(false)

                expect(listener).toHaveBeenCalledWith(
                  jasmine.objectContaining({ value: ':outside', origin: viewportElement }),
                  jasmine.anything(),
                  jasmine.anything()
                )
              })

              it('does not emit a global error when the viewport is clicked and up:layer:dismiss is prevented', async function() {
                up.layer.open({ dismissible: "outside", mode: 'modal' })
                up.on('up:layer:dismiss', (event) => event.preventDefault())

                await wait()

                await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
                  const {
                    viewportElement
                  } = up.layer.current
                  Trigger.clickSequence(viewportElement, { clientX: 0, clientY: 0 })

                  await wait()
                  expect(globalErrorSpy).not.toHaveBeenCalled()
                })
              })

              it('does not dismiss the overlay when the user clicks on the parent layer, but within a foreign overlay', async function() {
                up.layer.config.foreignOverlaySelectors = ['.foreign-overlay']
                const foreignOverlay = fixture('.foreign-overlay', { text: 'foreign overlay content' })

                up.layer.open({ dismissible: 'outside', mode: 'modal' })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(foreignOverlay, { clientX: 0, clientY: 0 })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)
              })
            })

            describe('for an overlay with tether', function() {

              it('dismisses the overlay when the user clicks anywhere on the parent layer', async function() {
                const opener = fixture('a', { text: 'label' })
                up.layer.open({ dismissible: 'outside', mode: 'popup', origin: opener })
                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(document.body)
                await wait()

                expect(up.layer.isOverlay()).toBe(false)
              })

              it('does not dismiss the overlay when the user clicks on the parent layer, but within a foreign overlay', async function() {
                up.layer.config.foreignOverlaySelectors = ['.foreign-overlay']
                const foreignOverlay = fixture('.foreign-overlay', { text: 'foreign overlay content' })

                const opener = fixture('a', { text: 'label' })
                up.layer.open({ dismissible: 'outside', mode: 'popup', origin: opener })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(foreignOverlay)

                await wait()

                expect(up.layer.isOverlay()).toBe(true)
              })

              it('lets the user close an overlay with tether by clicking on its opener', async function() {
                const opener = fixture('a', { text: 'label' })
                up.layer.open({ dismissible: 'outside', mode: 'popup', origin: opener })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(opener)

                await wait()

                expect(up.layer.isOverlay()).toBe(false)
              })

              describe('focus', function() {

                it('focuses the link that opened the overlay', async function() {
                  const opener = fixture('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  Trigger.clickSequence(opener)
                  await wait()

                  expect(up.layer.isOverlay()).toBe(true)

                  Trigger.clickSequence(document.body)
                  await wait(50)

                  expect(up.layer.isOverlay()).toBe(false)
                  expect(opener).toBeFocused()
                })

                it('focuses the link that opened the overlay when nested overlays are dismissed', async function() {
                  const rootOpener = fixture('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  Trigger.clickSequence(rootOpener)
                  await wait()

                  expect(up.layer.current.index).toBe(1)

                  const overlay1Opener = up.layer.affix('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  Trigger.clickSequence(overlay1Opener)
                  await wait()

                  expect(up.layer.current.index).toBe(2)

                  Trigger.clickSequence(document.body)
                  await wait(50)

                  expect(up.layer.isOverlay()).toBe(false)
                  expect(rootOpener).toBeFocused()
                })

                it('preserves focus when the overlay was dismissed by clicking a focusable element on the parent layer', async function() {
                  const opener = fixture('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  const input = fixture('input[type=text]')

                  Trigger.clickSequence(opener)
                  await wait()

                  expect(up.layer.isOverlay()).toBe(true)

                  Trigger.clickSequence(input)
                  await wait(50)

                  expect(up.layer.isOverlay()).toBe(false)
                  expect(input).toBeFocused()
                })
              })
            })
          })

          describe('without { dismissible: "outside" }', function() {
            it('does not let the user close a layer with viewport by clicking on its viewport (which sits over the backdrop and will receive all clicks outside the frame)', async function() {
              up.layer.open({ dismissible: false, mode: 'modal' })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.clickSequence(up.layer.current.viewportElement, { clientX: 0, clientY: 0 })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)
            })
          })
        })

        if (up.migrate.loaded) {

          describe('{ dismissable } (deprecated)', function() {

            it('forwards its value to { dismissible }', async function() {
              const layer = await up.layer.open({ dismissable: 'button outside' })
              expect(layer.dismissible).toMatchList(['button', 'outside'])
            })

          })

        }

        describe('{ onAccepted }', function() {

          it('runs the given callback when they layer is accepted', async function() {
            const callback = jasmine.createSpy('onAccepted callback')

            up.layer.open({ onAccepted: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.accept('acceptance value')

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:accepted', { value: 'acceptance value' })
          })

          it('does not run the given callback when the layer is dismissed', async function() {
            const callback = jasmine.createSpy('onAccepted callback')

            up.layer.open({ onAccepted: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.dismiss('dismissal value')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('sets up.layer.current to the layer that opened the overlay', async function() {
            const rootLayer = up.layer.root
            const baseLayerSpy = jasmine.createSpy('current layer spy')

            up.layer.open({
              onAccepted() {
                return baseLayerSpy(up.layer.current)
              }
            })

            await wait()

            expect(up.layer.current.mode).toEqual('modal')
            up.layer.accept()

            await wait()

            expect(baseLayerSpy).toHaveBeenCalledWith(rootLayer)
          })

          it('does not crash when there is focus in the overlay, animations are enabled and we reload in the background (bugfix)', async function() {
            up.motion.config.enabled = true
            up.layer.config.modal.closeAnimation = 'fade-out'
            up.layer.config.modal.closeDuration = 200

            fixture('.target', { text: 'old target text', 'up-source': '/target-source' })

            const overlay = await up.layer.open({
              onAccepted() {
                return up.reload('.target')
              }
            })

            const button = overlay.affix('button', { class: 'button', text: 'button label' })
            button.focus()
            expect(button).toBeFocused()

            overlay.accept()
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.lastRequest().url).toMatchURL('/target-source')

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new target text' })
            await wait()

            expect('.target').toHaveText('new target text')
          })
        })

        describe('{ onDismissed }', function() {

          it('runs the given callback when they layer is dimissed', async function() {
            const callback = jasmine.createSpy('onDismissed callback')

            up.layer.open({ onDismissed: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.dismiss('dismissal value')

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:dismissed', { value: 'dismissal value' })
          })

          it('does not run the given callback when the layer is accepted', async function() {
            const callback = jasmine.createSpy('onDismissed callback')

            up.layer.open({ onDismissed: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.accept('acceptance value')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('sets up.layer.current to the layer that opened the overlay', async function() {
            const rootLayer = up.layer.root
            const baseLayerSpy = jasmine.createSpy('current layer spy')

            up.layer.open({
              onDismissed() {
                return baseLayerSpy(up.layer.current)
              }
            })

            await wait()

            expect(up.layer.current.mode).toEqual('modal')
            up.layer.dismiss()

            await wait()

            expect(baseLayerSpy).toHaveBeenCalledWith(rootLayer)
          })
        })

        describe('{ acceptEvent }', function() {

          it('accepts the layer when an event of the given type was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('foo')

            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('uses the event object as the acceptance value', async function() {
            const fooEvent = up.event.build('foo')
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit(fooEvent)

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:accepted')
            expect(callback.calls.mostRecent().args[0].value).toBe(fooEvent)
          })

          describe('when the server sends a matching event via X-Up-Events', function() {

            it('accepts the overlay', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, acceptEvent: 'my:event', target: '.modal-content' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              const closingJob = up.navigate({ url: '/path', target: '.modal-content' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.modal-content', {
                responseHeaders: {
                  'X-Up-Events': JSON.stringify([{ type: 'my:event', foo: 'foo-value', layer: 'current' }])
                }
              })

              await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.mode).toBe('root')

              expect(callback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                  value: jasmine.objectContaining({
                    type: 'my:event',
                    foo: 'foo-value'
                  })
                })
              )
            })

            it('makes the response available to up:layer:accepted listeners as a { response } property', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, acceptEvent: 'my:event', target: '.modal-content' })

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              const closingJob = up.navigate({ url: '/path', target: '.modal-content' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith({
                responseText: '<div class="modal-content">closing text</div>',
                responseHeaders: {
                  'X-Up-Events': JSON.stringify([{ type: 'my:event', layer: 'current' }])
                }
              })

              await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.mode).toBe('root')

              expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
              expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="modal-content">closing text</div>')
            })
          })

          it('does not accept the layer when the given event was emitted on another layer', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.root.emit('foo')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('accepts the layer when one of multiple space-separated event types was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo bar baz' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('bar')

            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('allows the accepted response body to be consumed by a hungry element on another layer', async function() {
            pending("test me")
          })

          it('does not push a history entry if an X-Up-Events response header accepts the overlay', async function() {
            up.history.config.enabled = true
            up.history.replace('/root')
            up.history.config.restoreTargets = ['main']
            expect(up.history.location).toMatchURL('/root')

            htmlFixture(`<main>root text</main>`)

            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: 'main',
              acceptEvent: 'my:event',
              onAccepted: callback,
              history: true,
              url: '/overlay1',
            })
            await wait()

            jasmine.respondWith(`<main>overlay1 text</main>`)
            await wait()

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('overlay1 text')
            expect(up.history.location).toMatchURL('/overlay1')
            expect(callback).not.toHaveBeenCalled()

            let matchingUpdateJob = up.render({ target: 'main', url: '/overlay2', history: true })
            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Events': JSON.stringify([{ type: 'my:event', layer: 'current' }]),
              },
              responseText: `<main>overlay2 text</main>`
            })

            await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(callback).toHaveBeenCalled()
            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/root')

            history.back()
            await wait(400)

            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/overlay1')
            expect('main').toHaveText('overlay1 text')
          })

        })

        describe('{ dismissEvent }', function() {

          it('dismisses the layer when an event of the given type was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })
            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('foo')
            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('uses the event object as the dismissal value', async function() {
            const fooEvent = up.event.build('foo')
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit(fooEvent)

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:dismissed')
            expect(callback.calls.mostRecent().args[0].value).toBe(fooEvent)
          })

          it('does not dismiss the layer when the given event was emitted on another layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.root.emit('foo')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('dismisses the layer when one of multiple space-separated event types was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo bar baz' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('bar')

            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('does emit a global error when an event of the given type was emitted on the layer and up:layer:dismiss is prevented', async function() {
            up.on('up:layer:dismiss', (event) => event.preventDefault())

            up.layer.open({ dismissEvent: 'foo' })
            await wait()

            await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
              up.layer.emit('foo')
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              expect(globalErrorSpy).not.toHaveBeenCalled()
            })
          })
        })

        describe('{ acceptFragment }', function() {

          describe('when updating a layer', function() {

            it('accepts the layer when an fragment with the given selector is rendered into the layer', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial text')
              expect(callback).not.toHaveBeenCalled()

              let ignoredUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="no-match">ignored update</span>
                </div>
              `})
              await expectAsync(ignoredUpdateJob).toBeResolvedTo(jasmine.any(up.RenderResult))

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('ignored update')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(document).not.toHaveSelector('#match')
              expect(callback).toHaveBeenCalled()
            })

            it('accepts a fragment matching a comma-separated selector union', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#leading, #match, #trailing',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial text')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(document).not.toHaveSelector('#match')
              expect(callback).toHaveBeenCalled()
            })

            it('does not accept the layer when a matching fragment is rendered into a different layer', async function() {
              htmlFixtureList(`
                <div id="fragment">initial root text</div>
              `)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    initial overlay text
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial overlay text')
              expect(callback).not.toHaveBeenCalled()

              up.render({ layer: 'root', fragment: `
                <div id="fragment">
                  <div id="match">updated root text</div>
                </div>
              ` })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveText('updated root text')
              expect(up.fragment.get('#fragment', { layer: 'overlay' })).toHaveText('initial overlay text')
            })

            it('does not compile the matching element', async function() {
              const compilerFn = jasmine.createSpy('compiler function')
              up.compiler('#match', compilerFn)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(compilerFn).not.toHaveBeenCalled()
            })

            it('does not show the accepting fragment in a closing animation', async function() {
              up.motion.config.enabled = true

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `,
                closeAnimation: 'fade-out',
                closeDuration: 300,
                closeEasing: 'linear',
              })
              await wait()

              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(document).toHaveSelector('up-modal')
              expect('up-modal-content').toHaveText('initial text')
              expect('up-modal-content').not.toHaveText('matching text')
              await wait(400)

              expect(document).not.toHaveSelector('up-modal')
            })

            it('allows the matching element to be consumed by a hungry fragment on a parent layer', async function() {
              htmlFixture(`
                <div id="fragment" up-hungry up-if-layer="any">
                  initial root text
                </div>
              `)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial overlay text</span>
                  </div>
                `
              })
              await wait()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(callback).toHaveBeenCalled()
              expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveSelector('#match')
              expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveText('matching text')
            })

            it("uses the fragment's data as the acceptance value", async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial text')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match" up-data="{ name: 'Bob' }">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(document).not.toHaveSelector('#match')
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                type: 'up:layer:accepted',
                value: { name: 'Bob' },
              }))
            })

            it('does not push a history entry if the response accepts the overlay', async function() {
              up.history.config.enabled = true
              up.history.replace('/root')
              up.history.config.restoreTargets = ['main']
              expect(up.history.location).toMatchURL('/root')

              htmlFixture(`
                <main>
                  <span>root text</span>
                </main>
              `)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                target: 'main',
                acceptFragment: '#match',
                onAccepted: callback,
                history: true,
                url: '/overlay1',
              })
              await wait()

              jasmine.respondWith(`
                <main>
                  <span>overlay1 text</span>
                </main>
              `)
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('overlay1 text')
              expect(up.history.location).toMatchURL('/overlay1')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ target: 'main', url: '/overlay2', history: true })
              await wait()

              jasmine.respondWith(`
                <main>
                  <span id="match">overlay2 text</span>
                </main>
              `)

              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root')

              history.back()
              await wait(400)

              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/overlay1')
              expect('main').toHaveText('overlay1 text')
            })

          })

          describe('when opening an overlay', function() {

            describe('when its initial content matches the given selector', function() {

              it('immediately accepts a layer when its initial content contains the given selector', async function() {
                const callback = jasmine.createSpy('onAccepted callback')

                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#match',
                  fragment: `
                  <div id="container">
                    <div id="match" up-data="{ name: 'Bob' }">matching text</div>
                  </div>
                `
                })

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                  type: 'up:layer:accepted',
                  value: { name: 'Bob' },
                }))

                expect(up.layer.mode).toBe('root')
                expect(document).not.toHaveSelector('#match')
              })

              it('immediately accepts a layer when its initial content matches the given selector', async function() {
                const callback = jasmine.createSpy('onAccepted callback')

                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#match',
                  fragment: `
                    <div id="match" up-data="{ name: 'Bob' }">matching text</div>
                  `
                })
                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                  type: 'up:layer:accepted',
                  value: { name: 'Bob' },
                }))

                expect(up.layer.mode).toBe('root')
                expect(document).not.toHaveSelector('#match')
              })

              it('does not compile the matching element', async function() {
                const compilerFn = jasmine.createSpy('compiler function')
                up.compiler('#match', compilerFn)

                const callback = jasmine.createSpy('onAccepted callback')
                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#match',
                  fragment: `
                    <div id="match"></div>
                  `
                })
                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalled()
                expect(up.layer.mode).toBe('root')
                expect(compilerFn).not.toHaveBeenCalled()
              })

              it('allows the matching element to be consumed by a hungry fragment on a parent layer', async function() {
                htmlFixture(`
                  <div id="fragment" up-hungry up-if-layer="any">
                    initial root text
                  </div>
                `)

                const callback = jasmine.createSpy('onAccepted callback')
                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#fragment',
                  fragment: `
                    <div id="fragment">
                      matching text
                    </div>
                  `
                })
                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.current.mode).toBe('root')
                expect(callback).toHaveBeenCalled()
                expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveText('matching text')
              })

              it('does not push a history entry', async function() {
                up.history.config.enabled = true
                up.history.config.restoreTargets = ['main']
                up.history.replace('/root1')
                expect(up.history.location).toMatchURL('/root1')
                htmlFixture(`<main>root1 text</main>`)

                up.render({ target: 'main', url: '/root2', history: true })
                await wait()

                jasmine.respondWith('<main>root2 text</main>')
                await wait()

                expect('main').toHaveText('root2 text')

                const callback = jasmine.createSpy('onAccepted callback')
                let matchingUpdateJob = up.layer.open({
                  target: 'main',
                  acceptFragment: '#match',
                  onAccepted: callback,
                  history: true,
                  url: '/overlay1',
                })
                await wait()

                // We wait if the response ends up being rendered, and with what URL.
                expect(callback).not.toHaveBeenCalled()

                jasmine.respondWith(`<main><span id="match">overlay1 text</span></main>`)
                await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalled()
                expect(up.layer.current.mode).toBe('root')
                expect(up.history.location).toMatchURL('/root2')
                expect('main').toHaveText('root2 text')

                history.back()
                await wait(400)

                expect(up.layer.current.mode).toBe('root')
                expect(up.history.location).toMatchURL('/root1')

                expect(up.network.isBusy()).toBe(true)
                expect(jasmine.lastRequest().url).toMatchURL('/root1')
              })

            })

          })
        })

        describe('{ dismissFragment }', function() {

          it('dismisses the layer when an fragment with the given selector is rendered into the layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({
              onDismissed: callback,
              dismissFragment: '#match',
              fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
            })
            await wait()

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('initial text')
            expect(callback).not.toHaveBeenCalled()

            let ignoredUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="no-match">ignored update</span>
                </div>
              `})
            await expectAsync(ignoredUpdateJob).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('ignored update')
            expect(callback).not.toHaveBeenCalled()

            let matchingUpdateJob = up.render({ fragment: `
              <div id="fragment">
                <span id="match">matching text</span>
              </div>
            `})
            await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.current.mode).toBe('root')
            expect(document).not.toHaveSelector('#match')
            expect(callback).toHaveBeenCalled()
          })


        })

        describe('{ acceptLocation }', function() {

          beforeEach(function() {
            up.history.config.enabled = true
          })

          it('accepts the layer when the layer has reached the given location', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            up.navigate('.overlay-content', { content: 'other content', location: '/other-location' })
            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/acceptable-location'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            const value = { location: u.normalizeURL('/acceptable-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('accepts the layer when the layer has reached the given location pattern', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/users /records/* /articles'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/records/new'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = { location: u.normalizeURL('/records/new') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('parses a location pattern of named placeholders to produce an acceptance value', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/records/:action/:id'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/records/edit/123'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = {
              location: u.normalizeURL('/records/edit/123'),
              action: 'edit',
              id: '123'
            }

            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('accepts the layer when the layer has reached the given location but renders no history', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              history: false,
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/acceptable-location'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = { location: u.normalizeURL('/acceptable-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('does not accept the layer when another layer has reached the given location', function() {
            const callback = jasmine.createSpy('onAccepted callback')

            makeLayers([
              { target: '.root-content' },
              { target: '.overlay-content', onAccepted: callback, acceptLocation: '/acceptable-location' }
            ])

            up.navigate('.root-content', { layer: 'root', content: 'new content', location: '/acceptable-location' })

            expect(callback).not.toHaveBeenCalled()
          })

          it('accepts the layer when the response redirects to the observed location', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate({
              target: '.overlay-content',
              url: '/requested-location'
            })
            await wait()

            jasmine.respondWith({
              responseText: '<span class="overlay-content">You are being redirected</span>',
              responseURL: '/acceptable-location',
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            const value = { location: u.normalizeURL('/acceptable-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('does not accept the layer when the observed location is requested, but ends up redirecting elsewhere', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate({
              target: '.overlay-content',
              url: '/acceptable-location'
            })
            await wait()

            // We wait if the location ends up being rendered
            expect(callback).not.toHaveBeenCalled()

            jasmine.respondWith({
              responseText: '<span class="overlay-content">updated overlay content</span>',
              responseURL: '/redirect-location',
            })

            await expectAsync(closingJob).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(up.layer.mode).toBe('modal')
            expect(up.layer.location).toMatchURL('/redirect-location')
            expect(callback).not.toHaveBeenCalled()
          })

          it('allows the accepted response body to be consumed by a hungry element on another layer', async function() {
            pending("test me")
          })

          it('does not push a history entry if the response accepts the overlay', async function() {
            up.history.config.enabled = true
            up.history.replace('/root')
            up.history.config.restoreTargets = ['main']
            expect(up.history.location).toMatchURL('/root')

            htmlFixture(`<main>root text</main>`)

            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: 'main',
              acceptLocation: '/overlay2',
              onAccepted: callback,
              history: true,
              url: '/overlay1',
            })
            await wait()

            jasmine.respondWith(`<main>overlay1 text</main>`)
            await wait()

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('overlay1 text')
            expect(up.history.location).toMatchURL('/overlay1')
            expect(callback).not.toHaveBeenCalled()

            let matchingUpdateJob = up.render({ target: 'main', url: '/overlay2', history: true })
            await wait()

            // We wait if the response ends up being rendered, and with what URL.
            expect(callback).not.toHaveBeenCalled()

            jasmine.respondWith(`<main>overlay2 text</main>`)

            await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(callback).toHaveBeenCalled()
            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/root')

            history.back()
            await wait(400)

            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/overlay1')
            expect('main').toHaveText('overlay1 text')
          })

          describe('when opening an overlay', function() {

            it('immediately accepts a new overlay when its initial location matches the given location', async function() {
              up.history.replace('/root-path')
              expect(up.history.location).toMatchURL('/root-path')

              const callback = jasmine.createSpy('onAccepted callback')

              const compiler = jasmine.createSpy('compiler')
              up.compiler('.overlay-content', compiler)

              const openPromise = up.layer.open({
                target: '.overlay-content',
                history: true,
                onAccepted: callback,
                url: '/overlay-path',
                acceptLocation: '/overlay-path',
              })

              await wait()

              expect(up.layer.mode).toBe('root')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.overlay-content', { text: 'initial content' })

              // await wait()

              await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root-path')

              expect(document).not.toHaveSelector('.overlay-content')
              expect(compiler).not.toHaveBeenCalled()
            })

            it('does not immediately accept a layer if its parent layer is already on the given location (bugfix)', async function() {
              up.history.replace('/root-path')
              expect(up.history.location).toMatchURL('/root-path')

              const callback = jasmine.createSpy('onAccepted callback')

              up.layer.open({
                target: '.overlay-content',
                history: true,
                onAccepted: callback,
                url: '/overlay-path',
                acceptLocation: '/root-path',
              })

              await wait()

              expect(up.layer.mode).toBe('root')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.overlay-content', { text: 'initial content' })

              await wait()

              expect(callback).not.toHaveBeenCalled()
              expect(up.layer.mode).toBe('modal')
              expect(up.history.location).toMatchURL('/overlay-path')

              const navigatePromise = up.navigate({ url: '/root-path' })

              await wait()

              jasmine.respondWithSelector('.overlay-content', { text: 'next content' })

              await expectAsync(navigatePromise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root-path')
            })

            it('does not push a history if the initial response closes the overlay', async function() {
              up.history.config.enabled = true
              up.history.config.restoreTargets = ['main']
              up.history.replace('/root1')
              expect(up.history.location).toMatchURL('/root1')
              htmlFixture(`<main>root1 text</main>`)

              up.render({ target: 'main', url: '/root2', history: true })
              await wait()

              jasmine.respondWith('<main>root2 text</main>')
              await wait()

              expect('main').toHaveText('root2 text')

              const callback = jasmine.createSpy('onAccepted callback')
              let matchingUpdateJob = up.layer.open({
                target: 'main',
                acceptLocation: '/overlay1',
                onAccepted: callback,
                history: true,
                url: '/overlay1',
              })
              await wait()

              // We wait if the response ends up being rendered, and with what URL.
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith(`<main>overlay1 text</main>`)
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root2')
              expect('main').toHaveText('root2 text')

              history.back()
              await wait(400)

              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root1')

              expect(up.network.isBusy()).toBe(true)
              expect(jasmine.lastRequest().url).toMatchURL('/root1')

            })

          })

          it('makes the discarded response available to up:layer:accepted listeners as a { response } property', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', { url: '/acceptable-location', history: true })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            jasmine.respondWith('<div class="overlay-content">closing content</div>')

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
            expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="overlay-content">closing content</div>')
          })
        })

        describe('{ dismissLocation }', function() {

          beforeEach(function() {
            up.history.config.enabled = true
          })

          it('dismisses the layer when the layer has reached the given location', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onDismissed: callback,
              dismissLocation: '/dismissible-location'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.navigate('.overlay-content', { content: 'other content', location: '/other-location' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'dismissible content',
              location: '/dismissible-location'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = { location: u.normalizeURL('/dismissible-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })
        })
      })

    })

  })

})
