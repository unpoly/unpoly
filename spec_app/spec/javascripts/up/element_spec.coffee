u = up.util
$ = jQuery

describe 'up.element', ->

  describe 'up.element.get()', ->

    it 'returns the given element', ->
      element = fixture('.element')
      expect(up.element.get(element)).toBe(element)

    it 'returns the first element in the given jQuery collection', ->
      $element = $fixture('.element')
      expect(up.element.get($element)).toBe($element[0])

    it 'throws an error if passed a jQuery collection with multiple elements', ->
      $element1 = $fixture('.element')
      $element2 = $fixture('.element')
      $list = $element1.add($element2)
      get = -> up.element.get($list)
      expect(get).toThrowError(/cannot cast/i)

    it 'returns the first element matching the given CSS selector string', ->
      match = fixture('.match')
      expect(up.element.get('.match')).toBe(match)

    it 'returns the given document object', ->
      expect(up.element.get(document)).toBe(document)

    it 'returns the given window object', ->
      expect(up.element.get(window)).toBe(window)

    it 'returns undefined for undefined', ->
      expect(up.element.get(undefined)).toBeUndefined()

    it 'returns null for null', ->
      expect(up.element.get(null)).toBeNull()

  describe 'up.element.first()', ->

    it 'returns the first element matching the given selector', ->
      match = fixture('.match')
      otherMatch = fixture('.match')
      noMatch = fixture('.no-match')
      result = up.element.first('.match')
      expect(result).toBe(match)

    it 'supports the custom :has() selector', ->
      match = fixture('.match')
      otherMatch = fixture('.match')
      otherMatchChild = up.element.affix(otherMatch, '.child')

      result = up.element.first('.match:has(.child)')
      expect(result).toBe(otherMatch)

    describe 'when given a root element for the search', ->

      it 'returns the first descendant of the given root that matches the given selector', ->
        $element = $fixture('.element')
        $matchingChild = $element.affix('.child.match')
        $matchingGrandChild = $matchingChild.affix('.grand-child.match')
        $otherChild = $element.affix('.child')
        $otherGrandChild = $otherChild.affix('.grand-child')
        result = up.element.first($element[0], '.match')
        expect(result).toEqual $matchingChild[0]

      it 'returns missing if no descendant matches', ->
        $element = $fixture('.element')
        $child = $element.affix('.child')
        $grandChild = $child.affix('.grand-child')
        result = up.element.first($element[0], '.match')
        expect(result).toBeMissing()

      it 'does not return the root itself, even if it matches', ->
        $element = $fixture('.element.match')
        result = up.element.first($element[0], '.match')
        expect(result).toBeMissing()

      it 'does not return an ancestor of the root, even if it matches', ->
        $parent = $fixture('.parent.match')
        $element = $parent.affix('.element')
        result = up.element.first($element[0], '.match')
        expect(result).toBeMissing()

      it 'supports the custom :has() selector', ->
        $element = $fixture('.element')
        $childWithSelectorWithChild = $element.affix('.selector')
        $childWithSelectorWithChild.affix('.match')
        $childWithSelectorWithoutChild = $element.affix('.selector')
        $childWithoutSelectorWithChild = $element.affix('.other-selector')
        $childWithoutSelectorWithChild.affix('.match')
        $childWithoutSelectorWithoutChild = $fixture('.other-selector')

        result = up.element.first($element[0], '.selector:has(.match)')
        expect(result).toBe $childWithSelectorWithChild[0]

      it 'supports the custom :has() selector when a previous sibling only matches its own selector, but not the descendant selector (bugfix)', ->
        $element = $fixture('.element')
        $childWithSelectorWithoutChild = $element.affix('.selector')
        $childWithSelectorWithChild = $element.affix('.selector')
        $childWithSelectorWithChild.affix('.match')

        result = up.element.first($element[0], '.selector:has(.match)')
        expect(result).toBe $childWithSelectorWithChild[0]

  describe 'up.element.all()', ->

    it 'returns all elements matching the given selector', ->
      match = fixture('.match')
      otherMatch = fixture('.match')
      noMatch = fixture('.no-match')
      result = up.element.all('.match')
      expect(result).toMatchList [match, otherMatch]

    it 'supports the custom :has() selector'

    describe 'when given a root element for the search', ->

      it 'returns all descendants of the given root matching the given selector', ->
        $element = $fixture('.element')
        $matchingChild = $element.affix('.child.match')
        $matchingGrandChild = $matchingChild.affix('.grand-child.match')
        $otherChild = $element.affix('.child')
        $otherGrandChild = $otherChild.affix('.grand-child')
        results = up.element.all($element[0], '.match')
        expect(results).toEqual [$matchingChild[0], $matchingGrandChild[0]]

      it 'returns an empty list if no descendant matches', ->
        $element = $fixture('.element')
        $child = $element.affix('.child')
        $grandChild = $child.affix('.grand-child')
        results = up.element.all($element[0], '.match')
        expect(results).toEqual []

      it 'does not return the root itself, even if it matches', ->
        $element = $fixture('.element.match')
        results = up.element.all($element[0], '.match')
        expect(results).toEqual []

      it 'does not return ancestors of the root, even if they match', ->
        $parent = $fixture('.parent.match')
        $element = $parent.affix('.element')
        results = up.element.all($element[0], '.match')
        expect(results).toEqual []

      it 'supports the custom :has() selector', ->
        $element = $fixture('.element')
        $childWithSelectorWithChild = $element.affix('.selector')
        $childWithSelectorWithChild.affix('.match')
        $childWithSelectorWithoutChild = $element.affix('.selector')
        $childWithoutSelectorWithChild = $element.affix('.other-selector')
        $childWithoutSelectorWithChild.affix('.match')
        $childWithoutSelectorWithoutChild = $fixture('.other-selector')

        results = up.element.all($element[0], '.selector:has(.match)')
        expect(results).toEqual [$childWithSelectorWithChild[0]]

  describe 'up.element.list()', ->

    it 'returns the given array of elements', ->
      array = [document.body]
      result = up.element.list(array)
      expect(result).toEqual(array)

    it 'returns an empty list for undefined', ->
      result = up.element.list(undefined)
      expect(result).toEqual []

    it 'returns an empty list for null', ->
      result = up.element.list(null)
      expect(result).toEqual []

    it 'converts a NodeList to an array', ->
      nodeList = document.querySelectorAll('body')
      result = up.element.list(nodeList)
      expect(u.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(result[0]).toBe(document.body)

    it 'returns a concatenated array from multiple lists and elements', ->
      div0 = $fixture('div.div0')[0]
      div1 = $fixture('div.div1')[0]
      div2 = $fixture('div.div2')[0]
      div3 = $fixture('div.div3')[0]

      result = up.element.list(div0, [div1, div2], div3)
      expect(u.isArray(result)).toBe(true)
      expect(result).toEqual [div0, div1, div2, div3]

    it 'ignores missing values when concatenating arrays', ->
      div0 = $fixture('div.div0')[0]
      div1 = $fixture('div.div1')[0]
      div2 = $fixture('div.div2')[0]
      div3 = $fixture('div.div3')[0]

      result = up.element.list(null, div0, [div1, div2], undefined, div3)
      expect(u.isArray(result)).toBe(true)
      expect(result).toEqual [div0, div1, div2, div3]

  describe 'up.element.subtree()', ->

    it 'returns all descendants of the given root matching the given selector', ->
      $element = $fixture('.element')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      results = up.element.subtree($element[0], '.match')
      expect(results).toEqual [$matchingChild[0], $matchingGrandChild[0]]

    it 'includes the given root if it matches the selector', ->
      $element = $fixture('.element.match')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      results = up.element.subtree($element[0], '.match')
      expect(results).toEqual [$element[0], $matchingChild[0], $matchingGrandChild[0]]

    it 'does not return ancestors of the root, even if they match', ->
      $parent = $fixture('.parent.match')
      $element = $parent.affix('.element')
      results = up.element.subtree($element[0], '.match')
      expect(results).toEqual []

    it 'returns an empty list if neither root nor any descendant matches', ->
      $element = $fixture('.element')
      $child = $element.affix('.child')
      results = up.element.subtree($element[0], '.match')
      expect(results).toEqual []

    it 'supports the custom :has() selector', ->
      $element = $fixture('.selector')
      $childWithSelectorWithChild = $element.affix('.selector')
      $childWithSelectorWithChild.affix('.match')
      $childWithSelectorWithoutChild = $element.affix('.selector')
      $childWithoutSelectorWithChild = $element.affix('.other-selector')
      $childWithoutSelectorWithChild.affix('.match')
      $childWithoutSelectorWithoutChild = $fixture('.other-selector')

      results = up.element.subtree($element[0], '.selector:has(.match)')
      expect(results).toEqual [$element[0], $childWithSelectorWithChild[0]]

  describe 'up.element.closest()', ->

    it 'returns the closest ancestor of the given root that matches the given selector', ->
      $grandGrandMother = $fixture('.match')
      $grandMother = $fixture('.match')
      $mother = $grandMother.affix('.no-match')
      $element = $mother.affix('.element')

      result = up.element.closest($element[0], '.match')
      expect(result).toBe($grandMother[0])

    it 'returns the given root if it matches', ->
      $mother = $fixture('.match')
      $element = $mother.affix('.match')

      result = up.element.closest($element[0], '.match')
      expect(result).toBe($element[0])

    it 'does not return descendants of the root, even if they match', ->
      $element = $fixture('.element')
      $child = $element.affix('.match')

      result = up.element.closest($element[0], '.match')
      expect(result).toBeMissing()

    it 'returns missing if neither root nor ancestor matches', ->
      $mother = $fixture('.no-match')
      $element = $mother.affix('.no-match')

      result = up.element.closest($element[0], '.match')
      expect(result).toBeMissing()

  describe 'up.element.ancestor()', ->

    it 'returns the closest ancestor of the given root that matches the given selector', ->
      $grandGrandMother = $fixture('.match')
      $grandMother = $fixture('.match')
      $mother = $grandMother.affix('.no-match')
      $element = $mother.affix('.element')

      result = up.element.ancestor($element[0], '.match')
      expect(result).toBe($grandMother[0])

    it 'does not return the given root, even if it matches', ->
      $element = $fixture('.match')

      result = up.element.ancestor($element[0], '.match')
      expect(result).toBeMissing()

    it 'does not return descendants of the root, even if they match', ->
      $element = $fixture('.element')
      $child = $element.affix('.match')

      result = up.element.ancestor($element[0], '.match')
      expect(result).toBeMissing()

    it 'returns missing if no ancestor matches', ->
      $mother = $fixture('.no-match')
      $element = $mother.affix('.no-match')

      result = up.element.ancestor($element[0], '.match')
      expect(result).toBeMissing()

  describe 'up.element.emit()', ->

  describe 'up.element.remove()', ->

    it 'removes the given element from the DOM', ->
      element = fixture('.element')
      expect(element).toBeAttached()
      up.element.remove(element)
      expect(element).toBeDetached()

  describe 'up.element.toggle()', ->

    it 'hides the given element if it is visible', ->
      element = fixture('.element')
      up.element.toggle(element)
      expect(element).toBeHidden()

    it 'shows the given element if it is hidden', ->
      element = fixture('.element', style: { display: 'none' })
      up.element.toggle(element)
      expect(element).toBeVisible()

    it 'hides the given element if the second argument is false', ->
      element = fixture('.element')
      expect(element).toBeVisible()
      up.element.toggle(element, false)
      expect(element).toBeHidden()

    it 'shows the given element if the second argument is true', ->
      element = fixture('.element')
      element.style.display = 'none'
      expect(element).toBeHidden()
      up.element.toggle(element, true)
      expect(element).toBeVisible()

  describe 'up.element.createFromSelector()', ->

    it 'creates an element with a given tag', ->
      element = up.element.createFromSelector('table')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')

    it 'creates a custom element with a dash-separated tag name', ->
      element = up.element.createFromSelector('ta-belle')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TA-BELLE')

    it 'creates an element with a given tag and class', ->
      element = up.element.createFromSelector('table.foo')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')
      expect(element.className).toEqual('foo')

    it 'creates an element with multiple classes', ->
      element = up.element.createFromSelector('table.foo.bar')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')
      expect(element.className).toEqual('foo bar')

    it 'creates an element with a given tag and ID', ->
      element = up.element.createFromSelector('table#foo')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('TABLE')
      expect(element.id).toEqual('foo')

    it 'creates a <div> if no tag is given', ->
      element = up.element.createFromSelector('.foo')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('DIV')
      expect(element.className).toEqual('foo')

    it 'creates a hierarchy of elements for a descendant selector, and returns the root element', ->
      parent = up.element.createFromSelector('ul.foo li.bar')
      expect(parent).toBeElement()
      expect(parent.tagName).toEqual('UL')
      expect(parent.className).toEqual('foo')
      expect(parent.children.length).toBe(1)
      expect(parent.firstChild.tagName).toEqual('LI')
      expect(parent.firstChild.className).toEqual('bar')

    it 'creates a hierarchy of elements for a child selector, and returns the root element', ->
      parent = up.element.createFromSelector('ul.foo > li.bar')
      expect(parent).toBeElement()
      expect(parent.tagName).toEqual('UL')
      expect(parent.className).toEqual('foo')
      expect(parent.children.length).toBe(1)
      expect(parent.firstChild.tagName).toEqual('LI')
      expect(parent.firstChild.className).toEqual('bar')

    it 'creates an element with an attribute', ->
      element = up.element.createFromSelector('ul[foo=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'creates an element with a value-less attribute', ->
      element = up.element.createFromSelector('ul[foo]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('')

    it 'creates an element with multiple attributes', ->
      element = up.element.createFromSelector('ul[foo=bar][baz=bam]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')
      expect(element.getAttribute('baz')).toEqual('bam')

    it 'allows to quote attribute values with double quotes', ->
      element = up.element.createFromSelector('ul[foo="bar baz"]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar baz')

    it 'allows to quote attribute values with single quotes', ->
      element = up.element.createFromSelector("ul[foo='bar baz']")
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar baz')

    it 'throws an error when encountering an unknown selector', ->
      parse = -> up.element.createFromSelector("ul~baz")
      expect(parse).toThrowError('Cannot parse selector: ul~baz')

  describe 'up.element.toSelector', ->

    it "prefers using the element's 'up-id' attribute to using the element's ID", ->
      $element = $fixture('div[up-id=up-id-value]#id-value')
      expect(up.element.toSelector($element)).toBe('[up-id="up-id-value"]')

    it "prefers using the element's ID to using the element's name", ->
      $element = $fixture('div#id-value[name=name-value]')
      expect(up.element.toSelector($element)).toBe("#id-value")

    it "selects the ID with an attribute selector if the ID contains a slash", ->
      $element = $fixture('div').attr(id: 'foo/bar')
      expect(up.element.toSelector($element)).toBe('[id="foo/bar"]')

    it "selects the ID with an attribute selector if the ID contains a space", ->
      $element = $fixture('div').attr(id: 'foo bar')
      expect(up.element.toSelector($element)).toBe('[id="foo bar"]')

    it "selects the ID with an attribute selector if the ID contains a dot", ->
      $element = $fixture('div').attr(id: 'foo.bar')
      expect(up.element.toSelector($element)).toBe('[id="foo.bar"]')

    it "selects the ID with an attribute selector if the ID contains a quote", ->
      $element = $fixture('div').attr(id: 'foo"bar')
      expect(up.element.toSelector($element)).toBe('[id="foo\\"bar"]')

    it "prefers using the element's tagName + [name] to using the element's classes", ->
      $element = $fixture('input[name=name-value].class1.class2')
      expect(up.element.toSelector($element)).toBe('input[name="name-value"]')

    it "prefers using the element's classes to using the element's ARIA label", ->
      $element = $fixture('div.class1.class2[aria-label="ARIA label value"]')
      expect(up.element.toSelector($element)).toBe(".class1.class2")

    it 'does not use Unpoly classes to compose a class selector', ->
      $element = $fixture('div.class1.up-current.class2')
      expect(up.element.toSelector($element)).toBe(".class1.class2")

    it "prefers using the element's ARIA label to using the element's tag name", ->
      $element = $fixture('div[aria-label="ARIA label value"]')
      expect(up.element.toSelector($element)).toBe('[aria-label="ARIA label value"]')

    it "uses the element's tag name if no better description is available", ->
      $element = $fixture('div')
      expect(up.element.toSelector($element)).toBe("div")

    it 'escapes quotes in attribute selector values', ->
      $element = $fixture('div')
      $element.attr('aria-label', 'foo"bar')
      expect(up.element.toSelector($element)).toBe('[aria-label="foo\\"bar"]')

  describe 'up.element.createDocumentFromHtml', ->

    it 'parses a string that contains a serialized HTML document', ->
      string = """
        <html lang="foo">
          <head>
            <title>document title</title>
          </head>
          <body data-env='production'>
            <div>line 1</div>
            <div>line 2</div>
          </body>
        </html>
        """

      element = up.element.createDocumentFromHtml(string)

      expect(element.querySelector('head title').textContent).toEqual('document title')
      expect(element.querySelector('body').getAttribute('data-env')).toEqual('production')
      expect(element.querySelectorAll('body div').length).toBe(2)
      expect(element.querySelectorAll('body div')[0].textContent).toEqual('line 1')
      expect(element.querySelectorAll('body div')[1].textContent).toEqual('line 2')

    it 'parses a string that contains carriage returns (bugfix)', ->
      string = """
        <html>\r
          <body>\r
            <div>line</div>\r
          </body>\r
        </html>\r
        """

      $element = up.element.createDocumentFromHtml(string)
      expect($element.querySelector('body')).toBeGiven()
      expect($element.querySelector('body div').textContent).toEqual('line')

    it 'does not run forever if a page has a <head> without a <title> (bugfix)', ->
      html = """
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
        """
      element = up.element.createDocumentFromHtml(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')

    it 'can parse HTML without a <head>', ->
      html = """
        <html>
          <body>
            <h1>Full story</h1>
          </body>
        </html>
        """
      element = up.element.createDocumentFromHtml(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')

    it 'can parse a HTML fragment without a <body>', ->
      html = """
        <h1>Full story</h1>
        """
      element = up.element.createDocumentFromHtml(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')

  describe 'up.element.createFromHtml', ->

    it 'creates an element from the given HTML fragment', ->
      html = """
        <h1>Full story</h1>
        """
      element = up.element.createFromHtml(html)
      expect(element.tagName).toEqual('H1')
      expect(element.textContent).toEqual('Full story')

  describe 'up.element.fixedToAbsolute', ->

    it "changes the given element's position from fixed to absolute, without changing its rendered position", ->
      $container = $fixture('.container').css
        position: 'absolute'
        left: '100px'
        top: '100px'
        backgroundColor: 'yellow'

      $element = $container.affix('.element').text('element').css
        position: 'fixed',
        left: '70px'
        top: '30px'
        backgroundColor: 'red'

      oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)

    it 'correctly positions an element with margins', ->
      $container = $fixture('.container').css
        position: 'absolute'
        left: '20px'
        top: '20px'
        backgroundColor: 'yellow'

      $element = $container.affix('.element').text('element').css
        position: 'fixed',
        left: '40px'
        top: '60px'
        backgroundColor: 'red'
        margin: '15px'

      oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)

    it 'correctly positions an element when its new offset parent has margins', ->
      $container = $fixture('.container').css
        position: 'absolute'
        left: '100px'
        top: '100px'
        margin: '15px',
        backgroundColor: 'yellow'

      $element = $container.affix('.element').text('element').css
        position: 'fixed',
        left: '70px'
        top: '30px'
        backgroundColor: 'red'

      oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)

    it 'correctly positions an element when the new offset parent is scrolled', ->
      $container = $fixture('.container').css
        position: 'absolute'
        left: '100px'
        top: '100px'
        margin: '15px',
        backgroundColor: 'yellow'
        overflowY: 'scroll'

      $staticContainerContent = $container.affix('.content').css(height: '3000px').scrollTop(100)

      $element = $container.affix('.element').text('element').css
        position: 'fixed',
        left: '70px'
        top: '30px'
        backgroundColor: 'red'

      oldRect = up.Rect.fromElement($element[0])

      up.element.fixedToAbsolute($element[0])

      expect($element.css('position')).toEqual('absolute')
      newRect = up.Rect.fromElement($element[0])
      expect(newRect).toEqual(oldRect)

  describe 'up.element.castedAttr', ->
    
    it 'returns true if the attribute value is the string "true"', ->
      element = fixture('div[foo=true]')
      expect(up.element.castedAttr(element, 'foo')).toBe(true)

    it 'returns true if the attribute value is the name of the attribute', ->
      element = fixture('div[foo=foo]')
      expect(up.element.castedAttr(element, 'foo')).toBe(true)

    it 'returns false if the attribute value is the string "false"', ->
      element = fixture('div[foo=false]')
      expect(up.element.castedAttr(element, 'foo')).toBe(false)

    it 'returns a missing value if the element has no such attribute', ->
      element = fixture('div')
      expect(up.element.castedAttr(element, 'foo')).toBeMissing()

    it 'returns the attribute value unchanged if the value is some string', ->
      element = fixture('div[foo="some text"]')
      expect(up.element.castedAttr(element, 'foo')).toBe('some text')

  describe 'up.element.setTemporaryStyle', ->

    it "sets the given inline styles and returns a function that will restore the previous inline styles", ->
      $div = $fixture('div[style="color: red"]')
      restore = up.element.setTemporaryStyle($div, { color: 'blue' })
      expect($div.attr('style')).toContain('color: blue')
      expect($div.attr('style')).not.toContain('color: red')
      restore()
      expect($div.attr('style')).not.toContain('color: blue')
      expect($div.attr('style')).toContain('color: red')

    it "does not restore inherited styles", ->
      $div = $fixture('div[class="red-background"]')
      restore = up.element.setTemporaryStyle($div, { backgroundColor: 'blue' })
      expect($div.attr('style')).toContain('background-color: blue')
      restore()
      expect($div.attr('style')).not.toContain('background-color')

  describe 'up.element.inlineStyle', ->

    describe 'with a string as second argument', ->

      it 'returns a CSS value string from an inline [style] attribute', ->
        $div = $fixture('div').attr('style', 'background-color: #ff0000')
        style = up.element.inlineStyle($div, 'backgroundColor')
        # Browsers convert colors to rgb() values, even IE11
        expect(style).toEqual('rgb(255, 0, 0)')

      it 'returns a blank value if the element does not have the given property in the [style] attribute', ->
        $div = $fixture('div').attr('style', 'background-color: red')
        style = up.element.inlineStyle($div, 'color')
        expect(style).toBeBlank()

      it 'returns a blank value the given property is a computed property, but not in the [style] attribute', ->
        $div = $fixture('div[class="red-background"]')
        inlineStyle = up.element.inlineStyle($div, 'backgroundColor')
        computedStyle = up.element.computedStyle($div, 'backgroundColor')
        expect(computedStyle).toEqual('rgb(255, 0, 0)')
        expect(inlineStyle).toBeBlank()

    describe 'with an array as second argument', ->

      it 'returns an object with the given inline [style] properties', ->
        $div = $fixture('div').attr('style', 'background-color: #ff0000; color: #0000ff')
        style = up.element.inlineStyle($div, ['backgroundColor', 'color'])
        expect(style).toEqual
          backgroundColor: 'rgb(255, 0, 0)'
          color: 'rgb(0, 0, 255)'

      it 'returns blank keys if the element does not have the given property in the [style] attribute', ->
        $div = $fixture('div').attr('style', 'background-color: #ff0000')
        style = up.element.inlineStyle($div, ['backgroundColor', 'color'])
        expect(style).toHaveOwnProperty('color')
        expect(style.color).toBeBlank()

      it 'returns a blank value the given property is a computed property, but not in the [style] attribute', ->
        $div = $fixture('div[class="red-background"]')
        inlineStyleHash = up.element.inlineStyle($div, ['backgroundColor'])
        computedBackground = up.element.computedStyle($div, 'backgroundColor')
        expect(computedBackground).toEqual('rgb(255, 0, 0)')
        expect(inlineStyleHash).toHaveOwnProperty('backgroundColor')
        expect(inlineStyleHash.backgroundColor).toBeBlank()

  describe 'up.element.setInlineStyle', ->

    it "sets the given style properties as the given element's [style] attribute", ->
      $div = $fixture('div')
      up.element.setInlineStyle($div, { color: 'red', backgroundColor: 'blue' })
      style = $div.attr('style')
      expect(style).toContain('color: red')
      expect(style).toContain('background-color: blue')

    it "merges the given style properties into the given element's existing [style] value", ->
      $div = $fixture('div[style="color: red"]')
      up.element.setInlineStyle($div, { backgroundColor: 'blue' })
      style = $div.attr('style')
      expect(style).toContain('color: red')
      expect(style).toContain('background-color: blue')

    it "converts the values of known length properties to px values automatically", ->
      $div = $fixture('div')
      up.element.setInlineStyle($div, { paddingTop: 100 })
      style = $div.attr('style')
      expect(style).toContain('padding-top: 100px')

  describe 'up.element.isVisible', ->

    it 'returns true for an attached element', ->
      element = fixture('.element', text: 'content')
      expect(up.element.isVisible(element)).toBe(true)

    it 'returns true for an attached block element without content', ->
      element = fixture('div.element')
      expect(up.element.isVisible(element)).toBe(true)

    it 'returns true for an attached inline element without content', ->
      element = fixture('span.element')
      expect(up.element.isVisible(element)).toBe(true)

    it 'returns false for a detached element', ->
      element = document.createElement('text')
      element.innerText = 'content'
      expect(up.element.isVisible(element)).toBe(false)

    it 'returns false for an attached element with { display: none }', ->
      element = fixture('.element', text: 'content', style: { display: 'none' })
      expect(up.element.isVisible(element)).toBe(false)
