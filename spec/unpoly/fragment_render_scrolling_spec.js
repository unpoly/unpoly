const u = up.util

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('scrolling', function() {

        const mockReveal = function() {
          this.revealedHTML = []
          this.revealedText = []
          this.revealOptions = {}

          this.revealMock = up.reveal.mock().and.callFake((element, options) => {
            this.revealedHTML.push(element.outerHTML)
            this.revealedText.push(element.textContent.trim())
            this.revealOptions = options
            return Promise.resolve()
          })
        }

        const mockRevealBeforeEach = function() {
          beforeEach(function() {
            mockReveal.apply(this)
          })
        }

        describe('with { scroll: false }', function() {

          mockRevealBeforeEach()

          it('does not scroll', async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', scroll: false })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <div id="hash"></div>
              </div>
            `)

            await wait()

            expect(this.revealMock).not.toHaveBeenCalled()
          })

          if (up.migrate.loaded) {
            describe('with { reveal: false }', function() {
              it('does not scroll', async function() {
                fixture('.target')
                up.render('.target', { url: '/path#hash', reveal: false })

                await wait()

                jasmine.respondWith(`
                  <div class="target">
                    <div id="hash"></div>
                  </div>
                `)

                await wait()

                expect(this.revealMock).not.toHaveBeenCalled()
              })
            })
          }
        })

        describe('with { scroll: "target" }', function() {

          mockRevealBeforeEach()

          it('scrolls to the new element that is inserted into the DOM', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', scroll: 'target' })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new text' })

            await wait()

            expect(this.revealedText).toEqual(['new text'])
          })

          it('allows to pass another selector to reveal', async function() {
            fixture('.target', { text: 'target text' })
            fixture('.other', { text: 'other text' })

            up.render('.target', { url: '/path', scroll: '.other' })

            await wait()

            jasmine.respondWithSelector('.target')

            await wait()

            expect(this.revealedText).toEqual(['other text'])
          })

          it('allows to refer to the replacement { origin } as ":origin" in the { scroll } selector', async function() {
            const target = fixture('.target', { text: 'target text' })
            const origin = fixture('.origin', { text: 'origin text' })

            up.render('.target', { url: '/path', scroll: ':origin', origin })

            await wait()

            jasmine.respondWithSelector('.target')

            await wait()

            expect(this.revealedText).toEqual(['origin text'])
          })

          it('only scrolls the first fragment of a multi-target update', async function() {
            htmlFixtureList(`
              <div id="target1">old target1</div>
              <div id="target2">old target2</div>
            `)

            await up.render({
              target: '#target1, #target2',
              document: `
                <div id="target1">new target1</div>
                <div id="target2">new target2</div>
              `,
              scroll: 'target'
            })

            expect(this.revealedText).toEqual(['new target1'])
          })

          if (up.migrate.loaded) {
            describe('with { reveal: true }', function() {
              it('scrolls to the new element that is inserted into the DOM', async function() {
                fixture('.target')
                up.render('.target', { url: '/path', reveal: true })

                await wait()

                jasmine.respondWithSelector('.target', { text: 'new text' })

                await wait()

                expect(this.revealedText).toEqual(['new text'])
              })
            })
          }

          describe('when more than one fragment is replaced', function() {
            it('only reveals the first fragment', async function() {
              fixture('.one', { text: 'old one text' })
              fixture('.two', { text: 'old two text' })
              up.render('.one, .two', { url: '/path', scroll: 'target' })

              await wait()

              jasmine.respondWith(`
                <div class="one">new one text</div>
                <div class="two">new two text</div>
              `)

              await wait()

              expect(this.revealedText).toEqual(['new one text'])
            })
          })

          it('reveals a new element that is being appended', async function() {
            fixture('.target')
            up.render('.target:after', { url: '/path', scroll: 'target' })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new target text' })

            await wait()

            // Text nodes are wrapped in a up-wrapper container so we can
            // animate them and measure their position/size for scrolling.
            // This is not possible for container-less text nodes.
            expect(this.revealedHTML).toEqual(['<up-wrapper>new target text</up-wrapper>'])
            // Show that the wrapper is done after the insertion.
            expect('up-wrapper').not.toBeAttached()
          })

          it('reveals a new element that is being prepended', async function() {
            fixture('.target')
            up.render('.target:before', { url: '/path', scroll: 'target' })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new target text' })

            await wait()

            // Text nodes are wrapped in a up-wrapper container so we can
            // animate them and measure their position/size for scrolling.
            // This is not possible for container-less text nodes.
            expect(this.revealedHTML).toEqual(['<up-wrapper>new target text</up-wrapper>'])
            // Show that the wrapper is done after the insertion.
            expect('up-wrapper').not.toBeAttached()
          })
        })

        describe('with { scroll: "hash" }', function() {

          mockRevealBeforeEach()

          it("scrolls to the top of an element with the ID the location's #hash", async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', scroll: 'hash' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <div id="hash"></div>
              </div>
            `)

            await wait()

            expect(this.revealedHTML).toEqual(['<div id="hash"></div>'])
            expect(this.revealOptions).toEqual(jasmine.objectContaining({ top: true }))
          })

          it("scrolls to the top of an <a> element with the name of that hash", async function() {
            fixture('.target')
            up.render('.target', { url: '/path#three', scroll: 'hash' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <a name="three"></a>
              </div>
            `)

            await wait()

            expect(this.revealedHTML).toEqual(['<a name="three"></a>'])
            expect(this.revealOptions).toEqual(jasmine.objectContaining({ top: true }))
          })

          it("scrolls to a hash that includes a dot character ('.') (bugfix)", async function() {
            fixture('.target')
            up.render('.target', { url: '/path#foo.bar', scroll: 'hash' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <a name="foo.bar"></a>
              </div>
            `)

            await wait()

            expect(this.revealedHTML).toEqual(['<a name="foo.bar"></a>'])
            expect(this.revealOptions).toEqual(jasmine.objectContaining({ top: true }))
          })

          it('reveals multiple consecutive #hash targets with the same URL (bugfix)', async function() {
            fixture('.target')
            up.render('.target', { url: '/path#two', scroll: 'hash', cache: true })

            const html = `
              <div class="target">
                <div id="one">one</div>
                <div id="two">two</div>
                <div id="three">three</div>
              </div>
            `

            await wait()

            jasmine.respondWith(html)

            await wait()

            expect(this.revealedText).toEqual(['two'])

            up.render('.target', { url: '/path#three', scroll: 'hash', cache: true })

            await wait()

            expect(this.revealedText).toEqual(['two', 'three'])
          })

          it("does not scroll if there is no element with the ID of that #hash", async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', scroll: 'hash' })

            await wait()

            jasmine.respondWithSelector('.target')

            await wait()

            expect(this.revealMock).not.toHaveBeenCalled()
          })
        })

        describe('with { scroll: "top" }', function() {

          it("scrolls the updated fragment's viewport to the top", async function() {
            // viewport = fixture('[up-viewport]', { style: { 'width': '200px', 'height': '200px' }})
            // content = e.affix
            const [viewport] = htmlFixtureList(`
              <div up-viewport id="viewport" style="height: 200px; overflow-y: scroll">
                <div style="height: 1000px">
                  <div id="child">old child</div>
                </div>
              </div>
            `)

            viewport.scrollTop = 333
            await wait()

            expect(viewport.scrollTop).toBe(333)

            up.render({ fragment: '<div id="child">new child</div>', scroll: 'top' })
            await wait()

            expect('#child').toHaveText('new child')
            expect(viewport.scrollTop).toBe(0)
          })

        })

        describe('with { scroll: "bottom" }', function() {

          it("scrolls the updated fragment's viewport to the bottom", async function() {
            // viewport = fixture('[up-viewport]', { style: { 'width': '200px', 'height': '200px' }})
            // content = e.affix
            const [viewport] = htmlFixtureList(`
              <div up-viewport id="viewport" style="height: 200px; overflow-y: scroll">
                <div style="height: 1000px">
                  <div id="child">old child</div>
                </div>
              </div>
            `)

            up.render({ fragment: '<div id="child">new child</div>', scroll: 'bottom' })
            await wait()

            expect('#child').toHaveText('new child')
            expect(viewport.scrollTop).toBe(800)
          })

        })

        describe('with { scroll: "keep" }', function() {

          it('keeps scroll positions of a swapped list', async function() {
            let html = (text) => `
              <div up-viewport id="viewport" style="height: 200px; overflow-y: scroll">
                <div style="height: 1000px">
                  ${text}
                </div>
              </div>
            `
            const [viewport] = htmlFixtureList(html('old text'))
            viewport.scrollTop = 460
            await wait()

            expect(viewport).toBeScrolledTo(460)

            up.render({ fragment: html('new text'), scroll: 'keep' })
            await wait()

            expect('#viewport').toHaveText('new text')
            expect('#viewport').toBeScrolledTo(460)
          })

          it('keeps scroll positions of a swapped list that is a secondary target', async function() {
            let html = (prefix) => `
              <div up-viewport id="viewport1" style="height: 200px; overflow-y: scroll; background-color: #ff6666;">
                <div style="height: 1000px">
                  ${prefix} viewport1
                </div>
              </div>
              <div up-viewport id="viewport2" style="height: 200px; overflow-y: scroll; background-color: #66ff66;">
                <div style="height: 1000px">
                  ${prefix} viewport2
                </div>
              </div>
            `
            const [viewport1, _content1, viewport2, _content2] = htmlFixtureList(html('old'))
            viewport1.scrollTop = 123
            viewport2.scrollTop = 456

            await wait()

            expect(viewport1).toBeScrolledTo(123)
            expect(viewport2).toBeScrolledTo(456)

            up.render({ target: '#viewport1, #viewport2', document: html('new'), scroll: 'keep' })
            await wait()

            expect('#viewport1').toHaveText('new viewport1')
            expect('#viewport1').toBeScrolledTo(123)
            expect('#viewport2').toHaveText('new viewport2')
            expect('#viewport2').toBeScrolledTo(456)
          })

          it('keeps scroll positions when the location changes', async function() {
            up.history.config.enabled = true

            let html = (text) => `
              <div up-viewport id="viewport" style="height: 200px; overflow-y: scroll">
                <div style="height: 1000px">
                  ${text}
                </div>
              </div>
            `
            const [viewport] = htmlFixtureList(html('old text'))
            viewport.scrollTop = 460
            await wait()

            expect(viewport).toBeScrolledTo(460)

            up.render({ fragment: html('new text'), scroll: 'keep', history: true, location: '/location-after-swap' })
            await wait()

            expect(up.history.location).toMatchURL('/location-after-swap')
            expect('#viewport').toHaveText('new text')
            expect('#viewport').toBeScrolledTo(460)

          })

        })

        describe('with { scroll: Number } or a number-parseable string', function() {

          it('scrolls the top to the given positive position', async function() {
            let html = (text) => `
              <div up-viewport id="viewport" style="height: 200px; overflow-y: scroll">
                <div style="height: 1000px">
                  ${text}
                </div>
              </div>
            `
            const [viewport] = htmlFixtureList(html('old text'))
            viewport.scrollTop = 130
            await wait()

            expect(viewport).toBeScrolledTo(130)

            up.render({ fragment: html('new text'), scroll: 270 })
            await wait()

            expect('#viewport').toHaveText('new text')
            expect('#viewport').toBeScrolledTo(270)
          })

          it('scrolls the bottom to the given negative position', async function() {
            let html = (text) => `
              <div up-viewport id="viewport" style="height: 200px; overflow-y: scroll">
                <div style="height: 1000px">
                  ${text}
                </div>
              </div>
            `
            const [viewport] = htmlFixtureList(html('old text'))
            viewport.scrollTop = 130
            await wait()

            expect(viewport).toBeScrolledTo(130)

            up.render({ fragment: html('new text'), scroll: -50 })
            await wait()

            expect('#viewport').toHaveText('new text')
            expect('#viewport').toBeScrolledTo(1000 - 200 - 50)
          })

          it('scrolls the bottom with { scroll: -0 } (negative zero)', async function() {
            let html = (text) => `
              <div up-viewport id="viewport" style="height: 200px; overflow-y: scroll">
                <div style="height: 1000px">
                  ${text}
                </div>
              </div>
            `
            const [viewport] = htmlFixtureList(html('old text'))
            viewport.scrollTop = 130
            await wait()

            expect(viewport).toBeScrolledTo(130)

            up.render({ fragment: html('new text'), scroll: -0 })
            await wait()

            expect('#viewport').toHaveText('new text')
            expect('#viewport').toBeScrolledTo(1000 - 200)
          })

        })

        describe('with an array of { scroll } options', function() {

          mockRevealBeforeEach()

          it('tries each option until one succeeds', async function() {
            fixture('.container')
            up.render('.container', { scroll: ['hash', '.element', '.container'], content: "<div class='element'>element text</div>" })

            await wait()

            expect(this.revealedText).toEqual(['element text'])
          })
        })

        describe('with a string of comma-separated { scroll } options', function() {

          mockRevealBeforeEach()

          it('tries each option until one succeeds', async function() {
            fixture('.container')
            up.render('.container', { scroll: 'hash, .element, .container', content: "<div class='element'>element text</div>" })

            await wait()

            expect(this.revealedText).toEqual(['element text'])
          })

          it('ignores commas in parentheses', async function() {
            fixture('.container')
            up.render('.container', { scroll: 'hash, .other:not(input, select), .element:not(input, select), .container', content: "<div class='element'>element text</div>" })

            await wait()

            expect(this.revealedText).toEqual(['element text'])
          })
        })

        if (up.migrate.load) {
          describe('with a string of "or"-separated { scroll } options', function() {

            mockRevealBeforeEach()

            it('tries each option until one succeeds', async function() {
              fixture('.container')
              up.render('.container', { scroll: 'hash or .element or .container', content: "<div class='element'>element text</div>" })

              await wait()

              expect(this.revealedText).toEqual(['element text'])
            })
          })
        }

        describe('when the server responds with an error code', function() {

          mockRevealBeforeEach()

          it('ignores the { scroll } option', async function() {
            fixture('.target', { text: 'target text' })
            fixture('.other', { text: 'other text' })
            fixture('.fail-target', { text: 'fail-target text' })

            const renderJob = up.render('.target', { url: '/path', failTarget: '.fail-target', scroll: '.other' })

            await wait()

            jasmine.respondWithSelector('.fail-target', { status: 500, text: 'new fail-target text' })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(this.revealMock).not.toHaveBeenCalled()
          })

          it('accepts a { failScroll } option for error responses', async function() {
            fixture('.target', { text: 'old target text' })
            fixture('.other', { text: 'other text' })
            fixture('.fail-target', { text: 'old fail-target text' })
            const renderJob = up.render('.target', { url: '/path', failTarget: '.fail-target', scroll: false, failScroll: '.other' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="fail-target">
                  new fail-target text
                </div>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(this.revealedText).toEqual(['other text'])
          })

          it('allows to refer to the replacement { origin } as ":origin" in the { failScroll } selector', async function() {
            const $origin = $fixture('.origin').text('origin text')
            $fixture('.target').text('old target text')
            $fixture('.fail-target').text('old fail-target text')
            const renderJob = up.render('.target', { url: '/path', failTarget: '.fail-target', scroll: false, failScroll: ':origin', origin: $origin[0] })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="fail-target">
                  new fail-target text
                </div>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(this.revealedText).toEqual(['origin text'])
          })
        })

        describe('with { scrollMap } option', function() {

          mockRevealBeforeEach()

          it('allows to scroll different viewports in a multi-target update', async function() {
            htmlFixtureList(`
              <div id="viewport1" up-viewport>
                <div id="target1">old target1</div>
              </div>
              <div id="viewport2" up-viewport>
                <div id="target2">old target2</div>
              </div>
            `)

            await up.render({
              target: '#target1, #target2',
              document: `
                <div id="target1">new target1</div>
                <div id="target2">new target2</div>
              `,
              scrollMap: { '#target1': 'target', '#target2': 'target' }
            })

            expect(this.revealedText).toEqual(jasmine.arrayWithExactContents(['new target1', 'new target2']))
          })

          it('allows to scroll to absolute pixel positions', async function() {
            fixtureStyle(`
              #viewport1, #viewport2 {
                height: 150px;
                overflow-y: scroll;
              }
            `)

            fixtureStyle(`
              #target1, #target2 {
                height: 2000px;
              }
            `)

            htmlFixtureList(`
              <div id="viewport1" up-viewport>
                <div id="target1">old target1</div>
              </div>
              <div id="viewport2" up-viewport>
                <div id="target2">old target2</div>
              </div>
            `)

            await up.render({
              target: '#target1, #target2',
              document: `
                <div id="target1">new target1</div>
                <div id="target2">new target2</div>
              `,
              scrollMap: { '#target1': 123, '#target2': 456 }
            })

            expect(document.querySelector('#viewport1')).toBeScrolledTo(123)
            expect(document.querySelector('#viewport2')).toBeScrolledTo(456)
          })

          it('allows to scroll viewports that were not targeted', async function() {
            fixtureStyle(`
              #viewport1, #viewport2 {
                height: 150px;
                overflow-y: scroll;
              }
            `)

            fixtureStyle(`
              .content {
                height: 2000px;
              }
            `)

            htmlFixtureList(`
              <div id="target">
                old target
              </div>

              <div id="viewport1" up-viewport>
                <div class="content">
                  old content in viewport1
                </div>
              </div>
              <div id="viewport2" up-viewport>
                <div class="content">
                  old content in viewport2
                </div>
              </div>
            `)

            document.querySelector('#viewport1').scrollTop = 333
            document.querySelector('#viewport2').scrollTop = 444

            await up.render({
              target: '#target',
              document: `
                <div id="target">
                  new target
                </div>
              `,
              scrollMap: { '#viewport1': 'top', '#viewport2': 'bottom' }
            })

            expect('#target').toHaveText('new target')
            expect('#viewport1').toBeScrolledTo(0)
            expect('#viewport2').toBeScrolledTo(2000 - 150)
          })

          it('allows to preserve scroll positions of multiple swapped viewports', async function() {
            fixtureStyle(`
              #viewport1, #viewport2 {
                height: 150px;
                overflow-y: scroll;
              }
            `)

            fixtureStyle(`
              .content {
                height: 2000px;
              }
            `)

            htmlFixtureList(`
              <div id="viewport1" up-viewport>
                <div class="content">
                  old content in viewport1
                </div>
              </div>
              <div id="viewport2" up-viewport>
                <div class="content">
                  old content in viewport2
                </div>
              </div>
            `)

            document.querySelector('#viewport1').scrollTop = 333
            document.querySelector('#viewport2').scrollTop = 444

            await up.render({
              target: '#viewport1, #viewport2',
              document: `
                <div id="viewport1" up-viewport>
                  <div class="content">
                    new content in viewport1
                  </div>
                </div>
                <div id="viewport2" up-viewport>
                  <div class="content">
                    new content in viewport2
                  </div>
                </div>
              `,
              scrollMap: { '#viewport1': 'keep', '#viewport2': 'keep' }
            })

            expect('#viewport1').toHaveText('new content in viewport1')
            expect('#viewport1').toBeScrolledTo(333)
            expect('#viewport2').toHaveText('new content in viewport2')
            expect('#viewport2').toBeScrolledTo(444)
          })

          it('allows to match custom pseudos like :main', async function() {
            htmlFixtureList(`
              <div id="viewport" up-main>
                old main
              </div>
            `)

            await up.render({
              target: ':main',
              document: `
                <div id="viewport" up-main>
                  new main
                </div>
              `,
              scrollMap: { ':main': 'target' }
            })

            expect(this.revealedText).toEqual(jasmine.arrayWithExactContents(['new main']))

          })

          it('allows to scroll when opening an overlay', async function() {
            await up.render({
              layer: 'new modal',
              fragment: `
                <div id="root">
                  <div id="child1">
                    overlay child1
                  </div>

                  <div id="child2">
                    overlay child2
                  </div>
                </div>
              `,
              scrollMap: { '#root': '#child2' }
            })

            expect(this.revealedText).toEqual(['overlay child2'])
          })

          it('allows to scroll a hungry element on the same layer', async function() {
            htmlFixtureList(`
              <div id="viewport1" up-viewport>
                <div id="target">old target</div>
              </div>
              <div id="viewport2" up-viewport>
                <div id="hungry" up-hungry>old hungry</div>
              </div>
            `)

            await up.render({
              target: '#target',
              document: `
                <div id="target">new target</div>
                <div id="hungry" up-hungry>new hungry</div>
              `,
              scrollMap: { '#hungry': 'target' }
            })

            expect(this.revealedText).toEqual(['new hungry'])
          })

          it('overrides a { scroll } option', async function() {
            htmlFixtureList(`
              <div id="viewport1" up-viewport>
                <div id="target1">old target1</div>
                <div id="other">old other</div>
              </div>
              <div id="viewport2" up-viewport>
                <div id="target2">old target2</div>
              </div>
            `)

            await up.render({
              target: '#target1, #target2',
              document: `
                <div id="target1">new target1</div>
                <div id="target2">new target2</div>
              `,
              scroll: '#other',
              scrollMap: { '#target1': 'target', '#target2': 'target' }
            })

            expect(this.revealedText).toEqual(jasmine.arrayWithExactContents(['new target1', 'new target2']))
          })

        })

        describe('with { scrollBehavior } option', function() {

          it('animates the revealing when prepending an element', async function() {
            mockReveal.apply(this)

            fixture('.element', { text: 'version 1' })
            up.render('.element:before', {
              document: '<div class="element">version 2</div>',
              scroll: 'target',
              scrollBehavior: 'smooth'
            })

            await wait()

            expect(this.revealOptions.scrollBehavior).toEqual('smooth')
          })

          it('animates the revealing when appending an element', async function() {
            mockReveal.apply(this)

            fixture('.element', { text: 'version 1' })
            up.render('.element:after', {
              document: '<div class="element">version 2</div>',
              scroll: 'target',
              scrollBehavior: 'smooth'
            })

            await wait()

            expect(this.revealOptions.scrollBehavior).toEqual('smooth')
          })

          it('animates the revealing when swapping out an element', async function() {
            const highElement = fixture('.high', { style: { height: '30000px' } }) // ensure we can scroll

            fixture('.element', { text: 'version 1' })
            up.render('.element', {
              document: '<div class="element" style="position: absolute; top: 20000px; height: 100px; background-color: yellow">version 2</div>',
              scroll: 'target',
              scrollBehavior: 'smooth'
            })

            await wait(80)

            const finalScrollTop = 20000 - document.scrollingElement.clientHeight + 100
            expect(document.scrollingElement.scrollTop).toBeGreaterThan(10)
            expect(document.scrollingElement.scrollTop).toBeLessThan(finalScrollTop - 10)

            await wait(1500)

            expect(document.scrollingElement.scrollTop).toBe(finalScrollTop)
          })
        })

        describe('with { scroll: "restore" } option', function() {

          beforeEach(function() {
            up.history.config.enabled = true
          })

          it("restores the scroll positions of the target's viewport", async function() {
            const $viewport = $fixture('.viewport[up-viewport] .element').css({
              'height': '100px',
              'width': '100px',
              'overflow-y': 'scroll'
            })

            const respond = () => {
              jasmine.respondWith({
                status: 200,
                contentType: 'text/html',
                responseText: '<div class="element" style="height: 300px"></div>'
              })
            }

            up.render('.element', { url: '/foo', history: true })
            await wait()

            respond()
            await wait()

            $viewport.scrollTop(65)
            up.render('.element', { url: '/bar', history: true })
            await wait()

            respond()
            await wait()

            $viewport.scrollTop(10)
            up.render('.element', { url: '/foo', scroll: 'restore', history: true })

            await wait()

            respond()
            await wait()

            expect($viewport.scrollTop()).toBeAround(65, 1)
          })
        })

        describe('when rendering nothing', function() {

          mockRevealBeforeEach()

          it('still processes a { scroll } option', function() {
            fixture('.other', { text: 'other' })

            fixture('main', { text: 'main' })
            expect('main').not.toBeFocused()

            up.render(':none', { scroll: 'main', document: '<div></div>' })

            expect(this.revealedText).toEqual(['main'])
          })

          it('does not crash with { scroll: "target" }', function(done) {
            const promise = up.render(':none', { scroll: 'target', document: '<div></div>' })

            u.task(() => promiseState(promise).then(function(result) {
              expect(result.state).toBe('fulfilled')
              done()
            }))
          })
        })

        describe('with a function passed as { scroll } option', function() {

          it('calls the function', function() {
            const scrollHandler = jasmine.createSpy('scroll handler')
            fixture('.element', { content: 'old text' })

            up.render('.element', { content: 'new text', scroll: scrollHandler })

            expect('.element').toHaveText('new text')
            expect(scrollHandler).toHaveBeenCalled()
          })


          it('calls the function after all targets were updated', async function() {
            fixtureStyle(`
              #viewport1, #viewport2 {
                height: 150px;
                overflow-y: scroll;
              }
            `)

            fixtureStyle(`
              .content {
                height: 2000px;
              }
            `)

            let html = (prefix) => `
              <div id="viewport1" up-viewport>
                <div class="content">
                  ${prefix} content in viewport1
                </div>
              </div>
              <div id="viewport2" up-viewport>
                <div class="content">
                  ${prefix} content in viewport2
                </div>
              </div>
            `

            htmlFixtureList(html('old'))

            document.querySelector('#viewport1').scrollTop = 333
            document.querySelector('#viewport2').scrollTop = 444

            let scrollSpy = jasmine.createSpy('scroll spy')

            let scrollFn = () => {
              let viewport1 = document.querySelector('#viewport1')
              let viewport2 = document.querySelector('#viewport2')

              scrollSpy(
                viewport1.textContent.trim(),
                viewport2.textContent.trim()
              )

              viewport1.scrollTop = 555
              viewport2.scrollTop = 666
            }

            await up.render({
              target: '#viewport1, #viewport2',
              document: html('new'),
              scroll: scrollFn
            })

            expect(scrollSpy).toHaveBeenCalledWith('new content in viewport1', 'new content in viewport2')
            expect('#viewport1').toBeScrolledTo(555)
            expect('#viewport2').toBeScrolledTo(666)
          })


          it('does not crash the render pass and emits an error event if the function throws', async function() {
            const scrollError = new Error('error in scroll handler')
            const scrollHandler = jasmine.createSpy('scroll handler').and.throwError(scrollError)
            fixture('.element', { content: 'old text' })

            await jasmine.expectGlobalError(scrollError, async function() {
              const job = up.render('.element', { content: 'new text', scroll: scrollHandler })

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              expect('.element').toHaveText('new text')
              expect(scrollHandler).toHaveBeenCalled()
            })
          })
        })
      })

    })

  })

})
