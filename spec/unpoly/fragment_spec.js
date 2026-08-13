const u = up.util
const e = up.element
const $ = jQuery

describe('up.fragment', function() {

  describe('JavaScript functions', function() {

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

    require('./fragment_render_spec')

    if (up.migrate.loaded) {
      describe('up.replace()', function() {
        it('delegates to up.navigate({ target, url }) (deprecated)', function() {
          const navigateSpy = up.fragment.navigate.mock()
          const deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.replace('target', 'url')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', url: 'url' })
          expect(deprecatedSpy).toHaveBeenCalled()
        })
      })
    }

    if (up.migrate.loaded) {
      describe('up.extract()', function() {
        it('delegates to up.navigate({ target, document }) (deprecated)', function() {
          const navigateSpy = up.fragment.navigate.mock()
          const deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.extract('target', 'document')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', document: 'document' })
          expect(deprecatedSpy).toHaveBeenCalled()
        })
      })
    }

    describe('up.navigate()', function() {
      it('delegates to up.render({ ...options, navigate: true })', function() {
        const renderSpy = up.fragment.render.mock()
        up.navigate({ url: 'url' })
        expect(renderSpy).toHaveBeenCalledWith({ url: 'url', navigate: true })
      })

      it("updates the layer's main target by default (since navigation sets { fallback: true })", async function() {
        up.fragment.config.mainTargets.unshift('.main-target')
        fixture('.main-target')

        up.navigate({ url: '/path2' })

        await wait()
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.main-target')
      })
    })

    describe('up.destroy()', function() {
      it('removes the element with the given selector', async function() {
        $fixture('.element')
        up.destroy('.element')
        await wait()

        expect('.element').not.toBeAttached()
      })

      it('has a sync effect', function() {
        fixture('.element')
        up.destroy('.element')
        expect('.element').not.toBeAttached()
      })

      it('runs an animation before removal with { animate } option', async function() {
        const $element = $fixture('.element')
        up.destroy($element, { animation: 'fade-out', duration: 200, easing: 'linear' })
        await wait()

        expect($element).toHaveOwnOpacity(1.0, 0.15)
        await wait(100)

        expect($element).toHaveOwnOpacity(0.5, 0.3)
        await wait(175)

        expect($element).toBeDetached()
      })

      it('calls destructors for custom elements', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) => destructor)
        helloFixture('.element')
        up.destroy('.element')
        expect(destructor).toHaveBeenCalled()
      })

      it('does not call destructors twice if up.destroy() is called twice on the same fragment', async function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) => destructor)

        const element = fixture('.element')
        up.hello(element)

        up.destroy(element, { animation: 'fade-out', duration: 10 })
        up.destroy(element, { animation: 'fade-out', duration: 10 })
        await wait(150)

        expect(destructor.calls.count()).toBe(1)
      })

      it('calls destructors while the element is still attached', function() {
        const attachmentSpy = jasmine.createSpy('attachment spy')
        const compiler = (element) => () => attachmentSpy(element.isConnected)
        up.compiler('.element', compiler)

        const element = fixture('.element')
        up.hello(element)
        up.destroy(element)

        expect(attachmentSpy).toHaveBeenCalledWith(true)
      })

      it('calls destructors of descendants that will be detached with the element', function() {
        const destructor = jasmine.createSpy('destructor')
        const compiler = (element) => () => destructor()
        up.compiler('.element', compiler)

        const element = htmlFixture(`
          <div class="container">
            <div class="element">element</div>
          </div>
        `)
        up.hello(element)
        up.destroy(element)

        expect(destructor).toHaveBeenCalled()
      })

      it('marks the old element as [inert] before destructors', function(done) {
        const testElement = function(element) {
          expect(element).toHaveText('old text')
          expect(element).toMatchSelector('[inert]')
          done()
        }

        up.compiler('.container', (element) => () => testElement(element))

        helloFixture('.container', { text: 'old text' })

        up.destroy('.container')
      })

      it('immediately marks the old element as .up-destroying', function() {
        const container = fixture('.container')

        up.destroy('.container', { animation: 'fade-out', duration: 100 })

        expect(container).toMatchSelector('.up-destroying')
      })

      it('waits until an { animation } is done before calling destructors', async function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.container', (element) => () => destructor(element.innerText))
        const $container = $fixture('.container').text('old text')
        up.hello($container)

        up.destroy('.container', { animation: 'fade-out', duration: 100 })
        await wait(50)

        expect(destructor).not.toHaveBeenCalled()
        await wait(200)

        expect(destructor).toHaveBeenCalledWith('old text')
      })

      it('marks the element as .up-destroying while it is animating', async function() {
        const $element = $fixture('.element')
        up.destroy($element, { animation: 'fade-out', duration: 80, easing: 'linear' })
        await wait()

        expect($element).toHaveClass('up-destroying')
      })

      it('runs an { onFinished } callback after the element has been removed from the DOM', async function() {
        const $parent = $fixture('.parent')
        const $element = $parent.affix('.element')
        expect($element).toBeAttached()

        const onFinished = jasmine.createSpy('onFinished callback')

        up.destroy($element, { animation: 'fade-out', duration: 30, onFinished })
        await wait()

        expect($element).toBeAttached()
        expect(onFinished).not.toHaveBeenCalled()
        await wait(200)

        expect($element).toBeDetached()
        expect(onFinished).toHaveBeenCalled()
      })

      it('calls #sync() on all layers in the stack', async function() {
        makeLayers(2)
        await wait()

        spyOn(up.layer.stack[0], 'sync')
        spyOn(up.layer.stack[1], 'sync')

        const element = up.layer.stack[1].affix('.element')

        up.destroy(element)
        await wait()

        expect(up.layer.stack[0].sync).toHaveBeenCalled()
        expect(up.layer.stack[1].sync).toHaveBeenCalled()
      })

      it('does not crash and runs destructors when destroying a detached element (bugfix)', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) => destructor)
        const detachedElement = up.element.createFromSelector('.element')
        up.hello(detachedElement)
        up.destroy(detachedElement)
        expect(destructor).toHaveBeenCalled()
      })

      describe('emission of up:fragment:destroyed', function() {

        it('awaits an exit animation before emitting up:fragment:destroyed', async function() {
          const parent = fixture('.parent')
          const element = e.affix(parent, '.element')
          expect(element).toBeAttached()

          const listener = jasmine.createSpy('event listener')
          parent.addEventListener('up:fragment:destroyed', listener)

          up.destroy(element, { animation: 'fade-out', duration: 60 })
          await wait()

          expect(element).toMatchSelector('.up-destroying')
          expect(element).toBeAttached()
          expect(listener).not.toHaveBeenCalled()

          await wait(100)

          expect(element).toBeDetached()
          expect(listener).toHaveBeenCalled()
        })

        it('awaits an exit animation before emitting up:fragment:destroyed', async function() {
          const parent = fixture('.parent')
          const element = e.affix(parent, '.element')
          expect(element).toBeAttached()

          const listener = jasmine.createSpy('event listener')
          parent.addEventListener('up:fragment:destroyed', listener)

          up.destroy(element, { animation: 'fade-out', duration: 60 })
          await wait()

          expect(element).toMatchSelector('.up-destroying')
          expect(element).toBeAttached()
          expect(listener).not.toHaveBeenCalled()

          await wait(100)

          expect(element).toBeDetached()
          expect(listener).toHaveBeenCalled()
        })

      })

      describe('when a destructor crashes', function() {
        it('emits an error event but does not throw an exception', async function() {
          const destroyError = new Error('destructor error')
          const element = fixture('.element')
          up.destructor(element, function() { throw destroyError })

          await jasmine.expectGlobalError(destroyError, function() {
            const doDestroy = () => up.destroy(element)
            expect(doDestroy).not.toThrowError()
          })
        })

        it('removes the element', async function() {
          const destroyError = new Error('destructor error')
          const element = fixture('.element')
          up.destructor(element, function() { throw destroyError })

          await jasmine.expectGlobalError(destroyError, () => up.destroy(element))

          expect(element).toBeDetached()
        })

        it('removes the element after animation', async function() {
          const destroyError = new Error('destructor error')
          const element = fixture('.element')
          up.destructor(element, function() { throw destroyError })

          up.destroy(element, { animation: 'fade-out', duration: 50 })

          expect(element).not.toBeDetached()

          await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
            expect(globalErrorSpy).not.toHaveBeenCalled()
            await wait(150)

            expect(element).toBeDetached()
            expect(globalErrorSpy).toHaveBeenCalledWith(destroyError)
          })
        })
      })

      describe('pending requests', function() {
        it('aborts pending requests targeting the given element', async function() {
          const target = fixture('.target')
          const promise = up.render(target, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(target)

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })

        it('aborts pending requests targeting a descendant of the given element', async function() {
          const parent = fixture('.parent')
          const child = e.affix(parent, '.child')
          const promise = up.render(child, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(parent)

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })

        it('does not abort pending requests targeting an ascendant of the given element', async function() {
          const parent = fixture('.parent')
          const child = e.affix(parent, '.child')
          const promise = up.render(parent, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(child)

          await expectAsync(promise).toBePending()
        })
      })
    })

    describe('up.reload()', function() {

      it('reloads the given selector from the closest known source URL', async function() {
        const container = fixture('.container[up-source="/source"]')
        const element = e.affix(container, '.element', { text: 'old text' })

        up.reload('.element')
        await wait()

        expect(jasmine.lastRequest().url).toMatchURL('/source')
        jasmine.respondWith(`
          <div class="container">
            <div class="element">new text</div>
          </div>
        `)
        await wait()

        expect('.element').toHaveText('new text')
      })

      it('reloads the given element', async function() {
        const element = fixture('.element', { 'up-source': '/source', text: 'old text' })

        up.reload(element)
        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.element')
        expect(jasmine.lastRequest().url).toMatchURL('/source')
        jasmine.respondWithSelector('.element', { text: 'new text' })
        await wait()

        expect('.element').toHaveText('new text')
      })

      it('reloads a fragment from the URL from which it was received', async function() {
        fixture('.container')

        up.render('.container', { url: '/container-source' })
        await wait()

        jasmine.respondWith(`
          <div class='container'>
            <div class='target'>target text</div>
          </div>
        `)
        await wait()

        expect('.container').toHaveSelector('.target')
        expect('.target').toHaveText('target text')

        up.reload('.target')
        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')
        expect(jasmine.lastRequest().url).toMatchURL('/container-source')

        jasmine.respondWithSelector('.target', { text: 'reloaded target text' })
        await wait()

        expect('.target').toHaveText('reloaded target text')
      })

      it('throws a readable error when attempting to reloading a detached element', async function() {
        const element = fixture('.element', { 'up-source': '/source', text: 'old text' })
        element.remove() // detach from document

        await expectAsync(up.reload(element)).toBeRejectedWith(jasmine.anyError(/detached/))
      })

      if (up.migrate.loaded) {
        it('reloads the given jQuery collection', async function() {
          const element = fixture('.element', { 'up-source': '/source', text: 'old text' })

          up.reload($(element))
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.element')
          expect(jasmine.lastRequest().url).toMatchURL('/source')
          jasmine.respondWithSelector('.element', { text: 'new text' })
          await wait()

          expect('.element').toHaveText('new text')
        })
      }

      describe('caching', function() {
        it('does not use a cached response', async function() {
          await jasmine.populateCache('/source', '<div class="element">cached text</div>')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          const element = htmlFixture('<div class="element" up-source="/source">inserted text</div>')

          up.reload(element)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
          jasmine.respondWith('<div class="element">fresh text</div>')
          await wait()

          expect('.element').toHaveText('fresh text')
        })

        it('restores an element from cache with { cache: true }', async function() {
          await jasmine.populateCache('/source', '<div class="element">cached text</div>')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          const element = htmlFixture('<div class="element" up-source="/source">inserted text</div>')

          up.reload(element, { cache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect('.element').toHaveText('cached text')
        })

        it('revalidates an element restored from an expired cache entry with { revalidate: "auto" }', async function() {
          await jasmine.populateCache('/source', '<div class="element">cached text</div>')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          up.cache.expire()
          await wait()

          const element = htmlFixture('<div class="element" up-source="/source">inserted text</div>')

          up.reload(element, { cache: true, revalidate: 'auto' })
          await wait()

          expect('.element').toHaveText('cached text')
          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWith('<div class="element">revalidated text</div>')
          await wait()

          expect('.element').toHaveText('revalidated text')
        })

      })

      it('does not reveal by default', async function() {
        const element = fixture('.element[up-source="/source"]', { text: 'old text' })

        const revealSpy = up.reveal.mock().and.returnValue(Promise.resolve())

        up.reload('.element')
        await wait()

        jasmine.respondWithSelector('.element', { text: 'new text' })
        await wait()

        expect('.element').toHaveText('new text')
        expect(revealSpy).not.toHaveBeenCalled()
      })

      it('keeps scroll positions of reloaded viewports', async function() {
        let html = (text) => `
          <div id="target" up-source="/source">
            <div id="viewport" up-viewport style="overflow-y: scroll; height: 100px;">
              <div id="content" style="height: 10000px;">
                ${text}
              </div>
            </div>
          </div>
        `

        htmlFixtureList(html('old content'))

        document.querySelector('#viewport').scrollTop = 433
        expect('#viewport').toBeScrolledTo(433)

        up.reload('#target')
        await wait()
        jasmine.respondWith(html('new content'))
        await wait()

        expect('#viewport').toHaveText('new content')
        expect('#viewport').toBeScrolledTo(433)
      })

      it('keeps focus if the focused element can be rediscovered', async function() {
        let html = (text) => `
          <div id="target" up-source="/source">
            <form>
              <input id="input" type="text">
            </form>
            <div id="content">
              ${text}
            </div>
          </div>
        `

        htmlFixtureList(html('old content'))

        document.querySelector('#input').focus()
        expect('#input').toBeFocused()

        up.reload('#target')
        await wait()
        jasmine.respondWith(html('new content'))
        await wait()

        expect('#content').toHaveText('new content')
        expect('#input').toBeFocused()
      })

      describe('last modification time', function() {

        it("sends an If-Modified-Since header with the fragment's timestamp so the server can render nothing if no fresher content exists", async function() {
          const element = fixture('.element[up-source="/source"][up-time="1445412480"]')

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toEqual('Wed, 21 Oct 2015 07:28:00 GMT')
        })

        it("sends no If-Modified-Since header if no timestamp is known for the fragment", async function() {
          const element = fixture('.element[up-source="/source"]')

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toBeUndefined()
        })

        if (up.migrate.loaded) {
          it("sends an X-Up-Reload-From-Time header with the fragment's timestamp so the server can render nothing if no fresher content exists", async function() {
            const element = fixture('.element[up-source="/source"][up-time="1608712106"]')

            up.reload(element)
            await wait()

            expect(jasmine.lastRequest().url).toMatchURL('/source')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Reload-From-Time']).toEqual('1608712106')
          })

          it("sends an X-Up-Reload-From-Time: 0 header if no timestamp is known for the fragment", async function() {
            const element = fixture('.element[up-source="/source"]')

            up.reload(element)
            await wait()

            expect(jasmine.lastRequest().url).toMatchURL('/source')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Reload-From-Time']).toEqual('0')
          })
        }
      })

      describe('ETags', function() {

        it("sends an If-None-Match header with the fragment's timestamp so the server can render nothing if no fresher content exists", async function() {
          const element = fixture(".element[up-source='/source'][up-etag='\"abc\"']")

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toEqual('"abc"')
        })

        it("sends no If-None-Match header if no timestamp is known for the fragment", async function() {
          const element = fixture('.element[up-source="/source"]')

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toBeUndefined()
        })
      })

      describe('with { data } option', function() {
        it('lets the user forward data to compilers of the new element', async function() {
          const dataSpy = jasmine.createSpy('data spy')

          up.compiler('.element', function(element, data) {
            dataSpy(data)
            return element.addEventListener('click', () => up.reload(element, { data }))
          })

          const element = fixture('.element', { 'data-foo': 'a', 'up-source': '/source' })
          up.hello(element)

          expect(dataSpy.calls.count()).toBe(1)
          expect(dataSpy.calls.argsFor(0)[0].foo).toBe('a')

          Trigger.click(element)
          await wait()

          jasmine.respondWithSelector('.element', { 'data-foo': 'b', 'data-bar': 'c' })
          await wait()

          expect(dataSpy.calls.count()).toBe(2)
          expect(dataSpy.calls.argsFor(1)[0].foo).toBe('a')

          // Non-overridden props are still visible
          expect(dataSpy.calls.argsFor(1)[0].bar).toBe('c')
        })

        it('does not override data for secondary targets', async function() {
          const html = (prefix) => `
            <div id="foo">
              ${prefix} foo
            </div>  

            <div id="bar">
              ${prefix} bar
            </div>  
          `

          htmlFixtureList(html('old'))

          await up.render({ target: '#foo, #bar', document: html('new'), data: { fooKey: 'fooValue' } })

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('new bar')

          expect(up.data('#foo')).toEqual({ fooKey: 'fooValue' })
          expect(up.data('#bar')).toEqual({ })
        })

        it('does not override data for hungry targets', async function() {
          const html = (prefix) => `
            <div id="foo">
              ${prefix} foo
            </div>  

            <div id="bar" up-hungry>
              ${prefix} bar
            </div>  
          `

          htmlFixtureList(html('old'))

          await up.render({ target: '#foo', document: html('new'), data: { fooKey: 'fooValue' } })

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('new bar')

          expect(up.data('#foo')).toEqual({ fooKey: 'fooValue' })
          expect(up.data('#bar')).toEqual({ })
        })
      })

      describe('with { keepData: true } option', function() {
        it("compiles the new element with the old element's data", async function() {
          const dataSpy = jasmine.createSpy('data spy')

          up.compiler('.element', function(element, data) {
            dataSpy(data)
            return element.addEventListener('click', () => up.reload(element, { keepData: true }))
          })

          const element = fixture('.element', { 'data-foo': 'a', 'up-source': '/source' })
          up.hello(element)

          expect(dataSpy.calls.count()).toBe(1)
          expect(dataSpy.calls.argsFor(0)[0].foo).toBe('a')

          Trigger.click(element)
          await wait()

          jasmine.respondWithSelector('.element', { 'data-foo': 'b' })
          await wait()

          expect(dataSpy.calls.count()).toBe(2)
          expect(dataSpy.calls.argsFor(1)[0].foo).toBe('a')
        })
      })

      it("reloads the layer's main element if no selector is given", async function() {
        up.fragment.config.mainTargets = ['.element']

        fixture('.element[up-source="/source"]', { text: 'old text' })

        up.reload()
        await wait()

        expect(jasmine.lastRequest().url).toMatch(/\/source$/)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
        jasmine.respondWithSelector('.element', { content: 'new text' })
        await wait()

        expect('.element').toHaveText('new text')
      })

      describe('reloading multiple fragments', function() {

        it('reloads multiple fragments', async function() {
          const foo = fixture('#foo[up-source="/path"]', { text: 'old foo' })
          const bar = fixture('#bar[up-source="/path"]', { text: 'old bar' })

          up.reload('#foo, #bar')
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/path')

          jasmine.respondWith(`
            <div id="foo">new foo</div>
            <div id="bar">new bar</div>
          `)
          await wait()

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('new bar')
        })

        it('uses source URL, ETag and last modifiction time from the first matching fragment', async function() {
          const foo = fixture('#foo[up-source="/foo-source"][up-etag="foo-etag"][up-time="1704067200"]', { text: 'old foo' })
          const bar = fixture('#bar[up-source="/bar-source"][up-etag="bar-etag"][up-time="1735689600"]', { text: 'old bar' })

          up.reload('#foo, #bar')
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/foo-source')
          expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toMatchURL('foo-etag')
          expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toMatchURL(new Date(1704067200 * 1000).toUTCString())
        })
      })
    })

    describe('up.fragment.source()', function() {

      it('returns the source the fragment was retrieved from', async function() {
        fixture('.target')
        up.render('.target', { url: '/path' })
        await wait()

        jasmine.respondWithSelector('.target')
        await wait()

        expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
      })

      it('returns the source of a parent fragment if the given fragment has no reloadable source', async function() {
        fixture('.target')
        up.render('.target', { url: '/outer' })
        await wait()

        jasmine.respondWith(`
          <div class="target">
            <div class="inner">
              inner
            </div>
          </div>
        `)
        await wait()

        up.render('.inner', { url: '/inner', method: 'post' })
        await wait()

        jasmine.respondWithSelector('.inner')
        await wait()

        expect(up.fragment.source(e.get('.inner'))).toMatchURL('/outer')
      })

      it('allows users to provide an alternate reloading URL with an [up-source] attribute', async function() {
        fixture('.outer')
        up.render('.outer', { url: '/outer' })
        await wait()

        jasmine.respondWithSelector('.outer .between[up-source="/between"] .inner')
        await wait()

        expect(up.fragment.source(e.get('.outer'))).toMatchURL('/outer')
        expect(up.fragment.source(e.get('.between'))).toMatchURL('/between')
        expect(up.fragment.source(e.get('.inner'))).toMatchURL('/between')
      })

      it('also accepts a CSS selector instead of an element (used e.g. by unpoly-site)', function() {
        fixture('.target[up-source="/my-source"]')
        expect(up.fragment.source('.target')).toMatchURL('/my-source')
      })

      it('already reflects the latest source when called from a compiler function', async function() {
        let sourceSpy = jasmine.createSpy('source spy')

        up.compiler('#two', function(element) {
          sourceSpy(up.fragment.source(element))
        })

        fixture('.element#one')

        up.render({ target: '.element', history: true, url: '/url-after-render' })
        await wait()

        jasmine.respondWithSelector('.element#two')
        await wait()

        expect(sourceSpy).toHaveBeenCalledWith('/url-after-render')
      })

    })

    describe('up.fragment.failKey', function() {

      it('returns a failVariant for the given object key', function() {
        const result = up.fragment.failKey('foo')
        expect(result).toEqual('failFoo')
      })

      it('returns undefined if the given key is already prefixed with "fail"', function() {
        const result = up.fragment.failKey('failFoo')
        expect(result).toBeUndefined()
      })
    })

    describe('up.fragment.successKey', function() {

      it('returns the unprefixed key for the given failVariant', function() {
        const result = up.fragment.successKey('failFoo')
        expect(result).toEqual('foo')
      })

      it('returns undefined if the given key is not prefixed with "fail"', function() {
        const result = up.fragment.successKey('foo')
        expect(result).toBeUndefined()
      })

      it('returns undefined for the key "fail"', function() {
        const result = up.fragment.successKey('fail')
        expect(result).toBeUndefined()
      })

      it('prioritizes the prefix "on", converting onFailFoo to onFoo', function() {
        const result = up.fragment.successKey('onFailFoo')
        expect(result).toEqual('onFoo')
      })
    })

    describe('up.fragment.toTarget()', function() {

      it("prefers using the element's [up-id] attribute to using the element's ID", function() {
        const element = fixture('div[up-id=up-id-value]#id-value')
        expect(up.fragment.toTarget(element)).toBe('[up-id="up-id-value"]')
      })

      it("prefers using the element's ID to using the element's name", function() {
        const element = fixture('div#id-value[name=name-value]')
        expect(up.fragment.toTarget(element)).toBe("#id-value")
      })

      it("uses an attribute selector if the element's ID starts with a digit", function() {
        const element = fixture('div')
        element.id = '123-foo'
        expect(up.fragment.toTarget(element)).toBe('[id="123-foo"]')
      })

      it("selects the ID with an attribute selector if the ID contains a slash", function() {
        const element = fixture('div')
        element.setAttribute('id', 'foo/bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo/bar"]')
      })

      it("selects the ID with an attribute selector if the ID contains a space", function() {
        const element = fixture('div')
        element.setAttribute('id', 'foo bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo bar"]')
      })

      it("selects the ID with an attribute selector if the ID contains a dot", function() {
        const element = fixture('div')
        element.setAttribute('id', 'foo.bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo.bar"]')
      })

      it("selects the ID with an attribute selector if the ID contains a quote", function() {
        const element = fixture('div')
        element.setAttribute('id', 'foo"bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo\\"bar"]')
      })

      it("prefers using the element's class to using the element's tag name", function() {
        const element = fixture('div.class')
        expect(up.fragment.toTarget(element)).toBe(".class")
      })

      it('does not use Unpoly classes to compose a class selector', function() {
        const element = fixture('div.up-current.class')
        expect(up.fragment.toTarget(element)).toBe(".class")
      })

      it('does not use classes matching a string in up.fragment.config.badTargetClasses', function() {
        up.fragment.config.badTargetClasses.push('foo')
        const element = fixture('div.foo.bar')
        expect(up.fragment.toTarget(element)).toBe(".bar")
      })

      it('does not use classes matching a RegExp in up.fragment.config.badTargetClasses', function() {
        up.fragment.config.badTargetClasses.push(/^fo+$/)
        const element = fixture('div.fooooo.bar')
        expect(up.fragment.toTarget(element)).toBe(".bar")
      })

      it('uses all classes of an element (to match a BEM block that is identified by a modifier)', function() {
        const element = fixture('div.class1.class2')
        expect(up.fragment.toTarget(element)).toBe(".class1.class2")
      })

      it('escapes colons in class names', function() {
        const element = fixture('div')
        element.classList.add('block')
        element.classList.add('sm:hidden')
        expect(up.fragment.toTarget(element)).toBe(".block.sm\\:hidden")
      })

      it("prefers using the element's [name] attribute to only using the element's tag name", function() {
        const element = fixture('input[name=name-value]')
        expect(up.fragment.toTarget(element)).toBe('input[name="name-value"]')
      })

      it("refers to meta tags by both tag name and [name] attribute", function() {
        const element = fixture('meta[name="csrf-token"]')
        expect(up.fragment.toTarget(element)).toBe('meta[name="csrf-token"]')
      })

      it("refers to meta tags by both tag name and [property] attribute", function() {
        // Yes, OpenGraph uses [property] instead of [name]: https://ogp.me/
        const element = fixture('meta[property="og:title"]')
        expect(up.fragment.toTarget(element)).toBe('meta[property="og:title"]')
      })

      it("uses the tag name of a unique element", function() {
        expect(up.fragment.toTarget(document.body)).toBe("body")
      })

      it("uses the tag name of a unique element even if it has a class", function() {
        document.body.classList.add('some-custom-class')
        expect(up.fragment.toTarget(document.body)).toBe("body")
        document.body.classList.remove('some-custom-class')
      })

      it('can target the <body>', function() {
        expect(up.fragment.toTarget(document.body)).toBe("body")
      })

      it('can target the document root element (<html>)', function() {
        expect(up.fragment.toTarget(document.documentElement)).toBe("html")
      })

      it('does not use the tag name of a non-unique element', function() {
        const div = fixture('div')
        const deriveTarget = () => up.fragment.toTarget(div)
        expect(deriveTarget).toThrowError(/cannot derive/i)
      })

      it('uses "link[rel=canonical]" for such a link', function() {
        const link = fixture('link.some-class[rel="canonical"][href="/foo"]')

        if (up.fragment.toTarget(link).includes('some-class')) {
          const re = up.fragment.toTarget(link)
          console.log(re)
        }

        expect(up.fragment.toTarget(link)).toBe('link[rel="canonical"]')
      })

      it('uses "up-modal-viewport" for such an element, so that viewport can get a key to save scrollTops', function() {
        const link = fixture('up-modal-viewport')
        expect(up.fragment.toTarget(link)).toBe('up-modal-viewport')
      })

      it('throws an error if no good selector is available', function() {
        const element = fixture('p')
        const deriveTarget = () => up.fragment.toTarget(element)
        expect(deriveTarget).toThrowError(/cannot derive good target selector from a <p> element without identifying attributes/i)
      })

      it('escapes quotes in attribute selector values', function() {
        const element = fixture('input')
        element.setAttribute('name', 'foo"bar')
        expect(up.fragment.toTarget(element)).toBe('input[name="foo\\"bar"]')
      })

      it('lets users configure custom deriver patterns in up.fragment.config.targetDerivers', function() {
        const element = fixture('div.foo[custom-attr=value]')
        expect(up.fragment.toTarget(element)).toBe('.foo')

        up.fragment.config.targetDerivers.unshift('*[custom-attr]')

        expect(up.fragment.toTarget(element)).toBe('div[custom-attr="value"]')
      })

      it('lets users configure custom deriver functions in up.fragment.config.targetDerivers', function() {
        const element = fixture('div.foo[custom-attr=value]')
        expect(up.fragment.toTarget(element)).toBe('.foo')

        up.fragment.config.targetDerivers.unshift((element) => e.attrSelector('custom-attr', element.getAttribute('custom-attr')))

        expect(up.fragment.toTarget(element)).toBe('[custom-attr="value"]')
      })

      it('distinguishes between types of link[rel=alternate]', function() {
        const atomLink = fixture('link[rel=alternate][type="application/atom+xml"][ref="/atom.xml"]')
        const rssLink = fixture('link[rel=alternate][type="application/rss+xml"][href="/feed.rss"]')
        expect(up.fragment.toTarget(atomLink)).toBe('link[rel="alternate"][type="application/atom+xml"]')
        expect(up.fragment.toTarget(rssLink)).toBe('link[rel="alternate"][type="application/rss+xml"]')
      })

      it('distinguishes between multiple link[rel=preload] elements with different [href] attributes', function() {
        const preloadFoo = fixture('link[rel="preload"][href="/foo"]')
        const preloadBar = fixture('link[rel="preload"][href="/bar"]')

        expect(up.fragment.toTarget(preloadFoo)).toBe('link[rel="preload"][href="/foo"]')
        expect(up.fragment.toTarget(preloadBar)).toBe('link[rel="preload"][href="/bar"]')
      })

      it('uses `[up-flashes=""]` for a flashes container', function() {
        const flashes = fixture('div[up-flashes]')
        expect(up.fragment.toTarget(flashes)).toBe('[up-flashes=""]')
      })

      it('returns a given string unchanged', function() {
        expect(up.fragment.toTarget('.foo')).toBe('.foo')
      })

      describe('verification', function() {

        it("does not use a derived target that would match a different element", function() {
          const element1 = fixture('div#foo.foo')
          const element2 = fixture('div#foo.bar')

          expect(up.fragment.toTarget(element2)).toBe('.bar')
        })

        it("uses a derived target that would match a different element with up.fragment.config.verifyDerivedTarget = false", function() {
          const element1 = fixture('div#foo.foo')
          const element2 = fixture('div#foo.bar')

          expect(up.fragment.config.verifyDerivedTarget).toBe(true)
          expect(up.fragment.toTarget(element2)).toBe('.bar')

          up.fragment.config.verifyDerivedTarget = false
          expect(up.fragment.toTarget(element2)).toBe('#foo')
        })

        it("allows to override up.fragment.config.verifyDerivedTarget with a { verify } option", function() {
          const element1 = fixture('div#foo.foo')
          const element2 = fixture('div#foo.bar')

          // Show that the option overrides the config default.
          up.fragment.config.verifyDerivedTarget = false
          expect(up.fragment.toTarget(element2, { verify: true })).toBe('.bar')

          // Show that the option overrides the config default.
          up.fragment.config.verifyDerivedTarget = true
          expect(up.fragment.toTarget(element2, { verify: false })).toBe('#foo')
        })

        it("uses a derived target that would match a different element if the given element is detached", function() {
          const rivalElement = fixture('div#foo.foo')
          const detachedElement = up.element.createFromSelector('div#foo.bar')

          expect(up.fragment.config.verifyDerivedTarget).toBe(true)
          expect(up.fragment.toTarget(detachedElement)).toBe('#foo')
        })

        it("uses a derived target that would match a different element if the given element is playing a destroy animation", async function() {
          up.motion.config.enabled = true

          const rivalElement = fixture('div#foo.foo')
          const destroyingElement = fixture('div#foo.bar')

          up.destroy(destroyingElement, { animation: 'fade-out', duration: 200 })

          await wait(30)

          expect(up.fragment.config.verifyDerivedTarget).toBe(true)
          expect(document).toHaveSelector('#foo.bar.up-destroying')
          expect(up.fragment.toTarget(destroyingElement)).toBe('#foo')
        })

        it("uses a derived target that would match a different element if the given element is in its closing layer's close animation", async function() {
          up.motion.config.enabled = true

          const rivalElement = fixture('div#foo.foo')
          const overlay = await up.layer.open({ target: '#foo', fragment: '<div id="foo" class="bar"></div' })
          expect(up.layer.isOverlay()).toBe(true)
          const elementInClosingOverlay = overlay.getFirstSwappableElement()

          expect(elementInClosingOverlay.id).toBe('foo')

          up.layer.accept(null, { animation: 'fade-out', duration: 200 })

          await wait(30)
          expect(document).toHaveSelector('up-modal.up-destroying')

          expect(up.fragment.config.verifyDerivedTarget).toBe(true)
          expect(up.fragment.toTarget(elementInClosingOverlay)).toBe('#foo')
        })
      })

      describe('with { strong: true }', function() {

        it("uses the element's [up-id] attribute", function() {
          const element = fixture('div[up-id=up-id-value]')
          expect(up.fragment.toTarget(element, { strong: true })).toBe('[up-id="up-id-value"]')
        })

        it("uses the element's ID to using the element's name", function() {
          const element = fixture('div#id-value')
          expect(up.fragment.toTarget(element, { strong: true })).toBe("#id-value")
        })

        it("uses the element's tagname if it is the <body> element", function() {
          const element = document.body
          expect(up.fragment.toTarget(element, { strong: true })).toBe("body")
        })

        it("uses the element's tagname if it is the <html> element", function() {
          const element = document.documentElement
          expect(up.fragment.toTarget(element, { strong: true })).toBe("html")
        })

        it("does not use the element's tagname if it is any non-singleton element", function() {
          const element = fixture('my-element')
          const toTarget = () => up.fragment.toTarget(element, { strong: true })
          expect(toTarget).toThrowError(up.CannotTarget)
        })

        it("does not use the element's [class]", function() {
          const element = fixture('div.class')
          const toTarget = () => up.fragment.toTarget(element, { strong: true })
          expect(toTarget).toThrowError(up.CannotTarget)
        })

        it("does not use the element's [name] attribute", function() {
          const element = fixture('input[name=name-value]')
          const toTarget = () => up.fragment.toTarget(element, { strong: true })
          expect(toTarget).toThrowError(up.CannotTarget)
        })
      })
    })

    describe('up.fragment.expandTargets', function() {

      beforeEach(function() {
        up.layer.config.any.mainTargets = []
        up.layer.config.overlay.mainTargets = []
      })

      it('returns a list of simple selectors without changes', function() {
        const targets = ['.foo', '.bar']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.foo', '.bar'])
      })

      it("expands ':main' to the given layer mode's main targets", function() {
        const targets = ['.before', ':main', '.after']
        up.layer.config.root.mainTargets = ['.main1', '.main2']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.before', '.main1', '.main2', '.after'])
      })

      it("expands a descendant selector rooted at ':main'", function() {
        const targets = ['.before .child', ':main .child', '.after .child']
        up.layer.config.root.mainTargets = ['.main1', '.main2']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.before .child', '.main1 .child', '.main2 .child', '.after .child'])
      })

      it("expands true to the given layer mode's main targets (useful because { fallback } is often passed as a target)", function() {
        const targets = ['.before', true, '.after']
        up.layer.config.root.mainTargets = ['.main1', '.main2']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.before', '.main1', '.main2', '.after'])
      })

      it("expands ':layer' to a selector for the given layer's first swappable element", function() {
        const targets = ['.before', ':layer', '.after']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.before', 'body', '.after'])
      })

      it("expands a descendant selector rooted at ':layer'", function() {
        const targets = ['.before .child', ':layer .child', '.after .child']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.before .child', 'body .child', '.after .child'])
      })

      it("expands ':main' to the given layer mode's main targets if a main target is itself ':layer'", function() {
        const targets = ['.before', ':main', '.after']
        up.layer.config.root.mainTargets = [':layer']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.before', 'body', '.after'])
      })

      it('expands an element to a matching selector', function() {
        const element = fixture('#foo')
        const targets = ['.before', element, '.after']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.before', '#foo', '.after'])
      })

      it("it expands ':origin' to a selector for { origin }", function() {
        const targets = ['.before', ':origin .child', '.after']
        const origin = fixture('#foo')
        up.layer.config.root.mainTargets = [':layer']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root, origin })
        expect(expanded).toEqual(['.before', '#foo .child', '.after'])
      })

      it('expands multiple non-standard pseudo selectors in a single target', function() {
        const targets = ['#before', ':layer :main :origin .child', '#after']
        const origin = fixture('#origin')
        up.layer.config.root.mainTargets = ['#main']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root, origin })
        expect(expanded).toEqual(['#before', 'body #main #origin .child', '#after'])
      })

      if (up.migrate.loaded) {
        it("expands the ampersand character '&' to a selector for { origin }", function() {
          const targets = ['.before', '& .child', '.after']
          const origin = fixture('#foo')
          up.layer.config.root.mainTargets = [':layer']
          const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root, origin })
          expect(expanded).toEqual(['.before', '#foo .child', '.after'])
        })
      }

      it('removes duplicate selectors', function() {
        const targets = ['.foo', ':main']
        up.layer.config.root.mainTargets = ['.foo']
        const expanded = up.fragment.expandTargets(targets, { layer: up.layer.root })
        expect(expanded).toEqual(['.foo'])
      })
    })

    describe('up.fragment.resolveOrigin()', function() {

      it("it expands ':origin' to a selector for { origin }", function() {
        const origin = fixture('#foo')
        const resolved = up.fragment.resolveOrigin('.before :origin .after', { origin })
        expect(resolved).toEqual('.before #foo .after')
      })

      if (up.migrate.loaded) {
        it("expands the ampersand character '&' to a selector for { origin }", function() {
          const origin = fixture('#foo')
          const resolved = up.fragment.resolveOrigin('.before & .after', { origin })
          expect(resolved).toEqual('.before #foo .after')
        })

        it("ignores the ampersand character '&' in the value of an attribute selector and does not require an { origin } option (bugfix)", function() {
          const resolved = up.fragment.resolveOrigin('a[href="/foo?a=1&b=2"]')
          expect(resolved).toEqual('a[href="/foo?a=1&b=2"]')
        })

        it("ignores the ampersand character '&' in the value of an attribute selector that also contains square brackets in the attribute value (bugfix)", function() {
          const resolved = up.fragment.resolveOrigin('form[action="/example?param[]=a&param[]=b"]')
          expect(resolved).toEqual('form[action="/example?param[]=a&param[]=b"]')
        })
      }

      it("it expands ':origin' to a selector for { origin } if the origin's target is an attribute selector (bugfix)'", function() {
        const origin = fixture('a[href="/foo"]')
        const resolved = up.fragment.resolveOrigin('.before :origin .after', { origin })
        expect(resolved).toEqual('.before a[href="/foo"] .after')
      })
    })

    describe('up.fragment.config.mainTargets', function() {

      it('gets up.layer.config.any.mainTargets', function() {
        up.layer.config.any.mainTargets = ['.my-special-main-target']
        expect(up.fragment.config.mainTargets).toEqual(['.my-special-main-target'])
      })

      it('sets up.layer.config.any.mainTargets', function() {
        up.fragment.config.mainTargets = ['.new-target']
        expect(up.layer.config.any.mainTargets).toEqual(['.new-target'])
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

    describe('up.context', function() {

      it('gets up.layer.current.context', function() {
        up.layer.current.context = { key: 'value' }
        expect(up.context).toEqual({ key: 'value' })
      })

      it('sets up.layer.current.context', function() {
        up.context = { key: 'newValue' }
        expect(up.layer.current.context).toEqual({ key: 'newValue' })
      })
    })

    describe('up.fragment.time', function() {

      it('returns an [up-time] timestamp of the given element', function() {
        const element = fixture('.element[up-time="1445412480"]')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
      })

      it('returns an [up-time] timestamp of an ancestor', function() {
        const parent = fixture('.parent[up-time="1445412480"]')
        const element = e.affix(parent, '.element')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
      })

      it("returns undefined and ignores ancestor's [up-time] if the element itself has [up-time=false], indicating that the response had no Last-Modified header", function() {
        const parent = fixture('.parent[up-time="1445412480"]')
        const element = e.affix(parent, '.element[up-time=false]')
        expect(up.fragment.time(element)).toBeUndefined()
      })

      it("returns undefined if there is no [up-time] value in the element's ancestry", function() {
        const parent = fixture('.parent')
        const element = e.affix(parent, '.element')
        expect(up.fragment.time(element)).toBeUndefined()
      })

      it('returns an [up-time] value seriaized in RFC 1123 format', function() {
        const element = fixture('.element[up-source="/source"][up-time="Wed, 21 Oct 2015 07:28:00 GMT"]')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
      })
    })

    describe('up.fragment.etag', function() {

      it('returns the [up-etag] value of the given element', function() {
        const element = fixture(".element[up-etag='\"abc\"']")
        expect(up.fragment.etag(element)).toEqual('"abc"')
      })

      it('returns the [up-etag] value of an ancestor', function() {
        const parent = fixture(".parent[up-etag='\"abc\"']")
        const element = e.affix(parent, '.element')
        expect(up.fragment.etag(element)).toEqual('"abc"')
      })

      it("returns undefined if there is no [up-etag] value in the element's ancestry", function() {
        const parent = fixture(".parent")
        const element = e.affix(parent, '.element')
        expect(up.fragment.etag(element)).toBeUndefined()
      })

      it("returns undefined and ignores ancestor's [up-etag] if the element itself has [up-time=etag], indicating that the response had no ETag header", function() {
        const parent = fixture(".parent[up-etag='\"abc\"']")
        const element = e.affix(parent, '.element[up-etag=false]')
        expect(up.fragment.etag(element)).toBeUndefined()
      })
    })

    describe('up.fragment.insertTemp()', function() {

      it('inserts a new element relative to the given reference element', function() {
        const reference = fixture('#reference')
        const newElement = document.createElement('div')
        up.fragment.insertTemp(reference, newElement)

        expect(reference.children[0]).toBe(newElement)
      })

      it('allows to choose a different position relative to the reference element', function() {
        const reference = fixture('#reference')
        const newElement = document.createElement('div')
        up.fragment.insertTemp(reference, 'beforebegin', newElement)

        expect(reference.previousElementSibling).toBe(newElement)
      })

      it('compiles the given element', function() {
        const reference = fixture('#reference')
        const compilerFunction = jasmine.createSpy('compiler function')
        up.compiler('my-element', compilerFunction)
        const newElement = document.createElement('my-element')

        up.fragment.insertTemp(reference, newElement)

        expect(compilerFunction).toHaveBeenCalledWith(newElement, jasmine.anything(), jasmine.anything())
      })

      it('parses a string of HTML', function() {
        const reference = fixture('#reference')
        const newElementHTML = '<my-element></my-element>'
        up.fragment.insertTemp(reference, newElementHTML)

        expect(reference.children[0]).toBeElement()
        expect(reference.children[0]).toMatchSelector('my-element')
      })

      it('looks up a CSS selector matching a <template> to clone', function() {
        const template = htmlFixture(`
          <template id="my-template">
            <div id="my-element">
              element content
            </div>
          </template>
        `)

        const compilerFunction = jasmine.createSpy('compiler function')
        up.compiler('#my-element', compilerFunction)

        const reference = fixture('#reference')

        up.fragment.insertTemp(reference, '#my-template')
        expect(reference.children.length).toBe(1)
        expect(reference.children[0]).toMatchSelector('#my-element')
        expect(reference.children[0]).toHaveText('element content')

        // Test that the template content was cloned, not moved
        expect(reference.children[0]).not.toBe(template.content.children[0])

        // Test that the cloned element was compiled
        expect(compilerFunction).toHaveBeenCalled()
        expect(compilerFunction.calls.mostRecent().args[0]).toBe(reference.children[0])
      })

      it('inserts a NodeList from mixed Element and Text nodes', function() {
        let givenNodes = up.element.createNodesFromHTML('foo <b>bar</b> baz')
        expect(givenNodes.length).toBe(3)
        // Make a copy because it's a live list and we're going to compare it below
        givenNodes = u.copy(givenNodes)

        const reference = fixture('#reference')

        up.fragment.insertTemp(reference, givenNodes)

        expect(reference).toHaveText('foo bar baz')

        // The given nodes are now contained in reference, albeit in an <up-wrapper>
        expect(reference).toContain(givenNodes[0])
        expect(reference).toContain(givenNodes[1])
        expect(reference).toContain(givenNodes[2])
      })

      describe('returned undo function', function() {

        it('detaches the element', function() {
          const reference = fixture('#reference')
          const newElement = document.createElement('div')
          const undo = up.fragment.insertTemp(reference, newElement)

          expect(newElement).toBeAttached()

          undo()

          expect(newElement).toBeDetached()
        })

        it('calls destructors on the element', function() {
          const reference = fixture('#reference')
          const destructorFunction = jasmine.createSpy('destructor function')
          up.compiler('my-element', (element) => destructorFunction)
          const newElement = document.createElement('my-element')
          const undo = up.fragment.insertTemp(reference, newElement)

          expect(destructorFunction).not.toHaveBeenCalled()

          undo()

          expect(destructorFunction).toHaveBeenCalledWith(newElement)
        })
      })

      describe('with a previously attached element', function() {

        it('moves the element to the temporary position', function() {
          const reference = fixture('#reference')
          const newElement = fixture('my-element')

          up.fragment.insertTemp(reference, newElement)

          expect(newElement.parentElement).toBe(reference)
        })

        it('does not run compilers', function() {
          const reference = fixture('#reference')
          const compilerFunction = jasmine.createSpy('compiler function')
          up.compiler('my-element', compilerFunction)
          const newElement = fixture('my-element')

          up.fragment.insertTemp(reference, newElement)

          expect(compilerFunction).not.toHaveBeenCalled()
        })

        describe('returned undo function', function() {

          it('does not run destructors', function() {
            const reference = fixture('#reference')
            const destructorFunction = jasmine.createSpy('destructor function')
            const compilerFunction = jasmine.createSpy('compiler function').and.returnValue(destructorFunction)
            up.compiler('my-element', compilerFunction)
            const newElement = fixture('my-element')

            const undo = up.fragment.insertTemp(reference, newElement)
            expect(compilerFunction).not.toHaveBeenCalled()
            expect(destructorFunction).not.toHaveBeenCalled()

            undo()
            expect(compilerFunction).not.toHaveBeenCalled()
            expect(destructorFunction).not.toHaveBeenCalled()
          })

          it('moves it back to its original precision as an only child', function() {
            const reference = fixture('#reference')
            const oldContainer = fixture('#container')
            const tempElement = e.affix(oldContainer, '#movee')

            const undo = up.fragment.insertTemp(reference, tempElement)
            expect(tempElement.parentElement).toBe(reference)

            undo()

            expect(tempElement.parentElement).toBe(oldContainer)
          })

          it('moves it back to its original precision when it has a next sibling', function() {
            const reference = fixture('#reference')
            const oldContainer = fixture('#container')
            const tempElement = e.affix(oldContainer, '#movee')
            const oldNextSibling = e.affix(oldContainer, '#sibling')

            const undo = up.fragment.insertTemp(reference, tempElement)

            expect(tempElement.parentElement).toBe(reference)

            undo()

            expect(tempElement.parentElement).toBe(oldContainer)
            expect(tempElement.nextElementSibling).toBe(oldNextSibling)
          })

          it('moves it back to its original precision when it has a previous sibling', function() {
            const reference = fixture('#reference')
            const oldContainer = fixture('#container')
            const oldPreviousSibling = e.affix(oldContainer, '#sibling')
            const tempElement = e.affix(oldContainer, '#movee')

            const undo = up.fragment.insertTemp(reference, tempElement)

            expect(tempElement.parentElement).toBe(reference)

            undo()

            expect(tempElement.parentElement).toBe(oldContainer)
            expect(tempElement.previousElementSibling).toBe(oldPreviousSibling)
          })
        })
      })
    })

    describe('up.fragment.abort()', function() {

      beforeEach(function(done) {
        const layerHTML = `
          <div class='parent' id='parent0'>
            <div class='child' id='parent0-child'></div>
          </div>
          <div class='parent' id='parent1'>
            <div class='child' id='parent1-child'></div>
          </div>
        `

        this.layers = makeLayers([
          { content: layerHTML },
          { content: layerHTML },
        ])

        this.layer0Parent0ChildRequest = up.request('/path/a', { layer: this.layers[0], target: '#parent0-child' })
        this.layer0Parent1ChildRequest = up.request('/path/b', { layer: this.layers[0], target: '#parent1-child' })
        this.layer1Parent0ChildRequest = up.request('/path/c', { layer: this.layers[1], target: '#parent0-child' })
        this.layer1Parent1ChildRequest = up.request('/path/d', { layer: this.layers[1], target: '#parent1-child' })

        u.task(done)
      })

      describe('without an argument', function() {

        it('aborts requests for the current layer', function() {
          up.fragment.abort()

          expect(this.layer0Parent0ChildRequest.state).toBe('loading')
          expect(this.layer0Parent1ChildRequest.state).toBe('loading')
          expect(this.layer1Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer1Parent1ChildRequest.state).toBe('aborted')
        })

        it("also aborts requests outside the layer's main element", async function() {
          e.affix(up.layer.element, '#outside-main')
          const outsideRequest = up.request('/path/e', { layer: up.layer.element, target: '#outside-main' })

          await wait()

          up.fragment.abort()

          expect(outsideRequest.state).toBe('aborted')
        })

        describe('with { layer } option', function() {
          it('aborts requests on the given layer', function() {
            up.fragment.abort({ layer: 'root' })

            expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent0ChildRequest.state).toBe('loading')
            expect(this.layer1Parent1ChildRequest.state).toBe('loading')
          })
        })

        describe('with { layer: "any" }', function() {
          it('aborts requests on all layers', function() {
            up.fragment.abort({ layer: 'any' })

            expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent1ChildRequest.state).toBe('aborted')
          })
        })
      })

      describe('with an element', function() {
        it("aborts requests targeting given element's subtree", function() {
          const layer0Parent0 = up.fragment.get('#parent0', { layer: 0 })

          up.fragment.abort(layer0Parent0)

          expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer0Parent1ChildRequest.state).toBe('loading')
          expect(this.layer1Parent0ChildRequest.state).toBe('loading')
          expect(this.layer1Parent1ChildRequest.state).toBe('loading')
        })
      })

      describe('with a list of elements', function() {
        it("aborts requests targeting any of the given elements' subtrees", function() {
          const layer0Parent0 = up.fragment.get('#parent0', { layer: 0 })
          const layer0Parent1 = up.fragment.get('#parent1', { layer: 0 })

          up.fragment.abort([layer0Parent0, layer0Parent1])

          expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
          expect(this.layer1Parent0ChildRequest.state).toBe('loading')
          expect(this.layer1Parent1ChildRequest.state).toBe('loading')
        })
      })

      describe('with a selector', function() {

        it("matches the selector in the current layer and aborts requests within that subtree", function() {
          up.fragment.abort('.parent')

          expect(this.layer0Parent0ChildRequest.state).toBe('loading')
          expect(this.layer0Parent1ChildRequest.state).toBe('loading')
          expect(this.layer1Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer1Parent1ChildRequest.state).toBe('aborted')
        })

        describe('with { layer } option', function() {
          it('resolves the selector on another layer', function() {
            up.fragment.abort('.parent', { layer: 'root' })

            expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent0ChildRequest.state).toBe('loading')
            expect(this.layer1Parent1ChildRequest.state).toBe('loading')
          })
        })
      })

      describe('with { reason } option', function() {
        it('aborts the request with the given reason', async function() {
          up.fragment.abort('#parent0', { reason: 'Given reason' })

          await expectAsync(this.layer1Parent0ChildRequest).toBeRejectedWith(jasmine.anyError(/Given reason/))
        })
      })
    })

    describe('up.fragment.onAborted()', function() {

      it("runs the callback when the fragment is aborted", function() {
        const fragment = fixture('.fragment')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(fragment)

        expect(callback).toHaveBeenCalled()
      })

      it("runs the callback when the fragment's ancestor is aborted", function() {
        const ancestor = fixture('.ancestor')
        const fragment = e.affix(ancestor, '.fragment')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(ancestor)

        expect(callback).toHaveBeenCalled()
      })

      it("does not run the callback when the fragment's sibling is aborted", function() {
        const fragment = fixture('.fragment')
        const sibling = fixture('.sibling')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(sibling)

        expect(callback).not.toHaveBeenCalled()
      })

      it('returns a callback that stops the event listener', function() {
        const fragment = fixture('.fragment')
        const callback = jasmine.createSpy('aborted callback')
        const unsubscribe = up.fragment.onAborted(fragment, callback)

        unsubscribe()
        up.fragment.abort(fragment)

        expect(callback).not.toHaveBeenCalled()
      })

      it("does not run the callback when the fragment's descendant is aborted", function() {
        const fragment = fixture('.fragment')
        const descendant = e.affix(fragment, '.descendant')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(descendant)

        expect(callback).not.toHaveBeenCalled()
      })
    })

    describe('up.fragment.splitTarget()', function() {

      it('returns an array containing a single target', function() {
        const selectors = up.fragment.splitTarget('.one')
        expect(selectors).toEqual(['.one'])
      })

      it('splits multiple targets at commas', function() {
        const selectors = up.fragment.splitTarget('.one, .two')
        expect(selectors).toEqual(['.one', '.two'])
      })

      it('does not split at commas within parentheses', function() {
        const selectors = up.fragment.splitTarget('.one:has(.three, .four), .two')
        expect(selectors).toEqual(['.one:has(.three, .four)', '.two'])
      })
    })

    describe('up.fragment.parseTargetSteps()', function() {

      it('parses a single target', function() {
        const steps = up.fragment.parseTargetSteps('.one')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one' })
        ])
      })

      it('parses multiple targets', function() {
        const steps = up.fragment.parseTargetSteps('.one, .two')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one' }),
          jasmine.objectContaining({ selector: '.two' }),
        ])
      })

      it('parses multiple targets with commas within parentheses', function() {
        const steps = up.fragment.parseTargetSteps('.one:has(.three, .four), .two')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one:has(.three, .four)' }),
          jasmine.objectContaining({ selector: '.two' }),
        ])
      })

      it('does not parse any steps from a :none target', function() {
        const steps = up.fragment.parseTargetSteps(':none')
        expect(steps).toEqual([])
      })

      it('ignores a :none target in a union of other targets', function() {
        const steps = up.fragment.parseTargetSteps('.one, :none, .two')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one' }),
          jasmine.objectContaining({ selector: '.two' }),
        ])
      })

      it('sets a default placement of "swap"', function() {
        const steps = up.fragment.parseTargetSteps('.one')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one', placement: 'swap' })
        ])
      })

      it('parses a prepending placement from :before (single colon)', function() {
        const steps = up.fragment.parseTargetSteps('.one:before, .two')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one', placement: 'before' }),
          jasmine.objectContaining({ selector: '.two', placement: 'swap' }),
        ])
      })

      it('parses a prepending placement from ::before (double colon)', function() {
        const steps = up.fragment.parseTargetSteps('.one::before, .two')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one', placement: 'before' }),
          jasmine.objectContaining({ selector: '.two', placement: 'swap' }),
        ])
      })

      it('parses an append placement from :after (single colon)', function() {
        const steps = up.fragment.parseTargetSteps('.one, .two:after')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one', placement: 'swap' }),
          jasmine.objectContaining({ selector: '.two', placement: 'after' }),
        ])
      })

      it('parses an append placement from ::after (double colon)', function() {
        const steps = up.fragment.parseTargetSteps('.one, .two::after')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one', placement: 'swap' }),
          jasmine.objectContaining({ selector: '.two', placement: 'after' }),
        ])
      })

      it('parses an optional target from :maybe', function() {
        const steps = up.fragment.parseTargetSteps('.one, .two:maybe')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one', maybe: false }),
          jasmine.objectContaining({ selector: '.two', maybe: true }),
        ])
      })

      it('parses multiple pseudo elements in the same target', function() {
        const steps = up.fragment.parseTargetSteps('.one:maybe:before')
        expect(steps).toEqual([
          jasmine.objectContaining({ selector: '.one', maybe: true, placement: 'before' }),
        ])
      })
    })

    describe('up.fragment.provideNodes()', function() {

      describe('with a string of HTML', function() {

        it('parses a HTML fragment and returns a list containing its root Element', function() {
          const nodes = up.fragment.provideNodes('<div>root</div>')

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBeElement()
          expect(nodes[0].outerHTML).toBe('<div>root</div>')
        })

        it('parses a Text node without a containing Element', function() {
          const nodes = up.fragment.provideNodes('foo')

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBeTextNode('foo')
        })

        it('parses multiple HTML elements without a containing root element', function() {
          const nodes = up.fragment.provideNodes("<div>sibling1</div><div>sibling2</div>")

          expect(nodes).toHaveLength(2)
          expect(nodes[0].outerHTML).toBe('<div>sibling1</div>')
          expect(nodes[1].outerHTML).toBe('<div>sibling2</div>')
        })

        it('parses a mix of Element nodes and Text nodes without a containing root element', function() {
          const nodes = up.fragment.provideNodes("foo<b>bar</b>baz")
          expect(nodes).toHaveLength(3)

          expect(nodes[0]).toBeTextNode('foo')
          expect(nodes[1].outerHTML).toBe('<b>bar</b>')
          expect(nodes[2]).toBeTextNode('baz')
        })
      })

      describe('with a non-template element', function() {
        it('returns an list of the given element without making a copy, so users can temporarily move an element into an overlay', function() {
          const element = document.createElement('div')
          const nodes = up.fragment.provideNodes(element)

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBe(element)
        })
      })

      describe('with a template element', function() {

        it('returns a copy of the template content', function() {
          const template = up.element.createFromHTML(`
            <template id="my-template">
              foo<b>bar</b>baz
            </template>
          `)
          const nodes = up.fragment.provideNodes(template)

          expect(nodes[0]).toBeTextNode('foo')
          expect(nodes[1].outerHTML).toBe('<b>bar</b>')
          expect(nodes[2]).toBeTextNode('baz')

          // Make sure we made a copy and did not re-attach existing nodes
          expect(nodes[0]).not.toBe(template.content.childNodes[0])
          expect(nodes[1]).not.toBe(template.content.childNodes[1])
          expect(nodes[2]).not.toBe(template.content.childNodes[2])
        })

        it('allows to register a template engine with up:template:clone', function() {
          const template = htmlFixture(`
            <template id="my-template" type='text/minimustache'>
              Hello, <b>{{name}}</b>!
            </template>
          `)

          const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
            let html = event.target.innerHTML
            html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
            event.nodes = up.element.createNodesFromHTML(html)
          })

          up.on('up:template:clone', 'template[type="text/minimustache"]', templateHandler)

          const nodes = up.template.clone('#my-template', { name: "Alice" })
          expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), template, jasmine.anything())

          expect(nodes[0]).toBeTextNode('Hello, ')
          expect(nodes[1].outerHTML).toBe('<b>Alice</b>')
          expect(nodes[2]).toBeTextNode('!')
        })
      })

      describe('with a script element', function() {

        it('returns an list of the given element without making a copy', function() {
          const element = up.element.createFromSelector('script[type="text/javascript"]')
          const nodes = up.fragment.provideNodes(element)

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBe(element)
        })

        it('clones a script that does not contain JavaScript, considerung it a custom template', function() {
          const template = htmlFixture(`
            <script id="my-template" type='text/minimustache'>
              Hello, <b>{{name}}</b>!
            </script>
          `)

          const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
            let html = event.target.innerHTML
            html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
            event.nodes = up.element.createNodesFromHTML(html)
          })

          up.on('up:template:clone', 'script[type="text/minimustache"]', templateHandler)

          const nodes = up.fragment.provideNodes('#my-template { name: "Alice" }')

          expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), jasmine.anything(), jasmine.anything())
          expect(nodes[0]).toBeTextNode('Hello, ')
          expect(nodes[1].outerHTML).toBe('<b>Alice</b>')
          expect(nodes[2]).toBeTextNode('!')
        })
      })

      describe('with a selector string', function() {

        it('returns a list containing the first matching element', function() {
          const element1 = fixture('.my-element')
          const element2 = fixture('.my-element')
          const nodes = up.fragment.provideNodes('.my-element')

          expect(nodes).toEqual([element1])
        })

        it('looks up a selector in the given { origin } before looking at other layers', function() {
          const [layer0, layer1, layer2] = makeLayers(3)
          const layer0Match = layer0.affix('.match#layer0-element')
          const layer1Match = layer1.affix('.match#layer1-element')

          expect(up.fragment.provideNodes('.match', { origin: layer0.element })).toEqual([layer0Match])
          expect(up.fragment.provideNodes('.match', { origin: layer1.element })).toEqual([layer1Match])
          expect(up.fragment.provideNodes('.match', { origin: layer2.element })).toEqual([layer1Match])
        })

        it('throws an error if the selector cannot be matched', function() {
          const provide = () => up.fragment.provideNodes('#my-element')
          expect(provide).toThrowError('Cannot find template "#my-element"')
        })

        it('clones a matching <template>', function() {
          const template = htmlFixture(`
            <template id="my-template">
              foo<b>bar</b>baz
            </template>
          `)
          const nodes = up.fragment.provideNodes('#my-template')

          expect(nodes[0]).toBeTextNode('foo')
          expect(nodes[1].outerHTML).toBe('<b>bar</b>')
        })
      })

      describe('with a list of elements', function() {
        it('returns that list', function() {
          const list = [document.head, document.body]
          const nodes = up.fragment.provideNodes(list)
          expect(nodes).toEqual([document.head, document.body])
        })
      })

      describe('with a Document', function() {
        it('returns that Document', function() {
          const nodes = up.fragment.provideNodes(document)
          expect(nodes).toEqual([document])
        })
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

    describe('up.fragment.compressNestedSteps()', function() {

      it("removes a step whose { oldElement } is contained by a later step's { oldElement }", function() {
        const container = fixture('.container')
        const child = e.affix(container, '.child')

        const containerStep = { placement: 'swap', oldElement: container, selector: '.container' }
        const childStep = { placement: 'swap', oldElement: child, selector: '.child' }

        expect(up.fragment.compressNestedSteps([childStep, containerStep])).toEqual([containerStep])
      })

      it("removes a step whose { oldElement } is contained by an earlier step's { oldElement }", function() {
        const container = fixture('.container')
        const child = e.affix(container, '.child')

        const containerStep = { placement: 'swap', oldElement: container, selector: '.container' }
        const childStep = { placement: 'swap', oldElement: child, selector: '.child' }

        expect(up.fragment.compressNestedSteps([containerStep, childStep])).toEqual([containerStep])
      })

      it("keeps a step whose { oldElement } is not contained by another step's { oldElement }", function() {
        const sibling1 = fixture('.sibling1')
        const sibling2 = fixture('.sibling2')

        const sibling1Step = { placement: 'swap', oldElement: sibling1, selector: '.sibling1' }
        const sibling2Step = { placement: 'swap', oldElement: sibling2, selector: '.sibling2' }

        expect(up.fragment.compressNestedSteps([sibling1Step, sibling2Step])).toEqual([sibling1Step, sibling2Step])
      })

      it('keeps the earlier step if two steps have the same { oldElement }', function() {
        const element = fixture('.element')

        const step1 = { placement: 'swap', oldElement: element, selector: '.element', scroll: 'auto' }
        const step2 = { placement: 'swap', oldElement: element, selector: '.element', scroll: false }

        expect(up.fragment.compressNestedSteps([step1, step2])).toEqual([step1])
      })

      it('keeps the earlier step if two steps have the same { oldElement } but a different { selector }', function() {
        const element = fixture('.element')

        const step1 = { placement: 'swap', oldElement: element, selector: 'div', scroll: 'auto' }
        const step2 = { placement: 'swap', oldElement: element, selector: '.element', scroll: false }

        expect(up.fragment.compressNestedSteps([step1, step2])).toEqual([step1])
      })
    })

    describe('up.template.clone()', function() {

      it('clones the given <template> Element', function() {
        const template = htmlFixture(`
          <template id="my-template">
            foo<b>bar</b>baz
          </template>
        `)
        const nodes = up.template.clone(template)

        expect(nodes[0]).toBeTextNode('foo')
        expect(nodes[1].outerHTML).toBe('<b>bar</b>')
        expect(nodes[2]).toBeTextNode('baz')

        // Make sure we made a copy and did not re-attach existing nodes
        expect(nodes[0]).not.toBe(template.content.childNodes[0])
        expect(nodes[1]).not.toBe(template.content.childNodes[1])
        expect(nodes[2]).not.toBe(template.content.childNodes[2])
      })

      it('looks up a template by selector', function() {
        const template = htmlFixture(`
          <template id="my-template">
            foo<b>bar</b>baz
          </template>
        `)
        const nodes = up.template.clone('#my-template')

        expect(nodes[0]).toBeTextNode('foo')
        expect(nodes[1].outerHTML).toBe('<b>bar</b>')
        expect(nodes[2]).toBeTextNode('baz')
      })

      it('throws an error if the a template selector cannot be matched', function() {
        const doUse = () => up.template.clone('#my-template')
        expect(doUse).toThrowError(/Template not found/i)
      })

      it('allows to register a template engine with up:template:clone', function() {
        const template = htmlFixture(`
          <template id="my-template" type='text/minimustache'>
            Hello, <b>{{name}}</b>!
          </template>
        `)

        const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
          let html = event.target.innerHTML
          html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
          event.nodes = up.element.createNodesFromHTML(html)
        })

        up.on('up:template:clone', 'template[type="text/minimustache"]', templateHandler)

        const nodes = up.template.clone('#my-template', { name: "Alice" })
        expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), template, jasmine.anything())

        expect(nodes[0]).toBeTextNode('Hello, ')
        expect(nodes[1].outerHTML).toBe('<b>Alice</b>')
        expect(nodes[2]).toBeTextNode('!')
      })

      it('compiles an element cloned from a <template> with the second data argument', async function() {
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

        const nodes = up.template.clone('#target-template', { foo: 1, bar: 2 })
        up.render({ fragment: nodes })

        await wait()

        expect('#target').toHaveText('target from template')
        expect(compilerFn).toHaveBeenCalled()
        expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
        expect(compilerFn.calls.mostRecent().args[1]).toEqual({ foo: 1, bar: 2 })
      })
    })

    describe('up.fragment.defaultNormalizeKeepHTML()', function() {

      for (let attr of ['nonce', 'up-etag', 'up-time', 'up-source', 'up-on-rendered', 'up-watch', 'up-on-accepted']) {

        it(`removes a [${attr}] attribute from the root element`, function() {
          let input = `<div ${attr}="value"></div>`
          let output = up.fragment.defaultNormalizeKeepHTML(input)
          expect(output).toBe('<div></div>')
        })

        it(`removes a [${attr}] attribute but leaves other attributes`, function() {
          let input = `<div data-x="x" ${attr}="value" data-y="y"></div>`
          let output = up.fragment.defaultNormalizeKeepHTML(input)
          expect(output).toBe('<div data-x="x" data-y="y"></div>')
        })

        it(`removes multiple [${attr}] attributes in descendants`, function() {
          let input = `<div><span ${attr}="value"></span><span ${attr}="value"></span></div>`
          let output = up.fragment.defaultNormalizeKeepHTML(input)
          expect(output).toBe('<div><span></span><span></span></div>')
        })

      }

      it('removes multiple attributes from the same tag', function() {
        let input = `<a id="keepable" href="/path" up-keep="same-html" up-on-rendered="nonce-page-secret foo()" data-x="x" up-on-finished="nonce-page-secret bar()" data-y="y">text</a>`
        let output = up.fragment.defaultNormalizeKeepHTML(input)
        expect(output).toBe(`<a id="keepable" href="/path" up-keep="same-html" data-x="x" data-y="y">text</a>`)
      })

    })

  })

  describe('unobtrusive behavior', function() {

    require('./fragment_keep_spec')

  })

})
