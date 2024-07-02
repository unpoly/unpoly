const u = up.util
const $ = jQuery

describe('up.element', function() {

  describe('up.element.get()', function() {

    it('returns the given element', function() {
      const element = fixture('.element')
      expect(up.element.get(element)).toBe(element)
    })

    it('returns the first element in the given jQuery collection', function() {
      const $element = $fixture('.element')
      expect(up.element.get($element)).toBe($element[0])
    })

    it('throws an error if passed a jQuery collection with multiple elements', function() {
      const $element1 = $fixture('.element')
      const $element2 = $fixture('.element')
      const $list = $element1.add($element2)
      const get = () => up.element.get($list)
      expect(get).toThrowError(/cannot cast/i)
    })

    it('returns the given document object', () => {
      expect(up.element.get(document)).toBe(document)
    })

    it('returns the given window object', () => {
      expect(up.element.get(window)).toBe(window)
    })

    it('returns undefined for undefined', () => {
      expect(up.element.get(undefined)).toBeUndefined()
    })

    it('returns null for null', () => {
      expect(up.element.get(null)).toBeNull()
    })

    describe('for a CSS selector string', function() {

      it('returns the first element matching the given selector', function() {
        const match = fixture('.match')
        const otherMatch = fixture('.match')
        const noMatch = fixture('.no-match')
        const result = up.element.get('.match')
        expect(result).toBe(match)
      })

      describe('when given a root element for the search', function() {

        it('returns the first descendant of the given root that matches the given selector', function() {
          const $element = $fixture('.element')
          const $matchingChild = $element.affix('.child.match')
          const $matchingGrandChild = $matchingChild.affix('.grand-child.match')
          const $otherChild = $element.affix('.child')
          const $otherGrandChild = $otherChild.affix('.grand-child')
          const result = up.element.get($element[0], '.match')
          expect(result).toEqual($matchingChild[0])
        })

        it('returns missing if no descendant matches', function() {
          const $element = $fixture('.element')
          const $child = $element.affix('.child')
          const $grandChild = $child.affix('.grand-child')
          const result = up.element.get($element[0], '.match')
          expect(result).toBeMissing()
        })

        it('does not return the root itself, even if it matches', function() {
          const $element = $fixture('.element.match')
          const result = up.element.get($element[0], '.match')
          expect(result).toBeMissing()
        })

        it('does not return an ancestor of the root, even if it matches', function() {
          const $parent = $fixture('.parent.match')
          const $element = $parent.affix('.element')
          const result = up.element.get($element[0], '.match')
          expect(result).toBeMissing()
        })
      })
    })
  })


  if (up.migrate.loaded) {
    describe('up.element.all()', function() {

      it('returns all elements matching the given selector', function() {
        const match = fixture('.match')
        const otherMatch = fixture('.match')
        const noMatch = fixture('.no-match')
        const result = up.element.all('.match')
        expect(result).toMatchList([match, otherMatch])
      })

      describe('when given a root element for the search', function() {

        it('returns all descendants of the given root matching the given selector', function() {
          const $element = $fixture('.element')
          const $matchingChild = $element.affix('.child.match')
          const $matchingGrandChild = $matchingChild.affix('.grand-child.match')
          const $otherChild = $element.affix('.child')
          const $otherGrandChild = $otherChild.affix('.grand-child')
          const results = up.element.all($element[0], '.match')
          expect(results).toEqual([$matchingChild[0], $matchingGrandChild[0]])
        })

        it('returns an empty list if no descendant matches', function() {
          const $element = $fixture('.element')
          const $child = $element.affix('.child')
          const $grandChild = $child.affix('.grand-child')
          const results = up.element.all($element[0], '.match')
          expect(results).toEqual([])
        })

        it('does not return the root itself, even if it matches', function() {
          const $element = $fixture('.element.match')
          const results = up.element.all($element[0], '.match')
          expect(results).toEqual([])
        })

        it('does not return ancestors of the root, even if they match', function() {
          const $parent = $fixture('.parent.match')
          const $element = $parent.affix('.element')
          const results = up.element.all($element[0], '.match')
          expect(results).toEqual([])
        })
      })
    })
  }


  describe('up.element.list()', function() {

    it('returns the given array of elements', function() {
      const array = [document.body]
      const result = up.element.list(array)
      expect(result).toEqual(array)
    })

    it('returns an empty list for undefined', function() {
      const result = up.element.list(undefined)
      expect(result).toEqual([])
  })

    it('returns an empty list for null', function() {
      const result = up.element.list(null)
      expect(result).toEqual([])
  })

    it('converts a NodeList to an array', function() {
      const nodeList = document.querySelectorAll('body')
      const result = up.element.list(nodeList)
      expect(u.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(result[0]).toBe(document.body)
    })

    it('returns a concatenated array from multiple lists and elements', function() {
      const div0 = $fixture('div.div0')[0]
      const div1 = $fixture('div.div1')[0]
      const div2 = $fixture('div.div2')[0]
      const div3 = $fixture('div.div3')[0]

      const result = up.element.list(div0, [div1, div2], div3)
      expect(u.isArray(result)).toBe(true)
      expect(result).toEqual([div0, div1, div2, div3])
  })

    it('ignores missing values when concatenating arrays', function() {
      const div0 = $fixture('div.div0')[0]
      const div1 = $fixture('div.div1')[0]
      const div2 = $fixture('div.div2')[0]
      const div3 = $fixture('div.div3')[0]

      const result = up.element.list(null, div0, [div1, div2], undefined, div3)
      expect(u.isArray(result)).toBe(true)
      expect(result).toEqual([div0, div1, div2, div3])
  })
})

  if (up.migrate.loaded) {
    describe('up.element.matches()', function() {

      it('returns true if the given element matches the given selector', function() {
        const element = fixture('.foo')
        const result = up.element.matches(element, '.foo')
        expect(result).toBe(true)
      })

      it("returns false if the given element doesn't match the given selector", function() {
        const element = fixture('.foo')
        const result = up.element.matches(element, '.bar')
        expect(result).toBe(false)
      })

      it("returns false if the given element doesn't match the given selector, even if a child matches", function() {
        const element = fixture('.foo')
        const child = up.element.affix(element, '.bar')
        const result = up.element.matches(element, '.bar')
        expect(result).toBe(false)
      })
    })
  }

  describe('up.element.subtree()', function() {

    it('returns all descendants of the given root matching the given selector', function() {
      const $element = $fixture('.element')
      const $matchingChild = $element.affix('.child.match')
      const $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      const $otherChild = $element.affix('.child')
      const $otherGrandChild = $otherChild.affix('.grand-child')
      const results = up.element.subtree($element[0], '.match')
      expect(results).toEqual([$matchingChild[0], $matchingGrandChild[0]])
    })

    it('includes the given root if it matches the selector', function() {
      const $element = $fixture('.element.match')
      const $matchingChild = $element.affix('.child.match')
      const $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      const $otherChild = $element.affix('.child')
      const $otherGrandChild = $otherChild.affix('.grand-child')
      const results = up.element.subtree($element[0], '.match')
      expect(results).toEqual([$element[0], $matchingChild[0], $matchingGrandChild[0]])
    })

    it('does not return ancestors of the root, even if they match', function() {
      const $parent = $fixture('.parent.match')
      const $element = $parent.affix('.element')
      const results = up.element.subtree($element[0], '.match')
      expect(results).toEqual([])
    })

    it('returns an empty list if neither root nor any descendant matches', function() {
      const $element = $fixture('.element')
      const $child = $element.affix('.child')
      const results = up.element.subtree($element[0], '.match')
      expect(results).toEqual([])
    })
  })

  describe('up.element.contains()', function() {

    it('can handle conflicts with forms where an input is named `contains` GH#507', function() {
      const $form = $fixture('form')
      const $child = $form.affix('input[name="contains"]')

      expect(up.element.contains($form[0], $child)).toBe(true)
    })

  })

  if (up.migrate.loaded) {
    describe('up.element.closest()', function() {

      it('returns the closest ancestor of the given root that matches the given selector', function() {
        const $grandGrandMother = $fixture('.match')
        const $grandMother = $fixture('.match')
        const $mother = $grandMother.affix('.no-match')
        const $element = $mother.affix('.element')

        const result = up.element.closest($element[0], '.match')
        expect(result).toBe($grandMother[0])
      })

      it('returns the given root if it matches', function() {
        const $mother = $fixture('.match')
        const $element = $mother.affix('.match')

        const result = up.element.closest($element[0], '.match')
        expect(result).toBe($element[0])
      })

      it('does not return descendants of the root, even if they match', function() {
        const $element = $fixture('.element')
        const $child = $element.affix('.match')

        const result = up.element.closest($element[0], '.match')
        expect(result).toBeMissing()
      })

      it('returns missing if neither root nor ancestor matches', function() {
        const $mother = $fixture('.no-match')
        const $element = $mother.affix('.no-match')

        const result = up.element.closest($element[0], '.match')
        expect(result).toBeMissing()
      })
    })
  }

  describe('up.element.ancestor()', function() {

    it('returns the closest ancestor of the given root that matches the given selector', function() {
      const $grandGrandMother = $fixture('.match')
      const $grandMother = $fixture('.match')
      const $mother = $grandMother.affix('.no-match')
      const $element = $mother.affix('.element')

      const result = up.element.ancestor($element[0], '.match')
      expect(result).toBe($grandMother[0])
    })

    it('does not return the given root, even if it matches', function() {
      const $element = $fixture('.match')

      const result = up.element.ancestor($element[0], '.match')
      expect(result).toBeMissing()
    })

    it('does not return descendants of the root, even if they match', function() {
      const $element = $fixture('.element')
      const $child = $element.affix('.match')

      const result = up.element.ancestor($element[0], '.match')
      expect(result).toBeMissing()
    })

    it('returns missing if no ancestor matches', function() {
      const $mother = $fixture('.no-match')
      const $element = $mother.affix('.no-match')

      const result = up.element.ancestor($element[0], '.match')
      expect(result).toBeMissing()
    })
  })

  if (up.migrate.loaded) {

    describe('up.element.remove()', function() {

      it('removes the given element from the DOM', function() {
        const element = fixture('.element')
        expect(element).toBeAttached()
        up.element.remove(element)
        expect(element).toBeDetached()
      })

    })

  }

  describe('up.element.toggle()', function() {

    it('hides the given element if it is visible', function() {
      const element = fixture('.element')
      up.element.toggle(element)
      expect(element).toBeHidden()
    })

    it('shows the given element if it is hidden', function() {
      const element = fixture('.element', {style: { display: 'none' }})
      up.element.toggle(element)
      expect(element).toBeVisible()
    })

    it('hides the given element if the second argument is false', function() {
      const element = fixture('.element')
      expect(element).toBeVisible()
      up.element.toggle(element, false)
      expect(element).toBeHidden()
    })

    it('shows the given element if the second argument is true', function() {
      const element = fixture('.element')
      element.style.display = 'none'
      expect(element).toBeHidden()
      up.element.toggle(element, true)
      expect(element).toBeVisible()
    })
  })

  if (up.migrate.loaded) {
    describe('up.element.toggleClass()', function() {

      it('removes a class from an element that has that class', function() {
        const element = fixture('.klass')
        up.element.toggleClass(element, 'klass')
        expect(element).not.toHaveClass('klass')
      })

      it('adds a class to an element that does not have that class', function() {
        const element = fixture('div')
        up.element.toggleClass(element, 'klass')
        expect(element).toHaveClass('klass')
      })

      it('removes a class from the an element if the second argument is false', function() {
        const element = fixture('.klass')
        up.element.toggleClass(element, 'klass', false)
        expect(element).not.toHaveClass('klass')
      })

      it('adds a class to an element if the second argument is true', function() {
        const element = fixture('div')
        up.element.toggleClass(element, 'klass', true)
        expect(element).toHaveClass('klass')
      })
    })
  }

  describe('up.element.createFromSelector()', function() {

    it('creates an element with a given tag', function() {
      const element = up.element.createFromSelector('table')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')
    })

    it('creates a custom element with a dash-separated tag name', function() {
      const element = up.element.createFromSelector('ta-belle')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TA-BELLE')
    })

    it('creates an element with a given tag and class', function() {
      const element = up.element.createFromSelector('table.foo')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')
      expect(element.className).toEqual('foo')
    })

    it('creates an element with multiple classes', function() {
      const element = up.element.createFromSelector('table.foo.bar')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')
      expect(element.className).toEqual('foo bar')
    })

    it('creates an element with a given tag and ID', function() {
      const element = up.element.createFromSelector('table#foo')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')
      expect(element.id).toEqual('foo')
    })

    it('creates a <div> if no tag is given', function() {
      const element = up.element.createFromSelector('.foo')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('DIV')
      expect(element.className).toEqual('foo')
    })

    it('creates a hierarchy of elements for a descendant selector, and returns the root element', function() {
      const parent = up.element.createFromSelector('ul.foo li.bar')
      expect(parent).toBeElement()
      expect(parent.tagName).toEqual('UL')
      expect(parent.className).toEqual('foo')
      expect(parent.children.length).toBe(1)
      expect(parent.firstChild.tagName).toEqual('LI')
      expect(parent.firstChild.className).toEqual('bar')
    })

    it('creates a hierarchy of elements for a child selector, and returns the root element', function() {
      const parent = up.element.createFromSelector('ul.foo > li.bar')
      expect(parent).toBeElement()
      expect(parent.tagName).toEqual('UL')
      expect(parent.className).toEqual('foo')
      expect(parent.children.length).toBe(1)
      expect(parent.firstChild.tagName).toEqual('LI')
      expect(parent.firstChild.className).toEqual('bar')
    })

    it('creates an element with an attribute set to an exact value', function() {
      const element = up.element.createFromSelector('ul[foo=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('parses attribute names containing a dash', function() {
      const element = up.element.createFromSelector('ul[data-foo=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('data-foo')).toEqual('bar')
    })

    it('allows to quote attribute values in single quotes', function() {
      const element = up.element.createFromSelector("ul[foo='bar']")
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('allows to quote attribute values in double quotes', function() {
      const element = up.element.createFromSelector('ul[foo="bar"]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('allows single-quotes in a double-quoted attribute value', function() {
      const element = up.element.createFromSelector('ul[foo="bar\'baz"]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual("bar'baz")
    })

    it('allows double-quotes in a single-quoted attribute value', function() {
      const element = up.element.createFromSelector("ul[foo='bar\"baz']")
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar"baz')
    })

    it('creates an element with an attribute set to a space-separated value', function() {
      const element = up.element.createFromSelector('ul[foo~=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('creates an element with an attribute set to a dash-separated value', function() {
      const element = up.element.createFromSelector('ul[foo|=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('creates an element with an attribute set to a prefix', function() {
      const element = up.element.createFromSelector('ul[foo^=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('creates an element with an attribute set to a suffix', function() {
      const element = up.element.createFromSelector('ul[foo$=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('creates an element with an attribute set to a substring', function() {
      const element = up.element.createFromSelector('ul[foo*=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
    })

    it('creates an element with a value-less attribute', function() {
      const element = up.element.createFromSelector('ul[foo]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('')
    })

    it('creates an element with multiple attributes', function() {
      const element = up.element.createFromSelector('ul[foo=bar][baz=bam]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
      expect(element.getAttribute('baz')).toEqual('bam')
    })

    it('allows to quote attribute values with double quotes', function() {
      const element = up.element.createFromSelector('ul[foo="bar baz"]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar baz')
    })

    it('allows to quote attribute values with single quotes', function() {
      const element = up.element.createFromSelector("ul[foo='bar baz']")
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar baz')
    })

    it('throws an error when encountering an unknown selector', function() {
      const parse = () => up.element.createFromSelector("ul~baz")
      expect(parse).toThrowError('Cannot parse selector: ul~baz')
    })

    it('sets attributes from a second argument', function() {
      const element = up.element.createFromSelector('div', {foo: 'one', bar: 'two'})
      expect(element.getAttribute('foo')).toEqual('one')
      expect(element.getAttribute('bar')).toEqual('two')
    })

    it('adds an addition class from a { class } option', function() {
      const element = up.element.createFromSelector('.foo', {class: 'bar'})
      expect(element).toHaveClass('foo')
      expect(element).toHaveClass('bar')
    })

    describe('with { style } option', function() {

      it('sets inline styles from a { style } object with kebab-case keys', function() {
        const element = up.element.createFromSelector('div', {style: { 'font-size': '100px', 'margin-top': '200px' }})
        expect(element.style.fontSize).toEqual('100px')
        expect(element.style.marginTop).toEqual('200px')
      })

      it('sets inline styles from a { style } string with semicolon-separated styles', function() {
        const element = up.element.createFromSelector('div', {style: 'font-size: 100px; margin-top: 200px'})
        expect(element.style.fontSize).toEqual('100px')
        expect(element.style.marginTop).toEqual('200px')
      })

      if (up.migrate.loaded) {
        it('sets inline styles from a { style } object with camelCase keys', function() {
          const warnSpy = up.migrate.warn.mock()
          const element = up.element.createFromSelector('div', {style: { fontSize: '100px', marginTop: '200px' }})

          expect(element.style.fontSize).toEqual('100px')
          expect(element.style.marginTop).toEqual('200px')
          expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS property names must be in kebab-case'))
        })

        it('adds a px unit to unit-less length properties', function() {
          const warnSpy = up.migrate.warn.mock()
          const element = up.element.createFromSelector('div', {style: { 'height': '100', 'margin-top': '200' }})

          expect(element.style.height).toEqual('100px')
          expect(element.style.marginTop).toEqual('200px')
          expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS length values must have a unit'))
        })
      }
    })

    describe('with { text } option', function() {

      it('sets the element text from a { text } option', function() {
        const element = up.element.createFromSelector('.foo', {text: 'text'})
        expect(element).toHaveText('text')
      })

      it('escapes HTML from a { text } option', function() {
        const element = up.element.createFromSelector('.foo', {text: '<script>alert("foo")</script>'})
        expect(element).toHaveText('<script>alert("foo")</script>')
      })
    })
  })


  describe('up.element.affix()', function() {

    it('creates an element from the given selector and attaches it to the given container', function() {
      const container = fixture('.container')
      const element = up.element.affix(container, 'span')
      expect(element.tagName).toEqual('SPAN')
      expect(element.parentElement).toBe(container)
    })

    it('can attach an element to the body', function() {
      const element = up.element.affix(document.body, 'div')
      expect(element.tagName).toEqual('DIV')
      expect(element.parentElement).toBe(document.body)

      // Since this is not a fixture that would auto-remove itself after the test, remove it manually.
      return element.remove()
    })
  })


  describe('up.element.createBrokenDocumentFromHTML', function() {

    it('parses a string that contains a serialized HTML document', function() {
      const string = `
        <html lang="foo">
          <head>
            <title>document title</title>
          </head>
          <body data-env='production'>
            <div>line 1</div>
            <div>line 2</div>
          </body>
        </html>
      `

      const element = up.element.createBrokenDocumentFromHTML(string)

      expect(element.querySelector('head title').textContent).toEqual('document title')
      expect(element.querySelector('body').getAttribute('data-env')).toEqual('production')
      expect(element.querySelectorAll('body div').length).toBe(2)
      expect(element.querySelectorAll('body div')[0].textContent).toEqual('line 1')
      expect(element.querySelectorAll('body div')[1].textContent).toEqual('line 2')
    })

    it('parses a string that contains carriage returns (bugfix)', function() {
      const string = `
        <html>
          <body>
            <div>line</div>
          </body>
        </html>
      `

      const $element = up.element.createBrokenDocumentFromHTML(string)
      expect($element.querySelector('body')).toBeGiven()
      expect($element.querySelector('body div').textContent).toEqual('line')
    })

    it('does not run forever if a page has a <head> without a <title> (bugfix)', function() {
      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="format-detection" content="telephone=no">
            <link href='/images/favicon.png' rel='shortcut icon' type='image/png'>
            <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1'>
            <base href="/examples/update-fragment/" />
            <link href='http://fonts.googleapis.com/css?family=Orbitron:400|Ubuntu+Mono:400,700|Source+Sans+Pro:300,400,700,400italic,700italic' rel='stylesheet' type='text/css'>
            <link href="//netdna.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css" rel="stylesheet">
            <link href="/stylesheets/example/all.css" rel="stylesheet" />
            <script src="/javascripts/example.js"></script>
          </head>
          <body>
            <div class="page">
              <div class="story">
                <h1>Full story</h1>
                <p>Lorem ipsum dolor sit amet.</p>
              
                <a href="preview.html" up-target=".story">
                  Read summary
                </a>
              </div>
            </div>
          </body>
        </html>
      `

      const element = up.element.createBrokenDocumentFromHTML(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')
    })

    it('can parse HTML without a <head>', function() {
      const html = `
        <html>
          <body>
            <h1>Full story</h1>
          </body>
        </html>
      `
      const element = up.element.createBrokenDocumentFromHTML(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')
    })

    it('can parse a HTML fragment without a <body>', function() {
      const html = `
        <h1>Full story</h1>\
      `
      const element = up.element.createBrokenDocumentFromHTML(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')
    })
  })

  describe('up.element.createFromHTML', function() {

    it('creates an element from the given HTML fragment', function() {
      const html = `
        <h1>Full story</h1>
      `
      const element = up.element.createFromHTML(html)
      expect(element.tagName).toEqual('H1')
      expect(element.textContent).toEqual('Full story')
    })

    it('can create <noscript> tags (bugfix)', function() {
      const html = `
        <noscript>alternative content</noscript>\
      `
      const element = up.element.createFromHTML(html)
      expect(element.tagName).toEqual('NOSCRIPT')
      expect(element.textContent).toEqual('alternative content')
    })

    it('can create non-inert <script> tags', asyncSpec(function(next) {
      window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')

      const html = `
        <script>window.scriptTagExecuted()</script>\
      `

      const element = up.element.createFromHTML(html)

      expect(element.tagName).toBe('SCRIPT')
      expect(window.scriptTagExecuted).not.toHaveBeenCalled()

      document.body.appendChild(element)

      return next.after(100, function() {
        expect(window.scriptTagExecuted).toHaveBeenCalled()

        element.remove()
        return delete window.scriptTagExecuted
      })
    }))

    it('create an element when there is leading whitespace in the given string (bugfix)', function() {
      const html = "    <h1>Full story</h1>"
      const element = up.element.createFromHTML(html)
      expect(element.tagName).toEqual('H1')
      expect(element.textContent).toEqual('Full story')
    })

    it("throws an error if there is more than one element in the given string's the root depth", function() {
      const html = "<h1>Full story</h1><h2>Subtitle </h2>"
      const parse = () => up.element.createFromHTML(html)
      expect(parse).toThrowError(/must have a single root element/)
    })

    it("throws an error if there is no element in the given string", function() {
      const html = "    "
      const parse = () => up.element.createFromHTML(html)
      expect(parse).toThrowError(/must have a single root element/)
    })
  })

  describe('up.element.fixedToAbsolute', function() {

    it("changes the given element's position from fixed to absolute, without changing its rendered position", function() {
      const $container = $fixture('.container').css({
        position: 'absolute',
        left: '100px',
        top: '100px',
        backgroundColor: 'yellow'
      })

      const $element = $container.affix('.element').text('element').css({
        position: 'fixed',
        left: '70px',
        top: '30px',
        backgroundColor: 'red'
      })

      const oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      const newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)
    })

    it('correctly positions an element with margins', function() {
      const $container = $fixture('.container').css({
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: 'yellow'
      })

      const $element = $container.affix('.element').text('element').css({
        position: 'fixed',
        left: '40px',
        top: '60px',
        backgroundColor: 'red',
        margin: '15px'
      })

      const oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      const newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)
    })

    it('correctly positions an element when its new offset parent has margins', function() {
      const $container = $fixture('.container').css({
        position: 'absolute',
        left: '100px',
        top: '100px',
        margin: '15px',
        backgroundColor: 'yellow'
      })

      const $element = $container.affix('.element').text('element').css({
        position: 'fixed',
        left: '70px',
        top: '30px',
        backgroundColor: 'red'
      })

      const oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      const newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)
    })

    it('correctly positions an element when the new offset parent is scrolled', function() {
      const $container = $fixture('.container').css({
        position: 'absolute',
        left: '100px',
        top: '100px',
        margin: '15px',
        backgroundColor: 'yellow',
        overflowY: 'scroll'
      })

      const $staticContainerContent = $container.affix('.content').css({height: '3000px'}).scrollTop(100)

      const $element = $container.affix('.element').text('element').css({
        position: 'fixed',
        left: '70px',
        top: '30px',
        backgroundColor: 'red'
      })

      const oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      const newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)
    })
  })

  describe('up.element.attr', function() {

    it('returns the attribute with the given name from the given element', function() {
      const element = up.element.createFromHTML('<div foo="bar"></div>')
      expect(up.element.attr(element, 'foo')).toEqual('bar')
    })

    it('returns an empty string if the attribute is set without value', function() {
      const element = up.element.createFromHTML('<div foo></div>')
      expect(up.element.attr(element, 'foo')).toEqual('')
    })

    it('returns undefined if the element does not have the given attribute (unlike Element#getAttribute(), which would return null)', function() {
      const element = up.element.createFromHTML('<div></div>')
      expect(up.element.attr(element, 'foo')).toBeUndefined()
    })
  })

  describe('up.element.booleanAttr', function() {

    it('returns true if the attribute value is the string "true"', function() {
      const element = up.element.createFromHTML('<div foo="true"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(true)
    })

    it('returns true if the attribute value is the name of the attribute', function() {
      const element = up.element.createFromHTML('<div foo="foo"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(true)
    })

    it('returns false if the attribute value is the string "false"', function() {
      const element = up.element.createFromHTML('<div foo="false"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(false)
    })

    it('returns undefined if the element has no such attribute', function() {
      const element = up.element.createFromHTML('<div></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBeUndefined()
    })

    it('returns true if the attribute value is an unknown string', function() {
      const element = up.element.createFromHTML('<div foo="some text"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(true)
    })

    it('returns the raw attribute value is it is an unknown string and the third `pass` argument is true', function() {
      const element = up.element.createFromHTML('<div foo="some text"></div>')
      expect(up.element.booleanAttr(element, 'foo', true)).toBe('some text')
    })
  })

  describe('up.element.booleanOrStringAttr', function() {

    it('returns true if the attribute value is empty', function() {
      const element = up.element.createFromHTML('<div foo></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(true)
    })

    it('returns true if the attribute value is the string "true"', function() {
      const element = up.element.createFromHTML('<div foo="true"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(true)
    })

    it('returns true if the attribute value is the name of the attribute', function() {
      const element = up.element.createFromHTML('<div foo="foo"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(true)
    })

    it('returns false if the attribute value is the string "false"', function() {
      const element = up.element.createFromHTML('<div foo="false"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(false)
    })

    it('returns undefined if the element has no such attribute', function() {
      const element = up.element.createFromHTML('<div></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBeUndefined()
    })

    it("returns the attribute's raw string value if that value cannot be cast to a boolean", function() {
      const element = up.element.createFromHTML('<div foo="some text"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toEqual('some text')
    })
  })

  describe('up.element.numberAttr', function() {

    it("returns the given attribute's value parsed as an integer", function() {
      const element = up.element.createFromHTML('<div foo="123">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBe(123)
    })

    it("returns the given attribute's value parsed as a float", function() {
      const element = up.element.createFromHTML('<div foo="123.4">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBe(123.4)
    })

    it("returns undefined if the given attribute value cannot be parsed as a number", function() {
      const element = up.element.createFromHTML('<div foo="bar">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBeUndefined()
    })

    it("ignores underscores for digit groups", function() {
      const element = up.element.createFromHTML('<div foo="123_000">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBe(123000)
    })

    it("parses a negative number", function() {
      const element = up.element.createFromHTML('<div foo="-123">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBe(-123)
    })
  })

  describe('up.element.jsonAttr', function() {

    it("returns the given attribute's value parsed as JSON", function() {
      const element = up.element.createFromHTML('<div foo=\'{ "key": "value" }\'></div>')
      expect(up.element.jsonAttr(element, 'foo')).toEqual({ 'key': 'value'})
    })

    it("returns undefined if the given attribute's value is blank", function() {
      const element = up.element.createFromHTML('<div foo=""></div>')
      expect(up.element.jsonAttr(element, 'foo')).toBeUndefined()
    })

    it("returns undefined if the element has no such attribute", function() {
      const element = up.element.createFromHTML('<div></div>')
      expect(up.element.jsonAttr(element, 'foo')).toBeUndefined()
    })
  })

  describe('up.element.closestAttr', function() {

    it('returns the the value of the given attribute on the given element', function() {
      const element = fixture('div[foo=value]')
      expect(up.element.closestAttr(element, 'foo')).toEqual('value')
    })

    it('returns the the value of the given attribute of an ancestor of the given element', function() {
      const grandParent = fixture('div[foo=value]')
      const parent = up.element.affix(grandParent, 'div')
      const element = up.element.affix(parent, 'div')
      expect(up.element.closestAttr(element, 'foo')).toEqual('value')
    })

    it('returns a missing value if neither the given element nor an ancestor have the given attribute', function() {
      const parent = fixture('div')
      const element = up.element.affix(parent, 'div')
      expect(up.element.closestAttr(element, 'foo')).toBeMissing()
    })

    it('uses the third optional argument to parse the attribute', function() {
      const grandParent = fixture('div[foo]')
      const parent = up.element.affix(grandParent, 'div')
      const element = up.element.affix(parent, 'div')
      expect(up.element.closestAttr(element, 'foo', up.element.booleanAttr)).toBe(true)
    })
  })

  describe('up.element.setTemporaryStyle', function() {

    it("sets the given inline styles and returns a function that will restore the previous inline styles", function() {
      const div = fixture('div[style="color: red"]')
      const restore = up.element.setTemporaryStyle(div, { color: 'blue' })
      expect(div.getAttribute('style')).toContain('color: blue')
      expect(div.getAttribute('style')).not.toContain('color: red')
      restore()
      expect(div.getAttribute('style')).not.toContain('color: blue')
      expect(div.getAttribute('style')).toContain('color: red')
    })

    it("does not restore inherited styles", function() {
      const div = fixture('div[class="red-background"]')
      const restore = up.element.setTemporaryStyle(div, { 'background-color': 'blue' })
      expect(div.getAttribute('style')).toContain('background-color: blue')
      restore()
      expect(div.getAttribute('style')).not.toContain('background-color')
    })

    it("sets and restores the given custom properties as inline styles", function() {
      const div = fixture('div')
      const restore = up.element.setTemporaryStyle(div, { '--custom-prop': 'custom-value' })

      expect(div.getAttribute('style')).toContain('--custom-prop: custom-value')
      expect(div.style.getPropertyValue('--custom-prop')).toBe('custom-value')

      restore()

      expect(div.getAttribute('style')).not.toContain('--custom-prop')
      expect(div.style.getPropertyValue('--custom-prop')).toBeBlank()
    })
  })

  describe('up.element.styleNumber()', function() {

    it('returns the computed style for the given element and property, parsed as a number', function() {
      const element = fixture('div')
      element.style.marginRight = '125px'

      expect(up.element.styleNumber(element, 'margin-right')).toBe(125.0)
    })

    it('returns undefined if the element has no such style', function() {
      const element = fixture('div')

      expect(up.element.styleNumber(element, 'unknown-prop')).toBeUndefined()
    })

    it('an inherited style, parsed as a number', function() {
      const container = fixture('div', {style: { 'font-size': '40px' }})
      const element = up.element.affix(container, 'div')

      expect(up.element.styleNumber(element, 'font-size')).toBe(40.0)
    })

    it('returns NaN if the style value cannot be parsed as a number', function() {
      const element = fixture('div')
      element.style.fontFamily = 'Arial'

      expect(up.element.styleNumber(element, 'font-family')).toBeNaN()
    })

    if (up.migrate.loaded) {
      it('returns the computed style for a property in camel-case', function() {
        const warnSpy = up.migrate.warn.mock()
        const element = fixture('div')
        element.style.marginRight = '125px'

        expect(up.element.styleNumber(element, 'marginRight')).toBe(125.0)
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS property names must be in kebab-case'))
      })
    }
  })

  describe('up.element.inlineStyle', function() {

    describe('with a string as second argument', function() {

      it('returns a CSS value string from an inline [style] attribute', function() {
        const div = $fixture('div').attr('style', 'background-color: #ff0000')[0]
        const style = up.element.inlineStyle(div, 'background-color')
        // Browsers convert colors to rgb() values, even IE11
        expect(style).toBe('rgb(255, 0, 0)')
      })

      it('returns a blank value if the element does not have the given property in the [style] attribute', function() {
        const div = $fixture('div').attr('style', 'background-color: red')[0]
        const style = up.element.inlineStyle(div, 'color')
        expect(style).toBeBlank()
      })

      it('returns a blank value the given property is a computed property, but not in the [style] attribute', function() {
        const div = $fixture('div[class="red-background"]')[0]
        const inlineStyle = up.element.inlineStyle(div, 'background-color')
        const computedStyle = up.element.style(div, 'background-color')
        expect(computedStyle).toEqual('rgb(255, 0, 0)')
        expect(inlineStyle).toBeBlank()
      })

      it('returns a custom property from a [style] attribute', function() {
        const div = fixture('div')
        div.setAttribute('style', 'background-color: #ff0000; --custom-property: custom-value;')
        const style = up.element.inlineStyle(div, '--custom-property')
        expect(style).toBe('custom-value')
      })
    })

    describe('with an array as second argument', function() {

      it('returns an object with the given inline [style] properties', function() {
        const div = $fixture('div').attr('style', 'background-color: #ff0000; color: #0000ff')[0]
        const style = up.element.inlineStyle(div, ['background-color', 'color'])
        expect(style).toEqual({
          'background-color': 'rgb(255, 0, 0)',
          color: 'rgb(0, 0, 255)'
        })
      })

      it('returns blank keys if the element does not have the given property in the [style] attribute', function() {
        const div = $fixture('div').attr('style', 'background-color: #ff0000')[0]
        const style = up.element.inlineStyle(div, ['background-color', 'color'])
        expect(style).toHaveOwnProperty('color')
        expect(style.color).toBeBlank()
      })

      it('returns a blank value the given property is a computed property, but not in the [style] attribute', function() {
        const div = fixture('div[class="red-background"]')
        const inlineStyleHash = up.element.inlineStyle(div, ['background-color'])
        const computedBackground = up.element.style(div, 'background-color')
        expect(computedBackground).toEqual('rgb(255, 0, 0)')
        expect(inlineStyleHash).toHaveOwnProperty('background-color')
        expect(inlineStyleHash['background-color']).toBeBlank()
      })

      it('supports custom properties', function() {
        const div = fixture('div')
        div.setAttribute('style', 'background-color: #ff0000; --custom-property: custom-value; color: #00ff00;')
        const style = up.element.inlineStyle(div, ['--custom-property', 'color'])
        expect(style).toEqual({
          '--custom-property': 'custom-value',
          'color': 'rgb(0, 255, 0)',
        })
      })
    })
  })

  describe('up.element.setStyle', function() {

    it("sets the given style properties as the given element's [style] attribute", function() {
      const div = fixture('div')
      up.element.setStyle(div, { 'color': 'red', 'background-color': 'blue' })
      const style = div.getAttribute('style')
      expect(style).toContain('color: red')
      expect(style).toContain('background-color: blue')
    })

    it("merges the given style properties into the given element's existing [style] value", function() {
      const div = fixture('div[style="color: red"]')
      up.element.setStyle(div, { 'background-color': 'blue' })
      const style = div.getAttribute('style')
      expect(style).toContain('color: red')
      expect(style).toContain('background-color: blue')
    })

    if (up.migrate.loaded) {
      it('sets the given style properties in camelCase', function() {
        const warnSpy = up.migrate.warn.mock()
        const div = fixture('div')
        up.element.setStyle(div, { fontFamily: 'Roboto', backgroundColor: 'blue' })

        const style = div.getAttribute('style')
        expect(style).toContain('font-family: Roboto')
        expect(style).toContain('background-color: blue')
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS property names must be in kebab-case'))
      })

      it("converts the values of known length properties to px values automatically (with kebab-case)", function() {
        const warnSpy = up.migrate.warn.mock()
        const div = fixture('div')
        up.element.setStyle(div, { 'padding-top': 100 })

        const style = div.getAttribute('style')
        expect(style).toContain('padding-top: 100px')

        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS length values must have a unit'))
      })

      it("converts the values of known length properties to px values automatically (with camelCase)", function() {
        const warnSpy = up.migrate.warn.mock()
        const div = fixture('div')
        up.element.setStyle(div, { 'paddingTop': 100 })

        const style = div.getAttribute('style')
        expect(style).toContain('padding-top: 100px')

        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS length values must have a unit'))
      })
    }

    it('sets a custom property', function() {
      const div = fixture('div')
      up.element.setStyle(div, { '--custom-property': 'custom-value' })
      expect(div.getAttribute('style')).toContain('--custom-property: custom-value')
      expect(div.style.getPropertyValue('--custom-property')).toBe('custom-value')
    })
  })

  describe('up.element.style', function() {

    it('returns the computed style for the given CSS property', function() {
      const div = fixture('div')
      div.style.paddingTop = '10px'
      const value = up.element.style(div, 'padding-top')
      expect(value).toEqual('10px')
    })

    it('returns an empty string if the element has no such property (like getPropertyValue())', function() {
      const div = fixture('div')
      const value = up.element.style(div, 'missing-property')
      expect(value).toBe('')
    })

    it('returns the computed style for the given custom property', function() {
      const div = fixture('div')
      div.setAttribute('style', '--custom-property: custom-value')
      const value = up.element.style(div, '--custom-property')
      expect(value).toEqual('custom-value')
    })

    if (up.migrate.loaded) {
      it('returns the computed style for a CSS property given in camelCase', function() {
        const warnSpy = up.migrate.warn.mock()
        const div = fixture('div')
        div.style.paddingTop = '10px'

        const value = up.element.style(div, 'paddingTop')
        expect(value).toEqual('10px')

        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS property names must be in kebab-case'))
      })
    }

    describe('with an array of multiple property names', function() {

      it('returns the computed styles as an object', function() {
        const div = fixture('div')
        div.setAttribute('style', '--foo-property: foo-value; --bar-property: bar-value;')
        const value = up.element.style(div, ['--foo-property', '--bar-property'])
        expect(value).toEqual({
          '--foo-property': 'foo-value',
          '--bar-property': 'bar-value'
        })
      })

      it('returns unset properties as empty strings', function() {
        const div = fixture('div')
        div.style.paddingTop = '10px'
        const value = up.element.style(div, ['padding-top', 'missing-prop'])
        expect(value).toEqual({
          'padding-top': '10px',
          'missing-prop': '',
        })
      })
    })
  })

  describe('up.element.isVisible', function() {

    it('returns true for an attached element', function() {
      const element = fixture('.element', {text: 'content'})
      expect(up.element.isVisible(element)).toBe(true)
    })

    it('returns true for an attached block element without content', function() {
      const element = fixture('div.element')
      expect(up.element.isVisible(element)).toBe(true)
    })

    it('returns true for an attached inline element without content', function() {
      const element = fixture('span.element')
      expect(up.element.isVisible(element)).toBe(true)
    })

    it('returns false for a detached element', function() {
      const element = document.createElement('text')
      element.innerText = 'content'
      expect(up.element.isVisible(element)).toBe(false)
    })

    it('returns false for an attached element with { display: none }', function() {
      const element = fixture('.element', {text: 'content', style: { display: 'none' }})
      expect(up.element.isVisible(element)).toBe(false)
    })
  })

  describe('up.element.classSelector', function() {
    it('escapes all colons', function() {
      const element = fixture('div')
      element.classList.add('print:sm:hidden')
      expect(up.element.classSelector('print:sm:hidden')).toBe('.print\\:sm\\:hidden')
    })

    it('escapes all square-brackets', function() {
      const element = fixture('div')
      element.classList.add('text-[2rem]')
      expect(up.element.classSelector('text-[2rem]')).toBe('.text-\\[2rem\\]')
    })

    it('escapes all periods', function() {
      const element = fixture('div')
      element.classList.add('text-[.8125rem]')
      expect(up.element.classSelector('text-[.8125rem]')).toBe('.text-\\[\\.8125rem\\]')
    })

    it('escapes all exclamation marks', function() {
      const element = fixture('div')
      element.classList.add('!font-bold')
      expect(up.element.classSelector('!font-bold')).toBe('.\\!font-bold')
    })
  })


  describe('up.element.hide()', function() {

    it('makes the given element invisible', function() {
      const element = fixture('div')
      expect(element).toBeVisible()

      up.element.hide(element)

      expect(element).not.toBeVisible()
    })

    it('allows users to implement custom hide behavior through CSS', function() {
      fixtureStyle(`
        .other[hidden] {
          display: block !important;
          height: 0px;
        }
      `)

      const other = fixture('.other')
      up.element.hide(other)

      expect(getComputedStyle(other).display).toBe('block')
      expect(getComputedStyle(other).height).toBe('0px')
    })
  })


  describe('up.element.show()', function() {

    it('shows the given invisible element', function() {
      const element = fixture('div')
      up.element.hide(element)
      expect(element).not.toBeVisible()

      up.element.show(element)

      expect(element).toBeVisible()
    })

    it('restores the { display } property the element had before hiding', function() {
      const element = fixture('div', {style: { display: 'flex'}})
      expect(getComputedStyle(element).display).toBe('flex')
      up.element.hide(element)
      expect(element).not.toBeVisible()

      up.element.show(element)

      expect(element).toBeVisible()
      expect(getComputedStyle(element).display).toBe('flex')
    })
  })

  describe('up.element.isEmpty()', function() {

    it('returns true for an element without text and without children', function() {
      const element = up.element.createFromHTML('<span></span>')

      expect(up.element.isEmpty(element)).toBe(true)
    })

    it('returns false for an element with text', function() {
      const element = up.element.createFromHTML('<span>text</span>')

      expect(up.element.isEmpty(element)).toBe(false)
    })

    it('returns false for an element with a child element', function() {
      const element = up.element.createFromHTML('<div><span>text</span></div>')

      expect(up.element.isEmpty(element)).toBe(false)
    })

    it('returns false for an element with an empty child element', function() {
      const element = up.element.createFromHTML('<div><span></span></div>')

      expect(up.element.isEmpty(element)).toBe(false)
    })
  })

  describe('up.element.parseSelector()', function() {

    it('parses a selector with tag name, IDs, classes and attributes', function() {
      const parsed = up.element.parseSelector('tag-name#id.klass[attr=value]')

      expect(parsed.includePath).toEqual([{
        tagName: 'tag-name',
        id: 'id',
        classNames: ['klass'],
        attributes: { attr: 'value' }
      }])
    })

    it('unescapes quotes in attribute values', function() {
      const parsed = up.element.parseSelector('[attr="foo\\"bar"]')

      expect(parsed.includePath[0].attributes).toEqual({ attr: 'foo"bar' })
    })

    it('parses a descendant selector', function() {
      const parsed = up.element.parseSelector('.content > form[action="/"]')

      expect(parsed.includePath).toEqual([
        {
          tagName: null,
          id: null,
          classNames: ['content'],
          attributes: {}
        },
        {
          tagName: 'form',
          id: null,
          classNames: [],
          attributes: { action: "/" }
        },
      ])
    })

    it('parses a :not() suffix', function() {
      const parsed = up.element.parseSelector('.foo:not(.bar)')

      expect(parsed.includePath).toEqual([{
        tagName: null,
        id: null,
        classNames: ['foo'],
        attributes: {}
      }])

      expect(parsed.excludeRaw).toEqual(':not(.bar)')
    })
  })

  if (up.migrate.loaded) {
    describe('up.element.isAttached()', function() {

      it('returns true for the document', function() {
        const result = up.element.isAttached(document)
        expect(result).toBe(true)
      })

      it('returns true for the <html> element', function() {
        const result = up.element.isAttached(document.documentElement)
        expect(result).toBe(true)
      })

      it('returns true for the <body> element', function() {
        const result = up.element.isAttached(document.body)
        expect(result).toBe(true)
      })

      it('returns true for an attached element', function() {
        const element = fixture('.foo')
        const result = up.element.isAttached(element)
        expect(result).toBe(true)
      })

      it('returns false for a detached element', function() {
        const element = document.createElement('div')
        const result = up.element.isAttached(element)
        expect(result).toBe(false)
      })

      it('returns false for a once-attached that was removed', function() {
        const element = fixture('.foo')
        element.remove()
        const result = up.element.isAttached(element)
        expect(result).toBe(false)
      })
    })
  }
})
