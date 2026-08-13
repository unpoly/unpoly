const u = up.util
const e = up.element
const $ = jQuery

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('choice of target', function() {

        it('uses a selector given as { target } option', function() {
          const one = fixture('.one', { text: 'old one' })
          const two = fixture('.two', { text: 'old two' })

          up.render({ target: '.two', content: 'new two' })

          expect('.one').toHaveText('old one')
          expect('.two').toHaveText('new two')
        })

        it('accepts an array of selector alternatives as { target } option', function() {
          const one = fixture('.one', { text: 'old one' })
          const two = fixture('.two', { text: 'old two' })

          up.render({ target: ['.four', '.three', '.two', '.one'], document: '<div class="two">new two</div>' })

          expect('.one').toHaveText('old one')
          expect('.two').toHaveText('new two')
        })

        it('uses a selector given as first argument')

        it('derives a selector from an element given as first argument', async function() {
          const element = fixture('#element')

          up.render(element, { url: '/path' })

          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#element')
        })

        it('uses a default target for the layer that is being updated if no other option suggests a target')

        it("ignores an element that matches the selector but also matches .up-destroying", async function() {
          const document = '<div class="foo-bar">text</div>'
          $fixture('.foo-bar.up-destroying')
          const promise = up.render('.foo-bar', { document })

          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
        })

        it("ignores an element that matches the selector but also has a parent matching .up-destroying", async function() {
          const document = '<div class="foo-bar">text</div>'
          const $parent = $fixture('.up-destroying')
          const $child = $fixture('.foo-bar').appendTo($parent)
          const promise = up.render('.foo-bar', { document })

          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
        })

        it('only replaces the first element matching the selector', async function() {
          const document = '<div class="foo-bar">text</div>'
          $fixture('.foo-bar')
          $fixture('.foo-bar')
          up.render('.foo-bar', { document })

          await wait()

          const $elements = $('.foo-bar')
          expect($($elements.get(0)).text()).toEqual('text')
          expect($($elements.get(1)).text()).toEqual('')
        })

        it('replaces the body if asked to replace the "html" selector')

        describe('updating children', function() {

          it('replaces the children with :content, but keeps the element itself', function() {
            const oldTarget = fixture('#target', { 'old-attr': '' })
            e.affix(oldTarget, '.child', { text: 'old child' })
            up.render('#target:content', { document: `
              <div id='target' new-attr>
                <div class='child'>new child</div>
              </div>
            `
            })

            const newTarget = document.querySelector('#target')
            expect(newTarget).toBe(oldTarget)
            expect(newTarget).toHaveAttribute('old-attr')

            expect(newTarget).not.toHaveText('old child')
            expect(newTarget).toHaveText('new child')
          })

          it('returns an up.RenderResult with only the new children', async function() {
            let target = fixture('#target', { 'old-attr': '' })
            e.affix(target, '.child', { text: 'old child' })
            const result = await up.render('#target:content', { document: `
              <div id='target' new-attr>
                <div class='child'>new child</div>
              </div>
            `
            })

            expect('#target').toHaveText('new child')
            expect(result.ok).toBe(true)
            expect(result.fragments.length).toBe(1)
            expect(result.fragments[0]).toMatchSelector('.child')
          })
        })

        describe('appending and prepending', function() {

          it('prepends instead of replacing when the target has a :before pseudo-selector', async function() {
            const target = fixture('.target')
            e.affix(target, '.child', { text: 'old' })
            up.render('.target:before', { document: `
              <div class='target'>
                <div class='child'>new</div>
              </div>
            `
            })

            await wait()

            const children = target.querySelectorAll('.child')
            expect(children.length).toBe(2)
            expect(children[0]).toHaveText('new')
            expect(children[1]).toHaveText('old')
          })

          it('appends instead of replacing when the target has a :after pseudo-selector', async function() {
            const target = fixture('.target')
            e.affix(target, '.child', { text: 'old' })
            up.render('.target:after', { document: `
              <div class='target'>
                <div class='child'>new</div>
              </div>
            `
            })

            await wait()

            const children = target.querySelectorAll('.child')
            expect(children.length).toBe(2)
            expect(children[0]).toHaveText('old')
            expect(children[1]).toHaveText('new')
          })

          it('returns an up.RenderResult with only the appended elements', async function() {
            const target = fixture('.target')
            e.affix(target, '.child', { text: 'old' })
            const result = await up.render('.target:after', { document: `
              <div class='target'>
                <div class='child'>new</div>
              </div>
            `
            })

            expect(result.ok).toBe(true)
            expect(result.fragments.length).toBe(1)
            expect(result.fragments[0]).toMatchSelector('.child')
          })

          it("lets the developer choose between replacing/prepending/appending for each selector", async function() {
            fixture('.before', { text: 'old-before' })
            fixture('.middle', { text: 'old-middle' })
            fixture('.after', { text: 'old-after' })
            up.render('.before:before, .middle, .after:after', { document: `
              <div class="before">new-before</div>
              <div class="middle">new-middle</div>
              <div class="after">new-after</div>
            `
            })

            await wait()

            expect('.before').toHaveText('new-beforeold-before')
            expect('.middle').toHaveText('new-middle')
            expect('.after').toHaveText('old-afternew-after')
          })

          it('replaces multiple selectors separated with a comma', async function() {
            fixture('.before', { text: 'old-before' })
            fixture('.middle', { text: 'old-middle' })
            fixture('.after', { text: 'old-after' })

            up.render('.middle, .after', { document: `
              <div class="before">new-before</div>
              <div class="middle">new-middle</div>
              <div class="after">new-after</div>
            `
            })

            await wait()

            expect('.before').toHaveText('old-before')
            expect('.middle').toHaveText('new-middle')
            expect('.after').toHaveText('new-after')
          })
        })

        describe('optional targets', function() {

          it('uses a target with a :maybe pseudo-selector if it is found in the response', async function() {
            fixture('.foo', { text: 'old foo' })
            fixture('.bar', { text: 'old bar' })

            up.render('.foo:maybe, .bar', {
              document: `
                <div class="foo">new foo</div>
                <div class="bar">new bar</div>
              `
            })

            await wait()

            expect('.foo').toHaveText('new foo')
            expect('.bar').toHaveText('new bar')
          })

          it('allows the combination :has(.selector):maybe (bugfix)', async function() {
            htmlFixtureList(`
                <div class="foo"><span>old foo</span></div>
                <div class="bar">old bar</div>
            `)

            up.render('.foo:has(span):maybe, .bar', {
              document: `
                <div class="foo"><span>new foo</span></div>
                <div class="bar">new bar</div>
              `
            })

            await wait()

            expect('.foo').toHaveText('new foo')
            expect('.bar').toHaveText('new bar')
          })

          it('does not impede the render pass if the :maybe target is missing from the response', async function() {
            fixture('.foo', { text: 'old foo' })
            fixture('.bar', { text: 'old bar' })

            const promise = up.render('.foo:maybe, .bar', {
              document: `
                <div class="bar">new bar</div>
              `
            })

            await wait()
            const { state } = await promiseState(promise)

            expect(state).toBe('fulfilled')
            expect('.foo').toHaveText('old foo')
            expect('.bar').toHaveText('new bar')
          })

          it('does not impede the render pass if the :maybe target is missing from the current page', async function() {
            fixture('.bar', { text: 'old bar' })

            const promise = up.render('.foo:maybe, .bar', {
              document: `
                <div class="foo">new foo</div>
                <div class="bar">new bar</div>
              `
            })

            await expectAsync(promise).toBeResolved()

            expect(document).not.toHaveSelector('.foo')
            expect('.bar').toHaveText('new bar')
          })

          it('includes a :maybe target in the X-Up-Target header if it can be matched in the current page', async function() {
            fixture('.foo', { text: 'old foo' })
            fixture('.bar', { text: 'old bar' })

            const promise = up.render('.foo:maybe, .bar', { url: '/my-page' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.foo, .bar')
          })

          it('omits a :maybe target from the X-Up-Target header if it cannot be matched in the current page', async function() {
            fixture('.bar', { text: 'old bar' })

            const promise = up.render('.foo:maybe, .bar', { url: '/some-page' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.bar')
          })

          it('allows to combine :maybe and :after pseudo-selectors')
        })

        describe('matching old fragments around the origin', function() {

          it('prefers to match an element closest to origin', async function() {
            htmlFixture(`
              <div class="element" id="root">
                <div class="element">old one</div>
                <div class="element">
                  old two
                  <span class="origin"></span>
                </div>
                <div class="element">old three</div>
              </div>
            `)

            const origin = document.querySelector('.origin')
            up.render('.element', { origin, content: 'new text' })

            await wait()

            const elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            // While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')
            expect(elements[0]).not.toHaveText('new text')

            // One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            // Two is the closest match around the origin
            expect(elements[2]).toHaveText('new text')

            // Three is a sibling of three
            expect(elements[3]).toHaveText('old three')
          })

          it('updates the first matching element with { match: "first" }', async function() {
            htmlFixture(`
              <div id="root">
                <div class="element">old one</div>
                <div class="element">
                  old two
                  <span class="origin"></span>
                </div>
                <div class="element">old three</div>
              </div>
            `)

            const origin = document.querySelector('.origin')
            up.render('.element', { origin, content: 'new text', match: 'first' })

            await wait()

            const elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(3)

            expect(elements[0]).toHaveText('new text')
            expect(elements[1]).toHaveText('old two')
            expect(elements[2]).toHaveText('old three')
          })

          it('prefers to match an element closest to origin when the origin was swapped and then revalidating (bugfix)', async function() {
            up.request('/home', { target: '.element', cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWith(`
              <div class="element">
                new text from cache
                <span class="origin"></span>
              </div>
            `)

            await wait()

            expect({ url: '/home', target: '.element' }).toBeCached()

            htmlFixture(`
              <div class="element" id="root">
                <div class="element">old one</div>
                <div class="element">
                  old two
                  <span class="origin"></span>
                </div>
                <div class="element">old three</div>
              </div>
            `)

            const origin = document.querySelector('.origin')
            up.render('.element', { origin, url: '/home', cache: true, revalidate: true })

            await wait()

            let elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            // While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')
            expect(elements[0]).not.toHaveText('new text from cache')

            // One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            // Two is the closest match around the origin
            expect(elements[2]).toHaveText('new text from cache')

            // The origin was detached when two was swapped
            expect(origin).toBeDetached()

            // Three is a sibling of three
            expect(elements[3]).toHaveText('old three')

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)
            jasmine.respondWith(`
              <div class="element">revalidated new text</div>
            `)

            await wait()

            elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            // While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')
            expect(elements[0]).not.toHaveText('revalidated new text')

            // One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            // Two is the closest match around the origin
            expect(elements[2]).toHaveText('revalidated new text')

            // Three is a sibling of three
            expect(elements[3]).toHaveText('old three')
          })

          it('prefers to match an element closest to origin when the origin was swapped and then revalidating when the origin has no derivable target (bugfix)', async function() {
            up.request('/home', { target: '.element', cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWith(`
              <div class="element">
                new text from cache
                <span>origin</span>
              </div>
            `)

            await wait()

            expect({ url: '/home', target: '.element' }).toBeCached()

            htmlFixture(`
              <div class="element" id="root">
                <div class="element">old one</div>
                <div class="element">
                  old two
                  <span>origin</span>
                </div>
                <div class="element">old three</div>
              </div>
            `)

            const origin = document.querySelector('.element .element span')
            expect(origin).not.toBeTargetable()

            up.render('.element', { origin, url: '/home', cache: true, revalidate: true })

            await wait()

            let elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            // While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')
            expect(elements[0]).not.toHaveText('new text from cache')

            // One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            // Two is the closest match around the origin
            expect(elements[2]).toHaveText('new text from cache origin')

            // The origin was detached when two was swapped
            expect(origin).toBeDetached()

            // Three is a sibling of three
            expect(elements[3]).toHaveText('old three')

            expect(jasmine.Ajax.requests.count()).toBe(2)
            jasmine.respondWith(`
              <div class="element">
                revalidated new text
                <span>origin</span>
              </div>
            `)

            await wait()

            elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            // While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')
            expect(elements[0]).not.toHaveText('revalidated new text')

            // One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            // Two is the closest match around the origin
            expect(elements[2]).toHaveText('revalidated new text origin')

            // Three is a sibling of three
            expect(elements[3]).toHaveText('old three')
          })

          it('prefers to match a descendant selector in the region of the origin', async function() {
            const element1 = fixture('.element')
            const element1Child1 = e.affix(element1, '.child', { text: 'old element1Child1' })
            const element1Child2 = e.affix(element1, '.child.sibling', { text: 'old element1Child2' })

            const element2 = fixture('.element')
            const element2Child1 = e.affix(element2, '.child', { text: 'old element2Child1' })
            const element2Child2 = e.affix(element2, '.child.sibling', { text: 'old element2Child2' })

            up.render('.element .sibling', { origin: element2Child1, document: `
              <div class="element">
                <div class="child sibling">new text</div>
              </div>
            ` })

            await wait()

            const children = document.querySelectorAll('.child')

            expect(children.length).toBe(4)

            expect(children[0]).toHaveText('old element1Child1')
            expect(children[1]).toHaveText('old element1Child2')

            expect(children[2]).toHaveText('old element2Child1')
            expect(children[3]).toHaveText('new text')
          })

          it('prefers to match a descendant selector in the region of the origin when revalidating (bugfix)', async function() {
            up.request({ url: '/page', target: '.element .sibling', cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)

            jasmine.respondWith(`
              <div class="element">
                <div class="child sibling">new text from cache</div>
              </div>
            `)

            await wait()

            expect({ url: '/page', target: '.element .sibling' }).toBeCached()

            const element1 = fixture('.element')
            const element1Child1 = e.affix(element1, '.child', { text: 'old element1Child1' })
            const element1Child2 = e.affix(element1, '.child.sibling', { text: 'old element1Child2' })

            const element2 = fixture('.element')
            const element2Child1 = e.affix(element2, '.child', { text: 'old element2Child1' })
            const element2Child2 = e.affix(element2, '.child.sibling', { text: 'old element2Child2' })

            up.render('.element .sibling', { url: 'page', origin: element2Child1, cache: true, revalidate: true })

            await wait()

            let children = document.querySelectorAll('.child')
            expect(children.length).toBe(4)
            expect(children[0]).toHaveText('old element1Child1')
            expect(children[1]).toHaveText('old element1Child2')
            expect(children[2]).toHaveText('old element2Child1')
            expect(children[3]).toHaveText('new text from cache')

            expect(jasmine.Ajax.requests.count()).toBe(2)

            jasmine.respondWith(`
              <div class="element">
                <div class="child sibling">revalidated text</div>
              </div>
            `)

            await wait()

            children = document.querySelectorAll('.child')
            expect(children.length).toBe(4)
            expect(children[0]).toHaveText('old element1Child1')
            expect(children[1]).toHaveText('old element1Child2')
            expect(children[2]).toHaveText('old element2Child1')
            expect(children[3]).toHaveText('revalidated text')
          })

          it('allows ambiguous target derivation if it becomes clear given an origin', async function() {
            const root = fixture('.element#root')
            const one = e.affix(root, '.element', { text: 'old one' })
            const two = e.affix(root, '.element', { text: 'old two' })
            const childOfTwo = e.affix(two, '.origin')
            const three = e.affix(root, '.element', { text: 'old three' })

            up.render(two, { origin: childOfTwo, content: 'new text' })

            await wait()

            const elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            // While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')

            // One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            // Two is the closest match around the origin (childOfTwo)
            expect(elements[2]).toHaveText('new text')

            // Three is a sibling of three
            expect(elements[3]).toHaveText('old three')
          })

          it('rediscovers the { origin } in the new content and prefers matching an element closest to the rediscovered origin', function() {
            const root = fixture('.element#root')
            const one = e.affix(root, '.element', { text: 'old one' })
            const two = e.affix(root, '.element', { text: 'old two' })
            const childOfTwo = e.affix(two, '.origin')
            const three = e.affix(root, '.element', { text: 'old three' })

            const newHTML = root.outerHTML.replace(/old/g, 'new')

            up.render('.element', { origin: childOfTwo, document: newHTML })

            const elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            // While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')

            // One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            // Two is the closest match around the origin (childOfTwo)
            expect(elements[2]).toHaveText('new two')

            // Three is a sibling of three
            expect(elements[3]).toHaveText('old three')
          })

          it('uses the first match in the new content if the { origin } cannot be rediscovered in the new content', function() {
            const root = fixture('#root')
            const one = e.affix(root, '.element', { text: 'old one' })
            const two = e.affix(root, '.element', { text: 'old two' })
            const childOfTwo = e.affix(two, '.origin')
            const three = e.affix(root, '.element', { text: 'old three' })

            const newHTML = root.outerHTML.replace(/old/g, 'new').replace('origin', 'not-origin')

            up.render('.element', { origin: childOfTwo, document: newHTML })

            const elements = document.querySelectorAll('.element')

            expect(elements.length).toBe(3)

            // In the old content we could find a match oround the origin, so we're changing "two".
            // We could not rediscover the origin in the new content, so the first match ("one") is used.
            expect(elements[0]).toHaveText('old one')
            expect(elements[1]).toHaveText('new one')
            expect(elements[2]).toHaveText('old three')
          })

          it('swaps an element with target ".attendee-8993501089:maybe" (bugfix)', async function() {
            htmlFixtureList(`
              <div class="element attendee-1">
                old one
              </div>

              <div class="element attendee-8993501089">
                old two
                <span class="origin"></span>
              </div>

              <div class="element attendee-3">
                old three
              </div>
            `)

            const origin = document.querySelector('.origin')
            up.render('.attendee-8993501089:maybe', { origin, content: 'new text' })

            await wait()

            const elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(3)

            expect(elements[0]).toHaveText('old one')
            expect(elements[1]).toHaveText('new text')
            expect(elements[2]).toHaveText('old three')
          })


          it('processes the (redundant) target ".container:has(:origin) .selector:maybe" (bugfix)', function() {
            const element1 = fixture('.element#element1')
            const element1Child1 = e.affix(element1, '.child', { text: 'old element1Child1' })
            const element1Child2 = e.affix(element1, '.child.sibling', { text: 'old element1Child2' })

            const element2 = fixture('.element#element2')
            const element2Child1 = e.affix(element2, '#origin.child', { text: 'old element2Child1' })
            const element2Child2 = e.affix(element2, '.child.sibling', { text: 'old element2Child2' })

            up.render({ target: '.element:has(:origin) .sibling:maybe', origin: element2Child1, document: `
              <div class="element" id="element2">
                <div class="child" id="origin"></div>
                <div class="child sibling">new text</div>
              </div>
            ` })

            const children = document.querySelectorAll('.child')
            expect(children.length).toBe(4)
            expect(children[0]).toHaveText('old element1Child1')
            expect(children[1]).toHaveText('old element1Child2')
            expect(children[2]).toHaveText('old element2Child1')
            expect(children[3]).toHaveText('new text')
          })

        })

        describe('non-standard selector extensions', function() {

          describe(':has()', function() {
            it('matches elements with a given descendant', async function() {
              const $first = $fixture('.boxx#first')
              const $firstChild = $('<span class="first-child">old first</span>').appendTo($first)
              const $second = $fixture('.boxx#second')
              const $secondChild = $('<span class="second-child">old second</span>').appendTo($second)

              up.navigate('.boxx:has(.second-child)', { url: '/path' })

              await wait()

              jasmine.respondWith(`
                <div class="boxx" id="first">
                  <span class="first-child">new first</span>
                </div>
                <div class="boxx" id="second">
                  <span class="second-child">new second</span>
                </div>
              `)

              await wait()

              expect('#first span').toHaveText('old first')
              expect('#second span').toHaveText('new second')
            })
          })

          describe(':layer', function() {
            it('matches the first swappable element in a layer', async function() {
              up.render(':layer', { url: '/path' })

              await wait()

              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('body')
            })
          })

          describe(':main', function() {
            it('matches a main selector in a layer', async function() {
              const main = fixture('.main-element')
              up.layer.config.root.mainTargets = ['.main-element']
              up.render(':main', { url: '/path' })

              await wait()

              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.main-element')
            })
          })

          describe(':none', function() {
            it('contacts the server but does not update any fragment', async function() {
              fixture('.one', { text: 'old one' })
              fixture('.two', { text: 'old two' })

              const promise = up.render({ target: ':none', url: '/path' })

              await wait()

              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual(':none')
              jasmine.respondWith({ responseText: '', contentType: 'text/plain' })

              await wait()

              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('old two')

              await expectAsync(promise).toBeResolved()
            })

            it('returns an up.RenderResult that is #none and #ok', async function() {
              fixture('.one', { text: 'old one' })
              fixture('.two', { text: 'old two' })

              const renderOptions = { target: ':none', url: '/path' }
              const promise = up.render(renderOptions)

              await wait()

              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual(':none')
              jasmine.respondWith({ responseText: '', contentType: 'text/plain' })

              await wait()

              await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(promise).toBeResolvedTo(jasmine.objectContaining({
                ok: true,
                none: true,
                fragments: [],
                fragment: undefined,
                target: ':none',
                renderOptions: jasmine.objectContaining({ target: ':none', url: '/path' }),
              }))
            })

          })
        })

        describe('merging of nested selectors', function() {

          it('replaces a single fragment if a selector contains a subsequent selector in the current page', async function() {
            const $outer = $fixture('.outer').text('old outer text')
            const $inner = $outer.affix('.inner').text('old inner text')

            const replacePromise = up.render('.outer, .inner', { url: '/path' })
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

            jasmine.respondWith(`
              <div class="outer">
                new outer text
                <div class="inner">
                  new inner text
                </div>
              </div>
            `)
            await wait()

            expect('.outer').toBeAttached()
            expect($('.outer').text()).toContain('new outer text')
            expect('.inner').toBeAttached()
            expect($('.inner').text()).toContain('new inner text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('replaces a single fragment if a selector is contained by a subsequent selector in the current page', async function() {
            const $outer = $fixture('.outer').text('old outer text')
            const $inner = $outer.affix('.inner').text('old inner text')

            const replacePromise = up.render('.inner, .outer', { url: '/path' })
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

            jasmine.respondWith(`
              <div class="outer">
                new outer text
                <div class="inner">
                  new inner text
                </div>
              </div>
            `)
            await wait()

            expect('.outer').toBeAttached()
            expect($('.outer').text()).toContain('new outer text')
            expect('.inner').toBeAttached()
            expect($('.inner').text()).toContain('new inner text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('does not merge selectors if a selector contains a subsequent selector, but prepends instead of replacing', async function() {
            const $outer = $fixture('.outer').text('old outer text')
            const $inner = $outer.affix('.inner').text('old inner text')

            const replacePromise = up.render('.outer:before, .inner', { url: '/path' })
            await wait()

            // Placement pseudo-selectors are removed from X-Up-Target
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer, .inner')

            jasmine.respondWith(`
              <div class="outer">
                new outer text
                <div class="inner">
                  new inner text
                </div>
              </div>
            `)
            await wait()

            expect('.outer').toBeAttached()
            expect($('.outer').text()).toContain('new outer text')
            expect($('.outer').text()).toContain('old outer text')
            expect('.inner').toBeAttached()
            expect($('.inner').text()).toContain('new inner text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('does not merge selectors if a selector contains a subsequent selector, but appends instead of replacing', async function() {
            const $outer = $fixture('.outer').text('old outer text')
            const $inner = $outer.affix('.inner').text('old inner text')

            const replacePromise = up.render('.outer:after, .inner', { url: '/path' })
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer, .inner')

            jasmine.respondWith(`
              <div class="outer">
                new outer text
                <div class="inner">
                  new inner text
                </div>
              </div>
            `)
            await wait()

            expect('.outer').toBeAttached()
            expect($('.outer').text()).toContain('old outer text')
            expect($('.outer').text()).toContain('new outer text')
            expect('.inner').toBeAttached()
            expect($('.inner').text()).toContain('new inner text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('replaces a single fragment if a selector contains a previous selector in the current page', async function() {
            const $outer = $fixture('.outer').text('old outer text')
            const $inner = $outer.affix('.inner').text('old inner text')

            const replacePromise = up.render('.outer, .inner', { url: '/path' })
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

            jasmine.respondWith(`
              <div class="outer">
                new outer text
                <div class="inner">
                  new inner text
                </div>
              </div>
            `)
            await wait()

            expect('.outer').toBeAttached()
            expect($('.outer').text()).toContain('new outer text')
            expect('.inner').toBeAttached()
            expect($('.inner').text()).toContain('new inner text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('does not lose a { scroll } option if the first selector was merged into a subsequent selector', async function() {
            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

            const $outer = $fixture('.outer').text('old outer text')
            const $inner = $outer.affix('.inner').text('old inner text')

            up.render('.inner, .outer', { url: '/path', scroll: '.revealee' })
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

            jasmine.respondWith(`
              <div class="outer">
                new outer text
                <div class="inner">
                  new inner text
                  <div class="revealee">
                    revealee text
                  </div>
                </div>
              </div>
            `)
            await wait()

            expect('.outer').toBeAttached()
            expect($('.outer').text()).toContain('new outer text')
            expect('.inner').toBeAttached()
            expect($('.inner').text()).toContain('new inner text')

            expect(revealStub).toHaveBeenCalled()
            const revealArg = revealStub.calls.mostRecent().args[0]
            expect(revealArg).toMatchSelector('.revealee')
          })

          it('replaces a single fragment if the nesting differs in current page and response', async function() {
            const $outer = $fixture('.outer').text('old outer text')
            const $inner = $outer.affix('.inner').text('old inner text')

            const replacePromise = up.render('.outer, .inner', { url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="inner">
                new inner text
                <div class="outer">
                  new outer text
                </div>
              </div>
            `)
            await wait()

            expect('.outer').toBeAttached()
            expect($('.outer').text()).toContain('new outer text')
            expect('.inner').not.toBeAttached()

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('does not crash if two selectors that are siblings in the current page are nested in the response', async function() {
            const $outer = $fixture('.one').text('old one text')
            const $inner = $fixture('.two').text('old two text')

            const replacePromise = up.render('.one, .two', { url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="one">
                new one text
                <div class="two">
                  new two text
                </div>
              </div>
            `)
            await wait()

            expect('.one').toBeAttached()
            expect($('.one').text()).toContain('new one text')
            expect('.two').toBeAttached()
            expect($('.two').text()).toContain('new two text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('does not crash if selectors that siblings in the current page are inversely nested in the response', async function() {
            const $outer = $fixture('.one').text('old one text')
            const $inner = $fixture('.two').text('old two text')

            const replacePromise = up.render('.one, .two', { url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="two">
                new two text
                <div class="one">
                  new one text
                </div>
              </div>
            `)
            await wait()

            expect('.one').toBeAttached()
            expect($('.one').text()).toContain('new one text')
            expect('.two').toBeAttached()
            expect($('.two').text()).toContain('new two text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('updates the first selector if the same element is targeted twice in a single replacement', async function() {
            const $one = $fixture('.one.alias').text('old one text')

            const replacePromise = up.render('.one, .alias', { url: '/path' })
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.one')

            jasmine.respondWith(`
              <div class="one">
                new one text
              </div>
            `)
            await wait()

            expect('.one').toBeAttached()
            expect($('.one').text()).toContain('new one text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it('updates the first selector if the same element is prepended or appended twice in a single replacement', async function() {
            const $one = $fixture('.one').text('old one text')

            const replacePromise = up.render('.one:before, .one:after', { url: '/path' })
            await wait()

            // Placement pseudo-selectors are removed from X-Up-Target
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.one')

            jasmine.respondWith(`
              <div class="one">
                new one text
              </div>
            `)
            await wait()

            expect('.one').toBeAttached()
            expect($('.one').text()).toMatchText('new one text old one text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })

          it("updates the first selector if the same element is prepended, replaced and appended in a single replacement", async function() {
            const $elem = $fixture('.elem.alias1.alias2').text("old text")

            const replacePromise = up.render('.elem:before, .alias1, .alias2:after', { url: '/path' })
            await wait()

            // Placement pseudo-selectors are removed from X-Up-Target
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.elem')

            jasmine.respondWith(`
              <div class="elem alias1 alias2">
                new text
              </div>
            `)
            await wait()

            expect('.elem').toBeAttached()
            expect($('.elem').text()).toMatchText('new text old text')

            const promise = promiseState(replacePromise)
            const result = await promise
            expect(result.state).toEqual('fulfilled')
          })
        })

        describe('when selectors are missing on the page before the request was made', function() {

          beforeEach(function() {
            // In helpers/protect_jasmine_runner we have configured <default-fallback>
            // as a default target for all layers.
            up.layer.config.any.mainTargets = []
          })

          it('tries selectors from options.fallback before making a request', async function() {
            $fixture('.box').text('old box')
            up.render('.unknown', { url: '/path', fallback: '.box' })

            await wait()

            jasmine.respondWith(`
              <div class="box">new box</div>
            `)
            await wait()

            expect('.box').toHaveText('new box')
          })

          it('rejects the promise with up.CannotMatch if all alternatives are exhausted', async function() {
            const promise = up.render('.unknown', { url: '/path', fallback: '.more-unknown' })

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError('up.CannotMatch', /Could not find target in current page/i))
          })

          it('allows the request and does not reject if the { target } can be matched, but { failTarget } cannot', async function() {
            fixture('.success')

            const promise = up.render('.success', { url: '/path', failTarget: '.failure' })

            await wait()

            // Allow the request. In the common case that the request is successful, we would have aborted for no reason.
            // We can still throw if the server does end up responding with a failure.
            await expectAsync(promise).toBePending()
            expect(jasmine.Ajax.requests.count()).toBe(1)

            // When the server does end up responding with a failure, we cannot process it and must throw up.CannotMatch.
            jasmine.respondWithSelector('.failure', { status: 500 })
            await expectAsync(promise).toBeRejectedWith(jasmine.anyError('up.CannotMatch', /Could not find( common)? target/i))
          })

          it('considers a union selector to be missing if one of its selector-atoms are missing', async function() {
            $fixture('.target').text('old target')
            $fixture('.fallback').text('old fallback')
            up.render('.target, .unknown', { url: '/path', fallback: '.fallback' })

            await wait()

            jasmine.respondWith(`
              <div class="target">new target</div>
              <div class="fallback">new fallback</div>
            `)
            await wait()

            expect('.target').toHaveText('old target')
            expect('.fallback').toHaveText('new fallback')
          })

          it("tries the layer's main target with { fallback: true }", async function() {
            up.layer.config.any.mainTargets = ['.existing']
            $fixture('.existing').text('old existing')
            up.render('.unknown', { url: '/path', fallback: true })

            await wait()

            jasmine.respondWith(`
              <div class="existing">new existing</div>
            `)
            await wait()

            expect('.existing').toHaveText('new existing')
          })

          it("does not try the layer's default targets and rejects the promise with { fallback: false }", async function() {
            up.layer.config.any.mainTargets = ['.existing']
            $fixture('.existing').text('old existing')
            await expectAsync(
              up.render('.unknown', { url: '/path', fallback: false })
            ).toBeRejectedWith(
              jasmine.anyError(/Could not find target in current page/i)
            )
          })
        })

        describe('when selectors are missing on the page after the request was made', function() {

          beforeEach(function() { up.layer.config.any.mainTargets = [] })

          it('tries the selector in options.fallback before swapping elements', async function() {
            const $target = $fixture('.target').text('old target')
            const $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', { url: '/path', fallback: '.fallback' })
            $target.remove()

            await wait()

            jasmine.respondWith(`
              <div class="target">new target</div>
              <div class="fallback">new fallback</div>
            `)

            await wait()

            expect('.fallback').toHaveText('new fallback')
          })

          it('rejects the promise if all alternatives are exhausted', async function() {
            const $target = $fixture('.target').text('old target')
            const $fallback = $fixture('.fallback').text('old fallback')
            const promise = up.render('.target', { url: '/path', fallback: '.fallback' })

            await wait()

            $target.remove()
            $fallback.remove()

            jasmine.respondWith(`
              <div class="target">new target</div>
              <div class="fallback">new fallback</div>
            `)

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
          })

          it('considers a union selector to be missing if one of its selector-atoms are missing', async function() {
            const $target = $fixture('.target').text('old target')
            const $target2 = $fixture('.target2').text('old target2')
            const $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target, .target2', { url: '/path', fallback: '.fallback' })
            $target2.remove()

            await wait()

            jasmine.respondWith(`
              <div class="target">new target</div>
              <div class="target2">new target2</div>
              <div class="fallback">new fallback</div>
            `)

            await wait()

            expect('.target').toHaveText('old target')
            expect('.fallback').toHaveText('new fallback')
          })

          it("tries the layer's default targets with { fallback: true }", async function() {
            up.layer.config.any.mainTargets = ['.fallback']
            const $target = $fixture('.target').text('old target')
            const $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', { url: '/path', fallback: true })
            $target.remove()

            await wait()

            jasmine.respondWith(`
              <div class="target">new target</div>
              <div class="fallback">new fallback</div>
            `)

            await wait()

            expect('.fallback').toHaveText('new fallback')
          })

          it("does not try the layer's default targets and rejects the promise if options.fallback is false", function(done) {
            up.layer.config.any.fallbacks = ['.fallback']
            const $target = $fixture('.target').text('old target')
            const $fallback = $fixture('.fallback').text('old fallback')
            const promise = up.render('.target', { url: '/path', fallback: false })

            u.task(() => {
              $target.remove()

              jasmine.respondWith(`
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              `)

              promise.catch(function(e) {
                expect(e).toBeError(/Could not find common target/i)
                done()
              })
            })
          })
        })

        describe('when selectors are missing in the response', function() {

          beforeEach(function() {
            up.layer.config.any.mainTargets = []
          })

          it("tries the selector in options.fallback before swapping elements", async function() {
            const $target = $fixture('.target').text('old target')
            const $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', { url: '/path', fallback: '.fallback' })

            await wait()

            jasmine.respondWith(`
              <div class="fallback">new fallback</div>
            `)

            await wait()

            expect('.target').toHaveText('old target')
            expect('.fallback').toHaveText('new fallback')
          })

          it("replaces the layer's main target with { fallback: true }", async function() {
            up.layer.config.root.mainTargets = ['.default']
            fixture('.target', { text: 'old target text' })
            fixture('.default', { text: 'old fallback text' })

            up.render('.target', { url: '/path', fallback: true })

            await wait()

            jasmine.respondWithSelector('.default', { text: 'new fallback text' })

            await wait()

            expect('.target').toHaveText('old target text')
            expect('.default').toHaveText('new fallback text')
          })

          describe('if all alternatives are exhausted', function() {
            it('rejects the promise', async function() {
              const $target = $fixture('.target').text('old target')
              const $fallback = $fixture('.fallback').text('old fallback')
              const promise = up.render('.target', { url: '/path', fallback: '.fallback' })

              await wait()

              jasmine.respondWith('<div class="unexpected">new unexpected</div>')

              await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
            })
          })

          it('considers a union selector to be missing if one of its selector-atoms are missing', async function() {
            const $target = $fixture('.target').text('old target')
            const $target2 = $fixture('.target2').text('old target2')
            const $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target, .target2', { url: '/path', fallback: '.fallback' })

            await wait()

            jasmine.respondWith(`
              <div class="target">new target</div>
              <div class="fallback">new fallback</div>
            `)

            await wait()

            expect('.target').toHaveText('old target')
            expect('.target2').toHaveText('old target2')
            expect('.fallback').toHaveText('new fallback')
          })

          it("tries the layer's default targets with { fallback: true }", async function() {
            up.layer.config.any.mainTargets = ['.fallback']
            const $target = $fixture('.target').text('old target')
            const $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', { url: '/path', fallback: true })

            await wait()

            jasmine.respondWith('<div class="fallback">new fallback</div>')

            await wait()

            expect('.target').toHaveText('old target')
            expect('.fallback').toHaveText('new fallback')
          })

          it("does not try the layer's default targets and rejects the promise with { fallback: false }", async function() {
            up.layer.config.any.mainTargets = ['.fallback']
            const $target = $fixture('.target').text('old target')
            const $fallback = $fixture('.fallback').text('old fallback')
            const promise = up.render('.target', { url: '/path', fallback: false })

            await wait()

            jasmine.respondWith('<div class="fallback">new fallback</div>')

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
          })
        })
      })

    })

  })

})
