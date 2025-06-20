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

        beforeEach(function(done) {
          this.rootElement = fixture('.element.in-root')
          fixtureInOverlay('.element.in-overlay').then((element) => {
            this.overlayElement = element
            done()
          })
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

    describe('up.render()', function() {

      beforeEach(function() {
        up.motion.config.enabled = false
      })

      it('preserves a verbatim "<script>" string in an element attribute (bugfix)', function() {
        fixture('#target')
        const attrValue = '<script>alert("I am valid unescaped HTML/JS")<script>'

        up.render({ fragment: `<div id='target' foo='${attrValue}'></div>` })

        expect(document.querySelector('#target').getAttribute('foo')).toBe(attrValue)
      })

      describe('return value', function() {

        it('returns an up.RenderJob that describes the render options', function() {
          fixture('.target')

          const job = up.render('.target', { content: 'new text' })
          expect(job.renderOptions.target).toBe('.target')
          expect(job.renderOptions.content).toBe('new text')
        })

        it('returns a promise for an up.RenderResult describing the updated fragments and layer', async function() {
          fixture('.one', { text: 'old one' })
          fixture('.two', { text: 'old two' })
          fixture('.three', { text: 'old three' })

          const documentHTML = `
            <div class="one">new one</div>
            <div class="two">new two</div>
            <div class="three">new three</div>
          `

          const renderOptions = {
            target: '.one, .three',
            document: documentHTML,
          }
          const promise = up.render(renderOptions)

          await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))

          await expectAsync(promise).toBeResolvedTo(jasmine.objectContaining({
            ok: true,
            target: '.one, .three',
            fragments: [document.querySelector('.one'), document.querySelector('.three')],
            layer: up.layer.root,
            renderOptions: jasmine.objectContaining({
              target: '.one, .three',
              document: documentHTML,
            }),
          }))
        })
      })


      describe('compilation', function() {

        it('runs compilers for matching elements in the new content', function() {
          const childCompiler = jasmine.createSpy('compiler')
          up.compiler('.child', (element) => childCompiler(element.tagName, element.className))

          fixture('.fragment')
          up.render({ fragment: '<div class="fragment"><span class="child"></span></div>' })

          expect(childCompiler).toHaveBeenCalledWith('SPAN', 'child')
        })

        it('calls compilers with a third "meta" argument containing information about the render pass', async function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.element', compiler)
          fixture('.element', { text: 'old content' })

          up.render('.element', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.element', { text: 'new content' })
          await wait()

          expect('.element').toHaveText('new content')
          expect(compiler).toHaveBeenCalledWith(
            jasmine.any(Element),
            jasmine.any(Object),
            jasmine.objectContaining({
              layer: up.layer.root
            })
          )
        })

        if (up.migrate.loaded) {
          it('calls compilers with a third argument containing the { response } for the current render pass', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.element', compiler)

            fixture('.element', { text: 'old content' })
            up.render('.element', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.element', { text: 'new content' })
            await wait()

            expect('.element').toHaveText('new content')
            expect(compiler).toHaveBeenCalledWith(
              jasmine.any(Element),
              jasmine.any(Object),
              jasmine.objectContaining({
                response: jasmine.any(up.Response)
              })
            )
          })
        }

        describe('when a compiler throws an error', function() {

          it('emits an error event, but does not reject the up.render() promise', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, async function() {
              const promise = up.render({ fragment: '<div class="element">new text</div>' })

              await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
            })

            expect('.element').toHaveText('new text')
            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('emits an error event, but does not reject the up.render().finished promise', async function() {
            const compileError = new Error('error from crashing compiler')
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            const element = fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, async function() {
              const promise = up.render({ fragment: '<div class="element">new text</div>' })

              await expectAsync(promise.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
            })

            expect('.element').toHaveText('new text')
            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('does not call an { onError } callback', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            const errorCallback = jasmine.createSpy('onError callback')
            up.compiler('.element', crashingCompiler)
            const element = fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>', onError: errorCallback }))

            expect('.element').toHaveText('new text')
            expect(crashingCompiler).toHaveBeenCalled()
            expect(errorCallback).not.toHaveBeenCalled()
          })

          it('does not prevent other compilers on the same element', async function() {
            const compileError = new Error("error from crashing compiler")
            const compilerBefore = jasmine.createSpy('compiler before')
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            const compilerAfter = jasmine.createSpy('compiler after')
            up.compiler('.element', compilerBefore)
            up.compiler('.element', crashingCompiler)
            up.compiler('.element', compilerAfter)
            fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>' }))

            expect('.element').toHaveText('new text')

            expect(compilerBefore).toHaveBeenCalled()
            expect(crashingCompiler).toHaveBeenCalled()
            expect(compilerAfter).toHaveBeenCalled()
          })

          it('still updates subsequent elements for a multi-step target', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.secondary', crashingCompiler)
            fixture('.primary', { text: 'old primary' })
            fixture('.secondary', { text: 'old secondary' })
            fixture('.tertiary', { text: 'old tertiary' })

            await jasmine.expectGlobalError(compileError, () => up.render('.primary, .secondary, .tertiary', { document: `
              <div class="primary">new primary</div>
              <div class="secondary">new secondary</div>
              <div class="tertiary">new tertiary</div>
            `
            }))

            expect('.primary').toHaveText('new primary')
            expect('.secondary').toHaveText('new secondary')
            expect('.tertiary').toHaveText('new tertiary')

            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('still updates the target when failing to compile a hungry element on another layer', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.root', crashingCompiler)
            fixture('.root', { text: 'root', 'up-hungry': '', 'up-if-layer': 'any' })

            up.layer.open({ fragment: '<div class="overlay">old secondary</div>' })

            await jasmine.expectGlobalError(compileError, () => up.render('.overlay', { document: `
              <div class="root">new root</div>
              <div class="overlay">new overlay</div>
            `
            }))

            expect('.root').toHaveText('new root')
            expect('.overlay').toHaveText('new overlay')

            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('still opens an overlay when failing to compile a hungry element on another layer', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.root', crashingCompiler)
            fixture('.root', { text: 'root', 'up-hungry': '', 'up-if-layer': 'any' })

            await jasmine.expectGlobalError(compileError, () => up.layer.open({ target: '.overlay', document: `
              <div class="root">new root</div>
              <div class="overlay">new overlay</div>
            ` }))

            expect(up.layer.isOverlay()).toBe(true)
            expect('.root').toHaveText('new root')
            expect('.overlay').toHaveText('new overlay')
            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('does not prevent destructors', async function() {
            const compileError = new Error("error from crashing compiler")
            const destructor = jasmine.createSpy('destructor')
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            const element = fixture('.element', { text: 'old text' })
            up.destructor(element, destructor)

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>' }))

            expect('.element').toHaveText('new text')

            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('still processes a { scroll } option', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            fixture('.element', { text: 'old text' })

            const revealSpy = up.reveal.mock()

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>', scroll: 'target' }))

            expect('.element').toHaveText('new text')
            expect(revealSpy).toHaveBeenCalled()
            expect(crashingCompiler).toHaveBeenCalled()
          })
        })

        describe('when a destructor throws an error', function() {

          it('still updates subsequent elements for a multi-step target', async function() {
            const destroyError = new Error("error from crashing destructor")
            const crashingDestructor = jasmine.createSpy('crashing destructor').and.throwError(destroyError)
            const primary = fixture('.primary', { text: 'old primary' })
            const secondary = fixture('.secondary', { text: 'old secondary' })
            const tertiary = fixture('.tertiary', { text: 'old tertiary' })

            up.destructor(secondary, crashingDestructor)

            await jasmine.expectGlobalError(destroyError, () => up.render('.primary, .secondary, .tertiary', { document: `
              <div class="primary">new primary</div>
              <div class="secondary">new secondary</div>
              <div class="tertiary">new tertiary</div>
            `
            }))

            expect('.primary').toHaveText('new primary')
            expect('.secondary').toHaveText('new secondary')
            expect('.tertiary').toHaveText('new tertiary')
            expect(crashingDestructor).toHaveBeenCalled()
          })

          it('removes the old element', async function() {
            const destroyError = new Error("error from crashing destructor")
            const crashingDestructor = jasmine.createSpy('crashing destructor').and.throwError(destroyError)
            const oldElement = fixture('#element.old')

            up.destructor(oldElement, crashingDestructor)

            await jasmine.expectGlobalError(destroyError, () => up.render('#element', { document: `
              <div id="element" class="new"></div>
            ` }))

            expect(oldElement).toBeDetached()
            expect('#element').toHaveClass('new')
            expect(crashingDestructor).toHaveBeenCalled()
          })
        })
      })

      describe('with { url } option', function() {

        it('replaces the given selector with the same selector from a freshly fetched page', async function() {
          fixture('.before', { text: 'old-before' })
          fixture('.middle', { text: 'old-middle' })
          fixture('.after', { text: 'old-after' })

          up.render('.middle', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
          `)

          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('parses a full HTML page', async function() {
          fixture('.before', { text: 'old-before' })
          fixture('.middle', { text: 'old-middle' })
          fixture('.after', { text: 'old-after' })

          up.render('.middle', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Document title</title>
              </head>
              <body>
                <div class="before">new-before</div>
                <div class="middle">new-middle</div>
                <div class="after">new-after</div>
              </body>
            </html>
          `)

          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('parses a full HTML page with uppercase tag names', async function() {
          fixture('.before', { text: 'old-before' })
          fixture('.middle', { text: 'old-middle' })
          fixture('.after', { text: 'old-after' })

          up.render('.middle', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <!DOCTYPE html>
            <HTML>
              <HEAD>
                <TITLE>Document title</TITLE>
              </HEAD>
              <BODY>
                <DIV class="before">new-before</DIV>
                <DIV class="middle">new-middle</DIV>
                <DIV class="after">new-after</DIV>
              </BODY>
            </HTML>
          `)

          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('returns a promise that fulfills the server response was received and the fragments were swapped', async function() {
          fixture('.target')

          const resolution = jasmine.createSpy()
          const promise = up.render('.target', { url: '/path' })

          promise.then(resolution)

          await wait()

          expect(resolution).not.toHaveBeenCalled()
          jasmine.respondWithSelector('.target', { text: 'new-text' })

          await wait()

          expect(resolution).toHaveBeenCalled()
          expect('.target').toHaveText('new-text')
        })

        it('runs an { onRendered } callback when the server response was received and the fragments were swapped', async function() {
          fixture('.target')

          const callback = jasmine.createSpy('onRendered callback')
          up.render('.target', { url: '/path', onRendered: callback })

          await wait()

          expect(callback).not.toHaveBeenCalled()
          jasmine.respondWithSelector('.target', { text: 'new-text' })

          await wait()

          expect(callback).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          expect('.target').toHaveText('new-text')
        })

        // fit('emits an up:fragment:rendered event when the server response was received and the fragments were swapped', async function() {
        //   fixture('.target')
        //
        //   const callback = jasmine.createSpy('up:fragment:rendered listener')
        //   document.addEventListener('up:fragment:rendered', callback)
        //   up.render('.target', { url: '/path' })
        //
        //   await wait()
        //
        //   expect(callback).not.toHaveBeenCalled()
        //   jasmine.respondWithSelector('.target', { text: 'new-text' })
        //
        //   await wait()
        //
        //   expect('.target').toHaveText('new-text')
        //   expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
        //     ok: true,
        //     target: up.layer.root.element, // we cannot set { target } on an event
        //     layer: up.layer.root,
        //     fragments: [document.querySelector('.target')]
        //   }))
        //
        // })

        it('uses a HTTP method given as { method } option', async function() {
          fixture('.target')
          up.render('.target', { url: '/path', method: 'put' })
          await wait()
          expect(jasmine.lastRequest()).toHaveRequestMethod('PUT')
        })

        it('rejects with an AbortError if the request is aborted', async function() {
          fixture('.target')
          const promise = up.render('.target', { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.network.abort()

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })

        describe('source URL', function() {

          it('sets an [up-source] attribute to remember to URL from which the fragment was loaded', async function() {
            fixture('.target', { text: 'old text' })
            up.render('.target', { url: '/source-path' })
            await wait()
            jasmine.respondWithSelector('.target', { text: 'new text' })
            await wait()

            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('up-source', '/source-path')
            expect(up.fragment.source('.target')).toMatchURL('/source-path')
          })

          it('sets an [up-source] attribute for failed responses', async function() {
            fixture('.target', { text: 'old text' })
            up.render({ target: '.target', failTarget: '.target', url: '/source-path' })
            await wait()
            jasmine.respondWithSelector('.target', { text: 'new text', status: 500 })
            await wait()

            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('up-source', '/source-path')
            expect(up.fragment.source('.target')).toMatchURL('/source-path')
          })

          it('keeps an existing [up-source] attribute for responses to non-GET requests', async function() {
            fixture('.target', { text: 'old text', 'up-source': '/previous-source' })
            up.render('.target', { url: '/source-path', method: 'post' })
            await wait()
            jasmine.respondWithSelector('.target', { text: 'new text' })
            await wait()

            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('up-source', '/previous-source')
            expect(up.fragment.source('.target')).toMatchURL('/previous-source')
          })

        })

        describe('last modification time', function() {

          it('sets an Last-Modified response header as an [up-time] attribute', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'new content',
              responseHeaders: { 'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-time', 'Wed, 21 Oct 2015 07:28:00 GMT')
          })

          it('does not change an existing [up-time] attribute on the new fragment with information from the Last-Modified header', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target[up-time=123]', {
              text: 'new content',
              responseHeaders: { 'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-time', '123')
          })

          it("sets an [up-time=false] attribute if the server did not send an Last-Modified header, so we won't fall back to a parent's Last-Modified header later", async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new content' })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-time', 'false')
          })
        })

        describe('ETags', function() {

          it('sets a weak ETag header as an [up-etag] attribute', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'new content',
              responseHeaders: { 'Etag': 'W/"0815"' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', 'W/"0815"')
          })

          it('sets a strong ETag header as an [up-etag] attribute', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'new content',
              responseHeaders: { 'Etag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', '"33a64df551425fcc55e4d42a148795d9f25f89d4"')
          })

          it('does not change an existing [up-etag] attribute on the new fragment with information from the ETag header', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target[up-etag=123]', {
              text: 'new content',
              responseHeaders: { 'ETag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', '123')
          })

          it("sets an [up-etag=false] attribute if the server did not send an ETag header, so we won't fall back to a parent's ETag header later", async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new content' })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', 'false')
          })
        })

        describe('with { params } option', function() {

          it("uses the given params as a non-GET request's payload", async function() {
            const givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            fixture('.target')
            up.render('.target', { url: '/path', method: 'put', params: givenParams })

            await wait()

            expect(jasmine.lastRequest().data()['foo-key']).toEqual(['foo-value'])
            expect(jasmine.lastRequest().data()['bar-key']).toEqual(['bar-value'])
          })

          it("encodes the given params into the URL of a GET request", async function() {
            fixture('.target')
            const givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            up.render('.target', { url: '/path', method: 'get', params: givenParams })

            await wait()

            expect(jasmine.lastRequest().url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')
          })
        })

        describe('when the server responds with an error or unexpected content', function() {

          it('uses a target selector given as { failTarget } option', async function() {
            fixture('.success-target', { text: 'old success text' })
            fixture('.failure-target', { text: 'old failure text' })

            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="failure-target">new failure text</div>
                <div class="success-target">new success text</div>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.success-target').toHaveText('old success text')
            expect('.failure-target').toHaveText('new failure text')
          })

          it('updates a fallback target if the { failTarget } cannot be matched', async function() {
            fixture('.fallback', { text: 'old fallback text' })
            fixture('.success-target', { text: 'old success text' })
            fixture('.failure-target', { text: 'old failure text' })

            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target', fallback: '.fallback' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="fallback">new fallback text</div>
                <div class="success-target">new success text</div>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.success-target').toHaveText('old success text')
            expect('.fallback').toHaveText('new fallback text')
          })

          it('does update a fragment if the server sends an XHTML content-type instead of text/html', async function() {
            fixture('.target', { text: 'old text' })

            up.render('.target', { url: '/path', failTarget: '.failure' })

            await wait()

            jasmine.respondWith({
              contentType: 'application/xhtml+xml',
              responseText: '<div class="target">new text</div>'
            })

            await wait()

            expect('.target').toHaveText('new text')
          })

          it('rejects the returned promise with an up.RenderResult describing the updated fragments and layer', async function() {
            fixture('.success-target')
            fixture('.failure-target')
            const renderOptions = { url: '/path', target: '.success-target', failTarget: '.failure-target' }
            const renderJob = up.render(renderOptions)

            await wait()

            jasmine.respondWithSelector('.failure-target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(renderJob).toBeRejectedWith(jasmine.objectContaining({
              ok: false,
              target: '.failure-target',
              fragments: [document.querySelector('.failure-target')],
              layer: up.layer.root,
              renderOptions: jasmine.objectContaining({
                target: '.failure-target',
                url: '/path',
              }),
            }))
          })

          it('rejects the up.render().finished promise', async function() {
            fixture('.success-target')
            fixture('.failure-target')
            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target' })
            const {
              finished
            } = renderJob

            await wait()
            await expectAsync(finished).toBePending()

            jasmine.respondWithSelector('.failure-target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(finished).toBeRejectedWith(jasmine.any(up.RenderResult))
          })

          it('rejects with an error that explains why success targets were not used', async function() {
            fixture('.target')
            const promise = up.render('.target', { url: '/qux' })

            await wait()

            jasmine.respondWithSelector('.unexpected', { status: 500 })

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/No target selector given for failed responses/i))
          })

          it('runs an onFailRendered callback', async function() {
            fixture('.success-target', { text: 'old text' })
            fixture('.failure-target', { text: 'old text' })
            const onRendered = jasmine.createSpy('onRendered callback')
            const onFailRendered = jasmine.createSpy('onFailRendered callback')

            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target', onRendered, onFailRendered })

            await wait()

            expect(onRendered).not.toHaveBeenCalled()
            expect(onFailRendered).not.toHaveBeenCalled()

            jasmine.respondWithSelector('.failure-target', { status: 500, text: 'new text' })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.success-target').toHaveText('old text')
            expect('.failure-target').toHaveText('new text')

            expect(onRendered).not.toHaveBeenCalled()
            expect(onFailRendered).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          })

          describe('with { fail } option', function() {

            it('always uses success options with { fail: false }', async function() {
              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              const renderJob = up.render({
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 200,
                fail: true
              })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">new failure text</div>
              `)

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect('.success-target').toHaveText('old success text')
              expect('.failure-target').toHaveText('new failure text')
            })

            it('always uses failure options with { fail: true }', async function() {
              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              const renderJob = up.render({
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 200,
                fail: true
              })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">new failure text</div>
              `)

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect('.success-target').toHaveText('old success text')
              expect('.failure-target').toHaveText('new failure text')
            })

            it('accepts a function as { fail } option', async function() {
              const failFn = jasmine.createSpy('fail function').and.returnValue(false)

              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              up.render({
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 500,
                fail: failFn
              })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">old failure text</div>
              `)

              await wait()

              expect(failFn).toHaveBeenCalled

              expect('.success-target').toHaveText('new success text')
              expect('.failure-target').toHaveText('old failure text')
            })

            it('lets up:fragment:loaded listeners force a failure response by setting event.renderOptions.fail = true', async function() {
              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              up.on('up:fragment:loaded', (e) => e.renderOptions.fail = true)

              const renderJob = up.render({ target: '.success-target', failTarget: '.failure-target', url: '/path' })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">new failure text</div>
              `)

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect('.success-target').toHaveText('old success text')
              expect('.failure-target').toHaveText('new failure text')
            })
          })
        })

        describe('when the request times out', function() {
          it("doesn't crash and rejects the returned promise with an up.Offline error xx", async function() {
            jasmine.clock().install() // required by responseTimeout()
            fixture('.target')
            const renderJob = up.render('.target', { url: '/path', timeout: 500 })

            await wait()

            // See that the correct timeout value has been set on the XHR instance
            expect(jasmine.lastRequest().timeout).toEqual(500)

            await expectAsync(renderJob).toBePending()

            jasmine.lastRequest().responseTimeout()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))
          })
        })

        describe('when there is a network issue', function() {

          it("doesn't crash and rejects the returned promise with an up.Offline error", async function() {
            fixture('.target')
            const renderJob = up.render('.target', { url: '/path', timeout: 50 })

            await wait()

            // See that the correct timeout value has been set on the XHR instance
            expect(jasmine.lastRequest().timeout).toEqual(50)

            await expectAsync(renderJob).toBePending()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))
          })

          it('emits an up:fragment:offline event with access to { request } and { renderOptions }', async function() {
            const listener = jasmine.createSpy('up:fragment:offline listener')
            up.on('up:fragment:offline', listener)

            fixture('.target')
            const renderJob = up.render('.target', { url: '/other-path' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

            expect(listener).toHaveBeenCalled()
            const event = listener.calls.argsFor(0)[0]
            expect(event.type).toBe('up:fragment:offline')
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.renderOptions.target).toMatchURL('.target')
            expect(event.renderOptions.url).toMatchURL('/other-path')
          })

          it('calls an { onOffline } listener with an up:fragment:offline event', async function() {
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target')
            const renderJob = up.render('.target', { url: '/other-path', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

            expect(listener).toHaveBeenCalled()
            const event = listener.calls.argsFor(0)[0]
            expect(event.type).toBe('up:fragment:offline')
          })

          it('allows up:fragment:offline listeners to retry the rendering by calling event.retry()', async function() {
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target', { text: 'old text' })
            const promise = up.render('.target', { url: '/other-path', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Offline))

            expect('.target').toHaveText('old text')
            expect(listener.calls.count()).toBe(1)
            const event = listener.calls.argsFor(0)[0]
            event.retry()

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)

            jasmine.respondWithSelector('.target', { text: 'new text' })

            await wait()

            // The listener was not called again
            expect(listener.calls.count()).toBe(1)
            expect('.target').toHaveText('new text')
          })

          it('allows up:fragment:offline listeners to retry the rendering by calling event.retry() when relative URLs are used and the based has changed since rendering', async function() {
            up.history.config.enabled = true
            up.history.replace('/base1/')
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target', { text: 'old text' })
            const promise = up.render('.target', { url: 'relative', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.lastRequest().url).toMatchURL('/base1/relative')
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Offline))

            up.history.replace('/base2/')

            expect('.target').toHaveText('old text')
            expect(listener.calls.count()).toBe(1)
            const event = listener.calls.argsFor(0)[0]
            event.retry()

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)
            expect(jasmine.lastRequest().url).toMatchURL('/base1/relative')

            jasmine.respondWithSelector('.target', { text: 'new text' })

            await wait()

            // The listener was not called again
            expect(listener.calls.count()).toBe(1)
            expect('.target').toHaveText('new text')
          })

          it('allows up:fragment:offline listeners to override render options when retrying', async function() {
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target', { text: 'old text' })
            fixture('.override-target', { text: 'old text' })

            const promise = up.render('.target', { url: '/other-path', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()
            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Offline))

            expect('.target').toHaveText('old text')
            expect(listener.calls.count()).toBe(1)

            const event = listener.calls.argsFor(0)[0]
            event.retry({ target: '.override-target' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.override-target')
          })

          it('does not call an { onFinished } handler', async function() {
            const listener = jasmine.createSpy('onFinished callback')

            fixture('.target')
            const renderJob = up.render('.target', { url: '/other-path', onFinished: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

            expect(listener).not.toHaveBeenCalled()
          })

          describe('when there is an expired cache entry', function() {

            beforeEach(function(done) {
              fixture('.target', { text: 'old text' })

              const request = up.request('/path', { target: '.target', cache: true })

              u.task(() => jasmine.respondWithSelector('.target', { text: 'expired text' }))

              u.task(function() {
                expect(request).toBeCached()
                expect(request).not.toBeExpired()

                up.cache.expire(request)

                expect(request).toBeExpired()

                done()
              })
            })

            it('renders the expired content', async function() {
              up.render('.target', { url: '/path', cache: true })

              await wait()

              expect('.target').toHaveText('expired text')
            })

            it('calls an { onOffline } instead of { onFinished } after revalidation fails', async function() {
              const onOffline = jasmine.createSpy('onOffline handler')
              const onFinished = jasmine.createSpy('onFinished handler')

              const renderJob = up.render('.target', { url: '/path', cache: true, revalidate: true, onOffline, onFinished })

              await expectAsync(renderJob).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(renderJob.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)
              expect(onFinished).not.toHaveBeenCalled()
              expect(onOffline).not.toHaveBeenCalled()

              expect('.target').toHaveText('expired text')
              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(renderJob.finished).toBeRejectedWith(jasmine.any(up.Offline))

              expect(onFinished).not.toHaveBeenCalled()
              expect(onOffline).toHaveBeenCalled()
            })
          })
        })

        describe('up:fragment:loaded event', function() {

          it('emits an up:fragment:loaded event that contains information about the request, response and render options', async function() {
            const origin = fixture('.origin')
            fixture('.target')
            let event = undefined
            up.on('up:fragment:loaded', (e) => event = e)

            up.render({ target: '.target', url: '/url', location: '/location-from-option', peel: false, origin })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'text from server' })

            await wait()

            expect(event).toBeGiven()
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.request.url).toMatchURL('/url')
            expect(event.response.text).toContain('text from server')
            expect(event.renderOptions.peel).toBe(false)
            expect(event.renderOptions.location).toMatchURL('/location-from-option')
            expect(event.origin).toBe(origin)
            expect(event.layer).toBe(up.layer.root)
          })

          it('allows listeners to prevent an up:fragment:loaded event to prevent changes to the DOM and browser history', async function() {
            up.history.config.enabled = true
            up.on('up:fragment:loaded', (e) => e.preventDefault())
            fixture('.target', { text: 'old text' })

            const renderJob = up.render({ target: '.target', url: '/url' })

            await wait()

            jasmine.respondWith('new text')

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect('.target').toHaveText('old text')
            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('rejects programmatic callers with an up.AbortError when the event is prevented', async function() {
            up.on('up:fragment:loaded', (e) => e.preventDefault())
            fixture('.target', { text: 'old text' })

            const changePromise = up.render({ target: '.target', url: '/url' })

            await wait()

            jasmine.respondWith('new text')

            // Now up:fragment:loaded is emitted and is prevented
            await expectAsync(changePromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect('.target').toHaveText('old text')
          })

          it('fulfills programmatic callers with an empty up.RenderResult when the event is skipped (instead of prevented)', async function() {
            up.on('up:fragment:loaded', (e) => e.skip())
            fixture('.target', { text: 'old text' })

            const renderOptions = { target: '.target', url: '/url' }
            const changePromise = up.render(renderOptions)
            await wait()

            jasmine.respondWith('new text')

            await wait()

            expect('.target').toHaveText('old text')

            let result = await changePromise

            await expectAsync(changePromise).toBeResolvedTo(jasmine.any(up.RenderResult))
            await expectAsync(changePromise).toBeResolvedTo(jasmine.objectContaining({
              ok: true,
              none: true,
              renderOptions: jasmine.objectContaining({ target: ':none', url: '/url' }),
            }))
          })

          it('allows listeners to mutate up.render() options to target another fragment', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            up.on('up:fragment:loaded', (e) => e.renderOptions.target = '.two')

            up.render({ target: '.one', url: '/url' })
            await wait()

            jasmine.respondWith(`
              <div class="one">new one</div>
              <div class="two">new two</div>
            `)
            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('new two')
          })

          it('allows listeners to mutate up.render() options to target another fragment with a failed response', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            up.on('up:fragment:loaded', (e) => e.renderOptions.failTarget = '.two')

            up.render({ target: '.one', url: '/url' })
            await wait()

            jasmine.respondWith({ status: 500, responseText: `
              <div class="one">new one</div>
              <div class="two">new two</div>
            ` })
            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('new two')
          })

          it('allows listeners to mutate up.render() options and render into a new layer', async function() {
            fixture('.one', { text: 'old one' })

            up.on('up:fragment:loaded', (event) => event.renderOptions.layer = 'new')

            up.render({ target: '.one', url: '/url' })
            await wait()

            jasmine.respondWith(`\
<div class="one">new one</div>\
`
            )
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.fragment.get('.one', { layer: 'overlay' })).toHaveText('new one')
          })

          it('allows listeners to mutate up.render() options and render into a new layer with a failed response', async function() {
            fixture('.one', { text: 'old one' })

            up.on('up:fragment:loaded', (event) => event.renderOptions.failLayer = 'new')

            up.render({ target: '.one', failTarget: '.one', url: '/url' })
            await wait()

            jasmine.respondWith({ status: 500, responseText: `\
<div class="one">new one</div>\
`
            })
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.fragment.get('.one', { layer: 'overlay' })).toHaveText('new one')
          })

          it('allows listeners to mutate up.render() options before the fragment is updated when the server responds with an error code (bugfix)', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })
            fixture('.three', { text: 'old three' })

            up.on('up:fragment:loaded', (e) => e.renderOptions.failTarget = '.three')

            const renderJob = up.render({ target: '.one', failTarget: '.two', url: '/url' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `\
<div class="one">new one</div>
<div class="two">new two</div>
<div class="three">new three</div>\
`
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('old two')
            expect('.three').toHaveText('new three')
          })

          it('allows to pass a listener for just one render pass using { onLoaded } option', async function() {
            const origin = fixture('.origin')
            fixture('.target')
            let event = undefined
            const onLoaded = (e) => event = e

            up.render({ target: '.target', url: '/url', location: '/location-from-option', peel: false, origin, onLoaded })
            await wait()

            jasmine.respondWithSelector('.target', { text: 'text from server' })
            await wait()

            expect(event).toBeGiven()
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.request.url).toMatchURL('/url')
          })

          it('runs an { onLoaded } listener for failed responses (there is no { onFailLoaded })', async function() {
            const origin = fixture('.origin')
            fixture('.target')
            fixture('.fail-target')
            let event = undefined
            const onLoaded = (e) => event = e

            const renderJob = up.render({ target: '.target', failTarget: '.fail-target', url: '/url', location: '/location-from-option', peel: false, origin, onLoaded })

            await wait()

            jasmine.respondWithSelector('.fail-target', { text: 'error from server', status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(event).toBeGiven()
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.request.url).toMatchURL('/url')
          })

          describe('emission target', function() {

            it('is emitted on the element of the updating layer', async function() {
              makeLayers(2)
              expect(up.layer.current.isOverlay()).toBe(true)

              const one = up.layer.current.affix('#one')

              const spy = jasmine.createSpy('event.target spy')
              up.on('up:fragment:loaded', (event) => spy(event.target))

              up.render({ target: '#one', url: '/url' })
              await wait()

              jasmine.respondWithSelector('#one')
              await wait()

              expect(spy).toHaveBeenCalledWith(up.layer.current.element)
            })

            it('is emitted on the element of the base layer when opening a new overlay', async function() {
              makeLayers(2)
              const baseLayer = up.layer.current
              expect(baseLayer.isOverlay()).toBe(true)

              const spy = jasmine.createSpy('event.target spy')
              up.on('up:fragment:loaded', (event) => spy(event.target))

              up.render({ target: '#one', url: '/url', layer: 'new modal' })
              await wait()

              jasmine.respondWithSelector('#one')
              await wait()

              expect(spy).toHaveBeenCalledWith(baseLayer.element)
            })
          })
        })

        describe('when the server sends an X-Up-Events header', function() {

          it('emits these events', async function() {
            fixture('.element')

            up.render({ target: '.element', url: '/path' })

            const event1Plan = { type: 'foo', prop: 'bar ' }
            const event2Plan = { type: 'baz', prop: 'bam ' }

            spyOn(up, 'emit').and.callThrough()

            await wait()

            jasmine.respondWith({
              responseHeaders: { 'X-Up-Events': JSON.stringify([event1Plan, event2Plan]) },
              responseText: '<div class="element"></div>'
            })

            await wait()

            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(event1Plan))
            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(event2Plan))
          })

          it('accepts unquoted property names in the header value', async function() {
            fixture('.element')

            up.render({ target: '.element', url: '/path' })

            spyOn(up, 'emit').and.callThrough()

            await wait()

            jasmine.respondWith({
              responseHeaders: { 'X-Up-Events': '[{ type: "foo", prop: "bar" }]' },
              responseText: '<div class="element"></div>'
            })

            await wait()

            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining({ type: "foo", prop: "bar" }))
          })

          it('emits these events for a failure response', async function() {
            fixture('.element')

            const renderPromise = up.render({ target: '.element', failTarget: '.element', url: '/path' })

            const eventPlan = { type: 'foo', prop: 'bar ' }

            spyOn(up, 'emit').and.callThrough()

            await wait()

            jasmine.respondWith({
              status: 422,
              responseHeaders: { 'X-Up-Events': JSON.stringify([eventPlan]) },
              responseText: '<div class="element"></div>'
            })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(eventPlan))
          })
        })

        describe('when the server sends an X-Up-Accept-Layer header', function() {

          describe('when updating an overlay', function() {

            it('accepts the layer with the header value', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, content: 'Initial content', target: '.target' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              const promise = up.render({ url: '/path2', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()
              jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Accept-Layer': "123" } })

              await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.mode).toBe('root')
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value: 123 }))
            })

            it('does not require the server to render content when the overlay will close anyway (when updating a layer)', async function() {
              const callback = jasmine.createSpy('onAccepted callback')

              up.layer.open({ onAccepted: callback, content: 'Original content', target: '.target' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              const promise = up.render({ url: '/path2', target: '.target' })
              expect(callback).not.toHaveBeenCalled()

              await wait()

              jasmine.respondWith('', { responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
            })

            it('makes the discarded response available to up:layer:accepted listeners as a { response } property 1', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, content: 'initial content', target: '.target' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              const promise = up.render({ url: '/path2', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith('<div class="target">new content</div>', { responseHeaders: { 'X-Up-Accept-Layer': "123" } })

              await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
              expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="target">new content</div>')
            })
          })

          describe('when updating the root layer', function() {
            it('ignores the header and updates the root layer with the response body', async function() {
              const element = fixture('.element', { text: 'old content' })
              const acceptedListener = jasmine.createSpy('up:layer:accepted listener')
              up.on('up:layer:accepted', acceptedListener)

              up.render({ url: '/path', target: '.element' })

              await wait()

              jasmine.respondWithSelector('.element', { text: 'new content', responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await wait()

              expect('.element').toHaveText('new content')
              expect(acceptedListener).not.toHaveBeenCalled()
            })
          })

          describe('when opening a layer', function() {

            it('accepts the layer that is about to open', async function() {
              const callback = jasmine.createSpy('onAccepted callback')

              const layerPromise = up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await expectAsync(layerPromise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
            })

            it('does not require the server to render content when the overlay will close anyway', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              const layerPromise = up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith('', { responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await expectAsync(layerPromise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
            })
          })
        })


        describe('when the server sends an X-Up-Dismiss-Layer header', function() {

          it('dismisses the targeted overlay with the header value', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, url: '/path', target: '.target' })

            await wait()

            expect(up.layer.mode).toBe('root')
            jasmine.respondWithSelector('.target')

            await wait()

            expect(up.layer.mode).toBe('modal')
            const renderPromise = up.render({ url: '/path2', target: '.target' })

            await wait()

            expect(callback).not.toHaveBeenCalled()
            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Dismiss-Layer': "123" } })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value: 123 }))
          })

          it('makes the discarded response available to up:layer:accepted listeners as a { response } property 2', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onDismissed: callback, target: '.target', content: 'Initial content' })

            await wait()

            expect(up.layer.mode).toBe('modal')
            const promise = up.render({ url: '/path2', target: '.target' })

            await wait()

            expect(callback).not.toHaveBeenCalled()
            jasmine.respondWith('<div class="target">new content</div>', { responseHeaders: { 'X-Up-Dismiss-Layer': "123" } })

            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
            expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="target">new content</div>')
          })
        })

        describe('when the server sends an X-Up-Open-Layer header', function() {

          describe('when updating an overlay', function() {

            it('opens a new layer, ignoring the original { layer } option', async function() {
              fixture('#target', { text: 'old target' })
              up.render('#target', { url: '/path', layer: 'current' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}', 'X-Up-Target': '#overlay' } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect('#overlay').toHaveText('overlay')
              expect('#target').toHaveText('old target')
            })

            it('opens a new layer with render options parsed from the header value', async function() {
              fixture('#target', { text: 'old target' })
              up.render('#target', { url: '/path' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': JSON.stringify({ target: '#overlay', mode: 'drawer', size: 'small' }) } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect(up.layer.current.mode).toBe('drawer')
              expect(up.layer.current.size).toBe('small')
              expect('#overlay').toHaveText('overlay')
            })

            it("resolves a :main target using the new overlay mode", async function() {
              up.layer.config.root.mainTargets = ['#root-target']
              up.layer.config.modal.mainTargets = ['#overlay-target']

              fixture('#root-target', { text: 'old root target' })
              up.render(':main', { url: '/path' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay-target">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}' } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay-target')
              expect('#overlay-target').toHaveText('overlay')
              expect('#root-target').toHaveText('old root target')
            })

            describe('if no explicit target is given in either X-Up-Open-Layer or X-Up-Target header', function() {

              it('replaces the initial target with ":main"', async function() {
                up.layer.config.root.mainTargets = ['#root-target']
                up.layer.config.modal.mainTargets = ['#overlay-target']

                fixture('#root-target', { text: 'old root target' })
                up.render('#root-target', { url: '/path' })
                await wait()

                jasmine.respondWith({ responseText: '<div id="overlay-target">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}' } })
                await wait()

                expect(up.layer.current).toBeOverlay()
                expect(up.layer.current).toHaveSelector('#overlay-target')
                expect('#overlay-target').toHaveText('overlay')
                expect('#root-target').toHaveText('old root target')
              })

              it('ignores the initial target, even it exists in the response', async function() {
                up.layer.config.root.mainTargets = ['#root-target']
                up.layer.config.modal.mainTargets = ['#overlay-target']

                fixture('#root-target', { text: 'old root target' })
                up.render('#root-target', { url: '/path' })
                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div id="root-target">new root target</div>
                    <div id="overlay-target">new overlay target</div>
                  `,
                  responseHeaders: { 'X-Up-Open-Layer': '{}' }
                })
                await wait()

                expect(up.layer.current).toBeOverlay()
                expect(up.layer.current).not.toHaveSelector('#root-target')
                expect(up.layer.current).toHaveSelector('#overlay-target')
                expect('#root-target').toHaveText('old root target')
              })

            })

          })

          describe('when already opening an overlay', function() {

            it('still opens an overlay', async function() {
              up.render({ target: '#overlay', url: '/path', layer: 'new' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}', 'X-Up-Target': '#overlay' } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect('#overlay').toHaveText('overlay')
            })

            it('opens a new layer with render options parsed from the header value', async function() {
              up.render({ target: '#initial-target', url: '/path', layer: 'new' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': JSON.stringify({ target: '#overlay', mode: 'drawer', size: 'small' }) } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect(up.layer.current.mode).toBe('drawer')
              expect(up.layer.current.size).toBe('small')
              expect('#overlay').toHaveText('overlay')
            })

            it('uses default overlay options when no explicit options are given in the header value', async function() {
              up.render({ target: '#initial-target', url: '/path', layer: 'new', mode: 'drawer', size: 'small' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': JSON.stringify({ target: '#overlay' }) } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current.size).toBe('medium')
              expect('#overlay').toHaveText('overlay')

            })

          })

        })

        describe('when the server sends no content', function() {

          it('succeeds when the server sends an empty body with HTTP status 304 (not modified)', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            const promise = up.render({ target: '.one', url: '/path' })

            await wait()

            jasmine.respondWith({ status: 304, responseText: '' })

            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('old two')

            let result = await promiseState(promise)
            expect(result.state).toBe('fulfilled')
          })

          it('succeeds when the server sends an empty body with HTTP status 204 (no content)', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            const promise = up.render({ target: '.one', url: '/path' })

            await wait()

            jasmine.respondWith({ status: 204, responseText: '' })

            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('old two')

            let result = await promiseState(promise)
            expect(result.state).toBe('fulfilled')
          })

          it('does not call on { onRendered } callback', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            const onRendered = jasmine.createSpy('onRendered callback')
            up.render({ target: '.one', url: '/path', onRendered })

            await wait()

            jasmine.respondWith({ status: 304, responseText: '' })

            await wait()

            expect('.one').toHaveText('old one')
            expect(onRendered).not.toHaveBeenCalled()
          })
        })

        describe('when the server sends an X-Up-Target header', function() {

          it('renders the server-provided target', async function() {
            fixture('.one', { text: 'old content' })
            fixture('.two', { text: 'old content' })

            up.render({ target: '.one', url: '/path' })
            await wait()

            jasmine.respondWithSelector('.two', { text: 'new content', responseHeaders: { 'X-Up-Target': '.two' } })
            await wait()

            expect('.one').toHaveText('old content')
            expect('.two').toHaveText('new content')
          })

          it('renders the server-provided target for a failed update', async function() {
            fixture('.one', { text: 'old content' })
            fixture('.two', { text: 'old content' })
            fixture('.three', { text: 'old content' })

            const renderJob = up.render({ target: '.one', failTarget: '.two', url: '/path' })

            await wait()

            jasmine.respondWithSelector('.three', { text: 'new content', responseHeaders: { 'X-Up-Target': '.three' }, status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.one').toHaveText('old content')
            expect('.two').toHaveText('old content')
            expect('.three').toHaveText('new content')
          })

          describe('when the server sends X-Up-Target: :none', function() {

            it('does not require a response body and succeeds', async function() {
              fixture('.one', { text: 'old one' })
              fixture('.two', { text: 'old two' })

              const renderOptions = { target: '.one', url: '/path' }
              const promise = up.render(renderOptions)
              await wait()

              jasmine.respondWith({ responseHeaders: { 'X-Up-Target': ':none' }, responseText: '', contentType: 'text/plain' })
              await wait()

              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('old two')

              await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(promise).toBeResolvedTo(jasmine.objectContaining({
                ok: true,
                none: true,
                target: ':none',
                fragments: [],
                renderOptions: jasmine.objectContaining({ target: ':none', url: '/path' }),
              }))
            })

            it('does not call an { onRendered } callback', async function() {
              fixture('.one', { text: 'old one' })

              const onRendered = jasmine.createSpy('onRendered callback')
              up.render({ target: '.one', url: '/path', onRendered })
              await wait()

              jasmine.respondWith({ responseHeaders: { 'X-Up-Target': ':none' }, responseText: '', contentType: 'text/plain' })
              await wait()

              expect('.one').toHaveText('old one')
              expect(onRendered).not.toHaveBeenCalled()
            })
          })

          it('lets the server sends an abstract target like :main', async function() {
            fixture('.one', { text: 'old content' })
            fixture('.two', { text: 'old content' })
            up.fragment.config.mainTargets = ['.two']

            up.render({ target: '.one', url: '/path' })
            await wait()

            jasmine.respondWithSelector('.two', { text: 'new content', responseHeaders: { 'X-Up-Target': ':main' } })
            await wait()

            expect('.one').toHaveText('old content')
            expect('.two').toHaveText('new content')
          })
        })

        describe('for a cross-origin URL', function() {

          it('loads the content in a new page', async function() {
            const loadPage = spyOn(up.network, 'loadPage')

            fixture('.one')
            up.render({ target: '.one', url: 'http://other-domain.com/path/to' })

            await wait()

            expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining({ url: 'http://other-domain.com/path/to' }))
            expect(jasmine.Ajax.requests.count()).toBe(0)
          })

          it("returns an pending promise (since we do not want any callbacks to run as we're tearing down this page context)", function(done) {
            const loadPage = spyOn(up.network, 'loadPage')

            fixture('.one')
            const promise = up.render({ target: '.one', url: 'http://other-domain.com/path/to' })

            promiseState(promise).then(function(result) {
              expect(result.state).toBe('pending')
              done()
            })
          })
        })

        describeFallback('canPushState', function() {

          describe('when options.history is truthy', function() {

            it('loads the content in a new page', async function() {
              const loadPage = spyOn(up.network, 'loadPage')

              fixture('.one')
              up.render({ target: '.one', url: '/path', history: true })

              await wait()

              expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining({ url: '/path' }))
              expect(jasmine.Ajax.requests.count()).toBe(0)
            })

            it("returns an pending promise (since we do not want any callbacks to run as we're tearing down this page context)", async function() {
              const loadPage = spyOn(up.network, 'loadPage')

              fixture('.one')
              const promise = up.render({ target: '.one', url: '/path', history: true })

              const result = await promiseState(promise)
              expect(result.state).toBe('pending')
            })
          })

          describe('when options.history is falsy', function() {
            it("does not load the content in a new page", async function() {
              const loadPage = spyOn(up.network, 'loadPage')

              fixture('.one')
              up.render({ target: '.one', url: '/path' })

              await wait()

              expect(loadPage).not.toHaveBeenCalled()
              expect(jasmine.Ajax.requests.count()).toBe(1)
            })
          })
        })
      })

      describe('with { response } option', function() {
        it('renders the given up.Response', async function() {
          up.history.config.enabled = true
          const target = fixture('.target', { text: 'old text' })

          const request = up.request('/response-url')
          await wait()

          jasmine.respondWith('<div class="target">new text</div>')
          const response = await request

          expect('.target').toHaveText('old text')
          await up.render({ target: '.target', response, history: true })
          await wait()

          expect('.target').toHaveText('new text')
          expect(location.href).toMatchURL('/response-url')
        })
      })

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

      describe('choice of layer', function() {

        describe('targeting a background layer', function() {

          it('updates the layer given as { layer } option', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            up.render('.element', { content: 'new text', layer: 'root', peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('updates the layer of the given { origin }', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')

            up.render('.element', { content: 'new text', origin, peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('rejects when a detached { origin } is given, but no { layer } option', async function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')
            origin.remove()

            const promise = up.render('.element', { content: 'new text', origin, peel: false })

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find.*layer.*detached/i))

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/old text in root/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('ignores a detached { origin } for layer selection when there is also a { layer } option given', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')
            origin.remove()

            up.render('.element', { content: 'new text', origin, layer: 1, peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/old text in root/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/new text/)
          })

          it('updates the given { layer } even if the given { origin } is in another layer', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = up.fragment.get('.element', { layer: 1 })

            up.render('.element', { content: 'new text', origin, layer: 'root', peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('updates the layer of the given { origin } if the origin was detached after the request was sent', async function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')

            up.render('.element', { url: '/path', origin, peel: false })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)

            // Detach the origin
            origin.remove()

            jasmine.respondWithSelector('.element', { text: 'new text' })
            await wait()

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('updates the layer of the given target, if the target is given as an element (and not a selector)', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in overlay 1' },
              { target: '.element', content: 'old text in overlay 2' }
            ])

            up.render(up.layer.get(1).getFirstSwappableElement(), { content: 'new text in overlay 1', peel: false })

            expect(up.layer.get(0)).toHaveText(/old text in root/)
            expect(up.layer.get(1)).toHaveText('new text in overlay 1')
            expect(up.layer.get(2)).toHaveText('old text in overlay 2')
          })

          describe('with { peel: true }', function() {

            it('closes all overlays over the target with { peel: true }', function() {
              makeLayers([
                { target: '.element', content: 'old text in root' },
                { target: '.element', content: 'old text in overlay 1' },
                { target: '.element', content: 'old text in overlay 2' }
              ])

              up.render('.element', { content: 'new text', layer: 'root', peel: true })

              expect(up.layer.count).toBe(1)
              expect(up.layer.current.mode).toBe('root')
              expect(up.layer.current).toHaveText(/new text/)
            })

            it('does not create a history entry for the peeled layer', async function() {
              up.history.config.enabled = true
              up.history.replace('/root1')
              const locations = []
              up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

              fixture('.content', { text: 'root 1' })

              up.layer.open({ location: '/overlay1', history: true })
              await wait()

              expect(up.layer.count).toBe(2)
              expect(locations).toEqual(['/overlay1'])

              up.render({ content: 'root 2', target: '.content', history: true, location: '/root2', layer: 'root', peel: true })
              await wait()

              expect('.content').toHaveText('root 2')
              expect(up.layer.count).toBe(1)
              expect(locations).toEqual(['/overlay1', '/root2'])
            })

            it('does create a history entry for the peeled layer if the fragment update does not update history', async function() {
              up.history.config.enabled = true
              up.history.replace('/root1')
              const locations = []
              up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

              fixture('.content', { text: 'root 1' })

              up.layer.open({ location: '/overlay1', history: true })
              await wait()

              expect(up.layer.count).toBe(2)
              expect(locations).toEqual(['/overlay1'])

              up.render({ content: 'root 2', target: '.content', history: false, layer: 'root', peel: true })
              await wait()

              expect('.content').toHaveText('root 2')
              expect(up.layer.count).toBe(1)
              expect(locations).toEqual(['/overlay1', '/root1'])
            })

            it('still renders content if a destructor for the peeled layer crashes', async function() {
              const destroyError = new Error('error from crashing destructor')

              up.compiler('.overlay-element', () => (function() { throw destroyError }))

              htmlFixture('<div class="root-element">new root</div>')
              up.layer.open({ fragment: '<div class="overlay-element"></div>' })

              expect(up.layer.isOverlay()).toBe(true)

              await jasmine.expectGlobalError(destroyError, () => up.render({
                fragment: '<div class="root-element">new root</div>',
                peel: true,
                layer: 'root'
              }))

              expect('.root-element').toHaveText('new root')
              expect(up.layer.isOverlay()).toBe(false)
            })
          })
        })

        describe('stacking a new overlay', function() {

          it('opens a new layer when given { layer: "new" }', function() {
            up.render('.element', { content: 'new text', layer: 'new' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current).toHaveText('new text')
          })

          it('returns a promise with an up.RenderResult that contains information about the updated fragments and layer', function(done) {
            const promise = up.render('.overlay-element', { content: 'new text', layer: 'new' })

            promise.then(function(result) {
              expect(up.layer.count).toBe(2)
              expect(result.ok).toBe(true)
              expect(result.fragments).toEqual([up.fragment.get('.overlay-element')])
              expect(result.layer).toBe(up.layer.current)
              done()
            })
          })

          it('allows to pass the mode for the new layer as { layer: "new $MODE" } (as a shortcut)', function() {
            up.render('.element', { content: 'new text', layer: 'new drawer' })

            expect(up.layer.current.mode).toEqual('drawer')
          })
        })

        describe('with { layer: "swap" }', function() {

          it('replaces the current overlay with the new overlay', function() {
            makeLayers(2)

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('modal')

            up.render('.element', { content: 'new text', layer: 'swap', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })

          it('opens a new overlay if no overlay is open', function() {
            expect(up.layer.count).toBe(1)

            up.render('.element', { content: 'new text', layer: 'swap', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })

          it('does not push a history entry between that of the old and new overlays', async function() {
            up.history.config.enabled = true
            const locations = []
            up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

            up.layer.open({ location: '/overlay1', history: true })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1'])

            up.render({ content: 'overlay 2', target: '.content', history: true, location: '/overlay2', layer: 'swap' })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1', '/overlay2'])
          })

          it("does restore the base layer's history entry if the new overlay has no history", async function() {
            up.history.config.enabled = true
            up.history.replace('/base-layer')
            const locations = []
            up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

            up.layer.open({ location: '/overlay1', history: true })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1'])

            up.render({ content: 'overlay 2', target: '.content', history: false, layer: 'swap' })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1', '/base-layer'])
          })
        })

        describe('with { layer: "shatter" }', function() {

          it('replaces all existing overlays with the new overlay', function() {
            makeLayers(3)

            expect(up.layer.count).toBe(3)
            expect(up.layer.current.mode).toEqual('modal')

            up.render('.element', { content: 'new text', layer: 'shatter', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })

          it('opens a new overlay if no overlay is open', function() {
            expect(up.layer.count).toBe(1)

            up.render('.element', { content: 'new text', layer: 'shatter', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })
        })

        describe('if nothing else is specified', function() {

          it('updates the current layer', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            up.render('.element', { content: 'new text', peel: false })

            expect(up.layer.get(0)).toHaveText(/old text in root/)
            expect(up.layer.get(1)).toHaveText(/new text/)
          })

          it('rejects if the current layer does not match', async function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.other', content: 'old text in modal1' }
            ])

            const promise = up.render('.element', { content: 'new text' })

            await expectAsync(promise).toBeRejected()
          })
        })

        describe('if the given layer does not exist', function() {

          it('rejects the change', async function() {
            fixture('.element', { text: 'old text' })
            const promise = up.render('.element', { layer: 'parent', content: 'new text' })

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError('up.CannotMatch', /could not find (a )?layer/i))
            expect('.element').toHaveText(/old text/)
          })

          it('allows the request and does not reject if the { layer } can be resolved, but { failLayer } cannot', async function() {
            fixture('.success')
            fixture('.failure')

            const promise = up.render('.success', { url: '/path', failTarget: '.failure', layer: 'current', failLayer: 'parent' })

            await wait()

            // Allow the request. In the common case that the request is successful, we would have aborted for no reason.
            // We can still throw if the server does end up responding with a failure.
            await expectAsync(promise).toBePending()
            expect(jasmine.Ajax.requests.count()).toBe(1)

            // When the server does end up responding with a failure, we cannot process it and must throw up.CannotMatch.
            jasmine.respondWithSelector('.failure', { status: 500 })
            await expectAsync(promise).toBeRejectedWith(jasmine.anyError('up.CannotMatch', /could not find (a )?layer/i))
          })

          it('updates the next layer in a space-separated list of alternative layer names', function(done) {
            fixture('.element', { text: 'old text' })
            const promise = up.render('.element', { layer: 'parent root', content: 'new text' })

            u.task(() => promiseState(promise).then(function(result) {
              expect(result.state).toEqual('fulfilled')
              expect('.element').toHaveText(/new text/)
              done()
            }))
          })

          it('updates the next layer in a comma-separated list of alternative layer names', function(done) {
            fixture('.element', { text: 'old text' })
            const promise = up.render('.element', { layer: 'parent, root', content: 'new text' })

            u.task(() => promiseState(promise).then(function(result) {
              expect(result.state).toEqual('fulfilled')
              expect('.element').toHaveText(/new text/)
              done()
            }))
          })

          if (up.migrate.loaded) {
            it('updates the next layer in an "or"-separated list of alternative layer names', function(done) {
              fixture('.element', { text: 'old text' })
              const promise = up.render('.element', { layer: 'parent or root', content: 'new text' })

              u.task(() => promiseState(promise).then(function(result) {
                expect(result.state).toEqual('fulfilled')
                expect('.element').toHaveText(/new text/)
                done()
              }))
            })
          }
        })
      })

      describe('with { history } option', function() {

        beforeEach(function() {
          up.history.config.enabled = true
        })

        describe('browser location', function() {

          it('sets the browser location to the requested URL', async function() {
            fixture('.target')
            const promise = up.render('.target', { url: '/path', history: true })
            await wait()

            jasmine.respondWithSelector('.target')
            await promise

            expect(location.href).toMatchURL('/path')
          })

          it('does not add a history entry after non-GET requests', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', method: 'post', history: true })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it("detects a redirect's new URL when the server sets an X-Up-Location header", async function() {
            fixture('.target')
            up.render('.target', { url: '/path', history: true })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/other-path' } })
            await wait()

            expect(location.href).toMatchURL('/other-path')
          })

          it('assumes a redirect to GET when the response URL does not match the request URL', async function() {
            fixture('.target')
            up.render('.target', { url: '/endpoint', history: true, method: 'post' })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/redirect-path' } })
            await wait()

            expect(location.href).toMatchURL('/redirect-path')
          })

          it('does not assume a redirect to GET when the response URL matches the request URL', async function() {
            fixture('.target')
            up.render('.target', { url: '/endpoint', history: true, method: 'post' })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/endpoint' } })
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not assume a redirect to GET when the server sends an X-Up-Method header', async function() {
            fixture('.target')
            up.render('.target', { url: '/endpoint', history: true, method: 'post' })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/redirect-path', 'X-Up-Method': 'post' } })
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it("preserves the #hash when the server sets an X-Up-Location header (like a vanilla form submission would do in the browser)", async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', history: true })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/other-path' } })
            await wait()

            expect(location.href).toMatchURL('/other-path#hash')
          })

          it('adds a history entry after non-GET requests if the response includes a `X-Up-Method: GET` header (will happen after a redirect)', async function() {
            fixture('.target')
            up.render('.target', { url: '/requested-path', method: 'post', history: true })
            await wait()

            jasmine.respondWithSelector('.target', {
              responseHeaders: {
                'X-Up-Method': 'GET',
                'X-Up-Location': '/signaled-path'
              }
            })
            await wait()

            expect(location.href).toMatchURL('/signaled-path')
          })

          it('does add a history entry after a failed GET-request (since that is reloadable)', async function() {
            fixture('.target')
            const renderJob = up.render('.target', { url: '/path', method: 'post', failTarget: '.target', history: true })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not add a history entry with { history: false } option', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', history: false })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not add a history entry without a { history } option', async function() {
            fixture('.target')
            up.render('.target', { url: '/path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('adds params from a { params } option to the URL of a GET request', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', params: { 'foo-key': 'foo value', 'bar-key': 'bar value' }, history: true })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL('/path?foo-key=foo%20value&bar-key=bar%20value')
          })

          it('does not add a history entry with { history: false } option (which also prevents updating of window title)', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', history: false })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not add a history entry with { location: false } option', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', location: false })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          describe('with { history: "auto" }', function() {

            it('adds an history entry when updating a main target', async function() {
              up.fragment.config.mainTargets = ['.target']
              fixture('.target')
              const promise = up.render('.target', { url: '/path3', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.target')
              await promise

              expect(location.href).toMatchURL('/path3')
            })

            it('allows to configure auto-history targets that are not a main target', async function() {
              up.fragment.config.autoHistoryTargets = ['.target']
              expect(up.fragment.config.mainTargets).not.toContain('.target')

              fixture('.target')
              const promise = up.render('.target', { url: '/path3-2', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.target')
              await promise

              expect(location.href).toMatchURL('/path3-2')
            })

            it('adds an history entry when updating a fragment that contains a main target', async function() {
              up.fragment.config.mainTargets = ['.target']
              const container = fixture('.container')
              e.affix(container, '.target')
              const promise = up.render('.container', { url: '/path3-1', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.container .target')
              await promise

              expect(location.href).toMatchURL('/path3-1')
            })

            it('does not add an history entry when updating a non-main targets', async function() {
              up.fragment.config.mainTargets = ['.other']
              fixture('.target')
              const promise = up.render('.target', { url: '/path4', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.target')
              await promise

              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
            })

            it('adds a history when at least fragment of a multi-fragment update is a main target', async function() {
              up.fragment.config.mainTargets = ['.bar']
              fixture('.foo')
              fixture('.bar')
              fixture('.baz')
              const promise = up.render('.foo, .bar, .baz', { url: '/path4', history: 'auto' })
              await wait()

              jasmine.respondWith(`
                <div class='foo'></div>
                <div class='bar'></div>
                <div class='baz'></div>
              `)
              await promise

              expect(location.href).toMatchURL('/path4')
            })
          })

          describe('when a string is passed as { location } option', function() {

            it('uses that URL as the new location after a GET request', async function() {
              fixture('.target')
              up.render('.target', { url: '/path', history: true, location: '/path2' })
              await wait()

              jasmine.respondWithSelector('.target')
              await wait()

              expect(location.href).toMatchURL('/path2')
            })

            it('adds a history entry after a non-GET request', async function() {
              fixture('.target')
              up.render('.target', { url: '/path', method: 'post', history: true, location: '/path3' })
              await wait()

              jasmine.respondWithSelector('.target')
              await wait()

              expect(location.href).toMatchURL('/path3')
            })

            it('does not override the response URL after a failed request', async function() {
              fixture('.success-target')
              fixture('.failure-target')
              const renderJob = up.render('.success-target', { url: '/path', history: true, location: '/path4', failLocation: true, failTarget: '.failure-target' })

              await wait()

              jasmine.respondWithSelector('.failure-target', { status: 500 })

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect(location.href).toMatchURL('/path')
            })

            it('overrides the response URL after a failed request when passed as { failLocation }', async function() {
              fixture('.success-target')
              fixture('.failure-target')
              const renderJob = up.render('.success-target', { url: '/path', history: true, location: '/path5', failLocation: '/path6', failTarget: '.failure-target' })

              await wait()

              jasmine.respondWithSelector('.failure-target', { status: 500 })

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect(location.href).toMatchURL('/path6')
            })
          })

          describe('up:layer:location:changed event', function() {

            it('is emitted when the location changed in the root layer', async function() {
              history.replaceState?.({}, 'original title', '/original-url')
              fixture('.target')

              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              await up.render({ target: '.target', location: '/new-url', content: 'new content', history: true })

              expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', { location: '/new-url', layer: up.layer.current })
            })

            it("is emitted when the location changed in an overlay", async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', history: false, content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              // Browser location is unchanged, but the overlay still needs its internal location
              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
              expect(up.layer.location).toMatchURL('/original-layer-url')

              expect(listener.calls.count()).toBe(0)

              await up.render({ target: '.target', location: '/next-layer-url', content: 'new overlay text', history: true })

              expect(up.layer.current).toHaveText('new overlay text')
              expect(listener.calls.count()).toBe(1)
            })

            it('is not emitted when a layer is initially opened', async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              expect(up.layer.location).toMatchURL('/original-layer-url')
              expect(listener.calls.count()).toBe(0)
            })

            it('is not emitted when the location did not change', async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              expect(up.layer.location).toMatchURL('/original-layer-url')
              expect(listener.calls.count()).toBe(0)

              await up.render({ target: '.target', location: '/original-layer-url', content: 'new overlay text', history: true })

              expect(up.layer.current).toHaveText('new overlay text')
              expect(listener.calls.count()).toBe(0)
            })

            it("is emitted in overlays that don't render history", async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', history: false, content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              // Browser location is unchanged, but the overlay still needs its internal location
              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
              expect(up.layer.location).toMatchURL('/original-layer-url')

              expect(listener.calls.count()).toBe(0)

              await up.render({ target: '.target', location: '/next-layer-url', content: 'new overlay text', history: true })

              // Browser location is unchanged, but the overlay still needs its internal location
              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
              expect(up.layer.location).toMatchURL('/next-layer-url')

              // Listener was called again, as we're tracking changes to the layer's { location } prop
              expect(listener.calls.count()).toBe(1)
            })
          })
        })

        describe('window title', function() {

          it("sets the document title to the response <title>", async function() {
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from HTML')
          })

          it("sets the document title to a JSON-encoded X-Up-Title header in the response", async function() {
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <div class='container'>
                  new container text
                </div>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from header')
          })

          it("prefers the X-Up-Title header to the response <title>", async function() {
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from header')
          })

          if (up.migrate.loaded) {
            it("sets the document title to an unquoted X-Up-Title header in the response", async function() {
              fixture('.container', { text: 'old container text' })
              up.render('.container', { url: '/path', history: true })

              await wait()

              jasmine.respondWith({
                responseHeaders: {
                  'X-Up-Title': '"Title from header"'
                },
                responseText: `
                  <div class='container'>
                    new container text
                  </div>
                `
              })
              await wait()

              expect('.container').toHaveText('new container text')
              expect(document.title).toBe('Title from header')
            })
          }

          it("sets the document title to the response <title> with { location: false, title: true } options (bugfix)", async function() {
            $fixture('.container').text('old container text')
            up.render('.container', { url: '/path', history: true, location: false, title: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from HTML')
          })

          it('does not update the document title if the response has a <title> tag inside an inline SVG image (bugfix)', async function() {
            $fixture('.container').text('old container text')
            const oldTitle = document.title
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <title>SVG Title Demo example</title>
                  <rect x="10" y="10" width="200" height="50" style="fill:none; stroke:blue; stroke-width:1px"/>
                </g>
              </svg>

              <div class='container'>
                new container text
              </div>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe(oldTitle)
          })

          it("does not extract the title from the response or HTTP header with { title: false }", async function() {
            fixture('.container', { text: 'old container text' })
            const oldTitle = document.title
            up.render('.container', { url: '/path', history: true, title: false })
            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect(document.title).toEqual(oldTitle)
          })

          it("does not extract the title from the response or HTTP header with { history: false }", async function() {
            fixture('.container', { text: 'old container text' })
            const oldTitle = document.title
            up.render('.container', { url: '/path', history: false })
            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect(document.title).toEqual(oldTitle)
          })

          it('allows to pass an explicit title as { title } option', async function() {
            $fixture('.container').text('old container text')
            up.render('.container', { url: '/path', history: true, title: 'Title from options' })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from options')
          })

          it("sets document.title after calling history.pushState() to prevent mutating the old history state", async function() {
            const calls = []
            spyOn(up.layer.root, '_updateLocation').and.callFake(() => calls.push('set location'))
            spyOn(up.layer.root, '_updateTitle').and.callFake(() => calls.push('set title'))

            // Instead of setting Layer#title or document#title, an alternative implementation is to insert
            // a new <title> element.
            const onHeadChanges = (mutations) => mutations.map((mutation) =>
              (() => {
                const result = []
                for (var node of mutation.addedNodes) {
                  if (node.matches('title')) {
                    result.push(calls.push('set title'))
                  } else {
                    result.push(undefined)
                  }
                }
                return result
              })())
            const observer = new MutationObserver(onHeadChanges)
            observer.observe(document.head, { childList: true, subtree: true })

            $fixture('.container').text('old container text')
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(calls).toEqual(['set location', 'set title'])

            observer.disconnect()
          })
        })

        describe('meta tags', function() {

          beforeEach(function() { up.history.config.enabled = true })

          it("updates meta tags from the response", async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='new description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).not.toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('link[rel="canonical"][href="/new-canonical"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old description"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="new description"]')
          })

          it("does not update meta tags with [up-meta=false]", async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"][up-meta="false"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical' up-meta='false'>
                  <meta name='description' content='new description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).not.toHaveSelector('link[rel="canonical"][href="/new-canonical"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old description"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="new description"]')
          })

          it('does not update meta tags with { history: false }', async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: false })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='old description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('does not update meta tags with up.history.config.updateMetaTags = false', async function() {
            up.history.config.updateMetaTags = false

            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='old description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('does not update meta tags with { metaTags: false } option', async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true, metaTags: false })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='old description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('does not render meta tags for a background layer, but saves them for later restoration', async function() {
            fixture(document.head, 'meta[name="description"][content="old root description"]')
            document.title = 'old root title'

            fixture('.container', { text: 'old root container text' })

            up.layer.open({
              target: '.container',
              history: true,
              location: "/overlay",
              document: `
                <html>
                  <head>
                    <title>overlay title</title>
                    <meta name='description' content='overlay description'>
                  </head>
                  <body>
                    <div class='container'>
                      container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect(document.title).toBe('overlay title')
            expect(document.head).toHaveSelector('meta[name="description"][content="overlay description"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old root description"]')

            up.render({
              target: '.container',
              layer: 'root',
              history: true,
              location: '/root2',
              document: `
                <html>
                  <head>
                    <title>new root title</title>
                    <meta name='description' content='new root description'>
                  </head>
                  <body>
                    <div class='container'>
                      container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            // Since we updated a background layer, the rendered meta tags are still those from the overlay.
            expect(document.title).toBe('overlay title')
            expect(document.head).toHaveSelector('meta[name="description"][content="overlay description"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old root description"]')

            up.layer.dismiss()

            await wait()

            // Now that the root layer is revealed again, we see the meta tags saved from the last render pass.
            expect(document.title).toBe('new root title')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="overlay description"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old root description"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="new root description"]')
          })

          it('does not remove current meta tags if the response has no <head>', async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <div class='container'>
                new container text
              </div>
            `)

            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('updates a script[type="application/ld+json"] from the response with up.fragment.config.runScripts = false (bugfix)', async function() {
            up.fragment.config.runScripts = false

            const json = `
              {
                "@context": "https://schema.org/",
                "@type": "Recipe",
                "name": "Party Coffee Cake",
                "author": {
                  "@type": "Person",
                  "name": "Mary Stone"
                },
                "datePublished": "2018-03-10",
                "description": "This coffee cake is awesome and perfect for parties.",
                "prepTime": "PT20M"
              }
            `

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <script type="application/ld+json">${json}</script>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.head).toHaveSelector('script[type="application/ld+json"]')
            expect(document.head.querySelector('script[type="application/ld+json"]')).toHaveText(json)
          })

          if (up.migrate.loaded) {
            it("warns if an auto-update meta tags is also [up-hungry]", async function() {
              fixture(document.head, 'link[rel="canonical"][href="/old-canonical"][up-hungry]')
              const warnSpy = up.migrate.warn.mock()

              fixture('.container', { text: 'old container text' })
              up.render('.container', { url: '/path', history: true })

              await wait()

              jasmine.respondWith(`
                <html>
                  <head>
                    <link rel='canonical' href='/new-canonical' up-hungry>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `)

              await wait()

              expect(document.head).not.toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
              expect(document.head).toHaveSelector('link[rel="canonical"][href="/new-canonical"]')
              expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('Remove the [up-hungry] attribute'), jasmine.anything())
            })
          }
        })

        describe('html[lang]', function() {

          it('updates the html[lang] attribute with the language from the response', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html lang='fr'>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'fr')
          })

          it('removes the html[lang] attribute if the response has a <html> element without a [lang] attribute', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).not.toHaveAttribute('lang')
          })

          it('does not remove the html[lang] attribute if the response has no <html> element', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <div class='container'>
                new container text
              </div>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'it')
          })

          it('does not update the html[lang] attribute with { lang: false }', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true, lang: false })

            await wait()

            jasmine.respondWith(`
              <html lang='fr'>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'it')
          })

          it('does not update the html[lang] attribute when not updating history', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: false })

            await wait()

            jasmine.respondWith(`
              <html lang='fr'>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'it')
          })
        })

        describe('assets in the head', function() {

          it('does not update linked stylesheets in the <head>', async function() {
            const style = e.createFromSelector('link[rel="stylesheet"][href="styles-1.css"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <link rel='stylesheet' href='styles-2.css'>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.head).toHaveSelector('link[rel="stylesheet"][href="styles-1.css"]')
          })

          it('does not update linked scripts in the <head>', async function() {
            const style = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.head).toHaveSelector('script[src="scripts-1.js"]')
          })

          it('does not execute new inline scripts in the <head>, even when they are marked as [up-asset]', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)
            window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')
            fixture('.container', { text: 'old container text' })

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script id="new-script" up-asset nonce="specs-nonce">window.scriptTagExecuted()</script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')

            expect(listener).toHaveBeenCalled()
            expect(listener.calls.mostRecent().args[0].newAssets[0].id).toBe('new-script')
            expect(document.head).not.toHaveSelector('script#new-script')
            expect(window.scriptTagExecuted).not.toHaveBeenCalled()

            delete window.scriptTagExecuted
          })

          it('emits an up:assets:changed event if linked assets differ between <head> and <response>', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')

            expect(listener).toHaveBeenCalled()
            const event = listener.calls.mostRecent().args[0]
            expect(event.type).toBe('up:assets:changed')
            expect(event.renderOptions).toEqual(jasmine.any(Object))
            expect(event.renderOptions.location).toBe('/path')
            expect(u.map(event.oldAssets, 'outerHTML')).toEqual(['<script src="scripts-1.js"></script>'])
            expect(u.map(event.newAssets, 'outerHTML')).toEqual(['<script src="scripts-2.js"></script>'])
          })

          it('allows the user to insert an executable script from event.newAssets (bugfix)', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener').and.callFake((event) => {
              for (let newAsset of event.newAssets) {
                document.head.append(newAsset)
              }
            })
            up.on('up:assets:changed', listener)
            window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')
            fixture('.container', { text: 'old container text' })

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script id="new-script" up-asset nonce="specs-nonce">window.scriptTagExecuted()</script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')

            expect(listener).toHaveBeenCalled()
            expect(document.head).toHaveSelector('script#new-script')
            expect(window.scriptTagExecuted).toHaveBeenCalled()
            // Check that we didn't re-execute the script when we repaired the inert element
            expect(window.scriptTagExecuted.calls.count()).toBe(1)

            delete window.scriptTagExecuted
            document.head.querySelector('script#new-script').remove()
          })

          it('does not emit up:assets:changed if the only changed asset has [up-asset=false]', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts-1.js"][up-asset="false"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js' up-asset='false'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if the <link> and <meta> elements did not change', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed after a script in the <body> was disabled through up.fragmentconfig.runScripts = false (bugfix)', async function() {
            up.fragment.config.runScripts = false
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if the updated <link> and <meta> elements are not asset-related', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts.js"]')
            registerFixture(style)
            document.head.append(style)

            const description = e.createFromSelector('meta[name="description"][content="old description"]')
            registerFixture(description)
            document.head.append(description)

            const nextLink = e.createFromSelector('link[rel="next"][href="/old-next"]')
            registerFixture(nextLink)
            document.head.append(nextLink)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts.js'></script>
                    <meta name='description' content='new description'>
                    <link rel='next' href='/new-next'>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if the response has no <head>', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const script = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(script)
            document.head.append(script)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <div class='container'>
                  new container text
                </div>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if inline scripts in the <head> changed', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const script = e.createFromSelector('script', { text: 'console.log("hello from old inline scripts")' })
            registerFixture(script)
            document.head.append(script)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script nonce="specs-nonce">
                      console.log("hello from new inline script")
                    </script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('aborts the render pass if the up:assets:changed event is prevented', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener').and.callFake((event) => event.preventDefault())
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            const renderPromise = up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(listener).toHaveBeenCalled()
            expect('.container').toHaveText('old container text')
          })
        })

      })

      describe('fragment source', function() {

        it('remembers the source the fragment was retrieved from', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
        })

        it('returns the source location without a #hash', async function() {
          fixture('.target')
          up.render('.target', { url: '/path#hash' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
        })

        it('keeps the previous source for a non-GET request (since only that is reloadable)', async function() {
          const target = fixture('.target[up-source="/previous-source"]')
          up.render('.target', { url: '/path', method: 'post' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/previous-source')
        })

        it('does not overwrite an [up-source] attribute from the element HTML', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.target[up-source="/other"]')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/other')
        })

        describe('with { source } option', function() {

          it('uses that URL as the source for a GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            up.render('.target', { url: '/path', source: '/given-path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source for a failed GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            const renderJob = up.render('.target', { failTarget: '.target', url: '/path', source: '/given-path' })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source after a non-GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            up.render('.target', { url: '/path', method: 'post', source: '/given-path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source after a failed non-GET request\'', async function() {
            const target = fixture('.target[up-source="/previous-source"]')
            const renderJob = up.navigate('.target', { failTarget: '.target', url: '/path', method: 'post', source: '/given-path' })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })
        })
      })

      describe('context', function() {

        it("sends the layer's context along with requests pertaining to this layer as an X-Up-Context request header", async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue' })

          await wait()

          up.render('.target', { layer: up.layer.get(0), url: '/path1' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue' }))

          up.render('.target', { layer: up.layer.get(1), url: '/path2' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue' }))
        })

        it('escapes high ASCII characters in the X-Up-Context request header so Unicode values can be transported', async function() {
          up.layer.context = { foo: 'xäy' }
          fixture('.target')

          up.render('.target', { url: '/path3' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toBe('{"foo":"x\\u00e4y"}')
        })

        it("sends the fail layer's context as an X-Up-Fail-Context request header", async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render({ target: '.target', failTarget: '.target', layer: up.layer.get(0), failLayer: up.layer.get(1), url: '/path1' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue' }))
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Fail-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue' }))
        })

        it('lets the server update the context by responding with an X-Up-Context response header', async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render('.target', { layer: up.layer.get(1), url: '/path1' })
          await wait()

          jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue' }) } })
          await wait()

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue', newKey: 'newValue' })
        })

        it('allows unquoted property names in the X-Up-Context response header', async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render('.target', { layer: up.layer.get(1), url: '/path1' })
          await wait()

          jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Context': '{ newKey: "newValue" }' } })
          await wait()

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue', newKey: 'newValue' })
        })

        it('uses updates from an X-Up-Context header for failed responses', async function() {
          fixture('.success-target', { text: 'success target' })
          fixture('.failure-target', { text: 'failure target' })

          const renderJob = up.render({ target: '.success-target', failTarget: '.failure-target', url: '/path1' })

          await wait()

          jasmine.respondWithSelector('.failure-target', {
            text: 'new text',
            status: 500,
            responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue' }) }
          })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

          expect('.failure-target').toHaveText('new text')
          expect(up.layer.get(0).context).toEqual({ newKey: 'newValue' })
        })
      })

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

          let oldElement = undefined
          let newElement = undefined

          oldElement = document.querySelector('.element.v1')
          newElement = document.querySelector('.element.v2')

          expect(oldElement).toHaveOpacity(1.0, 0.15)
          expect(newElement).toHaveOpacity(0.0, 0.15)
          await wait(100)

          expect(oldElement).toHaveOpacity(0.5, 0.3)
          expect(newElement).toHaveOpacity(0.5, 0.3)
          await wait(170)

          expect(newElement).toHaveOpacity(1.0, 0.1)
          expect(oldElement).toBeDetached()
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
          expect('fake-body').toHaveOpacity(1.0)
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

          await up.render('.element', {
            document: '<div class="element v3">version 3</div>',
            transition: 'cross-fade',
            duration: 200
          })

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
          expect(oldFocused).toHaveOpacity(0.5, 0.4)
          expect(newFocused).toBeAttached()
          expect(newFocused).toHaveOpacity(0.5, 0.4)

          oldFocused.focus()
          expect(oldFocused).not.toBeFocused()

          await wait(800)

          expect(oldFocused).toBeDetached()
          expect(newFocused).toBeAttached()
          expect(newFocused).toHaveOpacity(1.0, 0.2)
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

      describe('style elements', function() {

        it('applies internal <style> elements that were inserted by a render pass', async function() {
          let [paragraph, target] = htmlFixtureList(`
            <p>paragraph text</p>
            <div id="target">old target text</div>
          `)

          up.render({
            fragment: `
              <div id="target">
                new target text
                <style nonce="specs-nonce">
                  p {
                    font-size: 60px;
                  }
                </style>
              </div>
            `
          })

          await wait(200)

          expect('#target').toHaveVisibleText('new target text')
          expect('#target').toHaveSelector('style')
          expect(paragraph).toHaveComputedStyle({ 'font-size': '60px' })

        })
      })

      describe('execution of scripts', function() {

        beforeEach(function() {
          window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')
          this.linkedScriptPath = `/spec/files/linked_script.js?cache-buster=${Math.random().toString()}`
        })

        afterEach(function() {
          delete window.scriptTagExecuted
        })

        describe('with up.fragment.config.runScripts = false', function() {

          beforeEach(function() {
            up.fragment.config.runScripts = false
          })

          it('does not execute inline script tags from a fragment response', async function() {
            htmlFixtureList(`
              <div class="target">
                old text
              </div>
            `)

            up.render({
              fragment: `
                <div class="target">
                  new text
                  <script type="text/javascript">
                    window.scriptTagExecuted()
                  </script>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
            expect('.target').toHaveVisibleText('new text')
          })

          it('does not execute inline script tags that match the page nonce', async function() {
            htmlFixtureList(`
              <div class="target">
                old text
              </div>
            `)

            up.render({
              fragment: `
                <div class="target">
                  new text
                  <script type="text/javascript" nonce="specs-nonce">
                    window.scriptTagExecuted()
                  </script>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
            expect('.target').toHaveVisibleText('new text')
          })

          it('does not execute inline script tags that match the response nonce', async function() {
            htmlFixtureList(`
              <div class="target">
                old text
              </div>
            `)

            up.render({ url: '/path', target: '.target' })
            await wait()

            jasmine.respondWith({
              responseHeaders: { 'Content-Security-Policy': "script-src: 'specs-nonce'" },
              responseText: `
                <div class="target">
                  new text
                  <script type="text/javascript" nonce="specs-nonce">
                    window.scriptTagExecuted()
                  </script>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
            expect('.target').toHaveVisibleText('new text')
          })

          it('does not execute a script[type=module]', async function() {
            fixture('.target', { text: 'old text' })

            up.render({
              fragment: `
                <div class="target">
                  new text
                  <script type="module" nonce="specs-nonce">
                    window.scriptTagExecuted()
                  </script>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="module"]')
            expect('.target').toHaveVisibleText('new text')
          })

          it('does not execute inline script tags from a document response', async function() {
            fixture('.target', { text: 'old text' })

            up.render('.target', {
              document: `
                <html>
                  <body>
                    <div class="target">
                      new text
                      <script type="text/javascript" nonce="specs-nonce">
                        window.scriptTagExecuted()
                      </script>
                    </div>
                  </body>
                </html>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
            expect('.target').toHaveVisibleText('new text')
          })

          it('does not execute inline script tags when opening a new overlay', async function() {
            up.layer.open({
              fragment: `
                <div class="target">
                  new text
                  <script type="text/javascript" nonce="specs-nonce">
                    window.scriptTagExecuted()
                  </script>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(up.layer.count).toBe(2)
            expect(up.layer.current).toHaveVisibleText('new text')
          })

          it('does not crash when the new fragment contains inline script tag that is followed by another sibling (bugfix)', async function() {
            fixture('.target')
            up.render({
              fragment: `
                <div class="target">
                  <div>before</div>
                  <script type="text/javascript" nonce="specs-nonce">
                    window.scriptTagExecuted()
                  </script>
                  <div>after</div>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
            expect('.target').toHaveVisibleText('before after')
          })

          it('does not execute linked scripts to prevent re-inclusion of javascript inserted before the closing body tag', async function() {
            fixture('.target')
            up.render({
              fragment: `
                <div class="target">
                  <script type="text/javascript" src="${this.linkedScriptPath}" nonce="specs-nonce"></script>
                </div>
              `
            })

            await wait(1500)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
          })

          it('keeps script[type="application/ld+json"]', async function() {
            const json = `
              {
                "@context": "https://schema.org/",
                "@type": "Recipe",
                "name": "Party Coffee Cake",
                "author": {
                  "@type": "Person",
                  "name": "Mary Stone"
                },
                "datePublished": "2018-03-10",
                "description": "This coffee cake is awesome and perfect for parties.",
                "prepTime": "PT20M"
              }
            `

            fixture('#target')

            up.render({
              fragment: `
                <div id="target">
                  <script type="application/ld+json">
                    ${json}
                  </script>
                </div>
              `
            })

            await wait()

            expect(document.querySelector('#target')).toHaveSelector('script[type="application/ld+json"]')
            expect(document.querySelector('#target script[type="application/ld+json"]')).toHaveText(json)
          })
        })

        describe('with up.fragment.config.runScripts = true', function() {

          beforeEach(function() {
            up.fragment.config.runScripts = true
          })

          it('executes inline script elements inside the updated fragment', async function() {
            fixture('.target', { text: 'old text' })

            up.render({ target: '.target', url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="target">
                new text
                <script type="text/javascript" nonce="specs-nonce">
                  window.scriptTagExecuted()
                </script>
              </div>
            `)

            await wait(100)

            expect(window.scriptTagExecuted).toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).toHaveSelector('.target script[type="text/javascript"]')
            expect('.target').toHaveVisibleText(/new text/)
          })

          it('executes inline script elements in fragments only once when rendering a { fragment } (bugfix)', async function() {
            fixture('.target', { text: 'old text' })

            up.render({
              fragment: `
                <div class="target">
                  new text
                  <script type="text/javascript" nonce="specs-nonce">
                    window.scriptTagExecuted()
                  </script>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted.calls.count()).toBe(1)
          })

          it('executes inline script elements in fragments only once when rendering a full document from a { url } (bugfix)', async function() {
            fixture('.target', { text: 'old text' })

            up.render({ url: '/url', target: '.target' })
            await wait()

            jasmine.respondWith(`
              <html>
                <body>
                  <div class="target">
                    new text
                    <script type="text/javascript" nonce="specs-nonce">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                </body>
              </html>
            `)

            await wait(100)

            expect(window.scriptTagExecuted.calls.count()).toBe(1)
          })

          it('preserves the [nonce] attribute of an inline script (bugfix)', async function() {
            fixture('.target', { text: 'old text' })

            up.render({ target: '.target', url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="target">
                new text
                <script type="text/javascript" nonce="secret">
                  window.scriptTagExecuted()
                </script>
              </div>
            `)
            await wait(100)

            // Cannot use toHaveAttribute() here, because on pages with a CSP that value is masked by the browser.
            expect('.target script[type="text/javascript"]').toHaveProperty('nonce', 'secret')
          })

          it('executes scripts with a correct [nonce]', async function() {
            fixture('.target', { text: 'old text' })

            up.render({ target: '.target', url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="target">
                new text
                <script type="text/javascript" nonce="specs-nonce">
                  window.scriptTagExecuted()
                </script>
              </div>
            `)
            await wait(100)

            expect(window.scriptTagExecuted).toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).toHaveSelector('.target script[type="text/javascript"]')
            // Cannot use toHaveAttribute() here, because on pages with a CSP that value is masked by the browser.
            expect('.target script[type="text/javascript"]').toHaveProperty('nonce', 'specs-nonce')
            expect('.target').toHaveVisibleText(/new text/)
          })

          if (specs.config.csp !== 'none') {

          }

          it('executes a script[type=module] inside the updated fragment', async function() {
            fixture('.target', { text: 'old text' })

            up.render({ target: '.target', url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="target">
                new text
                <script type="module" nonce="specs-nonce">
                  window.scriptTagExecuted()
                </script>
              </div>
            `)
            await wait(100)

            expect(window.scriptTagExecuted).toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).toHaveSelector('.target script[type="module"]')
            expect('.target').toHaveVisibleText(/new text/)
          })

          it('executes inline script tags that are itself the target', async function() {
            fixture('script.target', { text: 'true' })

            up.render({ target: '.target', url: '/path' })
            await wait()

            jasmine.respondWith(`
              <script class="target" nonce="specs-nonce">
                window.scriptTagExecuted()
              </script>
            `)
            await wait(100)

            expect(window.scriptTagExecuted).toHaveBeenCalled()
          })

          it('does not execute inline script tags outside the updated fragment', async function() {
            fixture('.target', { text: 'old text' })

            up.render({ target: '.target', url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="before">
                <script type="text/javascript" nonce="specs-nonce">
                  window.scriptTagExecuted()
                </script>
              </div>
              <div class="target">
                new text
              </div>
            `)
            await wait(100)

            expect(window.scriptTagExecuted).not.toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
            expect('.target').toHaveVisibleText('new text')
          })

          it('executes linked scripts', async function() {
            fixture('.target')

            up.render({ target: '.target', url: '/path' })
            await wait()

            jasmine.respondWith(`
              <div class="target">
                <script type="text/javascript" src="${this.linkedScriptPath}" nonce="specs-nonce"></script>
              </div>
            `)
            await wait(1500)

            expect(window.scriptTagExecuted).toHaveBeenCalled()
            expect(document).toHaveSelector('.target')
            expect(document).toHaveSelector('.target script')
          })

          if (specs.config.csp === 'nonce-only') {
            describe('with a nonce-only CSP', function() {

              it('does not execute inline scripts with an incorrect [nonce]', async function() {
                fixture('.target', { text: 'old text' })

                up.render({ target: '.target', url: '/path' })
                await wait()

                jasmine.respondWith(`
                <div class="target">
                  new text
                  <script type="text/javascript" nonce="incorrect-nonce">
                    console.log("execute!")
                    window.scriptTagExecuted()
                  </script>
                </div>
              `)
                await wait(100)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target script') // we did not disable, but the browser blocked it
                // Cannot use toHaveAttribute() here, because on pages with a CSP that value is masked by the browser.
                expect('.target script').toHaveProperty('nonce', 'incorrect-nonce')
              })

              it('does not execute linked scripts with an incorrect [nonce]', async function() {
                fixture('.target')

                up.render({ target: '.target', url: '/path' })
                await wait()

                jasmine.respondWith(`
                <div class="target">
                  <script type="text/javascript" src="${this.linkedScriptPath}" nonce="incorrect-nonce"></script>
                </div>
              `)
                await wait(1500)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target script') // we did not disable, but the browser blocked it
                // Cannot use toHaveAttribute() here, because on pages with a CSP that value is masked by the browser.
                expect('.target script').toHaveProperty('nonce', 'incorrect-nonce')
              })
            })
          }

          if (specs.config.csp === 'strict-dynamic') {
            describe('with a strict-dynamic CSP', function() {

              it('runs a script[nonce] when its nonce matches the response nonce', async function() {
                htmlFixtureList(`
                  <div class="target">
                    old text
                  </div>
                `)

                up.render({ url: '/path', target: '.target' })
                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'specs-nonce'" },
                  responseText: `
                  <div class="target">
                    new text
                    <script type="text/javascript" nonce="specs-nonce">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

              it('runs a script[nonce] when its nonce matches the page nonce when rendering a { fragment }', async function() {
                htmlFixtureList(`
                  <div class="target">
                    old text
                  </div>
                `)

                up.render({
                  fragment: `
                  <div class="target">
                    new text
                    <script type="text/javascript" nonce="specs-nonce">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

              it('does not run a script without a [nonce] attribute', async function() {
                htmlFixtureList(`
                <div class="target">
                  old text
                </div>
              `)

                up.render({ url: '/path', target: '.target' })
                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'specs-nonce'" },
                  responseText: `
                  <div class="target">
                    new text
                    <script type="text/javascript">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

              it('does not run a script without a [nonce] attribute when the page nonce is unknown', async function() {
                let suiteMeta = document.querySelector('meta[name="csp-nonce"]')
                suiteMeta.remove()
                expect(up.protocol.cspNonce()).toBeMissing()

                htmlFixtureList(`
                  <div class="target">
                    old text
                  </div>
                `)

                up.render({ url: '/path', target: '.target' })
                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'specs-nonce'" },
                  responseText: `
                  <div class="target">
                    new text
                    <script type="text/javascript">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

              it('does not run a script[nonce] when its nonce does not match the response nonce', async function() {
                htmlFixtureList(`
                  <div class="target">
                    old text
                  </div>
                `)

                up.render({ url: '/path', target: '.target' })
                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'specs-nonce'" },
                  responseText: `
                  <div class="target">
                    new text
                    <script type="text/javascript" nonce="other-nonce">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

              it("does not run a script[nonce] with a response CSP of `script-src 'self' but without a nonce", async function() {
                htmlFixtureList(`
                  <div class="target">
                    old text
                  </div>
                `)

                up.render({ url: '/path', target: '.target' })
                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'self'" },
                  responseText: `
                  <div class="target">
                    new text
                    <script type="text/javascript">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

              it('does not run a script[nonce] when its nonce does not match the response nonce', async function() {
                htmlFixtureList(`
                  <div class="target">
                    old text
                  </div>
                `)

                up.render({ url: '/path', target: '.target' })
                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'response-nonce'" },
                  responseText: `
                  <div class="target">
                    new text
                    <script type="text/javascript" nonce="other-nonce">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

              it('does not run a script[nonce] when its nonce matches the response nonce but the page has no nonce', async function() {
                htmlFixtureList(`
                  <div class="target">
                    old text
                  </div>
                `)

                up.render({ url: '/path', target: '.target' })
                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'response-nonce'" },
                  responseText: `
                  <div class="target">
                    new text
                    <script type="text/javascript" nonce="response-nonce">
                      window.scriptTagExecuted()
                    </script>
                  </div>
                `
                })

                await wait(100)

                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).not.toHaveSelector('.target script[type="text/javascript"]')
                expect('.target').toHaveVisibleText('new text')
              })

            })
          }
        }) // runScripts = true

        describe('with up.fragment.config.runScripts = Function(script): boolean', function() {

          it('lets the function decide which scripts to run', async function() {
            up.fragment.config.runScripts = (script) => script.id === "two"

            fixture('.target', { text: 'old text' })

            up.render({
              fragment: `
                <div class="target">
                  new text
                  <script type="text/javascript" nonce="specs-nonce" id="one">
                    window.scriptTagExecuted('one')
                  </script>
                  <script type="text/javascript" nonce="specs-nonce" id="two">
                    window.scriptTagExecuted('two')
                  </script>
                  <script type="text/javascript" nonce="specs-nonce" id="three">
                    window.scriptTagExecuted('three')
                  </script>
                </div>
              `
            })

            await wait(100)

            expect(window.scriptTagExecuted).toHaveBeenCalled()
            expect(window.scriptTagExecuted.calls.count()).toBe(1)
            expect(window.scriptTagExecuted.calls.mostRecent().args).toEqual(['two'])

            expect(document).toHaveSelector('.target')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]#one')
            expect(document).toHaveSelector('.target script[type="text/javascript"]#two')
            expect(document).not.toHaveSelector('.target script[type="text/javascript"]#three')
            expect('.target').toHaveVisibleText(/new text/)
          })

          if (specs.config.csp === 'strict-dynamic') {
            it('runs a nonce-less script with a strict-dynamic CSP when the function returns true', async function() {
              up.fragment.config.runScripts = (_script) => true

              htmlFixtureList(`
              <div class="target">
                old text
              </div>
            `)

              up.render({ url: '/path', target: '.target' })
              await wait()

              jasmine.respondWith({
                responseHeaders: { 'Content-Security-Policy': "script-src: 'strict-dynamic' 'specs-nonce'" },
                responseText: `
                <div class="target">
                  new text
                  <script type="text/javascript">
                    window.scriptTagExecuted()
                  </script>
                </div>
              `
              })

              await wait(100)

              expect(window.scriptTagExecuted).toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).toHaveSelector('.target script[type="text/javascript"]')
              expect('.target').toHaveVisibleText('new text')
            })
          }

        })

        describe('<noscript> tags', function() {

          it('parses <noscript> contents as text, not DOM nodes (since it will be placed in a scripting-capable browser)', async function() {
            fixture('.target')
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <noscript>
                  <img src="foo.png">
                </noscript>
              </div>
            `)

            await wait()

            const noscript = document.querySelector('.target noscript')
            expect(noscript).toHaveText('<img src="foo.png">')
          })

          it('parses <noscript> contents as text, not DOM nodes when the <noscript> itself is the target', async function() {
            fixture('noscript#target')
            up.render('#target', { url: '/path' })

            await wait()

            jasmine.respondWith(`
              <div>
                <noscript id='target'>
                  <img src="foo.png">
                </noscript>
              </div>
            `)

            await wait()

            const noscript = document.querySelector('#target')
            expect(noscript).toHaveText('<img src="foo.png">')
          })

          it('parses <noscript> contents with multiple lines as text, not DOM nodes', async function() {
            fixture('.target')
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <noscript>
                  <img src="foo.png">
                  <img src="bar.png">
                </noscript>
              </div>
            `)

            await wait()

            const $noscript = $('.target noscript')
            const text = $noscript.text().trim()
            expect(text).toMatch(/<img src="foo\.png">\s+<img src="bar\.png">/)
          })

          it('parses multiple <noscript> tags in the same fragment as text, not DOM nodes', async function() {
            fixture('.target')
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <noscript>
                  <img src="foo.png">
                </noscript>
                <noscript>
                  <img src="bar.png">
                </noscript>
              </div>
            `)

            await wait()

            const $noscripts = $('.target noscript')
            expect($noscripts.length).toBe(2)
            const text0 = $noscripts[0].textContent.trim()
            const text1 = $noscripts[1].textContent.trim()
            expect(text0).toEqual('<img src="foo.png">')
            expect(text1).toEqual('<img src="bar.png">')
          })
        })
      })

      describe('media elements', function() {
        // https://github.com/unpoly/unpoly/issues/432
        it('inserts an auto-playing <video> element (bugfix for Safari)', function(done) {
          fixture('#target')

          // Must render from a { url } or { document } so DOMParser is involved.
          up.render('#target', { url: '/video' })

          return u.task(function() {
            jasmine.respondWith(`
                <div id='target'>
                  <video width="400" controls loop muted autoplay>
                    <source src="/spec/files/video.webm" type="video/webm">
                  </video>
                </div>
            `)

            return u.task(function() {
              const video = document.querySelector('#target video')
              expect(video).toBeGiven()
              const specDone = () => done()
              return video.addEventListener('timeupdate', specDone, { once: true })
            })
          })
        })
      })


      describe('CSP nonces in body scripts', function() {

        beforeEach(function() {
          up.fragment.config.runScripts = true
        })

        it("rewrites the [nonce] of a body script to use the current page's nonce when it matches the response nonce", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `
              <div id="target">
                new target text
                <script nonce="response-secret"></script>
              </div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect('#target script').toHaveProperty('nonce', 'page-secret')
        })

        it("rewrites the [nonce] of a body script to use the current page's nonce when it matches one of multiple response's nonces", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `
              <div id="target">
                new target text
                <script nonce="response-secret-2"></script>
              </div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret-1' 'nonce-response-secret-2' 'nonce-response-secret-3'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect('#target script').toHaveProperty('nonce', 'page-secret')
        })

        it('rewrites the [nonce] of a body script with Content-Security-Policy-Report-Only response header', async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `
              <div id="target">
                new target text
                <script nonce="response-secret"></script>
              </div>
            `,
            responseHeaders: { 'Content-Security-Policy-Report-Only': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect('#target script').toHaveProperty('nonce', 'page-secret')
        })

        it('does not change a body script when the current page nonce is unknown', async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue(null)

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `
              <div id="target">
                new target text
                <script nonce="response-secret"></script>
              </div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect('#target script').toHaveProperty('nonce', 'response-secret')
        })

        it("does not change a body script that doesn't match the response's script-src policy", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `
              <div id="target">
                new target text
                <script nonce="html-secret"></script>
              </div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect('#target script').toHaveProperty('nonce', 'html-secret')

        })

        it("does not change a body script that only matches the response's style-src policy", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `
              <div id="target">
                new target text
                <script nonce="style-secret"></script>
              </div>
            `,
            responseHeaders: { 'Content-Security-Policy': "style-src: 'nonce-style-secret'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect('#target script').toHaveProperty('nonce', 'style-secret')
        })

        it("does not change body scripts that never had [nonce] attribute", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `
              <div id="target">
                new target text
                <script></script>
              </div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect(document.querySelector('#target script').nonce).toBeBlank()
        })

      })

      describe('CSP nonces in head scripts', function() {

        it('rewrites a matching [nonce] of a head script before it is passed to up:assets:changed', async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')
          const listener = jasmine.createSpy('up:assets:changed listener')
          up.on('up:assets:changed', listener)

          let [target] = htmlFixtureList(`
            <div id="target">
              old target text
            </div>
          `)

          up.render('#target', { url: '/path', history: true })
          await wait()

          jasmine.respondWith({
            responseText: `
              <html>
                <head>
                  <script src='head-script.js' nonce="response-secret"></script>
                </head>
                <body>
                  <div id="target">
                    new target text
                    <script nonce="response-secret"></script>
                  </div>
                </body>
              </html>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect('#target').toHaveVisibleText('new target text')
          expect(listener).toHaveBeenCalled()
          const event = listener.calls.mostRecent().args[0]
          expect(event.newAssets.length).toBe(1)
          expect(event.newAssets[0]).toMatchSelector('script[src="head-script.js"]')
          expect(event.newAssets[0]).toHaveProperty('nonce', 'page-secret')
        })

        it('does not rewrite a non-matching [nonce] of a head script before it is passed to up:assets:changed')

        it('does not trigger up:assets:changed if a script elements is identical after the [nonce] was rewritten')

      })

      describe('CSP nonces in callback attributes', function() {

        beforeEach(function() {
          up.script.config.nonceableAttributes.push('callback')
        })

        it("rewrites nonceable callbacks to use the current page's nonce", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith({
            responseText: `
              <div class="target" callback="nonce-secret2 alert()">new text</div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'" }
          })

          await wait()

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
        })

        it("rewrites nonceable callbacks to use the current page's nonce with Content-Security-Policy-Report-Only response header", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith({
            responseText: `
              <div class="target" callback="nonce-secret2 alert()">new text</div>
            `,
            responseHeaders: { 'Content-Security-Policy-Report-Only': "script-src: 'nonce-secret2'" }
          })

          await wait()

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
        })

        it("rewrites nonceable callbacks to use the current page's nonce when opening a new overlay (bugfix)", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          up.render('.target', { url: '/path', layer: 'new' })

          await wait()

          jasmine.respondWith({
            responseText: `
              <div class="target" callback="nonce-secret2 alert()">new text</div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'" }
          })

          await wait()

          expect(up.layer.isOverlay()).toBe(true)

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
        })

        it("ensures nonced callbacks still match the current page's nonce after a render pass that updates history (meta tags are part of history state) (bugfix)", async function() {
          let suiteMeta = document.querySelector('meta[name="csp-nonce"]')
          suiteMeta.remove()

          up.element.affix(document.head, 'meta#test-nonce[name="csp-nonce"][content="nonce-secret1"]')
          expect(up.protocol.cspNonce()).toBe('nonce-secret1')

          const element = fixture('.element', { callback: 'nonce-secret1 alert()' })
          fixture('.target', { text: 'old text' })

          up.render('.target', { url: '/path', history: true })

          await wait()

          jasmine.respondWith({
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'" },
            responseText: `
              <html>
                <head>
                  <meta id="test-nonce" name="csp-nonce" content="nonce-secret2">
                </head>
                <body>
                  <div class="target">
                    new text
                  </div>
                </body>
              </html>
            `
          })

          await wait()

          const currentPageNonce = up.protocol.cspNonce()
          expect(element.getAttribute('callback')).toBe(`${currentPageNonce} alert()`)

          // clean up
          document.head.querySelector('meta#test-nonce').remove()
          document.head.append(suiteMeta)
        })

        it("rewrites a callback's nonce it the nonce matches one of multiple script-src nonces in its own response", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith({
            responseText: `
              <div class="target" callback="nonce-secret3 alert()">new text</div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2' 'self' 'nonce-secret3'" }
          })

          await wait()

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
        })

        it("does not rewrite a callback's nonce it the nonce does not match a script-src nonce in its own response", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith({
            responseText: `
              <div class="target" callback="nonce-wrong alert()">new text</div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'" }
          })

          await wait()

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('callback', "nonce-wrong alert()")
        })

        it("does not rewrite a callback's nonce it the nonce only matches a style-src nonce in its own response", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith({
            responseText: `
              <div class="target" callback="nonce-secret2 alert()">new text</div>
            `,
            responseHeaders: { 'Content-Security-Policy': "style-src: 'nonce-secret2'" }
          })

          await wait()

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('callback', "nonce-secret2 alert()")
        })

        it("does not rewrite a callback's nonce it the curent page's nonce is unknown", async function() {
          spyOn(up.protocol, 'cspNonce').and.returnValue(null)
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith({
            responseText: `
              <div class="target" callback="nonce-secret2 alert()">new text</div>
            `,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'" }
          })

          await wait()

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('callback', "nonce-secret2 alert()")
        })
      })

      describe('destruction of old element', function() {

        it('emits an up:fragment:destroyed event on the former parent element after the element has been removed from the DOM', async function() {
          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element.v1').text('v1')
          expect($element).toBeAttached()

          const spy = jasmine.createSpy('event listener')
          $parent[0].addEventListener('up:fragment:destroyed', (event) => spy(event.target, event.fragment, up.specUtil.isDetached($element)))

          await up.render('.element', { document: '<div class="element v2">v2</div>' })

          expect(spy).toHaveBeenCalledWith($parent[0], $element[0], true)
        })

        it('calls destructors on the old element', async function() {
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText))
          const $container = $fixture('.container').text('old text')
          up.hello($container)
          up.render('.container', { document: '<div class="container">new text</div>' })

          await wait()

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalledWith('old text')
        })

        it('calls destructors on the old element after a { transition }', function(done) {
          up.motion.config.enabled = true

          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText))
          const $container = $fixture('.container').text('old text')
          up.hello($container)

          up.render({ fragment: '<div class="container">new text</div>', transition: 'cross-fade', duration: 100 })

          u.timer(50, () => {
            expect(destructor).not.toHaveBeenCalled()
          })

          u.timer(220, () => {
            expect('.container').toHaveText('new text')
            expect(destructor).toHaveBeenCalledWith('old text')
            done()
          })
        })

        it('calls destructors when the replaced element is a singleton element like <body> (bugfix)', async function() {
          // shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
          up.element.isSingleton.mock().and.callFake((element) => element.matches('.container'))
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', () => destructor)
          const $container = $fixture('.container')
          up.hello($container)

          // Need to pass a { target } and not use { fragment }, since up.fragment.toTarget() ignores
          // classes and only returns the tag name for singleton elements.
          up.render('.container', { document: '<div class="container">new text</div>' })

          await wait()

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalled()
        })

        it('marks the old element as .up-destroying before destructors', function(done) {
          const testElementState = u.memoize(function(element) {
            expect(element).toHaveText('old text')
            expect(element).toMatchSelector('.up-destroying')
            done()
          })

          up.compiler('.container', (element) => () => testElementState(element))

          up.hello(fixture('.container', { text: 'old text' }))

          up.render({ fragment: '<div class="container">new text</div>' })

        })

        it('marks the old element as .up-destroying before destructors after a { transition }', async function() {
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText, element.matches('.up-destroying')))
          const $container = $fixture('.container').text('old text')
          up.hello($container)

          await up.render({
            fragment: '<div class="container">new text</div>',
            transition: 'cross-fade',
            duration: 100
          })

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalledWith('old text', true)
        })

        it('calls destructors while the element is still attached to the DOM, so destructors see ancestry and events bubble up', async function() {
          const spy = jasmine.createSpy('parent spy')
          up.compiler('.element', (element) => () => spy(element.innerText, element.parentElement))

          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element').text('old text')
          up.hello($element)

          up.render({ fragment: '<div class="element">new text</div>' })

          await wait()

          expect(spy).toHaveBeenCalledWith('old text', $parent.get(0))
        })

        it('calls destructors while the element is still attached to the DOM when also using a { transition }', async function() {
          const spy = jasmine.createSpy('parent spy')
          up.compiler('.element', (element) => () => // We must seek .parent in our ancestry, because our direct parent() is an .up-bounds container
          spy(element.innerText, element.closest('.parent')))

          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element').text('old text')
          up.hello($element)

          await up.render({
            fragment: '<div class="element">new text</div>',
            transition: 'cross-fade',
            duration: 30
          })

          expect(spy).toHaveBeenCalledWith('old text', $parent.get(0))
        })
      })

      describe('focus', function() {

        describe('with { focus: "autofocus" }', function() {
          it('focuses an [autofocus] element in the new fragment', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: 'autofocus',
              fragment: `
                <form class='foo-bar'>
                  <input class="autofocused-input" autofocus>
                </form>
              `
            })

            await wait()

            expect('.autofocused-input').toBeFocused()
          })
        })

        describe('with { focus: "target" }', function() {

          it('focuses the new fragment', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: 'target',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('focuses the fragment even if its element type is not focusable by default', async function() {
            fixture('.foo-bar')
            up.render({
              focus: 'target',
              fragment: `
                <span class='foo-bar'></span>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })
        })

        describe('with { focus: "main" }', function() {
          it('focuses the main element', async function() {
            const main = fixture('main')
            e.affix(main, 'form.foo-bar')
            up.render({
              focus: 'main',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('main').toBeFocused()
          })
        })

        describe('with { focus: "hash" }', function() {
          it('focuses the target of a URL #hash', async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', focus: 'hash' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <div id="hash"></div>
              </div>
            `)

            await wait()

            expect('#hash').toBeFocused()
          })
        })

        describe('with a CSS selector as { focus } option', function() {

          it('focuses a matching element within the new fragment', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: '.input',
              fragment: `
                <form class='foo-bar'>
                  <input class='input'>
                </form>
              `
            })

            await wait()

            expect('.input').toBeFocused()
          })

          it('focuses a matching element in the same layer', async function() {
            fixture('form.foo-bar')

            fixture('.element')

            up.render({
              focus: '.element',
              fragment: `
                <form class='foo-bar'>
                </form>
              `
            })

            await wait()

            expect('.element').toBeFocused()
          })

          it('does not focus a matching element in another layer', async function() {
            makeLayers([
              { target: '.root-element' },
              { target: '.overlay-element' }
            ])

            await wait()

            up.render('.overlay-element', { focus: '.root-element', content: 'new content' })

            await wait()

            expect('.root-element').not.toBeFocused()
          })
        })

        describe('with { focus: "keep" }', function() {

          it('preserves focus of an element within the changed fragment', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', {
              focus: 'keep',
              document: `
                <div class="container">
                  <div class="focused" tabindex="0">new focused</div>
                </div>
              `
            })
            await wait()

            expect('.focused').toHaveText('new focused')
            expect('.focused').toBeFocused()
          })

          it('preserves focus when morphing with a { transition }', async function() {
            up.motion.config.enabled = true

            const oldFocused = fixture('.focused[tabindex=0][data-version="old"]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.focused', {
              focus: 'keep',
              document: `
                <div class="focused" data-version="new" tabindex="0">new focused</div>
              `,
              transition: 'cross-fade',
              duration: 1200,
            })

            await wait(600)

            const newFocused = document.querySelector('.focused[data-version="new"]')

            expect(oldFocused).toBeAttached()
            expect(oldFocused).toHaveOpacity(0.5, 0.4)
            expect(newFocused).toBeAttached()
            expect(newFocused).toHaveOpacity(0.5, 0.4)
            expect(newFocused).toBeFocused()

            await wait(800)

            expect(oldFocused).toBeDetached()
            expect(newFocused).toBeAttached()
            expect(newFocused).toHaveOpacity(1.0, 0.2)
            expect(newFocused).toBeFocused()
          })

          it('does not re-focus an unrelated element that never lost focus during the render pass', async function() {
            fixture('.target', { text: 'old target' })
            const outside = fixture('.focused[tabindex=0]', { text: 'old focused' })
            outside.focus()
            expect(outside).toBeFocused()

            const focusSpy = spyOn(up, 'focus').and.callThrough()

            up.render({
              focus: 'keep',
              fragment: `
                <div class="target">
                  new target
                </div>
              `
            })
            await wait()

            expect('.target').toHaveText('new target')
            expect(focusSpy).not.toHaveBeenCalled()
            expect('.focused').toBeFocused()
          })

          it('does not crash if the focused element is not targetable (bugfix)', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, 'div[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', {
              focus: 'keep',
              document: `
                <div class="container">
                  <div tabindex="0">new focused</div>
                </div>
              `
            })

            await wait()

            expect('div[tabindex]').toHaveText('new focused')
            expect('div[tabindex]').not.toBeFocused()
          })

          it('preserves focus of an element within the changed fragment when updating inner HTML with { content } (bugfix)', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', { focus: 'keep', content: '<div class="focused" tabindex="0">new focused</div>' })

            await wait()

            expect('.focused').toBeFocused()
          })

          it('preserves scroll position and selection range of an element within the changed fragment', async function() {
            const container = fixture('.container')
            const longText = `
              foooooooooooo
              baaaaaaaaaaar
              baaaaaaaaaaaz
              baaaaaaaaaaam
              quuuuuuuuuuux
              foooooooooooo
              baaaaaaaaaaar
              baaaaaaaaaaaz
              baaaaaaaaaaam
              quuuuuuuuuuux
            `
            const oldFocused = e.affix(container, 'textarea[name=prose][wrap=off][rows=3][cols=6]', { text: longText })

            oldFocused.selectionStart = 10
            oldFocused.selectionEnd = 11
            oldFocused.scrollTop = 12
            oldFocused.scrollLeft = 13
            oldFocused.focus()

            expect(oldFocused).toBeFocused()
            expect(oldFocused.selectionStart).toBeAround(10, 2)
            expect(oldFocused.selectionEnd).toBeAround(11, 2)
            expect(oldFocused.scrollTop).toBeAround(12, 2)
            expect(oldFocused.scrollLeft).toBeAround(13, 2)

            up.render('.container', { focus: 'keep', content: `<textarea name='prose' wrap='off' rows='3' cols='6'>${longText}</textarea>` })

            await wait()

            const textarea = document.querySelector('.container textarea')
            expect(textarea.selectionStart).toBeAround(10, 2)
            expect(textarea.selectionEnd).toBeAround(11, 2)
            expect(textarea.scrollTop).toBeAround(12, 2)
            expect(textarea.scrollLeft).toBeAround(13, 2)
            expect(textarea).toBeFocused()
          })

          it('does not lose focus of an element outside the changed fragment', async function() {
            const oldFocused = fixture('textarea')
            oldFocused.focus()

            const container = fixture('.container')
            e.affix(container, 'textarea')

            up.render('.container', { focus: 'keep', content: "<textarea></textarea>" })

            await wait()

            expect(oldFocused).toBeFocused()
          })

          it('does not override a focus change made after the request was sent', async function() {
            let outsideTextField = fixture('input[type="text"][name="foo"]')
            let target = fixture('form#target')
            let insideTextField = e.affix(target, 'input[type="text"][name="bar"]')
            insideTextField.focus()
            expect(insideTextField).toBeFocused()

            up.render({ target: '#target', focus: 'keep', url: '/path' })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(insideTextField).toBeFocused()

            outsideTextField.focus()
            await wait()

            expect(outsideTextField).toBeFocused()

            jasmine.respondWithSelector('#target', { text: 'New target' })
            await wait()

            expect('#target').toHaveText('New target')
            expect(outsideTextField).toBeFocused()
          })

          it('does not override selection changes made after the request was sent', async function() {
            let outsideTextField = fixture('input[type="text"][name="foo"]')
            let target = fixture('form#target')
            let insideTextField = e.affix(target, 'input[type="text"][name="bar"]')

            outsideTextField.focus()
            outsideTextField.value = 'abcdefghijklmnopqurstuvwxyz'
            outsideTextField.selectionStart = 3
            outsideTextField.selectionEnd = 5

            up.render({ target: '#target', focus: 'keep', url: '/path' })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(3)
            expect(outsideTextField.selectionEnd).toBe(5)

            outsideTextField.selectionStart = 8
            outsideTextField.selectionEnd = 10
            await wait()

            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(8)
            expect(outsideTextField.selectionEnd).toBe(10)

            jasmine.respondWithSelector('#target', { text: 'New target' })
            await wait()

            expect('#target').toHaveText('New target')
            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(8)
            expect(outsideTextField.selectionEnd).toBe(10)
          })

          it('does not rediscover an element with the same selector outside the changed fragment (bugfix)', async function() {
            const outside = fixture('textarea')

            const container = fixture('.container')
            e.affix(container, 'textarea')

            up.render('.container', { focus: 'keep', content: "<textarea></textarea>" })

            await wait()

            expect(outside).not.toBeFocused()
          })
        })

        describe('with { focus: "layer" }', function() {
          it("focuses the fragment's layer", async function() {
            // Focus another element since the front layer will automatically
            // get focus after opening.
            const textarea = fixture('textarea')
            textarea.focus()

            makeLayers([
              { target: '.root' },
              { target: '.overlay' }
            ])

            await wait()

            up.render('.overlay', { focus: 'layer', content: 'new overlay text' })

            await wait()

            expect(up.layer.front).toBeFocused()
          })
        })

        describe('with { focus: "target-if-main" }', function() {

          it('focuses a main target', async function() {
            fixture('form.foo-bar')

            up.fragment.config.mainTargets.push('.foo-bar')

            up.render({
              focus: 'target-if-main',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('does not focus a non-main target', async function() {
            fixture('form.foo-bar')

            up.render({
              focus: 'target-if-main',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').not.toBeFocused()
          })
        })

        describe('with { focus: "target-if-lost" }', function() {

          it('focuses the target if the focus was lost with the old fragment', async function() {
            const container = fixture('.container')
            const child = e.affix(container, '.child[tabindex=0]')
            child.focus()

            expect(child).toBeFocused()

            up.render({
              focus: 'target-if-lost',
              fragment: `
                <div class='container'>
                  <div class='child' tabindex='0'></div>
                </div>
              `
            })

            await wait()

            expect('.container').toBeFocused()
          })

          it('focuses the target if the focus was lost within a secondary fragment in a multi-fragment update', async function() {
            const element1 = fixture('#element1[tabindex=0]')
            const element2 = fixture('#element2[tabindex=0]')
            element2.focus()

            expect(element2).toBeFocused()

            up.render('#element1, #element2', {
              focus: 'target-if-lost',
              document: `
                <div>
                  <div id="element1" tabindex='0'>new element1</div>
                  <div id="element2" tabindex='0'>new element2</div>
                </div>
              `
            })

            await wait()

            expect('#element1').toBeFocused()
          })

          it('does not focus the target if an element outside the updating fragment was focused', async function() {
            const container = fixture('.container')
            const child = e.affix(container, '.child')

            const outside = fixture('.outside[tabindex=0]')
            outside.focus()

            up.render({
              focus: 'target-if-lost',
              fragment: `
                <div class='container'>
                  <div class='child' tabindex='0'></div>
                </div>
              `
            })

            await wait()

            expect('.outside').toBeFocused()
          })
        })

        describe('with an array of { focus } options', function() {
          it('tries each option until one succeeds', async function() {
            fixture('.container')
            up.render('.container', { focus: ['autofocus', '.element', '.container'], content: "<div class='element'>element</div>" })

            await wait()

            expect('.container .element').toBeFocused()
          })
        })

        describe('with a string with comma-separated { focus } options', function() {
          it('tries each option until one succeeds', async function() {
            fixture('.container')
            up.render('.container', { focus: 'autofocus, .element, .container', content: "<div class='element'>element</div>" })
            await wait()

            expect('.container .element').toBeFocused()
          })
        })

        if (up.migrate.loaded) {
          describe('with a string with "or"-separated { focus } options', function() {
            it('tries each option until one succeeds', async function() {
              fixture('.container')
              up.render('.container', { focus: 'autofocus or .element or .container', content: "<div class='element'>element</div>" })
              await wait()

              expect('.container .element').toBeFocused()
            })
          })
        }

        describe('with { focus: "restore" }', function() {
          it('restores earlier focus-related state at this location')
        })

        describe('with { focus: "auto" }', function() {

          it('focuses a main target', async function() {
            fixture('form.foo-bar')

            up.fragment.config.mainTargets.unshift('.foo-bar')

            up.render({
              focus: 'auto',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('focuses a main target within the updated container', async function() {
            const container = fixture('.container')
            e.affix(container, 'form.foo-bar')

            up.fragment.config.mainTargets.push('.foo-bar')

            up.render({
              focus: 'auto',
              fragment: `
                <div class='container'>
                  <form class='foo-bar'>
                    <input>
                  </form>
                </div>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('does not focus a non-main target', async function() {
            fixture('.foo-bar')

            up.render({
              focus: 'auto',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').not.toBeFocused()
          })

          it('focuses an child element with [autofocus] attribute (even when not replacing a main target)', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: 'auto',
              fragment: `
                <form class='foo-bar'>
                  <input class="autofocused-input" autofocus>
                </form>
              `
            })

            await wait()

            expect('.autofocused-input').toBeFocused()
          })

          it('focuses the target of a URL #hash', async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', focus: 'auto' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <div id="hash"></div>
              </div>
            `)

            await wait()

            expect('#hash').toBeFocused()
          })

          it('preserves focus within a non-main fragment', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', {
              focus: 'auto',
              document: `
                <div class="container">
                  <div class="focused" tabindex="0">new focused</div>
                </div>
              `
            })

            await wait()

            expect('.focused').toHaveText('new focused')
            expect('.focused').toBeFocused()
          })
        })

        describe('without a { focus } option', function() {
          it('preserves focus of an element within the changed fragment', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', {
              document: `
                <div class="container">
                  <div class="focused" tabindex="0">new focused</div>
                </div>
              `
            })

            await wait()

            expect('.focused').toHaveText('new focused')
            expect('.focused').toBeFocused()
          })
        })

        describe('with a function passed as { focus } option', function() {

          it('calls the function', async function() {
            const focusHandler = jasmine.createSpy('focus handler')
            fixture('.element', { content: 'old text' })

            await up.render('.element', { content: 'new text', focus: focusHandler })

            expect('.element').toHaveText('new text')
            expect(focusHandler).toHaveBeenCalled()
          })

          it('does not crash the render pass and emits an error event if the function throws', async function() {
            const focusError = new Error('error in focus handler')
            const focusHandler = jasmine.createSpy('focus handler').and.throwError(focusError)
            fixture('.element', { content: 'old text' })

            await jasmine.expectGlobalError(focusError, async function() {
              const job = up.render('.element', { content: 'new text', focus: focusHandler })

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              expect('.element').toHaveText('new text')
              expect(focusHandler).toHaveBeenCalled()
            })
          })
        })

        describe('when rendering nothing', function() {

          it('still processes a { focus } option', function() {
            fixture('main')
            expect('main').not.toBeFocused()

            up.render(':none', { focus: 'main', document: '<div></div>' })

            expect('main').toBeFocused()
          })

          it('does not crash with { focus: "target" }', function(done) {
            const promise = up.render(':none', { focus: 'target', document: '<div></div>' })

            u.task(() => promiseState(promise).then(function(result) {
              expect(result.state).toBe('fulfilled')
              done()
            }))
          })
        })
      })

      describe('with { guardEvent } option', function() {

        it('emits the given event before rendering', async function() {
          fixture('.target', { text: 'old content' })
          const guardEvent = up.event.build('my:guard')
          const listener = jasmine.createSpy('listener').and.callFake((event) => expect('.target').toHaveText('old content'))
          up.on('my:guard', listener)

          up.render({ target: '.target', content: 'new content', guardEvent })

          await wait()

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect('.target').toHaveText('new content')
        })

        it('prefers to emit the given event on the given { origin } instead of the document', async function() {
          fixture('.target', { text: 'old content' })
          const origin = fixture('.origin')
          const guardEvent = up.event.build('my:guard')
          const listener = jasmine.createSpy('listener')
          origin.addEventListener('my:guard', listener)

          up.render({ target: '.target', content: 'new content', guardEvent, origin })

          await wait()

          expect(listener).toHaveBeenCalledWith(guardEvent)
        })

        it('lets listeners prevent the event, aborting the fragment update', async function() {
          fixture('.target', { text: 'old content' })
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', (event) => event.preventDefault())

          const promise = up.render({ target: '.target', content: 'new content', guardEvent })
          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/(Aborted|Prevented)/i))
        })

        it('sets { renderOptions } on the emitted event', async function() {
          fixture('.target', { text: 'old content' })
          const listener = jasmine.createSpy('listener').and.callFake((event) => event.preventDefault())
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          const renderJob = up.render({ target: '.target', content: 'new content', guardEvent })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')
        })

        it('omits the { guardEvent } key from the { renderOptions }, so event handlers can pass this to render() without causing an infinite loop', async function() {
          fixture('.target', { text: 'old content' })
          const listener = jasmine.createSpy('listener').and.callFake((event) => event.preventDefault())
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          const renderJob = up.render({ target: '.target', content: 'new content', guardEvent })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')
          expect(listener.calls.argsFor(0)[0].renderOptions.guardEvent).toBeMissing()
        })
      })

      describe('with { abort } option', function() {

        describe('with { abort: true }', function() {

          it('aborts the request of an existing change', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('does not abort an earlier request that was made with { abortable: false }', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abortable: false })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('aborts the request of an existing change if the new change is made from local content', async function() {
            fixture('.element1')
            fixture('.element2')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element2', { content: 'local content', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(0)
          })

          it('aborts an existing request when a preload request gets promoted to the foreground', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            const change2Link = fixture('a[href="/path2"][up-target=".element"][up-abort="true"]')

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.link.preload(change2Link)
            await wait()
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)

            up.link.follow(change2Link)
            await wait()
            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('does not cancel its own pending preload request (bugfix)', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change2Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            const changeLink = fixture('a[href="/path"][up-target=".element"]')

            change1Promise = up.link.preload(changeLink)
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.follow(changeLink)
            change2Promise.catch((e) => change2Error = e)
            await wait()

            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("aborts an existing change's request that was queued with { abort: false }", async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: false })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })
        })

        describe('with { abort: "all" }', function() {
          it('is an alias for { abort: true }', async function() {
            fixture('.element')
            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: 'all' })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining({ layer: 'any' }))
          })
        })

        describe('with { abort: "layer" }', function() {
          it("aborts all requests on the targeted fragment's layer", async function() {
            const layers = makeLayers(3)

            layers[1].affix('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: 'layer', layer: 1 })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining({ layer: up.layer.get(1) }))
          })
        })

        describe('with { abort } option set to a CSS selector', function() {
          it("aborts all requests in the subtree of a matching element in the targeted layer", async function() {
            const layers = makeLayers(3)

            layers[1].affix('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: '.element', layer: 1 })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith('.element', jasmine.objectContaining({ layer: up.layer.get(1) }))
          })
        })

        describe('with { abort } option set to an Element', function() {
          it("aborts all requests in the subtree of that Element", async function() {
            const element = fixture('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: element })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(element, jasmine.anything())
          })
        })

        describe('with { abort: "target" }', function() {

          it('aborts existing requests targeting the same element', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', { url: '/path2', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('aborts an existing requests targeting the same URL and element IFF not caching (bugfix)', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', { url: '/path1', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('aborts existing requests targeting the same element when updating from local content', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            fixture('.sibling')
            const change2Promise = up.render('.sibling', { url: '/path2' })

            expect(up.network.queue.allRequests.length).toBe(2)

            up.render('.element', { content: 'new content', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(change2Promise).toBePending()
            expect('.element').toHaveText('new content')
          })

          it('aborts existing requests targeting a descendant of the targeted element', async function() {
            fixture('.parent .child')
            const change1Promise = up.render('.child', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.parent', { url: '/path2', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('does not abort existing requests targeting an ascendant of the targeted element', async function() {
            fixture('.parent .child')
            const parentChangePromise = up.render('.parent', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.child', { url: '/path2', abort: 'target' })

            await expectAsync(parentChangePromise).toBePending()
          })

          it('does not abort its own preloading request', async function() {
            fixture('.element')
            const link = fixture('a[href="/path"][up-target=".element"]')

            const preloadPromise = up.link.preload(link)
            await wait()

            expect(up.network.queue.allRequests.length).toBe(1)

            const followPromise = up.link.follow(link)
            await wait()

            await expectAsync(preloadPromise).toBePending()
            await expectAsync(followPromise).toBePending()
            expect(up.network.queue.allRequests.length).toBe(1)
          })
        })

        describe('with { abort: false }', function() {

          it("does not abort an existing change's request", async function() {
            fixture('.element')

            let change1Error = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1' })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: false })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('does not abort requests targeting the same subtree once our response is received and swapped in', async function() {
            fixture('.element', { text: 'old text' })

            const change1Promise = up.render('.element', { url: '/path1', abort: false })
            let change1Error = undefined
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)

            up.render('.element', { url: '/path2', abort: false })

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()

            jasmine.respondWithSelector('.element', { text: 'text from /path2' })

            await wait()

            expect('.element').toHaveText('text from /path2')
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })
        })
      })

      if (up.migrate.loaded) {
        describe('with { solo } option', function() {

          it('aborts the request of an existing change', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: true }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('aborts the request of an existing change if the new change is made from local content', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: true }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { content: 'local content', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(0)
          })

          it('does not cancel its own pending preload request (bugfix)', async function() {
            fixture('.element')
            const changeLink = fixture('a[href="/path"][up-target=".element"]')

            let change1Error  = undefined
            let change2Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.link.preload(changeLink)
            change1Promise.catch((e) => change1Error = e)
            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.follow(changeLink, { solo: true })
            change2Promise.catch((e) => change2Error = e)
            await wait()

            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("aborts an existing change's request that was queued with { solo: false }", async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: false }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("does not abort an existing change's request when called with { solo: false }", async function() {
            fixture('.element')

            let change1Error = undefined
            let change1Promise = undefined

            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1' }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: false })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('may be passed as a function that decides which existing requests are aborted', async function() {
            fixture('.element1')
            fixture('.element2')
            fixture('.element3')

            let change1Promise = undefined
            let change1Error = undefined

            let change2Promise = undefined
            let change2Error = undefined

            let change3Promise = undefined
            let change3Error = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: false }).catch((e) => change1Error = e)
            change2Promise = up.render('.element2', { url: '/path2', abort: false }).catch((e) => change2Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            const soloFn = (request) => u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element3', { url: '/path3', solo: soloFn }).catch((e) => change3Error = e)

            await wait()

            expect(change1Error).toBeAbortError()
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('may be passed as a function that decides which existing requests are aborted when updating from local content', async function() {
            fixture('.element1')
            fixture('.element2')
            fixture('.element3')

            let change1Promise = undefined
            let change1Error = undefined

            let change2Promise = undefined
            let change2Error = undefined

            let change3Promise = undefined
            let change3Error = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: false }).catch((e) => change1Error = e)
            change2Promise = up.render('.element2', { url: '/path2', abort: false }).catch((e) => change2Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            const soloFn = (request) => u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element3', { content: 'new content', solo: soloFn }).catch((e) => change3Error = e)

            await wait()

            expect(change1Error).toBeAbortError()
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

            expect(up.network.queue.allRequests.length).toEqual(1)
          })
        })
      }


      describe('with { cache } option', function() {

        it('reuses a cached request with { cache: true }', async function() {
          fixture('.element')

          up.render('.element', { url: '/path', cache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).toBeCached()

          up.render('.element', { url: '/path', cache: true, abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
        })

        it('reuses a cached request when rendering the same location, but with a #hash', async function() {
          fixture('.element')

          up.render('.element', { url: '/path', cache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).toBeCached()

          up.render('.element', { url: '/path#other', cache: true, abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
        })

        it('does not reuse a cached request with { cache: false }', async function() {
          fixture('.element')

          up.render('.element', { url: '/path', cache: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).not.toBeCached()

          up.render('.element', { url: '/path', cache: false, abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('does not reuse a cached request when no { cache } option is given', async function() {
          fixture('.element')

          up.render('.element', { url: '/path' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).not.toBeCached()

          up.render('.element', { url: '/path', abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        describe('cache revalidation with { revalidate }', function() {

          beforeEach(async function() {
            fixture('.target', { text: 'initial text' })
            up.request('/cached-path', { cache: true })

            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'cached text',
              responseHeaders: {
                'Etag': 'W/"0123456789"',
                'Last-Modified': 'Wed, 21 Oct 2015 18:14:00 GMT'
              }
            })

            await wait()

            expect({ url: '/cached-path' }).toBeCached()
            expect('.target').toHaveText('initial text')
          })

          it('reloads a fragment that was rendered from an expired cached response', async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('reloads expired content that was rendered into a new overlay', async function() {
            up.render('.target', { layer: 'new', url: '/cached-path', cache: true, revalidate: true })

            await wait()

            expect(up.layer.current).toBeOverlay()
            expect('up-modal .target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect(up.layer.current).toBeOverlay()
            expect('up-modal .target').toHaveText('verified text')
          })

          it('reloads multiple targets', async function() {
            fixture('#foo', { text: 'initial foo' })
            fixture('#bar', { text: 'initial bar' })

            up.request('/multi-cached-path', { cache: true })

            await wait()

            jasmine.respondWith(`
              <div id="foo">cached foo</div>
              <div id="bar">cached bar</div>
            `)

            await wait()

            expect({ url: '/multi-cached-path' }).toBeCached()

            up.render('#foo, #bar', { url: '/multi-cached-path', cache: true, revalidate: true })

            await wait()

            expect('#foo').toHaveText('cached foo')
            expect('#bar').toHaveText('cached bar')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#foo, #bar')

            jasmine.respondWith(`
              <div id="foo">verified foo</div>
              <div id="bar">verified bar</div>
            `)

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('#foo').toHaveText('verified foo')
            expect('#bar').toHaveText('verified bar')
          })

          it('reloads multiple targets when an { origin } is given (bugfix)', async function() {
            fixture('#foo', { text: 'initial foo' })
            fixture('#bar', { text: 'initial bar' })
            const origin = fixture('#origin', { text: 'origin' })

            up.request('/multi-cached-path', { cache: true })

            await wait()

            jasmine.respondWith(`
              <div id="foo">cached foo</div>
              <div id="bar">cached bar</div>
            `)

            await wait()

            expect({ url: '/multi-cached-path' }).toBeCached()

            up.render('#foo, #bar', { url: '/multi-cached-path', cache: true, revalidate: true, origin }).finished

            await wait()

            expect('#foo').toHaveText('cached foo')
            expect('#bar').toHaveText('cached bar')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#foo, #bar')

            jasmine.respondWith(`
              <div id="foo">verified foo</div>
              <div id="bar">verified bar</div>
            `)

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('#foo').toHaveText('verified foo')
            expect('#bar').toHaveText('verified bar')
          })

          it('reloads hungry targets that piggy-backed on the initial request when an { origin } is given (bugfix)', async function() {
            fixture('#foo', { text: 'initial foo' })
            fixture('#bar[up-hungry]', { text: 'initial bar' })
            const origin = fixture('#origin', { text: 'origin' })

            up.request('/multi-cached-path', { cache: true })

            await wait()

            jasmine.respondWith(`
              <div id="foo">cached foo</div>
              <div id="bar">cached bar</div>
            `)

            await wait()

            expect({ url: '/multi-cached-path' }).toBeCached()

            up.render('#foo', { url: '/multi-cached-path', cache: true, revalidate: true, origin })

            await wait()

            expect('#foo').toHaveText('cached foo')
            expect('#bar').toHaveText('cached bar')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#foo, #bar')

            jasmine.respondWith(`
              <div id="foo">verified foo</div>
              <div id="bar">verified bar</div>
            `)

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('#foo').toHaveText('verified foo')
            expect('#bar').toHaveText('verified bar')
          })

          it('does not verify a fragment rendered from a recent cached response with { revalidate: "auto" }', async function() {
            up.fragment.config.autoRevalidate = (response) => response.age >= (10 * 1000)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: 'auto' })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(false)
          })

          it("does not verify a fragment that wasn't rendered from a cached response", async function() {
            up.render('.target', { url: '/uncached-path', cache: true, revalidate: true })
            await wait()

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'server text' })
          })

          it('does not verify a fragment when prepending content with :before', async function() {
            up.render('.target:before', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText("cached textinitial text")
            expect(up.network.isBusy()).toBe(false)
          })

          it('does not verify a fragment when appending content with :after', async function() {
            up.render('.target:after', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText("initial textcached text")
            expect(up.network.isBusy()).toBe(false)
          })

          it('does not render a second time if the revalidation response is a 304 Not Modified', async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWith({ status: 304 })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('cached text')
          })

          it('does not render a second time if the revalidation response has the same text as the expired response', async function() {
            const insertedSpy = jasmine.createSpy('up:fragment:inserted listener')
            up.on('up:fragment:inserted', insertedSpy)
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect(insertedSpy.calls.count()).toBe(1)
            const target = document.querySelector('.target')
            expect(target).toHaveText('cached text')
            target.innerText = 'text changed on client'

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'cached text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect(insertedSpy.calls.count()).toBe(1)
            expect('.target').toHaveText('text changed on client')
          })

          it('allows to define which responses to verify in up.fragment.config.autoRevalidate')

          it('revalidates after the initial round of render callbacks', async function() {
            fixture('#target', { text: 'initial text' })
            await jasmine.populateCache('/foo', '<div id="target">expired text</div>')
            up.cache.expire()

            const sequence = []
            const renderedCallback = () => sequence.push('renderedCallback')

            const renderedPromise = () => sequence.push('renderedPromise')

            const revalidateOption = function() {
              sequence.push('revalidateOption')
              return true
            }

            up.on('up:request:load', () => sequence.push('requestLoad'))

            up.on('up:request:loaded', () => sequence.push('requestLoaded'))

            expect('#target').toHaveText('initial text')
            expect(sequence).toEqual([])

            const job = up.render({ target: '#target', url: '/foo', onRendered: renderedCallback, cache: true, revalidate: revalidateOption })
            job.then(renderedPromise)
            await wait()

            expect('#target').toHaveText('expired text')
            expect(sequence).toEqual(['renderedCallback', 'renderedPromise', 'revalidateOption', 'requestLoad'])

            jasmine.respondWithSelector('#target', { text: 'revalidated text' })
            await wait()

            expect('#target').toHaveText('revalidated text')
            expect(sequence).toEqual(['renderedCallback', 'renderedPromise', 'revalidateOption', 'requestLoad', 'requestLoaded', 'renderedCallback'])
          })

          it('does not use options like { confirm } or { feedback } when verifying', async function() {
            const confirmSpy = spyOn(window, 'confirm').and.returnValue(true)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, confirm: true, feedback: true })
            expect(confirmSpy.calls.count()).toBe(1)
            await wait()

            expect('.target').toHaveText('cached text')
            expect('.target').not.toHaveClass('up-loading')
            expect(up.network.isBusy()).toBe(true)
            expect(confirmSpy.calls.count()).toBe(1)
          })

          it("delays revalidation until the original transition completed, so an element isn't changed in-flight", async function() {
            up.motion.config.enabled = true
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, transition: 'cross-fade', easing: 'linear', duration: 200 })
            await wait()

            expect('.target').toHaveText('cached text')
            expect('.target:not(.up-destroying)').toHaveOpacity(0, 0.15)
            expect(up.network.isBusy()).toBe(false)

            await wait(300)

            expect('.target:not(.up-destroying)').toHaveOpacity(1)
            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect('.target').toHaveText('verified text')
          })

          it('delays up.render().finished promise until the fragment was verified', async function() {
            const finishedCallback = jasmine.createSpy('finished callback')

            const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            job.finished.then(finishedCallback)
            await wait()

            expect('.target').toHaveText('cached text')
            expect(finishedCallback).not.toHaveBeenCalled()

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
            expect(finishedCallback).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          })

          it('delays an { onFinished } callback until the fragment was verified', async function() {
            const finishedCallback = jasmine.createSpy('finished callback')

            const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onFinished: finishedCallback })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(finishedCallback).not.toHaveBeenCalled()

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
            expect(finishedCallback).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          })

          it('runs the { onRendered } a second time for the second render pass', async function() {
            const onRendered = jasmine.createSpy('onRendered callback')

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onRendered })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(onRendered.calls.count()).toBe(1)

            expect(up.network.isBusy()).toBe(true)
            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(onRendered.calls.count()).toBe(2)
            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('does not re-emit a { guardEvent } for the second render pass', async function() {
            const guardEventListener = jasmine.createSpy('guard event listener')
            const guardEvent = up.event.build('my:guard')
            up.on('my:guard', guardEventListener)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, guardEvent })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(guardEventListener.calls.count()).toBe(1)

            expect(up.network.isBusy()).toBe(true)
            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect('.target').toHaveText('verified text')
            expect(guardEventListener.calls.count()).toBe(1)
          })

          it("preserves user's changes in scroll position between the first and second render pass", async function() {
            fixtureStyle(`
              .target { height: 50000px; background-color: red }
            `)

            up.viewport.root.scrollTop = 0

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(true)

            up.viewport.root.scrollTop = 500

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect('.target').toHaveText('verified text')
            expect(up.viewport.root.scrollTop).toBe(500)
          })

          it("preserves user's changes in focus between the first and second render pass", async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(true)

            const input = e.affix(document.querySelector('.target'), 'input[name=foo]')
            input.focus()

            jasmine.respondWithSelector('.target input[name=foo]')
            await wait()

            expect('input[name=foo]').toBeFocused()
          })

          it('revalidates a fallback target', async function() {
            up.fragment.config.mainTargets = ['.target']
            up.render({ url: '/cached-path', cache: true, revalidate: true, fallback: true })
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('updates the original { failTarget } if the revalidation response has an error code', async function() {
            fixture('.fail-target', { text: 'old failure text' })

            up.render({ target: '.target', failTarget: '.fail-target', url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.fail-target', { text: 'new failure text', status: 500 })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('cached text')
            expect('.fail-target').toHaveText('new failure text')
          })

          it('revalidates when a link in an overlay is loading cached content into a parent layer (bugfix)', async function() {
            expect('.target').toHaveText('initial text')

            up.layer.open({ content: `
              <a href="/cached-path" up-target=".target" up-layer="root" up-revalidate="true" id="overlay-link">label</a>
            ` })
            await wait()

            const overlayLink = document.querySelector('#overlay-link')
            Trigger.clickSequence(overlayLink)
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('reloads the correct path when when rendering a relative URL, and does not use its own location as a new base', async function() {
            up.history.config.enabled = true

            await jasmine.populateCache({ url: '/sub1/sub2/index.html' }, { status: 200, responseText: '<div class="target">cached text</div>' })
            up.cache.expire()

            up.history.replace('/sub1/')

            up.render('.target', { url: 'sub2/index.html', cache: true, revalidate: true, history: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.history.location).toMatchURL('/sub1/sub2/index.html')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')
            expect(jasmine.lastRequest().url).toMatchURL('/sub1/sub2/index.html')
            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
            expect(jasmine.lastRequest().url).toMatchURL('/sub1/sub2/index.html')
            expect(up.history.location).toMatchURL('/sub1/sub2/index.html')
          })

          it('calls compilers with a third argument containing a { revalidating } property', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            expect(compiler.calls.count()).toBe(1)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(compiler.calls.count()).toBe(2)

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'validated content' })
            await wait()

            expect('.target').toHaveText('validated content')
            expect(compiler.calls.count()).toBe(3)
            expect(compiler.calls.mostRecent().args).toEqual([
              jasmine.any(Element),
              jasmine.any(Object),
              jasmine.objectContaining({
                revalidating: true
              })
            ])
          })

          it('resends ETag and Last-Modified since headers from the cached response', async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')
            expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toBe('W/"0123456789"')
            expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toBe('Wed, 21 Oct 2015 18:14:00 GMT')

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          describe('if revalidation responded with 304 Not Modified', function() {

            it('does not call { onRendered } a second time', async function() {
              const onRendered = jasmine.createSpy('onRendered handler')
              up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onRendered })
              await wait()

              expect(onRendered.calls.count()).toBe(1)
              expect('.target').toHaveText('cached text')

              expect(up.network.isBusy()).toBe(true)
              jasmine.respondWith({ status: 304 })
              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect(onRendered.calls.count()).toBe(1)
              expect('.target').toHaveText('cached text')
            })

            it('fulfills up.render().finished promise with the up.RenderResult from the first render pass')

            it('calls { onFinished } with the cached up.RenderResult from the first render pass', async function() {
              const onFinished = jasmine.createSpy('onFinished handler')
              const onRendered = jasmine.createSpy('onRendered handler')
              const renderOptions = { url: '/cached-path', cache: true, revalidate: true }
              up.render('.target', { ...renderOptions, onRendered, onFinished })
              await wait()

              expect('.target').toHaveText('cached text')
              expect(onRendered).toHaveBeenCalled()

              const renderedResult = onRendered.calls.argsFor(0)[0]
              expect(renderedResult).toEqual(jasmine.any(up.RenderResult))
              expect(renderedResult.ok).toBe(true)
              expect(renderedResult.none).toBe(false)
              expect(renderedResult.fragment).toMatchSelector('.target')
              expect(renderedResult.renderOptions).toEqual(jasmine.objectContaining(renderOptions))


              expect(up.network.isBusy()).toBe(true)
              jasmine.respondWith({ status: 304 })
              await wait()

              expect('.target').toHaveText('cached text')
              expect(onFinished).toHaveBeenCalled()

              const finishedResult = onFinished.calls.argsFor(0)[0]
              expect(finishedResult).toEqual(jasmine.any(up.RenderResult))
              // expect(finishedResult.ok).toBe(true)
              expect(finishedResult.none).toBe(false)
              expect(finishedResult.fragment).toMatchSelector('.target')
              expect(finishedResult.renderOptions).toEqual(jasmine.objectContaining(renderOptions))
            })

            it('keeps the older cache entry that did have content', async function() {
              const job1 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job1

              expect('.target').toHaveText('cached text')

              await expectAsync(job1).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job1.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWith({ status: 304 })

              await expectAsync(job1.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              // Simulate navigating to another page
              up.render('.target', { content: 'other text' })
              expect('.target').toHaveText('other text')

              // Re-render the cached content that we could not revalidate earlier.
              const job2 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job2

              // See that we kept the last known response in the cache.
              expect('.target').toHaveText('cached text')

              // We now have a second revalidation request.
              await expectAsync(job2.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWith({ status: 304 })

              await expectAsync(job1.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')
            })
          })

          describe('if revalidation failed due to a network error', function() {

            it('rejects up.render().finished promise', async function() {
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job

              expect('.target').toHaveText('cached text')

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')
            })

            it('rejects up.render().finished promise if there also is an { onFinished } callback (bugfix)', async function() {
              const onFinished = jasmine.createSpy('onFinished callback')
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onFinished })

              await job

              expect('.target').toHaveText('cached text')

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              expect(onFinished).not.toHaveBeenCalled()
            })

            it('logs to the error console and there also is an { onFinished } callback (bugfix)', async function() {
              const onFinished = jasmine.createSpy('onFinished callback')
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onFinished })
              const logErrorSpy = spyOn(up, 'puts').and.callThrough()

              await job

              expect('.target').toHaveText('cached text')

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              expect(logErrorSpy.calls.mostRecent().args[1]).toMatch(/Cannot load request/i)
            })

            // Cannot get this spec to work in both Chrome and Safari. See comment in up.RenderJob.
            xit('reports an unhandled rejection if no catch() handler is attached to the up.render().finished promise', async function() {
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job

              expect('.target').toHaveText('cached text')

              await wait()

              // Still revalidating
              expect(up.network.isBusy()).toBe(true)

              await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {

                jasmine.lastRequest().responseError()

                await wait()

                expect(up.network.isBusy()).toBe(false)
                expect('.target').toHaveText('cached text')

                // Browsers wait a bit before emitting an unhandledrejection event.
                await wait(100)

                expect(globalErrorSpy).toHaveBeenCalledWith(jasmine.any(up.Offline))
              })
            })

            it('keeps the expired response in the cache so users can keep navigating within the last known content', async function() {
              const job1 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job1

              expect('.target').toHaveText('cached text')

              await expectAsync(job1).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job1.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job1.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              // Simulate navigating to another page
              up.render('.target', { content: 'other text' })
              expect('.target').toHaveText('other text')

              // Re-render the cached content that we could not revalidate earlier.
              const job2 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job2

              // See that we kept the last known response in the cache.
              expect('.target').toHaveText('cached text')

              // We now have a second revalidation request.
              await expectAsync(job2.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job2.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')
            })
          })


          describe('prevention', function() {

            it('emits a second up:fragment:loaded event with { revalidating: true }', async function() {
              const flags = []
              up.on('up:fragment:loaded', (event) => {
                flags.push(event.revalidating)
              })

              up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
              await wait()

              expect('.target').toHaveText('cached text')
              expect(up.network.isBusy()).toBe(true)
              expect(flags).toEqual([false])

              jasmine.respondWithSelector('.target', { text: 'verified text' })
              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('verified text')
              expect(flags).toEqual([false, true])
            })

            it('lets listeners prevent insertion of revalidated content by *preventing* the second up:fragment:loaded event, aborting the { finished } promise yy', async function() {
              up.on('up:fragment:loaded', function(event) {
                if (event.revalidating) {
                  event.preventDefault()
                }
              })

              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job

              expect('.target').toHaveText('cached text')

              await wait()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWithSelector('.target', { text: 'verified text' })

              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Aborted))
            })

            it('lets listeners prevent insertion of revalidated content by *skipping* the second up:fragment:loaded event, fulfilling the { finished } promise', async function() {
              up.on('up:fragment:loaded', function(event) {
                if (event.revalidating) {
                  event.skip()
                }
              })

              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job

              expect('.target').toHaveText('cached text')

              await wait()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWithSelector('.target', { text: 'verified text' })

              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              await expectAsync(job.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
            })
          })
        })
      })

      if (window.customElements) {
        describe('custom elements', function() {
          beforeAll(function() {
            var TestComponent = function() {
              const instance = Reflect.construct(HTMLElement, [], TestComponent)
              instance.innerHTML = 'component activated'
              up.emit('test-component:new')
              return instance
            }
            Object.setPrototypeOf(TestComponent.prototype, HTMLElement.prototype)
            Object.setPrototypeOf(TestComponent, HTMLElement)

            window.customElements.define('test-component-activation', TestComponent)
          })

          it('activates custom elements in inserted fragments', async function() {
            fixture('.target')

            up.render('.target', { content: `
              <test-component-activation></test-component-activation>
            ` })

            await wait()
            expect('.target test-component-activation').toHaveText('component activated')
          })

          it('does not activate custom elements outside of inserted fragments (for performance reasons)', async function() {
            fixture('.target')
            const constructorSpy = jasmine.createSpy('constructor called')
            up.on('test-component:new', constructorSpy)

            up.render('.target', { document: `
              <div class="target">
                <test-component-activation></test-component-activation>
              </div>
              <div class="other">
                <test-component-activation></test-component-activation>
              </div>
            ` })

            await wait()
            expect(constructorSpy.calls.count()).toBe(1)
          })
        })
      }
    })

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

        expect($element).toHaveOpacity(1.0, 0.15)
        await wait(100)

        expect($element).toHaveOpacity(0.5, 0.3)
        await wait(175)

        expect($element).toBeDetached()
      })

      it('calls destructors for custom elements', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) => destructor)
        up.hello(fixture('.element'))
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

      it('marks the old element as [inert] before destructors', function(done) {
        const testElement = function(element) {
          expect(element).toHaveText('old text')
          expect(element).toMatchSelector('[inert]')
          done()
        }

        up.compiler('.container', (element) => () => testElement(element))

        up.hello(fixture('.container', { text: 'old text' }))

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

      it('emits an up:fragment:destroyed event on the former parent element after the element was marked as .up-destroying and started its close animation', async function() {
        const $parent = $fixture('.parent')
        const $element = $parent.affix('.element')
        expect($element).toBeAttached()

        const listener = jasmine.createSpy('event listener')

        $parent[0].addEventListener('up:fragment:destroyed', listener)

        up.destroy($element, { animation: 'fade-out', duration: 30 })
        await wait()

        expect(listener).toHaveBeenCalled()
        expect($element).toMatchSelector('.up-destroying')
        expect($element).toBeAttached()
      })

      it('removes element-related data from the global jQuery cache (bugfix)', async function() {
        const $element = $fixture('.element')
        $element.data('foo', { foo: '1' })
        expect($element.data('foo')).toEqual({ foo: '1' })
        up.destroy($element)
        await wait()

        expect($element.data('foo')).toBeMissing()
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

    describe('[up-keep]', function() {

      function squish(string) {
        if (u.isString(string)) {
          string = string.replace(/^\s+/g, '')
          string = string.replace(/\s+$/g, '')
          string = string.replace(/\s+/g, ' ')
        }
        return string
      }

      beforeEach(function() {
        // TODO: Refactor this spec file so examples don't all share one example
        $('.before, .middle, .after').remove()
      })

      it('keeps an [up-keep] element, but does replace other elements around it', async function() {
        const $container = $fixture('.container')
        $container.affix('.before').text('old-before')
        $container.affix('.middle[up-keep]').text('old-middle')
        $container.affix('.after').text('old-after')

        up.render('.container', { document: `
          <div class='container'>
            <div class='before'>new-before</div>
            <div class='middle' up-keep>new-middle</div>
            <div class='after'>new-after</div>
          </div>
        `
        })

        await wait()

        expect('.before').toHaveText('new-before')
        expect('.middle').toHaveText('old-middle')
        expect('.after').toHaveText('new-after')
      })


      if (up.specUtil.canMoveBefore()) {
        it('preserves focus in an [up-keep] without re-focusing the element (which may e.g. open custom menus)', async function() {
          let focusinSpy = jasmine.createSpy('focusin listener')
          up.on('focusin', focusinSpy)

          let [container, oldBefore, middle, oldAfter] = htmlFixtureList(`
            <div class='container'>
              <div class='before'>old-before</div>
              <input type="text" class='middle' up-keep></input>
              <div class='after'>old-after</div>
            </div>
          `)

          middle.focus()
          expect(middle).toBeFocused()
          expect(focusinSpy.calls.count()).toBe(1)

          up.render({ fragment: `
            <div class='container'>
              <div class='before'>new-before</div>
              <input type="text" class='middle' up-keep></input>
              <div class='after'>new-after</div>
            </div>
          `})

          await wait()

          expect('.before').toHaveText('new-before')
          expect(document.querySelector('.middle')).toBe(middle)
          expect('.after').toHaveText('new-after')

          expect(middle).toBeFocused()
          expect(focusinSpy.calls.count()).toBe(1)
        })
      }

      it('does not run destructors within kept elements', async function() {
        const destructor = jasmine.createSpy('destructor spy')

        up.compiler('.keepable', (element) => destructor)

        container = fixture('.container')
        const keepable = e.affix(container, '.keepable[up-keep]', { text: 'old text' })

        up.hello(keepable)

        up.render('.container', { document: `
          <div class='container'>
            <div class='keepable' up-keep>new text</div>
          </div>
        `
        })

        await wait()
        expect(destructor).not.toHaveBeenCalled()

        up.destroy('.container')
        await wait()

        expect(destructor).toHaveBeenCalled()
      })

      it('does not run destructors within kept elements when the <body> is targeted (bugfix)', async function() {
        const destructor = jasmine.createSpy('destructor spy')

        up.compiler('.keepable', (element) => destructor)

        const keepable = fixture('.keepable[up-keep]', { text: 'old content' })

        up.hello(keepable)

        up.render('body', { document: `
          <body>
            <div class='keepable' up-keep>new content</div>
          </body>
        `
        })

        await wait()

        expect(destructor).not.toHaveBeenCalled()
      })

      it('keeps an [up-keep] element when updating a singleton element like <body>', async function() {
        up.fragment.config.targetDerivers.unshift('middle-element')

        // shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
        up.element.isSingleton.mock().and.callFake((element) => element.matches('middle-element'))

        const $container = $fixture('.container')
        $container.affix('before-element').text('old-before')
        // Must use a custom element since up.fragment.toTarget() only returns the element name for singleton elements.
        // Using a <div class="middle"> would return "div" and match the before-element.
        $container.affix('middle-element[up-keep]').text('old-middle')
        $container.affix('after-element').text('old-after')

        up.render('.container', { document: `
          <div class='container'>
            <before-element>new-before</before-element>
            <middle-element class='middle' up-keep>new-middle</middle-element>
            <after-element class='after'>new-after</after-element>
          </div>
        ` })

        await wait()

        expect('before-element').toHaveText('new-before')
        expect('middle-element').toHaveText('old-middle')
        expect('after-element').toHaveText('new-after')
      })

      it('keeps an [up-keep] element, but does replace text nodes around it', async function() {
        const $container = $fixture('.container')
        $container.html(`
          old-before
          <div class='element' up-keep>old-inside</div>
          old-after
        `)

        up.render('.container', { document: `
          <div class='container'>
            new-before
            <div class='element' up-keep>new-inside</div>
            new-after
          </div>
        ` })

        await wait()

        expect(squish($('.container').text())).toEqual('new-before old-inside new-after')
      })

      it('omits a kept element from the returned up.RenderResult', async function() {
        const $container = $fixture('.container')
        $container.affix('.before').text('old-before')
        $container.affix('.middle[up-keep]').text('old-middle')
        $container.affix('.after').text('old-after')

        const result = await up.render('.before, .middle', { document: `
          <div class='container'>
            <div class='before'>new-before</div>
            <div class='middle' up-keep>new-middle</div>
            <div class='after'>new-after</div>
          </div>
        ` })

        expect('.before').toHaveText('new-before')
        expect('.middle').toHaveText('old-middle') // was kept
        expect('.after').toHaveText('old-after')

        expect(result.fragments.length).toBe(1)
        expect(result.fragments[0]).toMatchSelector('.before')
      })

      it('updates an [up-keep] element with { keep: false } option', async function() {
        const $container = $fixture('.container')
        $container.html(`
          old-before
          <div class='element' up-keep>old-inside</div>
          old-after
        `)

        up.render('.container', {
          keep: false,
          document: `
            <div class='container'>
              new-before
              <div class='element' up-keep>new-inside</div>
              new-after
            </div>
          `
        })

        await wait()

        expect(squish($('.container').text())).toEqual('new-before new-inside new-after')
      })

      it('keeps the scroll position of an [up-viewport] within a kept element', function() {
        container = fixture('.container')
        const keepable = e.affix(container, '.keepable[up-keep]')
        const viewport = e.affix(keepable, '.viewport[up-viewport]', { style: { 'height': '100px', 'overflow-y': 'scroll' } })
        const viewportContent = e.affix(viewport, '.viewport-content', { style: { 'height': '500px' } })
        const unkeeptSibling = e.affix(container, '.other', { text: 'old other text' })

        viewport.scrollTop = 100

        expect(viewport).toBeAttached()
        expect(viewport.scrollTop).toBe(100)

        up.render({ fragment: `
          <div class="container">
            <div class="keepable" up-keep>
              <div class="viewport" up-viewport></div>
            </div>
            <div class="other">new other text</div>
          </div>
        ` })

        expect('.other').toHaveText('new other text')
        expect(viewport).toBeAttached()
        expect(viewport.scrollTop).toBe(100)
      })

      describe('media elements', function() {

        it('keeps a <video> element when rendering with DOMparser (bugfix)', async function() {
          const html = `
            <div id="container">
              <video id="video" up-keep></video>
            </div>
          `

          htmlFixture(html)
          const videoBeforeRender = document.querySelector('#video')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#video')).toBe(videoBeforeRender)
        })

        it('keeps the position of a <video> element within the DOM hierarchy when rendering with DOMparser (bugfix)', async function() {
          const html = `
            <div id="container">
              <video id="video" up-keep></video>
            </div>
          `

          container = htmlFixture(html)
          document.querySelector('#video')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          const video = document.querySelector('#video')
          expect(video).toMatchSelector('#fixtures > #container > #video')
        })

        it('keeps a <audio> element when rendering with DOMparser (bugfix)', async function() {
          const html = `
            <div id="container">
              <audio id="audio" up-keep></audio>
            </div>
          `

          htmlFixture(html)
          const audioBeforeRender = document.querySelector('#audio')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#audio')).toBe(audioBeforeRender)
        })

        it('preserves the playback state of a kept media element', function(done) {
          container = fixture('.container')
          const playerHTML = `
            <div id="player">
              <video width="400" controls loop muted up-keep id="video">
                <source src="/spec/files/video.webm" type="video/webm">
              </video>
            </div>
          `

          const onPlaying = async function() {
            expect(video.paused).toBe(false)

            // Playback state is only lost when the update is from a URL, but not when updating
            // from a local string (which is sync).
            //
            // This may have two reasons:
            //
            // 1. Rendering from a URL is async, rendering a local string is sync
            // 2. Rendering from a URL uses DOMParser and fixParserDamage(), rendering from a local string
            //    creates elements within the current browsing context.
            const promise = up.render({ target: '#player', url: '/video2' })

            await wait()

            jasmine.respondWith(playerHTML)

            await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(video).toBeAttached()
            expect(video.paused).toBe(false)
            expect(document.querySelectorAll('video').length).toBe(1)

            // We cannot pass `done` to addEventListener() directly. I think the event argument
            // causes Jasmine to fail the test
            const onUpdate = () => done()

            // Check that we video is still playing
            video.addEventListener('timeupdate', onUpdate, { once: true })
          }

          container.innerHTML = playerHTML
          var video = container.querySelector('video')
          expect(video.paused).toBe(true)

          // We're waiting for a timeupdate event in addition to checking !video.paused
          // since an unpaused video may not actually be playing.
          video.addEventListener('timeupdate', onPlaying, { once: true })
          video.play()
        })
      })

      describe('scripts', function() {

        beforeEach(function() {
          up.fragment.config.runScripts = true
        })

        it('keeps a <script> element (bugfix)', async function() {
          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce"></script>
            </div>
          `

          htmlFixture(html)
          const scriptBeforeRender = document.querySelector('#script')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involved.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#script')).toBe(scriptBeforeRender)
        })

        it('keeps a <script> element, but allows to replace it in a non-keeping render pass later (bugfix)', async function() {
          window.keepSpy = jasmine.createSpy('spy called from keepable script')

          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce">window.keepSpy()</script>
            </div>
          `

          htmlFixture(html)
          const scriptBeforeRender = document.querySelector('#script')

          expect(window.keepSpy.calls.count()).toBe(1)

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#script')).toBe(scriptBeforeRender)
          expect(window.keepSpy.calls.count()).toBe(1)

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html, keep: false })

          await wait()

          expect(document.querySelector('#script')).not.toBe(scriptBeforeRender)
          expect(window.keepSpy.calls.count()).toBe(2)

          delete window.keepSpy
        })

        it('does not re-run a kept <script> element when rendering with DOMParser (bugfix)', async function() {
          window.specSpy = jasmine.createSpy('specSpy() function')
          expect(window.specSpy.calls.count()).toBe(0)

          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce">window.specSpy()</script>
            </div>
          `

          htmlFixture(html)
          expect(window.specSpy.calls.count()).toBe(1)

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(window.specSpy.calls.count()).toBe(1)

          delete window.specSpy
        })

        it('does not re-run a kept <script> element when rendering without DOMParser (bugfix)', async function() {
          window.specSpy = jasmine.createSpy('specSpy() function')
          expect(window.specSpy.calls.count()).toBe(0)

          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce">window.specSpy()</script>
            </div>
          `

          htmlFixture(html)
          expect(window.specSpy.calls.count()).toBe(1)

          document.querySelector('#container #script').classList.add('the-original-one')

          // Rendering from { fragment } does *not* use DOMParser to parse HTML
          up.render({ fragment: html })

          await wait()

          expect(window.specSpy.calls.count()).toBe(1)

          delete window.specSpy
        })

        it('keeps a <noscript> element (bugfix)', async function() {
          const html = `
            <div id="container">
              <noscript id="noscript" up-keep></noscript>
            </div>
          `

          htmlFixture(html)
          const noscriptBeforeRender = document.querySelector('#noscript')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#noscript')).toBe(noscriptBeforeRender)
        })
      })

      describe('if an [up-keep] element is itself a direct replacement target', function() {

        it("keeps that element", async function() {
          $fixture('.keeper[up-keep]').text('old-inside')
          up.render({ fragment: `
            <div class='keeper' up-keep>new-inside</div>
          ` })

          await wait()
          expect('.keeper').toHaveText('old-inside')
        })

        it("does not run the element's destructors", async function() {
          const destructor = jasmine.createSpy('destructor spy')

          up.compiler('.keepable', (element) => destructor)

          const keepable = fixture('.keepable[up-keep]', { text: 'old text' })

          up.hello(keepable)

          up.render('.keepable', { document: `
            <div class='keepable' up-keep>
              new text
            </div>
          ` })

          await wait()
          expect(destructor).not.toHaveBeenCalled()

          up.destroy('.keepable')
          await wait()
          expect(destructor).toHaveBeenCalled()
        })

        it("only emits an event up:fragment:keep, but not an event up:fragment:inserted", async function() {
          const insertedListener = jasmine.createSpy('subscriber to up:fragment:inserted')
          const keepListener = jasmine.createSpy('subscriber to up:fragment:keep')
          up.on('up:fragment:keep', keepListener)
          up.on('up:fragment:inserted', insertedListener)
          const $keeper = $fixture('.keeper[up-keep]').text('old-inside')
          up.render('.keeper', { document: `
            <div class='keeper new' up-keep>new-inside</div>
          ` })

          await wait()
          expect(insertedListener).not.toHaveBeenCalled()
          expect(keepListener).toHaveBeenCalledWith(
            jasmine.objectContaining({ newFragment: jasmine.objectContaining({ className: 'keeper new' }) }),
            $keeper[0],
            jasmine.anything()
          )
        })
      })

      it("removes an [up-keep] element if no matching element is found in the response", async function() {
        const barCompiler = jasmine.createSpy()
        const barDestructor = jasmine.createSpy()
        up.compiler('.bar', function(bar) {
          const text = bar.innerText
          barCompiler(text)
          return () => barDestructor(text)
        })

        const $container = $fixture('.container')
        $container.html(`
          <div class='foo'>old-foo</div>
          <div class='bar' up-keep>old-bar</div>
        `)
        up.hello($container)

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([])

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-ffrooo</div>
          </div>
        ` })

        await wait()
        expect('.container .foo').toBeAttached()
        expect('.container .bar').not.toBeAttached()

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([['old-bar']])
      })

      it("keeps an element even if the new element is no longer [up-keep]", function() {
        container = htmlFixture(`
          <div class='container'>
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
          </div>
        `)
        up.hello(container)

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar'>new-bar</div>
          </div>
        ` })

        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('old-bar')
      })

      it("updates an element if a matching element is found in the response, but that other element has [up-keep=false]", async function() {
        const barCompiler = jasmine.createSpy()
        const barDestructor = jasmine.createSpy()
        up.compiler('.bar', function(bar) {
          const text = bar.innerText
          barCompiler(text)
          return () => barDestructor(text)
        })

        const $container = $fixture('.container')
        $container.html(`
          <div class='foo'>old-foo</div>
          <div class='bar' up-keep>old-bar</div>
        `)
        up.hello($container)

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([])

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep='false'>new-bar</div>
          </div>
        ` })

        await wait()
        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('new-bar')

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar'], ['new-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([['old-bar']])
      })

      it('keeps an element with [up-keep=true]', function() {
        container = htmlFixture(`
          <div class='container'>
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep='true'>old-bar</div>
          </div>
        `)
        up.hello(container)

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep='true'>new-bar</div>
          </div>
        ` })

        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('old-bar')
      })

      it('updates an element with [up-keep=false], even if a matching element in the response has [up-keep]', function() {
        container = htmlFixture(`
          <div class='container'>
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep='false'>old-bar</div>
          </div>
        `)
        up.hello(container)

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep>new-bar</div>
          </div>
        ` })

        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('new-bar')
      })

      it('moves a kept element to the ancestry position of the matching element in the response', async function() {
        const $container = $fixture('.container')
        $container.html(`
          <div class="parent1">
            <div class="keeper" up-keep>old-inside</div>
          </div>
          <div class="parent2">
          </div>
        `)
        up.render({ fragment: `
          <div class='container'>
            <div class="parent1">
            </div>
            <div class="parent2">
              <div class="keeper" up-keep>old-inside</div>
            </div>
          </div>
        ` })

        await wait()
        expect('.keeper').toHaveText('old-inside')
        expect($('.keeper').parent()).toEqual($('.parent2'))
      })

      if (up.migrate.loaded) {
        it('lets developers choose a selector to match against as the value of the [up-keep] attribute', function() {
          container = fixture('.container')

          container.innerHTML = `
            <audio id='player' src='foo.mp3' up-keep='[src="foo.mp3"]' data-tag='1'></audio>
          `

          up.hello(container)

          expect(document.querySelector('#player').src).toMatchURL('foo.mp3')
          expect(document.querySelector('#player').dataset.tag).toBe('1')

          up.render({ fragment: `
            <div class='container'>
              <audio id='player' src='bar.mp3' up-keep='[src="bar.mp3"]' data-tag='2'></audio>
            </div>
          ` })

          expect(document.querySelector('#player').src).toMatchURL('bar.mp3')
          expect(document.querySelector('#player').dataset.tag).toBe('2')

          up.render({ fragment: `
            <div class='container'>
              <audio id='player' src='bar.mp3' up-keep='[src="bar.mp3"]' data-tag='3'></audio>
            </div>
          ` })

          expect(document.querySelector('#player').src).toMatchURL('bar.mp3')
          expect(document.querySelector('#player').dataset.tag).toBe('2')
        })

        it('does not print a deprecation warning for [up-keep=true]', function() {
          const warnSpy = up.migrate.warn.mock()

          container = htmlFixture(`
            <div class='container'>
              <div class='foo'>old-foo</div>
              <div class='bar' up-keep='true'>old-bar</div>
            </div>
          `)
          up.hello(container)

          expect(warnSpy).not.toHaveBeenCalled()
        })
      }

      it('does not compile a kept element a second time', async function() {
        const compiler = jasmine.createSpy('compiler')
        up.compiler('.keeper', compiler)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)

        up.hello($container)
        expect(compiler.calls.count()).toEqual(1)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep>new-text</div>
          </div>
        ` })

        await wait()

        expect(compiler.calls.count()).toEqual(1)
        expect('.keeper').toBeAttached()
        expect('.keeper').toHaveText('old-text')
      })

      it('does not lose jQuery event handlers on a kept element (bugfix)', async function() {
        const handler = jasmine.createSpy('event handler')
        up.compiler('.keeper', (keeper) => keeper.addEventListener('click', handler))

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)
        up.hello($container)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep>new-text</div>
          </div>
        ` })

        await wait()

        expect('.keeper').toHaveText('old-text')
        await wait()

        Trigger.click('.keeper')
        await wait()

        expect(handler).toHaveBeenCalled()
      })

      it('does not call destructors on a kept alement', async function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.keeper', (keeper) => destructor)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)
        up.hello($container)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep>new-text</div>
          </div>
        ` })

        await wait()

        const $keeper = $('.keeper')
        expect($keeper).toHaveText('old-text')
        expect(destructor).not.toHaveBeenCalled()
      })

      it('calls destructors when a kept element is eventually removed from the DOM', async function() {
        const handler = jasmine.createSpy('event handler')
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.keeper', (keeper) => destructor)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)
        up.hello($container)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep="false">new-text</div>
          </div>
        ` })

        await wait()

        const $keeper = $('.keeper')
        expect($keeper).toHaveText('new-text')
        expect(destructor).toHaveBeenCalled()
      })

      it('emits an up:fragment:keep event that lets listeners inspect the new element and its data', async function() {
        const $keeper = $fixture('.keeper[up-keep]').text('old-inside')
        const listener = jasmine.createSpy('event listener')
        $keeper[0].addEventListener('up:fragment:keep', listener)
        up.render('.keeper', { document: `
          <div class='keeper new' up-keep up-data='{ "key": "new-value" }'>new-inside</div>
        ` })

        await wait()

        expect(listener).toHaveBeenCalledWith(
          jasmine.objectContaining({
            newFragment: jasmine.objectContaining({ className: 'keeper new' }),
            newData: jasmine.objectContaining({ key: 'new-value' }),
            target: $keeper[0]
          })
        )
      })

      it('emits an up:fragment:keep event with information about the render pass', async function() {
        const keeper = fixture('.keeper[up-keep]', { text: 'old inside' })
        const listener = jasmine.createSpy('event listener')
        keeper.addEventListener('up:fragment:keep', listener)
        up.render('.keeper', { document: `
          <div class='keeper new' up-keep>new-inside</div>
        `, abort: 'all', scroll: 'top' })

        await wait()

        expect(listener).toHaveBeenCalledWith(
          jasmine.objectContaining({
            renderOptions: jasmine.objectContaining({ abort: 'all', scroll: 'top' })
          })
        )
      })

      it('emits an up:fragment:keep with { newData: {} } if the new element had no up-data value', async function() {
        const keepListener = jasmine.createSpy()
        up.on('up:fragment:keep', keepListener)
        const $container = $fixture('.container')
        const $keeper = $container.affix('.keeper[up-keep]').text('old-inside')
        up.render('.keeper', { document: `
          <div class='container'>
            <div class='keeper' up-keep>new-inside</div>
          </div>
        ` })

        await wait()

        expect('.keeper').toHaveText('old-inside')
        expect(keepListener).toEqual(jasmine.anything(), $('.keeper'), {})
      })

      it('allows to define a listener in an [up-on-keep] attribute', async function() {
        const keeper = fixture('.keeper[up-keep][up-on-keep="nonce-specs-nonce this.onKeepSpy(this, newFragment, newData)"]', { text: 'old-inside' })

        keeper.onKeepSpy = jasmine.createSpy('onKeep spy')

        up.render('.keeper', { document: `
          <div class='keeper new' up-keep up-data='{ "key": "new-value" }'>new-inside</div>
        ` })

        await wait()

        expect(keeper.onKeepSpy).toHaveBeenCalledWith(
          keeper,
          jasmine.objectContaining({ className: 'keeper new' }),
          jasmine.objectContaining({ key: 'new-value' })
        )
      })

      it('lets listeners cancel the keeping by preventing default on an up:fragment:keep event', async function() {
        const $keeper = $fixture('.keeper[up-keep]').text('old-inside')
        $keeper.on('up:fragment:keep', (event) => event.preventDefault())
        up.render({ fragment: `
          <div class='keeper' up-keep>new-inside</div>
        ` })

        await wait()

        expect('.keeper').toHaveText('new-inside')
      })

      it('lets listeners prevent up:fragment:keep event if the element was kept before (bugfix)', async function() {
        const $keeper = $fixture('.keeper[up-keep]').text('version 1')
        $keeper[0].addEventListener('up:fragment:keep', function(event) {
          if (event.newFragment.textContent.trim() === 'version 3') { event.preventDefault() }
        })

        up.render({ fragment: `
          <div class='keeper' up-keep>version 2</div>
        ` })
        await wait()

        expect('.keeper').toHaveText('version 1')

        up.render({ fragment: `
          <div class='keeper' up-keep>version 3</div>
        ` })
        await wait()

        expect('.keeper').toHaveText('version 3')
      })

      it('emits an up:fragment:keep event on a keepable element and up:fragment:inserted on the targeted parent', async function() {
        const insertedListener = jasmine.createSpy()
        up.on('up:fragment:inserted', insertedListener)
        const keepListener = jasmine.createSpy()
        up.on('up:fragment:keep', keepListener)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep></div>
        `)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep></div>
          </div>
        ` })

        await wait()

        expect(insertedListener).toHaveBeenCalledWith(jasmine.anything(), $('.container')[0], jasmine.anything())
        expect(keepListener).toHaveBeenCalledWith(jasmine.anything(), $('.container .keeper')[0], jasmine.anything())
      })

      it('reuses the same element and emits up:fragment:keep during multiple extractions', async function() {
        const keepListener = jasmine.createSpy()
        up.on('up:fragment:keep', (event) => keepListener(event.target, event.newData))
        const $container = $fixture('.container')
        let $keeper = $container.affix('.keeper[up-keep]').text('old-inside')

        up.render('.keeper', { document: `
          <div class='container'>
            <div class='keeper' up-keep up-data='{ "key": "value1" }'>new-inside</div>
          </div>
        ` })
        await wait()

        up.render('.keeper', { document: `
          <div class='container'>
            <div class='keeper' up-keep up-data='{ "key": "value2" }'>new-inside</div>
          </div>
        ` })
        await wait()

        $keeper = $('.keeper')
        expect($keeper).toHaveText('old-inside')
        expect(keepListener).toHaveBeenCalledWith($keeper[0], jasmine.objectContaining({ key: 'value1' }))
        expect(keepListener).toHaveBeenCalledWith($keeper[0], jasmine.objectContaining({ key: 'value2' }))
      })

      it("doesn't let the discarded element appear in a transition", async function() {
        up.motion.config.enabled = true

        let oldTextDuringTransition = undefined
        let newTextDuringTransition = undefined
        const transition = function(oldElement, newElement) {
          oldTextDuringTransition = squish(oldElement.innerText)
          newTextDuringTransition = squish(newElement.innerText)
          return Promise.resolve()
        }

        const $container = $fixture('.container')
        $container.html(`
          <div class='foo'>old-foo</div>
          <div class='bar' up-keep>old-bar</div>
        `)

        const newHTML = `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep>new-bar</div>
          </div>
        `

        await up.render('.container', {
          fragment: newHTML,
          transition,
        }).finished

        expect(oldTextDuringTransition).toEqual('old-foo old-bar')
        expect(newTextDuringTransition).toEqual('new-foo old-bar')
      })

      function keepableFixture(html, renderOptions = {}) {
        // Make sure we insert the element through rendering, so we can test
        // our own HTML pollution with [up-etag], [up-time], [up-source].
        fixture('#keepable')
        up.render({ target: '#keepable', document: html, ...renderOptions })

        return document.querySelector('#keepable')
      }

      describe('with [up-keep="same-html"]', function() {

        it('keeps the element if its outer HTML is stable', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an [up-keep] descendant if its outer HTML is stable', async function() {
          let [container, keepable] = htmlFixtureList(`
            <div id="container">
              <div id="keepable" up-keep="same-html">text</div>
            </div>
          `)
          up.hello(container)

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores indentation', async function() {
          let [container, keepable] = htmlFixtureList(`
            <div id="container">
              <div id="keepable" up-keep="same-html">
                text
              </div>
            </div>
          `)
          up.hello(container)

          up.render({ fragment: `
                  <div id="keepable" up-keep="same-html">
                          text
                  </div>
          ` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores HTML changes made by a user compiler', async function() {
          up.compiler('#keepable', (el) => el.innerText = 'text changed by compiler')

          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')
          expect(keepable).toHaveText('text changed by compiler')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
          expect(document.querySelector('#keepable')).toHaveText('text changed by compiler')
        })

        it('ignores HTML changes made by a user macro', async function() {
          up.macro('#keepable', (el) => el.innerText = 'text changed by macro')

          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')
          expect(keepable).toHaveText('text changed by macro')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
          expect(document.querySelector('#keepable')).toHaveText('text changed by macro')
        })

        it('ignores HTML changes made by a system macro', async function() {
          html = `
            <div id="keepable" up-expand up-keep="same-html">
              <a href="/path">text</a>
            </div>
          `
          let keepable = keepableFixture(html)
          expect(keepable).toBeFollowable()
          expect(keepable).toHaveAttribute('up-href', '/path')

          up.render({ fragment: html })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an identical element that was introduced by a transition (which adds tracking classes)', async function() {
          fixture('#keepable')
          html = '<div id="keepable" up-keep="same-html">text</div>'
          let keepable = (await up.render({ target: '#keepable', document: html, transition: 'cross-fade', duration: 70 }).finished).fragment

          up.render({ fragment: html })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an element when a new identitcal was introduced by a transition (which adds tracking classes)', async function() {
          html = '<div id="keepable" up-keep="same-html">text</div>'
          let keepable = keepableFixture(html)

          await up.render({ fragment: html, transition: 'cross-fade', duration: 70 }).finished

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores HTML changes that happened after rendering', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')

          keepable.innerText = 'text changed after rendering'
          expect(keepable).toHaveText('text changed after rendering')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
          expect(document.querySelector('#keepable')).toHaveText('text changed after rendering')
        })

        it('replaces the element if its text changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">old text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">new text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if an attribute changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html" attr="old">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-html" attr="new">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if child element changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html" attr="old"></div>')

          up.render({ fragment: `
            <div id="keepable" up-keep="same-html" attr="new">
              <span></span>
            </div>
          `})
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('ignores a <script nonce> for the comparison', async function() {
          up.fragment.config.runScripts = true

          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let keepable = keepableFixture(`<div id="keepable" up-keep="same-html"><script nonce="page-secret"></script></div>`)

          up.render({ target: '#keepable', url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `<div id="keepable" up-keep="same-html"><script nonce="response-secret"></script></div>`,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores a callback nonce for the comparison', async function() {
          up.fragment.config.runScripts = true

          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let keepable = keepableFixture(`<input id="keepable" name="foo" up-keep="same-html" up-watch="nonce-page-secret foo()"></input>`)

          up.render({ target: '#keepable', url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `<input id="keepable" name="foo" up-keep="same-html" up-watch="nonce-response-secret foo()"></input>`,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores multiple callback nonces within the same tag', async function() {
          up.fragment.config.runScripts = true

          spyOn(up.protocol, 'cspNonce').and.returnValue('page-secret')

          let keepable = keepableFixture(`<a id="keepable" href="/path" up-keep="same-html" up-on-rendered="nonce-page-secret foo()" data-x="x" up-on-finished="nonce-page-secret bar()" data-y="y">text</a>`)

          up.render({ target: '#keepable', url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `<a id="keepable" href="/path" up-keep="same-html" up-on-rendered="nonce-response-secret foo()" data-x="x" up-on-finished="nonce-response-secret bar()" data-y="y">text</a>`,
            responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-response-secret'" }
          })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

      })

      describe('with [up-keep="same-data"]', function() {

        it('keeps the element if its data is stable, even though the innerHTML changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">changed text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an [up-keep] descendant if its data is stable, even though the innerHTML changed', async function() {
          let [container, keepable] = htmlFixtureList(`
            <div id="container">
              <div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>
            </div>
          `)
          up.hello(container)

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">changed text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an element with an empty [up-data] object when the new element has no [up-data] attribute at all')

        it('merges [up-data] and [data-*] attribute in both elements before comparison')

        it('ignores data mutated after rendering', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.data(keepable).bar = 2
          expect(up.data(keepable)).toEqual({ foo: 1, bar: 2})

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('replaces the element if a data value changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 2 }">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if the new element has an additional data key', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1, bar: 2 }">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if has data, but the new element does not', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it("replaces the element if it doesn't have data, but the new element has data", async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data"></div>')

          up.render({ fragment: `
            <div id="keepable" up-keep="same-data" up-data="{ foo: 1 }"></div>
          `})
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

      })

    })

  })

})
