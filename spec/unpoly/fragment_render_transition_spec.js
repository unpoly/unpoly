const $ = jQuery

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('with { transition } option', function() {

        beforeEach(function() { up.motion.config.enabled = true })

        it('morphs between the old and new element', async function() {
          fixture('.element.v1', { text: 'version 1' })
          up.render('.element', {
            document: '<div class="element v2">version 2</div>',
            transition: 'cross-fade',
            duration: 200,
            easing: 'linear'
          })
          await wait()

          let oldElement = document.querySelector('.element.v1')
          let newElement = document.querySelector('.element.v2')

          expect(oldElement).toHaveOwnOpacity(1.0, 0.15)
          expect(newElement).toHaveOwnOpacity(0.0, 0.15)
          await wait(100)

          expect(oldElement).toHaveOwnOpacity(0.5, 0.3)
          expect(newElement).toHaveOwnOpacity(0.5, 0.3)
          await wait(170)

          expect(newElement).toHaveOwnOpacity(1.0, 0.1)
          expect(oldElement).toBeDetached()
        })

        it('allows to morphs when swapping children with :content', async function() {
          let html = (version) => `
            <div class="container v${version}">
              <div class="element v${version}">
                version ${version}
              </div>
            </div>
          `

          let [container1] = htmlFixtureList(html(1))

          up.render('.container:content', {
            document: html(2),
            transition: 'cross-fade',
            duration: 200,
            easing: 'linear'
          })
          await wait()

          let oldElement = document.querySelector('.element.v1')
          let newElement = document.querySelector('.element.v2')

          expect(oldElement).toHaveEffectiveOpacity(1.0, 0.15)
          expect(newElement).toHaveEffectiveOpacity(0.0, 0.15)
          await wait(100)

          expect(oldElement).toHaveEffectiveOpacity(0.5, 0.3)
          expect(newElement).toHaveEffectiveOpacity(0.5, 0.3)
          await wait(170)

          expect(newElement).toHaveEffectiveOpacity(1.0, 0.1)
          expect(oldElement).toBeDetached()

          let currentContainer = document.querySelector('.container')
          expect(currentContainer).toHaveClass('v1')
          expect(currentContainer).toBe(container1)
        })

        it('ignores a { transition } option when replacing a singleton element like <body>', async function() {
          // shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
          spyOn(up.element, 'isSingleton').and.callFake((element) => element.matches('fake-body'))

          up.fragment.config.targetDerivers.unshift('fake-body')
          $fixture('fake-body').text('old text')

          const renderDone = jasmine.createSpy('render() done')
          const promise = up.render({
            fragment: '<fake-body>new text</fake-body>',
            transition: 'cross-fade',
            duration: 200
          })
          promise.then(renderDone)

          await wait()

          // See that we've already immediately swapped the element and ignored the duration of 200ms
          expect(renderDone).toHaveBeenCalled()
          expect($('fake-body').length).toEqual(1)
          expect('fake-body').toHaveOwnOpacity(1.0)
        })

        it('marks the old fragment as .up-destroying during the transition', async function() {
          fixture('.element', { text: 'version 1' })
          up.render({
            fragment: '<div class="element">version 2</div>',
            transition: 'cross-fade',
            duration: 200
          })

          await wait()

          const version1 = up.specUtil.findElementContainingText('.element', "version 1")
          expect(version1).toHaveClass('up-destroying')

          const version2 = up.specUtil.findElementContainingText('.element', "version 2")
          expect(version2).not.toHaveClass('up-destroying')
        })

        it('runs an { onFinished } callback after the element has been removed from the DOM', async function() {
          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element.v1').text('v1')

          let renderOptions = {
            document: '<div class="element v2">v2</div>',
            transition: 'cross-fade',
            duration: 75,
          }
          let onFinished = jasmine.createSpy('onFinished callback')

          up.render('.element', { ...renderOptions, onFinished })
          await wait()

          expect('.element.v2').toHaveText('v2')
          expect($element).toBeAttached()
          expect(onFinished).not.toHaveBeenCalled()

          await wait(150)

          expect($element).toBeDetached()
          expect(onFinished).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          expect(onFinished).toHaveBeenCalledWith(jasmine.objectContaining({
            ok: true,
            fragment: document.querySelector('.element.v2'),
            renderOptions: jasmine.objectContaining(renderOptions),
          }))
        })

        it('fulfills the render().finished promise after the element has been removed from the DOM', async function() {
          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element.v1').text('v1')

          const renderOptions = {
            document: '<div class="element v2">v2</div>',
            transition: 'cross-fade',
            duration: 75
          }
          const job = up.render('.element', renderOptions)
          const finished = job.finished
          await wait()

          expect('.element.v2').toHaveText('v2')
          expect($element).toBeAttached()
          await expectAsync(job.finished).toBePending()

          await wait(150)

          expect($element).toBeDetached()

          await expectAsync(finished).toBeResolvedTo(jasmine.any(up.RenderResult))
          await expectAsync(finished).toBeResolvedTo(jasmine.objectContaining({
            ok: true,
            fragment: document.querySelector('.element.v2'),
            renderOptions: jasmine.objectContaining({
              transition: 'cross-fade',
              duration: 75
            }),
          }))
        })

        it('rejects the render().finished promise after the element has been removed from the DOM when updating from a failed response', async function() {
          fixture('.success-target', { text: 'old success target' })
          fixture('.failure-target', { text: 'old failure target' })

          const renderOptions = {
            target: '.success-target',
            failTarget: '.failure-target',
            transition: 'cross-fade',
            failTransition: 'move-up',
            duration: 200,
            failDuration: 300,
            url: '/path2'
          }

          const job = up.render(renderOptions)
          const { finished } = job

          await wait()

          jasmine.respondWith({
            status: 500,
            responseText: `
              <div class="failure-target">new failure target</div>
            `
          })

          await wait(100)

          await expectAsync(job).toBeRejectedWith(jasmine.any(up.RenderResult))
          await expectAsync(finished).toBePending()

          await wait(200)

          await expectAsync(finished).toBeRejectedWith(jasmine.any(up.RenderResult))
          await expectAsync(finished).toBeRejectedWith(jasmine.objectContaining({
            ok: false,
            target: '.failure-target',
            fragments: [document.querySelector('.failure-target')],
            layer: up.layer.root,
            renderOptions: jasmine.objectContaining({
              target: '.failure-target',
              transition: 'move-up',
              duration: 300,
            }),
          }))
        })

        it('runs an { onFinished } callback once when updating multiple elements', async function() {
          fixture('.foo')
          fixture('.bar')

          const onFinishedSpy = jasmine.createSpy('onFinished spy')

          up.render('.foo, .bar', {
            document: '<div class="foo"></div> <div class="bar"></div>',
            transition: 'cross-fade',
            duration: 10,
            onFinished: onFinishedSpy
          })

          await wait(200)
          expect(onFinishedSpy.calls.count()).toBe(1)
        })

        it('cancels an existing transition by instantly jumping to the last frame', async function() {
          $fixture('.element.v1').text('version 1')

          up.render('.element', {
            document: '<div class="element v2">version 2</div>',
            transition: 'cross-fade',
            duration: 200
          })

          await wait()

          const $ghost1 = $('.element:contains("version 1")')
          expect($ghost1).toHaveLength(1)
          expect($ghost1.css('opacity')).toBeAround(1.0, 0.1)

          const $ghost2 = $('.element:contains("version 2")')
          expect($ghost2).toHaveLength(1)
          expect($ghost2.css('opacity')).toBeAround(0.0, 0.1)

          up.render('.element', {
            document: '<div class="element v3">version 3</div>',
            transition: 'cross-fade',
            duration: 200
          })

          await wait()

          const $ghost1After = $('.element:contains("version 1")')
          expect($ghost1After).toHaveLength(0)

          const $ghost2After = $('.element:contains("version 2")')
          expect($ghost2After).toHaveLength(1)
          expect($ghost2After.css('opacity')).toBeAround(1.0, 0.1)

          const $ghost3 = $('.element:contains("version 3")')
          expect($ghost3).toHaveLength(1)
          expect($ghost3.css('opacity')).toBeAround(0.0, 0.1)
        })

        it('prevents the user from focusing the destroying element', async function() {
          up.motion.config.enabled = true

          const oldFocused = fixture('.focused[tabindex=0][data-version="old"]', { text: 'old focused' })

          up.render('.focused', {
            focus: false,
            document: `
                <div class="focused" data-version="new" tabindex="0">new focused</div>
              `,
            transition: 'cross-fade',
            duration: 1200,
          })

          await wait(600)

          const newFocused = document.querySelector('.focused[data-version="new"]')

          expect(oldFocused).toBeAttached()
          expect(oldFocused).toHaveOwnOpacity(0.5, 0.4)
          expect(newFocused).toBeAttached()
          expect(newFocused).toHaveOwnOpacity(0.5, 0.4)

          oldFocused.focus()
          expect(oldFocused).not.toBeFocused()

          await wait(800)

          expect(oldFocused).toBeDetached()
          expect(newFocused).toBeAttached()
          expect(newFocused).toHaveOwnOpacity(1.0, 0.2)
        })

        it('resolves the returned promise as soon as both elements are in the DOM and the transition has started', function(done) {
          fixture('.swapping-element', { text: 'version 1' })

          const renderDone = up.render({
            fragment: '<div class="swapping-element">version 2</div>',
            transition: 'cross-fade',
            duration: 60
          })

          renderDone.then(function() {
            const elements = document.querySelectorAll('.swapping-element')
            expect(elements.length).toBe(2)

            expect(elements[0]).toHaveText('version 2')
            expect(elements[0]).not.toMatchSelector('.up-destroying')

            expect(elements[1]).toHaveText('version 1')
            expect(elements[1]).toMatchSelector('.up-destroying')

            done()
          })
        })

        it('runs an { onFinished } callback when the transition has finished', async function() {
          fixture('.element', { text: 'version 1' })
          const onFinished = jasmine.createSpy('onFinished callback')

          up.render({
            fragment: '<div class="element">version 2</div>',
            transition: 'cross-fade',
            duration: 60,
            onFinished
          })

          expect(onFinished).not.toHaveBeenCalled()
          await wait(20)

          expect(onFinished).not.toHaveBeenCalled()
          await wait(200)

          expect(onFinished).toHaveBeenCalled()
        })

        it('runs an { onFinished } callback once when appending an element', async function() {
          fixture('.foo')

          const onFinishedSpy = jasmine.createSpy('onFinished spy')

          up.render('.foo:after', {
            document: '<div class="foo"></div>',
            transition: 'fade-in',
            duration: 10,
            onFinished: onFinishedSpy
          })

          await wait(200)
          expect(onFinishedSpy.calls.count()).toBe(1)
        })

        it('marks the old element as .up-destroying before compilers are called', async function() {
          const element = fixture('.element', { id: 'old', text: 'old text' })
          const isMarkedSpy = jasmine.createSpy()
          up.compiler('.element', (element) => isMarkedSpy(document.querySelector('.element#old').matches('.up-destroying')))
          up.render({ target: '.element', document: '<div class="element" id="new">new text</div>', transition: 'cross-fade', duration: 70 })
          await wait(35)

          expect('.element').toHaveText('new text')
          expect(isMarkedSpy).toHaveBeenCalledWith(true)
        })

        it('attaches the new element to the DOM before compilers are called, so they can see their parents and trigger bubbling events', async function() {
          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element').text('old text')
          const spy = jasmine.createSpy('parent spy')
          up.compiler('.element', (element) => spy(element.innerText, element.parentElement))
          up.render({
            fragment: '<div class="element">new text</div>',
            transition: 'cross-fade',
            duration: 50
          })

          await wait()
          expect(spy).toHaveBeenCalledWith('new text', $parent.get(0))
        })

        it('reveals the new element while making the old element within the same viewport appear as if it would keep its scroll position', async function() {
          const $container = $fixture('.container[up-viewport]').css({
            'width': '200px',
            'height': '200px',
            'overflow-y': 'scroll',
            'position': 'fixed',
            'left': '0px',
            'top': '0px',
          })
          const $element = $fixture('.element').appendTo($container).css({ height: '600px' })

          $container.scrollTop(300)
          expect($container.scrollTop()).toEqual(300)

          up.render($element.get(0), {
            transition: 'cross-fade',
            duration: 60000,
            scroll: 'target',
            document: `
              <div class="element" style="height: 600px"></div>
            `
          })

          await wait()

          const $old = $('.element.up-destroying')
          const $new = $('.element:not(.up-destroying)')

          // Container is scrolled up due to { scroll: 'target' } option.
          // Since $old and $new are sitting in the same viewport with a
          // single shared scrollbar, this will make the ghost for $old jump.
          expect($container.scrollTop()).toBeAround(0, 5)

          // See that the ghost for $new is aligned with the top edge
          // of the viewport.
          expect($new.offset().top).toBeAround(0, 5)

          // The absolutized $old is shifted upwards to make it looks like it
          // was at the scroll position before we revealed $new.
          expect($old.offset().top).toBeAround(-300, 5)
        })

        describe('when up.morph() is called from a transition function', function() {

          it("does not emit multiple replacement events (bugfix)", function(done) {
            const $element = $fixture('.element').text('old content')

            const transition = (oldElement, newElement, options) => up.morph(oldElement, newElement, 'cross-fade', options)

            const destroyedListener = jasmine.createSpy('listener to up:fragment:destroyed')
            up.on('up:fragment:destroyed', destroyedListener)
            const insertedListener = jasmine.createSpy('listener to up:fragment:inserted')
            up.on('up:fragment:inserted', insertedListener)

            const testListenerCalls = function() {
              expect(destroyedListener.calls.count()).toBe(1)
              expect(insertedListener.calls.count()).toBe(1)
              done()
            }

            up.render({
              fragment: '<div class="element">new content</div>',
              transition,
              duration: 50,
              easing: 'linear',
              onFinished: testListenerCalls
            })
          })

          it("does not compile the element multiple times (bugfix)", function(done) {
            const $element = $fixture('.element').text('old content')

            const transition = (oldElement, newElement, options) => up.morph(oldElement, newElement, 'cross-fade', options)

            const compiler = jasmine.createSpy('compiler')
            up.compiler('.element', compiler)

            expect(compiler.calls.count()).toBe(1)

            const extractDone = up.render({
              fragment: '<div class="element">new content</div>',
              transition,
              duration: 50,
              easing: 'linear'
            })

            extractDone.then(function() {
              expect(compiler.calls.count()).toBe(2)
              done()
            })
          })

          it("does not call destructors multiple times (bugfix)", async function() {
            const destructor = jasmine.createSpy('destructor')
            up.compiler('.element', (element) => destructor)

            const $element = $fixture('.element').text('old content')
            up.hello($element)

            const transition = (oldElement, newElement, options) => up.morph(oldElement, newElement, 'cross-fade', options)

            await up.render({
              fragment: '<div class="element">new content</div>',
              transition,
              duration: 50,
              easing: 'linear',
            }).finished

            expect(destructor.calls.count()).toBe(1)
          })
        })

        describe('when animation is disabled', function() {

          beforeEach(function() { up.motion.config.enabled = false })

          it('immediately swaps the old and new elements without creating unnecessary ghosts', async function() {
            $fixture('.element').text('version 1')
            up.render({
              fragment: '<div class="element">version 2</div>',
              transition: 'cross-fade',
              duration: 200
            })
            await wait()

            expect('.element').toHaveText('version 2')
            expect(document.querySelectorAll('.up-ghost')).toHaveLength(0)
          })

          it("replaces the elements directly, since first inserting and then removing would shift scroll positions", async function() {
            const swapDirectlySpy = up.motion.swapElementsDirectly.mock()
            $fixture('.element').text('version 1')
            up.render({
              fragment: '<div class="element">version 2</div>',
              transition: false
            })

            await wait()
            expect(swapDirectlySpy).toHaveBeenCalled()
          })
        })

        describe('when the transition function throws an error', function() {

          it('emits an error event on window, but does not reject the render job', async function() {
            const transitionError = new Error("error from crashing transition")
            const crashingTransition = jasmine.createSpy('crashing transition').and.throwError(transitionError)
            up.transition('crashing', crashingTransition)

            fixture('.target', { text: 'old target' })

            await jasmine.expectGlobalError(transitionError, async function() {
              const job = up.render({
                transition: crashingTransition,
                fragment: `
                  <div class="target">new target</div>
                `
              })

              expect('.target').toHaveText('new target')
              expect(crashingTransition).toHaveBeenCalled()
              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
            })
          })

          it('still updates subsequent elements for a multi-step target', async function() {
            const transitionError = new Error("error from crashing transition")
            const crashingTransition = jasmine.createSpy('crashing transition').and.throwError(transitionError)
            up.transition('crashing', crashingTransition)

            fixture('.primary', { text: 'old primary' })
            fixture('.secondary', { text: 'old secondary' })
            fixture('.tertiary', { text: 'old tertiary' })

            await jasmine.spyOnGlobalErrorsAsync(async function() {
              up.render('.primary, .secondary, .tertiary', {
                transition: 'crashing',
                document: `
                  <div class="primary">new primary</div>
                  <div class="secondary">new secondary</div>
                  <div class="tertiary">new tertiary</div>
                `
              })

              expect(crashingTransition).toHaveBeenCalled()
              expect('.primary').toHaveText('new primary')
              expect('.secondary').toHaveText('new secondary')
              expect('.tertiary').toHaveText('new tertiary')
            })
          })
        })
      })

    })

  })

})
