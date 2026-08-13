const e = up.element
const $ = jQuery

extendDescribe('up.history', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('navigating history with back and forward buttons', function() {

      it('loads locations when the navigation changes the path', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']

        let [nav, link1, link2, link3, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2" up-follow>path2</a>
            <a href="/path3" up-follow>path3</a>
          </nav>
          <main>
            initial text
          </main>
        `)

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        Trigger.clickSequence(link2)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')

        expect(up.network.isBusy()).toBe(false)
      })

      it('loads locations when the navigation changes the query string', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']

        let [nav, link1, link2, link3, target] = htmlFixtureList(`
          <nav>
            <a href="/path?query=1" up-follow>path1</a>
            <a href="/path?query=2" up-follow>path2</a>
            <a href="/path?query=3" up-follow>path3</a>
          </nav>
          <main>
            initial text
          </main>
        `)

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=1')
        expect('main').toHaveText('path1 text')

        Trigger.clickSequence(link2)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=2')
        expect('main').toHaveText('path2 text')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')
        expect(up.network.isBusy()).toBe(false)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=2')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=1')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=2')
        expect('main').toHaveText('path2 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')

        expect(up.network.isBusy()).toBe(false)
      })

      it('loads locations when the navigation changes both path and hash', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']
        up.viewport.config.revealSnap = 0

        let [nav, link1, link2a, link2b, link3, viewport, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2#a" up-follow>path2#a</a>
            <a href="/path2#b" up-follow>path2#b</a>
            <a href="/path3" up-follow>path3</a>
          </nav>
          <div id="viewport" up-viewport style="height: 200px; overflow-y: scroll; background-color: yellow;">
            <main>
              initial text
            </main>
          </div>
        `)

        let path1Text = `
          <main>
            path1 text
          </main>
        `

        let path2Text = `
          <main>
            <div style="height: 300px">before</div>
            <div id="a" style="height: 50px; background-color: green">
              path2#a text
            </div>
            <div style="height: 300px">between</div>
            <div id="b" style="height: 50px; background-color: blue">
              path2#b text
            </div>
            <div style="height: 300px">below</div>
          </main>
        `

        let path3Text = `
          <main>
            path3 text
          </main>
        `

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        Trigger.clickSequence(link2a)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')

        expect(viewport.scrollTop).toBe(300) // revealing a hash always aligns with top

        Trigger.clickSequence(link2b)
        await wait()
        expect(up.network.isBusy()).toBe(false)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(location.href).toMatchURL('/path2#b')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#a')
        expect(viewport.scrollTop).toBe(300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')
        expect(viewport.scrollTop).toBe(300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        expect(up.network.isBusy()).toBe(false)
      })

      it('loads locations when the navigation changes both path and hash and the user reloads in between (issue #773)', async function() {
        const waitForBrowser = 100

        const configure = () => {
          up.network.config.autoCache = false
          up.history.config.restoreTargets = ['main']
          up.viewport.config.revealSnap = 0
        }

        configure()

        async function fakeReload() {
          // We can't really reload the browser without losing the spec runner.
          // Instead we reset the framework to throw away internal state that we would also
          // lose during a reload.
          up.framework.reset()
          await wait()
          configure()
        }

        let [nav, link1, link2a, link2b, link3, viewport, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2#a" up-follow>path2#a</a>
            <a href="/path2#b" up-follow>path2#b</a>
            <a href="/path3" up-follow>path3</a>
          </nav>
          <div id="viewport" up-viewport style="height: 200px; overflow-y: scroll; background-color: yellow;">
            <main>
              initial text
            </main>
          </div>
        `)

        let path1Text = `
          <main>
            path1 text
          </main>
        `

        let path2Text = `
          <main>
            <div style="height: 300px">before</div>
            <div id="a" style="height: 50px; background-color: green">
              path2#a text
            </div>
            <div style="height: 300px">between</div>
            <div id="b" style="height: 50px; background-color: blue">
              path2#b text
            </div>
            <div style="height: 300px">below</div>
          </main>
        `

        let path3Text = `
          <main>
            path3 text
          </main>
        `

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        Trigger.clickSequence(link2a)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')

        expect(viewport.scrollTop).toBe(300) // revealing a hash always aligns with top

        Trigger.clickSequence(link2b)
        await wait()
        expect(up.network.isBusy()).toBe(false)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(location.href).toMatchURL('/path2#b')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        await fakeReload()

        history.back()
        await wait(waitForBrowser)

        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')

        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#a')
        expect(viewport.scrollTop).toBe(300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        await fakeReload()

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')
        expect(viewport.scrollTop).toBe(300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        expect(up.network.isBusy()).toBe(false)
      })

      it('loads locations when the navigation changes both query string and hash', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']
        up.viewport.config.revealSnap = 0

        let [nav, link1, link2a, link2b, link3, viewport, target] = htmlFixtureList(`
          <nav>
            <a href="/path" up-follow>path1</a>
            <a href="/path?query=2#a" up-follow>path2#a</a>
            <a href="/path?query=2#b" up-follow>path2#b</a>
            <a href="/path?query=3" up-follow>path3</a>
          </nav>
          <div id="viewport" up-viewport style="height: 200px; overflow-y: scroll; background-color: yellow;">
            <main>
              initial text
            </main>
          </div>
        `)

        let path1Text = `
          <main>
            path1 text
          </main>
        `

        let path2Text = `
          <main>
            <div style="height: 300px">before</div>
            <div id="a" style="height: 50px; background-color: green">
              path2#a text
            </div>
            <div style="height: 300px">between</div>
            <div id="b" style="height: 50px; background-color: blue">
              path2#b text
            </div>
            <div style="height: 300px">below</div>
          </main>
        `

        let path3Text = `
          <main>
            path3 text
          </main>
        `

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        Trigger.clickSequence(link2a)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=2#a')
        expect('main #a').toHaveText('path2#a text')

        expect(viewport.scrollTop).toBe(300) // revealing a hash always aligns with top

        Trigger.clickSequence(link2b)
        await wait()
        expect(up.network.isBusy()).toBe(false)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(location.href).toMatchURL('/path?query=2#b')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path?query=2#a')
        expect(viewport.scrollTop).toBe(300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=2#a')
        expect('main #a').toHaveText('path2#a text')
        expect(viewport.scrollTop).toBe(300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path?query=2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        expect(up.network.isBusy()).toBe(false)

      })

      it('does not load locations when navigating over entries pushed by foreign JS with custom state', async function() {
        const waitForBrowser = 150

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']

        let [nav, link1, link2, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2" up-follow>path2</a>
          </nav>
          <main>
            initial text
          </main>
        `)

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        history.pushState({}, '', '/foreign-path')
        await wait()
        expect(location.href).toMatchURL('/foreign-path')
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(up.network.isBusy()).toBe(false)

        Trigger.clickSequence(link2)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/foreign-path')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/foreign-path')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        expect(up.network.isBusy()).toBe(false)
      })

      it('calls destructor functions when destroying compiled elements (bugfix)', async function() {
        const waitForBrowser = 100

        // By default, up.history will replace the <body> tag when
        // the user presses the back-button. We reconfigure this
        // so we don't lose the Jasmine runner interface.
        up.history.config.restoreTargets = ['.container']

        const constructorSpy = jasmine.createSpy('constructor')
        const destructorSpy = jasmine.createSpy('destructor')

        up.compiler('.example', function(example) {
          constructorSpy()
          return destructorSpy
        })

        up.history.push('/one')
        up.history.push('/two')

        const $container = $fixture('.container')
        const $example = $container.affix('.example')
        up.hello($example)

        expect(constructorSpy).toHaveBeenCalled()

        history.back()
        await wait(waitForBrowser)

        expect(location.pathname).toEqual('/one')
        jasmine.respondWith("<div class='container'>restored container text</div>")

        await wait()

        expect(destructorSpy).toHaveBeenCalled()
      })

      describe('up:location:restore event', function() {

        it('emits an up:location:restore event that users can prevent and substitute their own restoration logic', async function() {
          const waitForBrowser = 100
          const main = fixture('main#main', { text: 'original content' })
          up.history.config.restoreTargets = [':main']
          const restoreListener = jasmine.createSpy('up:location:restore listener').and.callFake((event) => {
            event.preventDefault()
            main.innerText = 'manually restored content'
          })
          up.on('up:location:restore', restoreListener)

          up.history.push("/page1")
          await wait()

          up.history.push("/page2")
          await wait()

          expect(up.history.location).toMatchURL('/page2')
          expect(restoreListener).not.toHaveBeenCalled()

          history.back()
          await wait(waitForBrowser)

          expect(up.history.location).toMatchURL('/page1')
          expect(restoreListener).toHaveBeenCalled()

          expect(main).toHaveText('manually restored content')
        })

        it('lets users mutate event.renderOptions to customize the restoration pass', async function() {
          const waitForBrowser = 100
          fixture('#main', { text: 'original main' })
          fixture('#other', { text: 'original other' })
          up.history.config.restoreTargets = ['#main']
          const restoreListener = jasmine.createSpy('up:location:restore listener').and.callFake((event) => event.renderOptions.target = '#other')

          up.on('up:location:restore', restoreListener)

          up.history.push("/page1")

          await wait()

          up.history.push("/page2")

          await wait()

          expect(up.history.location).toMatchURL('/page2')
          expect(restoreListener).not.toHaveBeenCalled()

          history.back()

          await wait(waitForBrowser)

          expect(up.history.location).toMatchURL('/page1')
          expect(restoreListener).toHaveBeenCalled()

          await wait()

          jasmine.respondWith(`
            <div id='container'>
              <div id='main'>restored main</div>
              <div id='other'>restored other</div>
            </div>
          `)
          await wait()

          expect('#main').toHaveText('original main')
          expect('#other').toHaveText('restored other')
        })
      })

      describe('caching', function() {

        it('restores a page from cache', async function() {
          const waitForBrowser = 100
          fixture('main', { text: 'original content' })
          up.history.config.restoreTargets = [':main']

          up.navigate({ target: 'main', url: '/path1' })
          await wait()
          jasmine.respondWithSelector('main', { text: 'path1 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')

          up.navigate({ target: 'main', url: '/path2' })
          await wait()
          jasmine.respondWithSelector('main', { text: 'path2 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path2')
          expect('main').toHaveText('path2 content')

          history.back()
          await wait(waitForBrowser)

          // History was restored
          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')
          // No additional request was made
          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('revalidates expired cache entries after restoration', async function() {
          const waitForBrowser = 100
          up.network.config.cacheExpireAge = 1
          fixture('main', { text: 'original content' })
          up.history.config.restoreTargets = [':main']

          up.navigate({ target: 'main', url: '/path1' })
          await wait()
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('main', { text: 'path1 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')

          up.navigate({ target: 'main', url: '/path2' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWithSelector('main', { text: 'path2 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path2')
          expect('main').toHaveText('path2 content')

          history.back()
          await wait(waitForBrowser)

          // History was restored
          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')
          // No additional request was made
          expect(jasmine.Ajax.requests.count()).toBe(3)

          jasmine.respondWithSelector('main', { text: 'revalidated path1 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('revalidated path1 content')
          // No additional request was made
          expect(jasmine.Ajax.requests.count()).toBe(3)
        })
      })

      describe('focus restoration', () => {
        it('restores element focus when the user hits the back button', async function() {
          const waitForBrowser = 100
          up.fragment.config.mainTargets = ['main']
          up.history.config.restoreTargets = [':main']
          const main = fixture('main')
          const link = e.affix(main, 'a[href="/focus-path2"][up-follow]', { text: 'link label' })

          up.history.replace('/focus-path1')
          await wait()

          Trigger.clickSequence(link)
          await wait()

          expect(link).toBeFocused()
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('main', { text: 'new text' })
          await wait()

          expect('main').toHaveText('new text')
          expect('main').toBeFocused()

          history.back()
          await wait(waitForBrowser)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          await wait()

          jasmine.respondWithSelector('main a[href="/focus-path2"]')
          await wait()

          expect(document).toHaveSelector('main a[href="/focus-path2"]')
          expect('a[href="/focus-path2"]').toBeFocused()
        })
      })

      describe('scroll restoration', function() {

        afterEach(() => {
          $('.viewport').remove()
        })

        it('restores the scroll position of viewports when the user hits the back button', async function() {
          const longContentHTML = `
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px"></div>
            </div>
          `

          const respond = () => jasmine.respondWith(longContentHTML)

          const $viewport = $(longContentHTML).appendTo(document.body)

          const waitForBrowser = 100

          up.viewport.config.viewportSelectors = ['.viewport']
          up.history.config.restoreTargets = ['.viewport']

          up.history.replace('/scroll-restauration-spec')

          up.navigate('.content', { url: '/test-one', history: true })
          await wait(waitForBrowser)

          respond()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-one')
          $viewport.scrollTop(50)
          up.navigate('.content', { url: '/test-two', history: true })
          await wait(waitForBrowser)

          respond()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-two')
          $('.viewport').scrollTop(150)
          up.navigate('.content', { url: '/test-three', history: true })
          await wait(waitForBrowser)

          respond()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-three')
          $('.viewport').scrollTop(250)
          history.back()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-two')
          expect($('.viewport').scrollTop()).toBe(150)
          history.back()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-one')
          expect($('.viewport').scrollTop()).toBe(50)
          history.forward()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-two')
          expect($('.viewport').scrollTop()).toBe(150)
          history.forward()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-three')
          expect($('.viewport').scrollTop()).toBe(250)
        })

        it('resets the scroll position of no earlier scroll position is known', async function() {
          const longContentHTML = `
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px">text</div>
            </div>
          `

          const respond = () => jasmine.respondWith(longContentHTML)

          const $viewport = $(longContentHTML).appendTo(document.body)

          const waitForBrowser = 100

          up.viewport.config.viewportSelectors = ['.viewport']
          up.history.config.restoreTargets = ['.viewport']

          up.history.replace('/restore-path1')

          up.navigate('.content', { url: '/restore-path2', history: true })
          await wait()

          respond()
          await wait()

          expect(location.href).toMatchURL('/restore-path2')
          $('.viewport').scrollTop(50)

          // Emulate a cache miss
          up.layer.root.lastScrollTops.clear()

          history.back()
          await wait(waitForBrowser)

          respond()
          await wait()

          expect(location.href).toMatchURL('/restore-path1')
          expect($('.viewport').scrollTop()).toBe(0)
        })

        it('restores the scroll position of two viewports marked with [up-viewport], but not configured in up.viewport.config (bugfix)', async function() {
          up.history.config.restoreTargets = ['.container']

          const html = `
            <div class="container">
              <div class="viewport1" up-viewport style="width: 100px; height: 100px; overflow-y: scroll">
                <div class="content1" style="height: 5000px">content1</div>
              </div>
              <div class="viewport2" up-viewport style="width: 100px; height: 100px; overflow-y: scroll">
                <div class="content2" style="height: 5000px">content2</div>
              </div>
            </div>
          `

          const respond = () => jasmine.respondWith(html)

          const $screen = $fixture('.screen')
          $screen.html(html)

          up.navigate('.content1, .content2', { url: '/one', reveal: false, history: true })
          await wait()

          respond()
          await wait()

          $('.viewport1').scrollTop(3000)
          $('.viewport2').scrollTop(3050)
          expect('.viewport1').toBeScrolledTo(3000)
          expect('.viewport2').toBeScrolledTo(3050)

          up.navigate('.content1, .content2', { url: '/two', reveal: false, history: true })
          await wait()

          respond()
          await wait()

          expect(location.href).toMatchURL('/two')
          history.back()
          await wait(50)

          expect('.viewport1').toBeScrolledTo(3000)
          expect('.viewport2').toBeScrolledTo(3050)
        })
      })
    }) // history navigation

  })

})
