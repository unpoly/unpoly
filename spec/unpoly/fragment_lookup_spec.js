const e = up.element

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.fragment.get()', function() {

      it('returns the first element matching the given selector', function() {
        const noMatch = fixture('.no-match')
        const match = fixture('.match')
        const otherMatch = fixture('.match.other')

        const result = up.fragment.get('.match')

        expect(result).toEqual(match)
      })

      it('returns an Element argument unchanged', function() {
        const element = fixture('.element')
        const result = up.fragment.get(element)
        expect(result).toBe(element)
      })

      describe('when a root element is given as the optional first argument', function() {

        it('returns the first matching descendant of the given root element', function() {
          const elementBeforeContainer = fixture('.element')
          const container = fixture('.container')
          const elementWithinContainer = e.affix(container, '.element')
          const elementAfterContainer = fixture('.element')

          const result = up.fragment.get(container, '.element')

          expect(result).toEqual(elementWithinContainer)
        })

        it('returns a second Element argument unchanged, even if its not a descendant of the given root', function() {
          const root = fixture('.root')
          const element = fixture('.element')

          const result = up.fragment.get(root, element)

          expect(result).toBe(element)
        })

        it('finds an element in a detached tree', function() {
          const detachedTree = e.createFromSelector('.detached-tree')
          const element = e.affix(detachedTree, '.element')

          const result = up.fragment.get(detachedTree, '.element')

          expect(result).toEqual(element)
        })

        it('finds an element in a detached tree if the current layer is an overlay (bugfix)', function() {
          makeLayers(2)
          const detachedTree = e.createFromSelector('.detached-tree')
          const element = e.affix(detachedTree, '.element')

          const result = up.fragment.get(detachedTree, '.element')

          expect(result).toEqual(element)
        })
      })

      describe('when given a root Document for the search', function() {

        it('matches in the current layer if no { layer } option is given', function() {
          makeLayers([
            { '.element': '.element', content: 'element in layer 0' },
            { '.element': '.element', content: 'element in layer 1' },
            { '.element': '.element', content: 'element in layer 2' }
          ])

          const result = up.layer.get(1).asCurrent(function() {
            return up.fragment.get(window.document, '.element')
          })

          expect(result).toHaveText('element in layer 1')
        })

        it('matches in the given { layer }', function() {
          makeLayers([
            { '.element': '.element', content: 'element in layer 0' },
            { '.element': '.element', content: 'element in layer 1' },
            { '.element': '.element', content: 'element in layer 2' }
          ])

          const result = up.fragment.get(window.document, '.element', { layer: 1 })

          expect(result).toHaveText('element in layer 1')
        })

        it('does not filter layers if given an external document', function() {
          const html = `
            <div class="element">external element</div>
          `
          const parser = new DOMParser()
          const externalDocument = parser.parseFromString(html, "text/html")
          expect(externalDocument).toEqual(jasmine.any(Document))

          const result = up.fragment.get(externalDocument, '.element')

          expect(result).toHaveText('external element')
        })
      })

      describe('layers', function() {

        it('matches elements in the given { layer }', function() {
          makeLayers([{ target: '.element' }, { target: '.element' }])

          expect(up.layer.count).toBe(2)
          const result = up.fragment.get('.element', { layer: 'root' })

          expect(up.layer.get(result)).toBe(up.layer.get(0))
        })

        it('matches elements in the current layer if no { layer } option is given', function() {
          makeLayers([{ target: '.element' }, { target: '.element' }])

          expect(up.layer.count).toBe(2)

          const result = up.fragment.get('.element')

          expect(up.layer.get(result)).toBe(up.layer.get(1))
        })

        it('matches elements on the root layer with { layer: 0 } (bugfix)', function() {
          makeLayers([{ target: '.element' }, { target: '.element' }])

          const result = up.fragment.get('.element', { layer: 0 })

          expect(up.layer.get(result)).toBe(up.layer.root)
        })

        it('throws an exception if the { layer } option did not resolve to any layer', function() {
          makeLayers(2)
          const doGet = function() {
            return up.fragment.get('.element', { layer: 3 })
          }
          expect(doGet).toThrowError(/unknown layer: 3/i)
        })

        it('matches in earlier layers first if multiple layers are given', function() {
          makeLayers([
            { target: '.element#a' }, // 0
            { target: '.element#b' }, // 1
            { target: '.element#c' }, // 2
            { target: '.element#d' }, // 3
            { target: '.element#e' }, // 4
          ])

          const result = up.fragment.get('.element', { layer: '1 3' })
          expect(result.id).toBe('b')
        })

        it('matches in earlier layers first if multiple layers are given and the layer priority is the reverse DOM order', function() {
          makeLayers([
            { target: '.element#a' }, // 0
            { target: '.element#b' }, // 1
            { target: '.element#c' }, // 2
            { target: '.element#d' }, // 3
            { target: '.element#e' }, // 4
          ])

          const result = up.fragment.get('.element', { layer: '3 1' })
          expect(result.id).toBe('d')
        })
      })

      describe('matching in the region of { origin }', function() {

        it('prefers to match an element closest to origin when no { match } option is given', function() {
          const root = fixture('.element#root')
          const one = e.affix(root, '.element', { text: 'old one' })
          const two = e.affix(root, '.element', { text: 'old two' })
          const childOfTwo = e.affix(two, '.origin')
          const three = e.affix(root, '.element', { text: 'old three' })

          const result = up.fragment.get('.element', { origin: childOfTwo })

          expect(result).toBe(two)
        })

        it('prefers to match an element closest to origin with { match: "region" }', function() {
          const root = fixture('.element#root')
          const one = e.affix(root, '.element', { text: 'old one' })
          const two = e.affix(root, '.element', { text: 'old two' })
          const childOfTwo = e.affix(two, '.origin')
          const three = e.affix(root, '.element', { text: 'old three' })

          const result = up.fragment.get('.element', { origin: childOfTwo, match: 'region' })

          expect(result).toBe(two)
        })

        it('does not throw an error when we cannot parse a selector with spaces and commas as attribute values (bugfix)', function() {
          const parent = fixture('.parent')
          parent.setAttribute('foo', 'a b, c d')
          const child = e.affix(parent, '.child')
          const origin = e.affix(parent, '.origin')
          const doGet = function() {
            return up.fragment.get('.parent[foo="a b, c d"] .child', { origin, match: 'region' })
          }
          expect(doGet).not.toThrowError()
        })

        it('prefers to match a descendant selector in the region of the origin', function() {
          const element1 = fixture('.element')
          const element1Child1 = e.affix(element1, '.child', { text: 'old element1Child1' })
          const element1Child2 = e.affix(element1, '.child.sibling', { text: 'old element1Child2' })

          const element2 = fixture('.element')
          const element2Child1 = e.affix(element2, '.child', { text: 'old element2Child1' })
          const element2Child2 = e.affix(element2, '.child.sibling', { text: 'old element2Child2' })

          const result = up.fragment.get('.element .sibling', { origin: element2Child1 })

          expect(result).toBe(element2Child2)
        })

        it('prefers to match a union of descendant selectors in the region of the origin', function() {
          const element1 = fixture('.element')
          const element1Child1 = e.affix(element1, '.child', { text: 'old element1Child1' })
          const element1Child2 = e.affix(element1, '.child.sibling', { text: 'old element1Child2' })

          const element2 = fixture('.element')
          const element2Child1 = e.affix(element2, '.child', { text: 'old element2Child1' })
          const element2Child2 = e.affix(element2, '.child.sibling', { text: 'old element2Child2' })

          const result = up.fragment.get('.foo, .element .sibling, .baz', { origin: element2Child1 })

          expect(result.innerText).toBe('old element2Child2')
        })

        it('ignores the origin with { match: "first" }', function() {
          const root = fixture('.element#root')
          const one = e.affix(root, '.element', { text: 'old one' })
          const two = e.affix(root, '.element', { text: 'old two' })
          const childOfTwo = e.affix(two, '.origin')
          const three = e.affix(root, '.element', { text: 'old three' })

          const result = up.fragment.get('.element', { origin: childOfTwo, match: 'first' })

          expect(result).toBe(root)
        })

        it('ignores the origin with up.fragment.config.match = "first"', function() {
          const root = fixture('.element#root')
          const one = e.affix(root, '.element', { text: 'old one' })
          const two = e.affix(root, '.element', { text: 'old two' })
          const childOfTwo = e.affix(two, '.origin')
          const three = e.affix(root, '.element', { text: 'old three' })

          up.fragment.config.match = 'first'
          const result = up.fragment.get('.element', { origin: childOfTwo })

          expect(result).toBe(root)
        })
      })

      describe('exclusion of destroying fragments', function() {

        it('does not find destroyed fragments that are still playing their exit animation', async function() {
          const [fragment] = htmlFixtureList(`
            <div id="fragment">text</div>
          `)
          up.destroy(fragment, { animation: 'fade-out', duration: 200 })
          await wait()

          expect(document.querySelector('#fragment')).toBe(fragment)
          expect(up.fragment.get('#fragment')).toBeMissing()
        })

        it('does not find descendants of destroying fragments', async function() {
          const [container, fragment] = htmlFixtureList(`
            <div id="container">
              <div id="fragment">text</div>
            </div>
          `)
          up.destroy(container, { animation: 'fade-out', duration: 200 })
          await wait()

          expect(document.querySelector('#fragment')).toBe(fragment)
          expect(up.fragment.get('#fragment')).toBeMissing()
        })

        it('does find destroying fragments with { destroying: true }', async function() {
          const [fragment] = htmlFixtureList(`
            <div id="fragment">text</div>
          `)
          up.destroy(fragment, { animation: 'fade-out', duration: 200 })
          await wait()

          expect(document.querySelector('#fragment')).toBe(fragment)

          expect(up.fragment.get('#fragment', { destroying: true })).toBe(fragment)
        })

      })

      describe('expansion of :main', function() {

        it('returns an element matching the configured main target selectors', function() {
          const one = fixture('.one')
          const two = fixture('.two')
          const three = fixture('.three')

          up.fragment.config.mainTargets = ['.two']

          const result = up.fragment.get(':main')
          expect(result).toBe(two)
        })

        it('returns a missing value if the user has configured no main targets', function() {
          up.fragment.config.mainTargets = []

          const result = up.fragment.get(':main')
          expect(result).toBeMissing()
        })

        it('prioritizes earlier main targets', function() {
          const one = fixture('.one')
          const two = fixture('.two')
          const three = fixture('.three')
          const four = fixture('.four')

          up.fragment.config.mainTargets = ['.three', '.one', '.four']

          const result = up.fragment.get(':main')
          expect(result).toBe(three)
        })

        it('matches a secondary main target if a primary main target does not exist', function() {
          const secondary = fixture('#secondary')

          up.fragment.config.mainTargets = ['#primary', '#secondary']

          const result = up.fragment.get(':main')
          expect(result).toBe(secondary)
        })

        it('ignores an origin when matching :main', function() {
          const container = fixture('#container')
          const nav = e.affix(container, '#nav')
          const navItem = e.affix(nav, '#nav-item')
          const main = e.affix(container, '#main')

          // Mimic our defaults, which look like ['[up-main]', 'body'].
          // We always want to match an earlier main target, even if the user clicks outside it.
          up.fragment.config.mainTargets = ['#main', '#container']

          const result = up.fragment.get(':main', { origin: navItem })
          expect(result).toBe(main)
        })

        it('ignores an origin when matching a descendant of :main', function() {
          const container = fixture('#container')
          const containerTarget = e.affix(container, '.target')
          const nav = e.affix(container, '#nav')
          const navItem = e.affix(nav, '#nav-item')
          const main = e.affix(container, '#main')
          const mainTarget = e.affix(main, '.target')

          // Mimic our defaults, which look like ['[up-main]', 'body'].
          // We always want to match an earlier main target, even if the user clicks outside it.
          up.fragment.config.mainTargets = ['#main', '#container']

          const result = up.fragment.get(':main .target', { origin: navItem })
          expect(result).toBe(mainTarget)
        })
      })
    })

    describe('up.fragment.all()', function() {

      it('returns elements matching the given selector', function() {
        const match = fixture('.match')
        const otherMatch = fixture('.match.other')
        const noMatch = fixture('.no-match')
        const results = up.fragment.all('.match')
        expect(results).toEqual([match, otherMatch])
      })

      it('returns an array of the first argument if the first argument is already an element', function() {
        const match = fixture('.match')
        const results = up.fragment.all(match)
        expect(results).toEqual([match])
      })

      it('returns a given Array unchanged', function() {
        const match = fixture('.match')
        const results = up.fragment.all([match])
        expect(results).toEqual([match])
      })

      it('returns a given NodeList unchanged', function() {
        const match = fixture('.match')
        const nodeList = document.querySelectorAll('.match')
        const results = up.fragment.all(nodeList)
        expect(results).toEqual(nodeList)
      })

      it('returns an empty array if there are no matches', function() {
        const results = up.fragment.all('.match')
        expect(results).toEqual([])
      })

      it('does not return an element that is currently destroying', function() {
        const match = fixture('.match.up-destroying')
        const results = up.fragment.all('.match')
        expect(results).toEqual([])
      })

      it('finds the <body> element (bugfix)', function() {
        const results = up.fragment.all('body')
        expect(results).toEqual([document.body])
      })

      it('finds the <html> element (bugfix)', function() {
        const results = up.fragment.all('html')
        expect(results).toEqual([document.documentElement])
      })

      describe('expansion of :main', function() {

        it('expands :main to the configured main target selectors', function() {
          const one = fixture('.one')
          const two = fixture('.two')
          const three = fixture('.three')

          up.fragment.config.mainTargets = ['.two']

          const results = up.fragment.all(':main')
          expect(results).toEqual([two])
        })

        it('matches nothing if the user has configured no main targets', function() {
          up.fragment.config.mainTargets = []

          const results = up.fragment.all(':main')
          expect(results).toEqual([])
        })
      })

      describe('when given a root element for the search', function() {

        it('only matches descendants of that root', function() {
          const parent1 = fixture('.parent1')
          const parent1Match = e.affix(parent1, '.match')

          const parent2 = fixture('.parent1')
          const parent2Match = e.affix(parent2, '.match')

          expect(up.fragment.all(parent1, '.match')).toEqual([parent1Match])
          expect(up.fragment.all(parent2, '.match')).toEqual([parent2Match])
        })

        it('does not match the root element itself', function() {
          const parent = fixture('.element')
          const child = e.affix(parent, '.element')

          expect(up.fragment.all(parent, '.element')).toEqual([child])
        })

        it("only matches descendants in that root's layer", function() {
          makeLayers([
            { '.element': '.element', content: 'element in root layer' },
            { '.element': '.element', content: 'element in modal layer' }
          ])

          const results = up.fragment.all(document.body, '.element')
          expect(results.length).toBe(1)
          expect(up.layer.get(results[0])).toBe(up.layer.root)
        })
      })

      describe('when given a root Document for the search', function() {

        it('matches in the current layer if no { layer } option is given', function() {
          makeLayers([
            { '.element': '.element', content: 'element in layer 0' },
            { '.element': '.element', content: 'element in layer 1' },
            { '.element': '.element', content: 'element in layer 2' }
          ])

          const results = up.layer.get(1).asCurrent(() => up.fragment.all(window.document, '.element'))

          expect(results.length).toBe(1)
          expect(results[0]).toHaveText('element in layer 1')
        })

        it('matches in the given { layer }', function() {
          makeLayers([
            { '.element': '.element', content: 'element in layer 0' },
            { '.element': '.element', content: 'element in layer 1' },
            { '.element': '.element', content: 'element in layer 2' }
          ])

          const results = up.fragment.all(window.document, '.element', { layer: 1 })

          expect(results.length).toBe(1)
          expect(results[0]).toHaveText('element in layer 1')
        })

        it('does not filter layers if given an external document', function() {
          const html = `
            <div class="element">external element</div>
          `
          const parser = new DOMParser()
          const externalDocument = parser.parseFromString(html, "text/html")
          expect(document).toEqual(jasmine.any(Document))

          const results = up.fragment.all(externalDocument, '.element')

          expect(results.length).toBe(1)
          expect(results[0]).toHaveText('external element')
        })
      })

      describe('layer matching', function() {

        beforeEach(async function() {
          this.rootElement = fixture('.element.in-root')
          this.overlayElement = e.createFromSelector('.element.in-overlay')
          await up.layer.open({ fragment: this.overlayElement })
        })

        it('matches elements in the current layer only', function() {
          const results = up.fragment.all('.element')
          expect(results).toEqual([this.overlayElement])
        })

        it("only matches elements in the layer of the given { origin }", function() {
          const otherRootElement = fixture('.element.other.in-root')
          const results = up.fragment.all('.element', { origin: otherRootElement })
          expect(results).toEqual([this.rootElement, otherRootElement])
        })

        it('only matches elements in the given { layer }', function() {
          const results = up.fragment.all('.element', { layer: 'root' })
          expect(results).toEqual([this.rootElement])
        })

        it('returns an empty array if no element matches', function() {
          const results = up.fragment.all('.other')
          expect(results).toEqual([])
        })

        it('returns the first argument if that is already an element, even if { layer } is given', function() {
          const match = fixture('.match')
          const result = up.fragment.get(match, { layer: 'root' })
          expect(result).toBe(match)
        })
      })
    })

    describe('up.fragment.matches()', function() {

      it('returns whether the fragment matches the selector', function() {
        const fragment = fixture('.foo')
        expect(up.fragment.matches(fragment, '.foo')).toBe(true)
        expect(up.fragment.matches(fragment, '.bar')).toBe(false)
      })

      it('supports non-standard pseudos like :main', function() {
        const foo = fixture('.foo')
        const bar = fixture('.bar')
        up.fragment.config.mainTargets = ['.foo']

        expect(up.fragment.matches(foo, ':main')).toBe(true)
        expect(up.fragment.matches(bar, ':main')).toBe(false)
      })
    })

    describe('up.fragment.closest()', function() {

      it('returns the closest ancestor of the given root that matches the given selector', function() {
        const $grandGrandMother = $fixture('.match')
        const $grandMother = $grandGrandMother.affix('.match')
        const $mother = $grandMother.affix('.no-match')
        const $element = $mother.affix('.element')

        const result = up.fragment.closest($element[0], '.match')
        expect(result).toBe($grandMother[0])
      })

      it('returns the given root if it matches', function() {
        const $mother = $fixture('.match')
        const $element = $mother.affix('.match')

        const result = up.fragment.closest($element[0], '.match')
        expect(result).toBe($element[0])
      })

      it('does not return descendants of the root, even if they match', function() {
        const $element = $fixture('.element')
        const $child = $element.affix('.match')

        const result = up.fragment.closest($element[0], '.match')
        expect(result).toBeMissing()
      })

      it('returns missing if neither root nor ancestor matches', function() {
        const $mother = $fixture('.no-match')
        const $element = $mother.affix('.no-match')

        const result = up.fragment.closest($element[0], '.match')
        expect(result).toBeMissing()
      })

      it('returns missing if an ancestor matches, but is in another layer', function() {
        makeLayers(2)

        const start = up.layer.element
        const result = up.fragment.closest(start, 'body')
        expect(result).toBeMissing()
      })

      it('returns the closest ancestor in a detached tree', function() {
        const $grandGrandMother = $fixture('.match')
        const $grandMother = $grandGrandMother.affix('.match')
        const $mother = $grandMother.affix('.no-match')
        const $element = $mother.affix('.element')

        $grandGrandMother.detach()

        const result = up.fragment.closest($element[0], '.match')
        expect(result).toBe($grandMother[0])
      })
    })

    describe('up.fragment.subtree()', function() {

      it('returns all descendants of the given root matching the given selector', function() {
        const $element = $fixture('.element')
        const $matchingChild = $element.affix('.child.match')
        const $matchingGrandChild = $matchingChild.affix('.grand-child.match')
        const $otherChild = $element.affix('.child')
        const $otherGrandChild = $otherChild.affix('.grand-child')
        const results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual([$matchingChild[0], $matchingGrandChild[0]])
      })

      it('includes the given root if it matches the selector', function() {
        const $element = $fixture('.element.match')
        const $matchingChild = $element.affix('.child.match')
        const $matchingGrandChild = $matchingChild.affix('.grand-child.match')
        const $otherChild = $element.affix('.child')
        const $otherGrandChild = $otherChild.affix('.grand-child')
        const results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual([$element[0], $matchingChild[0], $matchingGrandChild[0]])
      })

      it('does not return ancestors of the root, even if they match', function() {
        const $parent = $fixture('.parent.match')
        const $element = $parent.affix('.element')
        const results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual([])
      })

      it('returns an empty list if neither root nor any descendant matches', function() {
        const $element = $fixture('.element')
        const $child = $element.affix('.child')
        const results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual([])
      })

      it('ignores descendants that are being destroyed', function() {
        const element = fixture('.element')
        const activeChild = e.affix(element, '.child')
        const destroyingChild = e.affix(element, '.child.up-destroying')

        const results = up.fragment.subtree(element, '.child')

        expect(results).toEqual([activeChild])
      })

      it('supports non-standard selector extensions')

      it('matches descendants in a detached tree', function() {
        const detachedTree = fixture('.element')
        const matchingChild = e.affix(detachedTree, '.child')
        const otherChild = e.affix(detachedTree, '.other-child')

        const results = up.fragment.subtree(detachedTree, '.child')

        expect(results).toEqual([matchingChild])
      })

      it('matches descendants in a detached tree when the current layer is an overlay (bugfix)', function() {
        makeLayers(2)

        const detachedTree = fixture('.element')
        const matchingChild = e.affix(detachedTree, '.child')
        const otherChild = e.affix(detachedTree, '.other-child')

        const results = up.fragment.subtree(detachedTree, '.child')

        expect(results).toEqual([matchingChild])
      })

      it('only matches elements in the layer of the root element', function() {
        makeLayers([{ target: '.element' }, { target: '.element' }])

        const results = up.fragment.subtree(document.body, '.element')

        expect(results).toEqual([up.fragment.get('.element', { layer: 'root' })])
      })
    })

    describe('up.fragment.isAlive()', function() {

      it('returns true for the body element', function() {
        expect(up.fragment.isAlive(document.body)).toBe(true)
      })

      it('returns true for a fragment attached to the DOM', function() {
        let element = fixture('#fragment')
        expect(up.fragment.isAlive(element)).toBe(true)
      })

      it('returns true for a fragmnent in an enter transition, but false for a fragment in an exit transition', async function() {
        htmlFixture(`<div id="fragment" class="old">old</div>`)
        up.render({ fragment: '<div id="fragment" class="new">new</div>', transition: 'cross-fade', duration: 1000 })

        let oldElement = document.querySelector('#fragment.old')
        let newElement = document.querySelector('#fragment.new')

        expect(oldElement).toBeAttached()
        expect(newElement).toBeAttached()

        expect(up.fragment.isAlive(oldElement)).toBe(false)
        expect(up.fragment.isAlive(newElement)).toBe(true)
      })

      it('returns false for a detached fragment', function() {
        let element = document.createElement('div')
        expect(up.fragment.isAlive(element)).toBe(false)
      })

      it('returns false for a fragment with a detached ancestor', function() {
        let [container, child] = htmlFixtureList(`
          <div id="container">
            <div id="child"></div>
          </div>
        `)

        expect(up.fragment.isAlive(child)).toBe(true)
        container.remove()
        expect(up.fragment.isAlive(child)).toBe(false)
      })

      it('returns false for a fully destroyed fragmnent', function() {
        let element = fixture('#fragment')
        expect(up.fragment.isAlive(element)).toBe(true)

        up.destroy(element)

        expect(up.fragment.isAlive(element)).toBe(false)
      })

      it('returns false for a destroying fragmnent still playing its exit animation', async function() {
        let element = fixture('#fragment')
        expect(up.fragment.isAlive(element)).toBe(true)

        up.destroy(element, { animation: 'fade-out', duration: 1000 })

        await wait(50)

        expect(element).toBeAttached()
        expect(up.fragment.isAlive(element)).toBe(false)
      })

      it('returns false for a fragmnent with a destroying ancestor still playing its exit animation', async function() {
        let [container, child] = htmlFixtureList(`
          <div id="container">
            <div id="child"></div>
          </div>
        `)

        expect(up.fragment.isAlive(child)).toBe(true)

        up.destroy(container, { animation: 'fade-out', duration: 1000 })

        await wait(50)

        expect(child).toBeAttached()
        expect(up.fragment.isAlive(child)).toBe(false)
      })

    })

    describe('up.fragment.contains()', function() {

      it('returns whether the given element is an ancestor of an element matching the given selector', function() {
        const root = fixture('#root')
        const child = e.affix(root, '#child')
        const grandChild = e.affix(root, '#grand-child')
        const sibling = fixture('#sibling')

        expect(up.fragment.contains(root, '#child')).toBe(true)
        expect(up.fragment.contains(root, '#grand-child')).toBe(true)
        expect(up.fragment.contains(root, '#sibling')).toBe(false)
        expect(up.fragment.contains(child, '#root')).toBe(false)
      })

      it('returns whether the given element itself matches the given selector', function() {
        const root = fixture('#root')
        expect(up.fragment.contains(root, '#root')).toBe(true)
        expect(up.fragment.contains(root, '#other')).toBe(false)
      })

      it('ignores matches on other layers', function() {
        up.layer.open({ target: '.child', content: 'child content' })

        expect(up.fragment.contains(document.body, '.child')).toBe(false)
      })

      it('returns whether the given element is an ancestor of the other given element', function() {
        const root = fixture('#root')
        const child = e.affix(root, '#child')
        const grandChild = e.affix(root, '#grand-child')
        const sibling = fixture('#sibling')

        expect(up.fragment.contains(root, child)).toBe(true)
        expect(up.fragment.contains(root, grandChild)).toBe(true)
        expect(up.fragment.contains(root, sibling)).toBe(false)
        expect(up.fragment.contains(child, root)).toBe(false)
      })

      it('returns whether the given element is the other given element', function() {
        const root = fixture('#root')
        const sibling = fixture('#sibling')
        expect(up.fragment.contains(root, root)).toBe(true)
        expect(up.fragment.contains(root, sibling)).toBe(false)
      })

      it('supports a Document for the root', function() {
        fixture('.internal-match')

        const parser = new DOMParser()
        const externalHTML = '<div class="external-match"></div>'
        const externalDocument = parser.parseFromString(externalHTML, "text/html")

        expect(up.fragment.contains(document, '.internal-match')).toBe(true)
        expect(up.fragment.contains(document, '.external-match')).toBe(false)

        expect(up.fragment.contains(externalDocument, '.internal-match')).toBe(false)
        expect(up.fragment.contains(externalDocument, '.external-match')).toBe(true)
      })
    })

  })

})
