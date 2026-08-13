const e = up.element

extendDescribe('up.history', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('changing the location #hash', function() {

      describe('when the #hash is changed manually', function() {

        it('reveals a matching fragment, honoring obstructions', async function() {
          // up.history.scrollRestoration = 'manual'

          // The browser will only fire a hashchange event if the hash actually did change.
          // In case someone re-runs this spec, reset the hash before we setup our test below.
          location.hash = ''
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px' } })
          const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })

          location.hash = "#element"
          await wait()

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
        })

        it('does not reveal when the new #hash is empty', async function() {
          // The browser will only fire a hashchange event if the hash actually did change.
          // In case someone re-runs this spec, reset the hash before we setup our test below.
          location.hash = '#elsewhere'
          await wait()

          const revealSpy = up.reveal.mock()

          location.hash = ""
          await wait()

          expect(revealSpy).not.toHaveBeenCalled()
        })
      })

      describe('clicking link containing only a #hash in its [href]', function() {

        it("reveals and focuses a fragment matching the link's hash, honoring obstructions", async function() {
          location.hash = ''
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px', 'background-color': 'yellow' } })
          const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
          const link = fixture('a', { href: '#element' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
          expect(location.hash).toBe('#element')
          expect('#element').toBeFocused()
        })

        it("reveals and focuses fragment when the location is already on the link's #hash", async function() {
          location.hash = '#element'
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px' } })
          const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
          const link = fixture('a', { href: '#element' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
          expect(location.hash).toBe('#element')
          expect('#element').toBeFocused()
        })

        it("reveals a fragment within a history-less layer", async function() {
          up.history.replace('/root-location')

          up.layer.open({ mode: 'cover', url: '/overlay-location', target: '#content', history: false })
          await wait()

          jasmine.respondWith(`
            <div id="content">
              <div style="height: 10000px"></div>
              <a id="link" href="#element" style="display: block; height: 50px">click me</a>
              <div style="height: 10000px"></div>
              <div id="element" style="height: 50px">element</div>
              <div style="height: 10000px"></div>
            </div>
          `)
          await wait()

          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.current).toHaveSelector('#content')

          expect(location.href).toMatchURL('/root-location')
          expect(up.layer.location).toMatchURL('/overlay-location')

          expect(up.layer.current.viewportElement.scrollTop).toBe(0)

          document.querySelector('#link').click()
          await wait()

          expect(up.layer.current.viewportElement.scrollTop).toBe(10000 + 50 + 10000)
        })

        it("does not reveal when no fragment matches the link's #hash", async function() {
          location.hash = ''
          await wait()

          const link = fixture('a', { href: '#element' })
          const revealSpy = up.reveal.mock()

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(revealSpy).not.toHaveBeenCalled()
          expect(location.hash).toBe('#element')
        })

        it("does not change focus when no fragment matches the link's #hash", async function() {
          location.hash = ''
          await wait()

          const input = fixture('input[type=text]')
          input.focus()
          expect(input).toBeFocused()

          const link = fixture('a', { href: '#element' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(location.hash).toBe('#element')
          expect(input).toBeFocused()
        })


        it("does not reveal when an event listener prevents the click event", async function() {
          location.hash = ''
          await wait()

          fixture('#element')

          const link = fixture('a', { href: '#element' })
          link.addEventListener('click', (event) => event.preventDefault())

          const revealSpy = up.reveal.mock()

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(revealSpy).not.toHaveBeenCalled()
          expect(location.hash).toBe('')
        })


        it("only reveals a fragment in the link's layer", async function() {
          let html = `
            <div id="content">
              <div style="height: 10000px"></div>
              <a id="link" href="#element" style="display: block; height: 50px">click me</a>
              <div style="height: 10000px"></div>
              <div id="element" style="height: 50px; background-color: yellow">element</div>
              <div style="height: 10000px"></div>
            </div>
          `

          makeLayers([
            { fragment: html },
            { fragment: html },
          ])
          await wait()

          let rootViewport = up.viewport.root
          let overlayViewport = up.layer.get(1).viewportElement

          let overlayLink = up.fragment.get('#link', { layer: 'current' })

          overlayLink.click()
          await wait()

          let overlayTopMargin = 25
          let overlayTopPadding = 20

          expect(rootViewport.scrollTop).toBe(0)
          expect(overlayViewport.scrollTop).toBe(overlayTopMargin + overlayTopPadding + 10000 + 50 + 10000)
        })

        it('only scrolls the current layer to the #top', async function() {
          let html = `
            <div id="content">
              <div style="height: 10000px"></div>
              <a id="link" href="#top" style="display: block; height: 50px">click me</a>
            </div>
          `

          makeLayers([
            { fragment: html },
            { fragment: html },
          ])
          await wait()

          let rootViewport = up.viewport.root
          let overlayViewport = up.layer.get(1).viewportElement
          rootViewport.scrollTo({ top: 500, behavior: 'instant' })
          overlayViewport.scrollTo({ top: 500, behavior: 'instant' })

          expect(rootViewport.scrollTop).toBe(500)
          expect(overlayViewport.scrollTop).toBe(500)

          let overlayLink = up.fragment.get('#link', { layer: 'current' })

          overlayLink.click()
          await wait()

          expect(rootViewport.scrollTop).toBe(500)
          expect(overlayViewport.scrollTop).toBe(0)
        })

        it('uses smooth scrolling if the viewport has a `{ scroll-behavior: smooth }` style', async function() {
          location.hash = ''
          await wait()

          fixtureStyle(`
            #viewport {
              width: 200px;
              height: 200px;
              overflow-y: scroll;
              scroll-behavior: smooth;
              background-color: yellow;
            }
          `)

          const viewport = fixture('#viewport[up-viewport]')
          const highElement = e.affix(viewport, '#high', { style: { height: '20000px' } }) // ensure we can scroll
          const element = e.affix(viewport, '#element', { text: 'content', style: { height: '100px', 'background-color': 'red' } })
          const link = fixture('a', { href: '#element' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(80)

          const finalScrollTop = 20000 - 100
          expect(viewport.scrollTop).toBeGreaterThan(10)
          expect(viewport.scrollTop).toBeLessThan(finalScrollTop - 10)

          expect(location.hash).toBe('#element')

          await wait(1500)
          expect(viewport.scrollTop).toBe(finalScrollTop)
        })

        it('does not use smooth scrolling if the viewport has no `{ scroll-behavior } style', async function() {
          location.hash = ''
          await wait()

          fixtureStyle(`
            #viewport {
              width: 200px;
              height: 200px;
              overflow-y: scroll;
              scroll-behavior: auto;
              background-color: yellow;
            }
          `)

          const viewport = fixture('#viewport[up-viewport]')
          const highElement = e.affix(viewport, '#high', { style: { height: '20000px' } }) // ensure we can scroll
          const element = e.affix(viewport, '#element', { text: 'content', style: { height: '100px', 'background-color': 'red' } })
          const link = fixture('a', { href: '#element' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(80)

          expect(location.hash).toBe('#element')
          expect(viewport.scrollTop).toBe(20000 - 100)
        })

        it('uses smooth scrolling if the root viewport has a `{ scroll-behavior: smooth }` style', async function() {
          location.hash = ''
          await wait()

          fixtureStyle(`
            ${document.scrollingElement.tagName} { scroll-behavior: smooth; }
          `)
          const highElement = fixture('.high', { style: { height: '30000px' } }) // ensure we can scroll
          const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '20000px', 'background-color': 'yellow' } })
          const link = fixture('a', { href: '#element' })

          expect(document.scrollingElement.scrollTop).toBe(0)

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(80)

          const finalScrollTop = 20000
          expect(document.scrollingElement.scrollTop).toBeLessThan(finalScrollTop - 10)
          expect(document.scrollingElement.scrollTop).toBeGreaterThan(10)

          expect(location.hash).toBe('#element')

          await wait(1500)
          expect(document.scrollingElement.scrollTop).toBe(finalScrollTop)
        })

        describe('scrolling to #top', function() {
          it("scrolls to the top if the link's hash is '#top', even if there is no matching fragment", async function() {
            location.hash = ''
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            up.viewport.root.scrollTo({ top: 3000, behavior: 'instant' })
            expect(up.viewport.root.scrollTop).toBe(3000)

            const link = fixture('a', { href: '#top' })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(200)

            expect(up.viewport.root.scrollTop).toBe(0)
            expect(location.hash).toBe('#top')
          })

          it("uses smooth scrolling if the root viewport has a `{ scroll-behavior: smooth }` style", async function() {
            location.hash = ''
            await wait()

            fixtureStyle(`
              ${document.scrollingElement.tagName} { scroll-behavior: smooth; }
            `)
            const highElement = fixture('.high', { style: { height: '30000px' } }) // ensure we can scroll
            const link = fixture('a', { href: '#top' })

            up.viewport.root.scrollTo({ top: 20000, behavior: 'instant' })
            expect(up.viewport.root.scrollTop).toBe(20_000)

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(80)

            expect(document.scrollingElement.scrollTop).toBeLessThan(20_000 - 10)
            expect(document.scrollingElement.scrollTop).toBeGreaterThan(10)
            expect(location.hash).toBe('#top')

            await wait(1500)

            expect(up.viewport.root.scrollTop).toBe(0)
          })

          it("uses smooth scrolling if the link has an [up-scroll-behavior='smooth'] attribute (#737)", async function() {
            location.hash = ''
            await wait()

            fixtureStyle(`
              ${document.scrollingElement.tagName} { scroll-behavior: instant; }
            `)
            const highElement = fixture('.high', { style: { height: '30000px' } }) // ensure we can scroll
            const link = fixture('a', { href: '#top', 'up-scroll-behavior': 'smooth' })

            up.viewport.root.scrollTo({ top: 20000, behavior: 'instant' })
            expect(up.viewport.root.scrollTop).toBe(20_000)

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(80)

            expect(document.scrollingElement.scrollTop).toBeLessThan(20_000 - 10)
            expect(document.scrollingElement.scrollTop).toBeGreaterThan(10)
            expect(location.hash).toBe('#top')

            await wait(1500)

            expect(up.viewport.root.scrollTop).toBe(0)
          })
        })

        describe('JavaScript links with an a[href="#"]', function() {

          it('allows foreign scripts to handle clicks with a listener bound to the link', async function() {
            location.hash = ''
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            up.viewport.root.scrollTo({ top: 3000, behavior: 'instant' })
            expect(up.viewport.root.scrollTop).toBe(3000)

            const link = fixture('a', { href: '#' })
            const foreignListener = jasmine.createSpy('foreign listener').and.callFake((event) => {
              event.preventDefault()
            })
            link.addEventListener('click', foreignListener)

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(foreignListener).toHaveBeenCalled()
            expect(up.viewport.root.scrollTop).toBe(3000)
          })

          it('allows foreign scripts to handle clicks with a listener bound to the document', async function() {
            location.hash = ''
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            up.viewport.root.scrollTo({ top: 3000, behavior: 'instant' })
            expect(up.viewport.root.scrollTop).toBe(3000)

            const link = fixture('a#link', { href: '#' })
            const foreignListener = jasmine.createSpy('foreign listener').and.callFake((event) => {
              event.preventDefault()
            })
            up.on('click', 'a#link', foreignListener)

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(foreignListener).toHaveBeenCalled()
            expect(up.viewport.root.scrollTop).toBe(3000)
          })

        })

      })

      describe('clicking link containing with both a path and a #hash in its [href]', function() {

        describe("when the link's base matches the current location", function() {

          it('reveals and focuses a matching fragment, honoring obstructions', async function() {
            let base = location.pathname + location.search

            location.hash = ''
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px', 'background-color': 'yellow' } })
            const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
            const link = fixture('a', { href: base + '#element' })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(up.viewport.root.scrollTop).toBe(5000 - 30)
            expect(location.hash).toBe('#element')
            expect('#element').toBeFocused()
          })

          it("reveals and focuses a matching fragment when we are already on the link's #hash", async function() {
            let base = location.pathname + location.search

            location.hash = '#element'
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px' } })
            const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
            const link = fixture('a', { href: base + '#element' })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(up.viewport.root.scrollTop).toBe(5000 - 30)
            expect(location.hash).toBe('#element')
            expect('#element').toBeFocused()
          })

          it("scrolls to the top if the link's hash is '#top', even if there is no matching fragment", async function() {
            let base = location.pathname + location.search
            location.hash = '#top'
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            up.viewport.root.scrollTo({ top: 3000, behavior: 'instant' })
            expect(up.viewport.root.scrollTop).toBe(3000)

            const link = fixture('a', { href: base + '#top' })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(200)

            expect(up.viewport.root.scrollTop).toBe(0)
            expect(location.hash).toBe('#top')
          })

        })

        describe("when the link's base matches another location", function() {

          it('renders the new location then reveals and focuses a matching fragment in the new content', async function() {
            location.hash = ''
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            const oldElement = fixture('#element', { text: 'old content', style: { position: 'absolute', top: '3000px', 'background-color': 'rebeccapurple' } })
            const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
            const link = fixture('a', { href: '/other-path#element', 'up-target': '#element', 'up-history': true })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(up.viewport.root.scrollTop).toBe(0)
            expect(jasmine.Ajax.requests.count()).toBe(1)

            jasmine.respondWithSelector('#element', { text: 'new content', style: { position: 'absolute', top: '5000px', 'background-color': 'yellow' } })
            await wait()

            expect('#element').toHaveText('new content')
            expect(up.viewport.root.scrollTop).toBe(5000 - 30)
            expect(location.hash).toBe('#element')
            expect('#element').toBeFocused()

          })

          it("renders the new location if the link's base matches the browser location, but not the location of a history-less layer", async function() {
            up.history.replace('/root-location')

            up.layer.open({ mode: 'cover', url: '/overlay-location', target: '#content', history: false })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWith(`
              <div id="content">
                <a id="link" href="/root-location#hash" up-target="#content">label</a>
                <div id="hash">fake hash</div> <!-- up.history.onHashLinkClicked should see a matching fragment, but not reveal it -->
              </div>
            `)
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')

            expect(location.href).toMatchURL('/root-location')
            expect(up.layer.location).toMatchURL('/overlay-location')

            document.querySelector('#link').click()
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)
            jasmine.respondWith(`
              <div id="content">
                new content
              </div>
            `)

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')
            expect('#content').toHaveText('new content')
          })

          it("renders the new location if the overlay was opened from a string of HTML", async function() {
            up.history.replace('/root-location')

            up.layer.open({ mode: 'cover', fragment: `
              <div id="content">
                <a id="link" href="/root-location#hash" up-target="#content">label</a>
                <div id="hash">fake hash</div> <!-- up.history.onHashLinkClicked should see a matching fragment, but not reveal it -->
              </div>
            ` })
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')

            expect(location.href).toMatchURL('/root-location')
            expect(up.layer.location).toBeMissing()

            document.querySelector('#link').click()
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWith(`
              <div id="content">
                new content
              </div>
            `)

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')
            expect('#content').toHaveText('new content')
          })

        })
      })

    }) // changing the location #hash

  })

})
