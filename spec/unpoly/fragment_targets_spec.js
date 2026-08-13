const e = up.element

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

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

  })

})
