const e = up.element

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('with { content } option', function() {

        it('replaces the given selector with a matching element that has the inner HTML from the given { content } string', async function() {
          fixture('.target', { text: 'old text' })

          up.render('.target', { content: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it('returns an up.RenderResult with the new children', async function() {
          fixture('.target', { text: 'old text' })

          const result = await up.render('.target', { content: `
            <div class="child1">child1</div>
            <div class="child2">child2</div>
          ` })

          expect(result.ok).toBe(true)
          expect(result.fragments.length).toBe(2)
          expect(result.fragments[0]).toMatchSelector('.child1')
          expect(result.fragments[1]).toMatchSelector('.child2')
        })

        it('replaces the given selector with a matching element that has the inner HTML from the given { content } element', async function() {
          fixture('.target', { text: 'old text' })
          const content = e.createFromSelector('div', { text: 'new text' })

          up.render('.target', { content })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it('allows to target :main', async function() {
          up.layer.config.root.mainTargets.unshift('.main-element')
          fixture('.main-element', { text: 'old text' })

          up.render({ target: ':main', content: 'new text' })
          await wait()

          expect('.main-element').toHaveText('new text')
        })

        it("removes the target's inner HTML with { content: '' }", async function() {
          fixture('.target', { text: 'old text' })

          up.render('.target', { content: '' })
          await wait()

          expect(document.querySelector('.target').innerHTML).toBe('')
        })

        it('keeps the target element and only updates its children', async function() {
          const originalTarget = fixture('.target.klass', { text: 'old text' })

          up.render('.target', { content: 'new text' })
          await wait()

          const rediscoveredTarget = document.querySelector('.target')
          expect(rediscoveredTarget).toBe(originalTarget)
          expect(rediscoveredTarget).toHaveClass('klass')
        })

        it('does not leave <up-wrapper> elements in the DOM', async function() {
          fixture('.target', { text: 'old text' })

          up.render('.target', { content: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
          expect(document.querySelectorAll('up-wrapper').length).toBe(0)
        })

        it('has a sync effect', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { content: 'new text' })
          expect('.target').toHaveText('new text')
        })

        it('can append content with an :after selector', async function() {
          const container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:after', { content: '<div class="new-child"></div>' })
          await wait()

          expect(container.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')
        })

        it('can prepend content with an :before selector', async function() {
          const container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:before', { content: '<div class="new-child"></div>' })
          await wait()

          expect(container.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
        })

        it('animates the appending with { animation }', async function() {
          up.motion.config.enabled = true

          fixtureStyle(`
            .new-child {
              background: red;
            }
          `)

          const container = fixture('.target')
          e.affix(container, '.old-child', { text: 'OLD' })

          up.render('.target:after', {
            content: '<div class="new-child">NEW</div>',
            animation: 'fade-in',
            duration: 500,
            easing: 'linear',
          })
          await wait()

          expect('.target').toHaveSelector('.old-child')
          expect('.target').toHaveSelector('.new-child')
          expect('.old-child').toHaveEffectiveOpacity(1.0, 0.0)
          expect('.new-child').toHaveEffectiveOpacity(0.0, 0.3)

          await wait(250)

          expect('.old-child').toHaveEffectiveOpacity(1.0, 0.0)
          expect('.new-child').toHaveEffectiveOpacity(0.5, 0.3)

          await wait(250)

          expect('.new-child').toHaveEffectiveOpacity(1.0, 0.3)
        })

        it('accepts a CSS selector for a <template> to clone', async function() {
          const template = htmlFixture(`
            <template id="target-template">
              <div id="child">
                child from template
              </div>
            </template>
          `)

          const target = htmlFixture(`
            <div id="target">
              <div id="child">
                old child
              </div>
            </div>
          `)

          up.render({ target: '#target', content: '#target-template' })
          await wait()

          expect('#target').toHaveSelector('#child')
          expect('#target').toHaveText('child from template')
          // Make sure the element was cloned, not moved
          expect(document.querySelector('#target').children[0]).not.toBe(template.content.children[0])
        })

        it('can clone a template with multiple child nodes without a root element', async function() {
          const template = htmlFixture(`
            <template id="target-template">
              one
              <div>two</div>
              three
            </template>
          `)

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: '#target-template' })
          await wait()

          expect('#target').toHaveVisibleText('one two three')
        })

        it('can render a string containing a text node without an enclosing element', async function() {
          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: 'new text' })
          await wait()

          expect('#target').toHaveVisibleText('new text')
        })

        it('can render a string containing multiple child nodes without an root element', async function() {
          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: `
            one
            <div>two</div>
            three
          ` })
          await wait()

          expect('#target').toHaveVisibleText('one two three')
        })

        it('can render an Element value', async function() {
          const givenElement = up.element.createFromHTML('<div>foo bar baz</div>')

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: givenElement })
          await wait()

          expect(document.querySelector('#target')).toHaveVisibleText('foo bar baz')
          expect(document.querySelector('#target').children[0]).toBe(givenElement)
        })

        it('can render an Text node value', async function() {
          const givenTextNode = new Text('foo bar baz')

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: givenTextNode })
          await wait()

          expect(document.querySelector('#target')).toHaveVisibleText('foo bar baz')
          expect(document.querySelector('#target').childNodes[0]).toBe(givenTextNode)
        })

        it('can render an NodeList with mixed Element and Text nodes', async function() {
          // Make a copy as it is a live list that we're going to mutate, then compare
          const givenNodes = [...up.element.createNodesFromHTML('foo <b>bar</b> baz')]
          expect(givenNodes).toHaveLength(3)

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: givenNodes })
          await wait()

          expect(document.querySelector('#target')).toHaveText('foo bar baz')
          expect(document.querySelector('#target').childNodes).toEqual(givenNodes)
        })
      })

      describe('with { document } option', function() {

        it('replaces the given selector with a matching element that has the outer HTML from the given { document } string', async function() {
          $fixture('.before').text('old-before')
          $fixture('.middle').text('old-middle')
          $fixture('.after').text('old-after')

          const document = `
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
          `

          up.render('.middle', { document })
          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('derives a selector from an element given as { target } option', async function() {
          const target = fixture('.target', { text: 'old-text' })
          const document = '<div class="target">new-text</div>'
          up.render({ target, document })
          await wait()

          expect('.target').toHaveText('new-text')
        })

        it('replaces the given selector with a matching element that has the outer HTML from the given { document } element', async function() {
          fixture('.target', { text: 'old text' })
          const element = e.createFromHTML('<div class="target">new text</div>')
          up.render('.target', { document: element })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it("rejects if the selector can't be found in the given { document } string", async function() {
          $fixture('.foo-bar')
          const promise = up.render('.foo-bar', { document: 'html without match' })

          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
        })

        it('has a sync effect', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })
          expect('.target').toHaveText('new text')
        })

        it('does not set an [up-source] attribute', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })

          expect('.target').toHaveText('new text')
          expect('.target').not.toHaveAttribute('up-source')
        })

        it('sets an [up-time=false] attribute to prevent an If-None-Match request header when reloading this fragment.', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('up-time', 'false')
        })

        it('sets an [up-etag=false] attribute to prevent an If-Modified-Since request header when reloading this fragment.', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('up-etag', 'false')
        })

        it('compiles a document cloned from a <template>', async function() {
          const template = htmlFixture(`
            <template id="document-template">
              <div id="foo">new foo</div>
              <div id="bar">new bar</div>
              <div id="baz">new baz</div>
            </template>
          `)

          htmlFixture('<div id="foo">old foo</div>')
          htmlFixture('<div id="bar">old bar</div>')
          htmlFixture('<div id="baz">old baz</div>')

          up.render({ target: '#foo, #baz', document: '#document-template' })
          await wait()

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('old bar')
          expect('#baz').toHaveText('new baz')
        })

        it('can update a single <tr> from a document that only contains that <tr>', async function() {
          const table = htmlFixture(`
            <table>
              <tbody>
                <tr id="row1"><td>cell1 old</td></tr>
                <tr id="row2"><td>cell2 old</td></tr>
                <tr id="row3"><td>cell3 old</td></tr>
              </tbody>
            </table>
          `)

          up.render({ target: '#row2', document: `
            <tr id="row2"><td>cell2 new</td></tr>
          `})
          await wait()

          expect('#row1 td').toHaveText('cell1 old')
          expect('#row2 td').toHaveText('cell2 new')
          expect('#row3 td').toHaveText('cell3 old')
        })

      })

      describe('with { fragment } option', function() {

        it('derives target and outer HTML from the given { fragment } string', async function() {
          $fixture('.before').text('old-before')
          $fixture('.middle').text('old-middle')
          $fixture('.after').text('old-after')

          const fragment = '<div class="middle">new-middle</div>'

          up.render({ fragment })
          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('derives target and outer HTML from the given { fragment } element', async function() {
          fixture('.target', { text: 'old text' })
          const fragment = e.createFromHTML('<div class="target">new text</div>')
          up.render('.target', { fragment })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it("rejects if the given { fragment } does not match an element on the current page", async function() {
          $fixture('.foo-bar')
          const fragment = e.createFromHTML('<div class="target">new text</div>')
          const promise = up.render({ fragment })

          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
        })

        it('has a sync effect', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { fragment: '<div class="target">new text</div>' })
          expect('.target').toHaveText('new text')
        })

        describe('appending and prepending', function() {

          it('can append content with an :after selector', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:after', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')
          })

          it('can prepend content with an :before selector', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:before', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
          })

          it('allows the combination :has(.selector):before', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:has(div):before', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
          })

          it('allows the combination :before:maybe', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:before:maybe', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
          })

          it('does not leave <up-wrapper> elements in the DOM', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:after', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')

            expect(document.querySelectorAll('up-wrapper').length).toBe(0)
          })

        })

        describe('cloning a <template>', function() {

          it('it accepts a CSS selector for a <template> to clone', async function() {
            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            up.render({ fragment: '#target-template' })
            await wait()

            expect('#target').toHaveText('target from template')
            // Make sure the element was cloned, not moved
            expect(document.querySelector('#target').children[0]).not.toBe(template.content.children[0])
          })

          it('it accepts the <template> as an Element option', async function() {
            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            up.render({ fragment: template })
            await wait()

            expect('#target').toHaveText('target from template')
            // Make sure the element was cloned, not moved
            expect(document.querySelector('#target').children[0]).not.toBe(template.content.children[0])
          })

          it('compiles an element cloned from a <template>', async function() {
            const compilerFn = jasmine.createSpy('compiler fn')
            up.compiler('#target', compilerFn)

            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            expect(compilerFn).not.toHaveBeenCalled()

            up.render({ fragment: '#target-template' })
            await wait()

            expect('#target').toHaveText('target from template')
            expect(compilerFn).toHaveBeenCalled()
            expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
          })

          it('compiles an element cloned from a <template> with a custom data object embedded into the { fragment } option', async function() {
            const compilerFn = jasmine.createSpy('compiler fn')
            up.compiler('#target', compilerFn)

            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            expect(compilerFn).not.toHaveBeenCalled()

            up.render({ fragment: '#target-template { foo: 1, bar: 2 }' })
            await wait()

            expect('#target').toHaveText('target from template')
            expect(compilerFn).toHaveBeenCalled()
            expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
            expect(compilerFn.calls.mostRecent().args[1]).toEqual({ foo: 1, bar: 2 })
          })

          it('compiles an element cloned from a <template> with a custom data object in the { data } option', async function() {
            const compilerFn = jasmine.createSpy('compiler fn')
            up.compiler('#target', compilerFn)

            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            expect(compilerFn).not.toHaveBeenCalled()

            up.render({ fragment: '#target-template', data: { foo: 1, bar: 2 } })
            await wait()

            expect('#target').toHaveText('target from template')
            expect(compilerFn).toHaveBeenCalled()
            expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
            expect(compilerFn.calls.mostRecent().args[1]).toEqual({ foo: 1, bar: 2 })
          })

          it('passes a { data } option to a custom up:template:clone handler', async function() {
            const template = htmlFixture(`
              <template id="target-template" type='text/minimustache'>
                <div id="target">
                  Hello, <b>{{name}}</b>!
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
              let html = event.target.innerHTML
              html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
              event.nodes = up.element.createNodesFromHTML(html)
            })

            up.on('up:template:clone', 'template[type="text/minimustache"]', templateHandler)

            up.render({ fragment: '#target-template', data: { name: "Alice" } })
            await wait()

            expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), template, jasmine.anything())
            expect('#target').toHaveText('Hello, Alice!')
          })

          it('compiles an element cloned from a <template> that can be manipulated with { onRendered }', async function() {
            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            up.render({ fragment: '#target-template', onRendered({ fragment }) { fragment.classList.add('class-from-callback') } })
            await wait()

            expect('#target').toHaveText('target from template')
            expect('#target').toHaveClass('class-from-callback')
          })
        })
      })

    })

  })

})
