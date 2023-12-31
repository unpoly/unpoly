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

    it 'returns the given document object', ->
      expect(up.element.get(document)).toBe(document)

    it 'returns the given window object', ->
      expect(up.element.get(window)).toBe(window)

    it 'returns undefined for undefined', ->
      expect(up.element.get(undefined)).toBeUndefined()

    it 'returns null for null', ->
      expect(up.element.get(null)).toBeNull()

    describe 'for a CSS selector string', ->

      it 'returns the first element matching the given selector', ->
        match = fixture('.match')
        otherMatch = fixture('.match')
        noMatch = fixture('.no-match')
        result = up.element.get('.match')
        expect(result).toBe(match)

      describe 'when given a root element for the search', ->

        it 'returns the first descendant of the given root that matches the given selector', ->
          $element = $fixture('.element')
          $matchingChild = $element.affix('.child.match')
          $matchingGrandChild = $matchingChild.affix('.grand-child.match')
          $otherChild = $element.affix('.child')
          $otherGrandChild = $otherChild.affix('.grand-child')
          result = up.element.get($element[0], '.match')
          expect(result).toEqual $matchingChild[0]

        it 'returns missing if no descendant matches', ->
          $element = $fixture('.element')
          $child = $element.affix('.child')
          $grandChild = $child.affix('.grand-child')
          result = up.element.get($element[0], '.match')
          expect(result).toBeMissing()

        it 'does not return the root itself, even if it matches', ->
          $element = $fixture('.element.match')
          result = up.element.get($element[0], '.match')
          expect(result).toBeMissing()

        it 'does not return an ancestor of the root, even if it matches', ->
          $parent = $fixture('.parent.match')
          $element = $parent.affix('.element')
          result = up.element.get($element[0], '.match')
          expect(result).toBeMissing()


  if up.migrate.loaded
    describe 'up.element.all()', ->

      it 'returns all elements matching the given selector', ->
        match = fixture('.match')
        otherMatch = fixture('.match')
        noMatch = fixture('.no-match')
        result = up.element.all('.match')
        expect(result).toMatchList [match, otherMatch]

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

  if up.migrate.loaded
    describe 'up.element.matches()', ->

      it 'returns true if the given element matches the given selector', ->
        element = fixture('.foo')
        result = up.element.matches(element, '.foo')
        expect(result).toBe(true)

      it "returns false if the given element doesn't match the given selector", ->
        element = fixture('.foo')
        result = up.element.matches(element, '.bar')
        expect(result).toBe(false)

      it "returns false if the given element doesn't match the given selector, even if a child matches", ->
        element = fixture('.foo')
        child = up.element.affix(element, '.bar')
        result = up.element.matches(element, '.bar')
        expect(result).toBe(false)

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

  describe 'up.element.contains()', ->
    it 'can handle conflicts with forms where an input is named `contains` GH#507', ->
      $form = $fixture('form')
      $child = $form.affix('input[name="contains"]')

      expect(up.element.contains($form[0], $child)).toBe(true)

  if up.migrate.loaded
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

  fdescribe 'up.element.ancestor()', ->

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

  if up.migrate.loaded
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

  if up.migrate.loaded
    describe 'up.element.toggleClass()', ->

      it 'removes a class from an element that has that class', ->
        element = fixture('.klass')
        up.element.toggleClass(element, 'klass')
        expect(element).not.toHaveClass('klass')

      it 'adds a class to an element that does not have that class', ->
        element = fixture('div')
        up.element.toggleClass(element, 'klass')
        expect(element).toHaveClass('klass')

      it 'removes a class from the an element if the second argument is false', ->
        element = fixture('.klass')
        up.element.toggleClass(element, 'klass', false)
        expect(element).not.toHaveClass('klass')

      it 'adds a class to an element if the second argument is true', ->
        element = fixture('div')
        up.element.toggleClass(element, 'klass', true)
        expect(element).toHaveClass('klass')

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

    it 'creates an element with an attribute set to an exact value', ->
      element = up.element.createFromSelector('ul[foo=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'parses attribute names containing a dash', ->
      element = up.element.createFromSelector('ul[data-foo=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('data-foo')).toEqual('bar')

    it 'allows to quote attribute values in single quotes', ->
      element = up.element.createFromSelector("ul[foo='bar']")
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'allows to quote attribute values in double quotes', ->
      element = up.element.createFromSelector('ul[foo="bar"]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'allows single-quotes in a double-quoted attribute value', ->
      element = up.element.createFromSelector('ul[foo="bar\'baz"]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual("bar'baz")

    it 'allows double-quotes in a single-quoted attribute value', ->
      element = up.element.createFromSelector("ul[foo='bar\"baz']")
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar"baz')

    it 'creates an element with an attribute set to a space-separated value', ->
      element = up.element.createFromSelector('ul[foo~=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'creates an element with an attribute set to a dash-separated value', ->
      element = up.element.createFromSelector('ul[foo|=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'creates an element with an attribute set to a prefix', ->
      element = up.element.createFromSelector('ul[foo^=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'creates an element with an attribute set to a suffix', ->
      element = up.element.createFromSelector('ul[foo$=bar]')
      expect(element).toBeElement()
      expect(element.tagName).toEqual('UL')
      expect(element.getAttribute('foo')).toEqual('bar')

    it 'creates an element with an attribute set to a substring', ->
      element = up.element.createFromSelector('ul[foo*=bar]')
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

    it 'sets attributes from a second argument', ->
      element = up.element.createFromSelector('div', foo: 'one', bar: 'two')
      expect(element.getAttribute('foo')).toEqual('one')
      expect(element.getAttribute('bar')).toEqual('two')

    it 'sets inline styles from a { style } object with camelCase keys', ->
      element = up.element.createFromSelector('div', style: { fontSize: '100px', marginTop: '200px' })
      expect(element.style.fontSize).toEqual('100px')
      expect(element.style.marginTop).toEqual('200px')

    it 'sets inline styles from a { style } object with kebab-case keys', ->
      element = up.element.createFromSelector('div', style: { 'font-size': '100px', 'margin-top': '200px' })
      expect(element.style.fontSize).toEqual('100px')
      expect(element.style.marginTop).toEqual('200px')

    it 'sets inline styles from a { style } string with semicolon-separated styles', ->
      element = up.element.createFromSelector('div', style: 'font-size: 100px; margin-top: 200px')
      expect(element.style.fontSize).toEqual('100px')
      expect(element.style.marginTop).toEqual('200px')

    it 'adds an addition class from a { class } option', ->
      element = up.element.createFromSelector('.foo', class: 'bar')
      expect(element).toHaveClass('foo')
      expect(element).toHaveClass('bar')

    it 'sets the element text from a { text } option', ->
      element = up.element.createFromSelector('.foo', text: 'text')
      expect(element).toHaveText('text')

    it 'escapes HTML from a { text } option', ->
      element = up.element.createFromSelector('.foo', text: '<script>alert("foo")</script>')
      expect(element).toHaveText('<script>alert("foo")</script>')

  describe 'up.element.affix()', ->

    it 'creates an element from the given selector and attaches it to the given container', ->
      container = fixture('.container')
      element = up.element.affix(container, 'span')
      expect(element.tagName).toEqual('SPAN')
      expect(element.parentElement).toBe(container)

    it 'can attach an element to the body', ->
      element = up.element.affix(document.body, 'div')
      expect(element.tagName).toEqual('DIV')
      expect(element.parentElement).toBe(document.body)

      # Since this is not a fixture that would auto-remove itself after the test, remove it manually.
      element.remove()


  describe 'up.element.createBrokenDocumentFromHTML', ->

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

      element = up.element.createBrokenDocumentFromHTML(string)

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

      $element = up.element.createBrokenDocumentFromHTML(string)
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
      element = up.element.createBrokenDocumentFromHTML(html)
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
      element = up.element.createBrokenDocumentFromHTML(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')

    it 'can parse a HTML fragment without a <body>', ->
      html = """
        <h1>Full story</h1>
        """
      element = up.element.createBrokenDocumentFromHTML(html)
      expect(element.querySelector("title")).toBeMissing()
      expect(element.querySelector("h1").textContent).toEqual('Full story')

  describe 'up.element.createFromHTML', ->

    it 'creates an element from the given HTML fragment', ->
      html = """
        <h1>Full story</h1>
        """
      element = up.element.createFromHTML(html)
      expect(element.tagName).toEqual('H1')
      expect(element.textContent).toEqual('Full story')

    it 'can create <noscript> tags (bugfix)', ->
      html = """
        <noscript>alternative content</noscript>
        """
      element = up.element.createFromHTML(html)
      expect(element.tagName).toEqual('NOSCRIPT')
      expect(element.textContent).toEqual('alternative content')

    it 'can create non-inert <script> tags', asyncSpec (next) ->
      window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')

      html = """
        <script>window.scriptTagExecuted()</script>
        """

      element = up.element.createFromHTML(html)

      expect(element.tagName).toBe('SCRIPT')
      expect(window.scriptTagExecuted).not.toHaveBeenCalled()

      document.body.appendChild(element)

      next.after 100, ->
        expect(window.scriptTagExecuted).toHaveBeenCalled()

        element.remove()
        delete window.scriptTagExecuted

    it 'create an element when there is leading whitespace in the given string (bugfix)', ->
      html = "    <h1>Full story</h1>"
      element = up.element.createFromHTML(html)
      expect(element.tagName).toEqual('H1')
      expect(element.textContent).toEqual('Full story')

    it "throws an error if there is more than one element in the given string's the root depth", ->
      html = "<h1>Full story</h1><h2>Subtitle </h2>"
      parse = -> up.element.createFromHTML(html)
      expect(parse).toThrowError(/must have a single root element/)

    it "throws an error if there is no element in the given string", ->
      html = "    "
      parse = -> up.element.createFromHTML(html)
      expect(parse).toThrowError(/must have a single root element/)

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

  describe 'up.element.attr', ->

    it 'returns the attribute with the given name from the given element', ->
      element = up.element.createFromHTML('<div foo="bar"></div>')
      expect(up.element.attr(element, 'foo')).toEqual('bar')

    it 'returns an empty string if the attribute is set without value', ->
      element = up.element.createFromHTML('<div foo></div>')
      expect(up.element.attr(element, 'foo')).toEqual('')

    it 'returns undefined if the element does not have the given attribute (unlike Element#getAttribute(), which would return null)', ->
      element = up.element.createFromHTML('<div></div>')
      expect(up.element.attr(element, 'foo')).toBeUndefined()

  describe 'up.element.booleanAttr', ->

    it 'returns true if the attribute value is the string "true"', ->
      element = up.element.createFromHTML('<div foo="true"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(true)

    it 'returns true if the attribute value is the name of the attribute', ->
      element = up.element.createFromHTML('<div foo="foo"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(true)

    it 'returns false if the attribute value is the string "false"', ->
      element = up.element.createFromHTML('<div foo="false"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(false)

    it 'returns undefined if the element has no such attribute', ->
      element = up.element.createFromHTML('<div></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBeUndefined()

    it 'returns true if the attribute value is an unknown string', ->
      element = up.element.createFromHTML('<div foo="some text"></div>')
      expect(up.element.booleanAttr(element, 'foo')).toBe(true)

    it 'returns the raw attribute value is it is an unknown string and the third `pass` argument is true', ->
      element = up.element.createFromHTML('<div foo="some text"></div>')
      expect(up.element.booleanAttr(element, 'foo', true)).toBe('some text')

  describe 'up.element.booleanOrStringAttr', ->

    it 'returns true if the attribute value is empty', ->
      element = up.element.createFromHTML('<div foo></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(true)

    it 'returns true if the attribute value is the string "true"', ->
      element = up.element.createFromHTML('<div foo="true"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(true)

    it 'returns true if the attribute value is the name of the attribute', ->
      element = up.element.createFromHTML('<div foo="foo"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(true)

    it 'returns false if the attribute value is the string "false"', ->
      element = up.element.createFromHTML('<div foo="false"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBe(false)

    it 'returns undefined if the element has no such attribute', ->
      element = up.element.createFromHTML('<div></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toBeUndefined()

    it "returns the attribute's raw string value if that value cannot be cast to a boolean", ->
      element = up.element.createFromHTML('<div foo="some text"></div>')
      expect(up.element.booleanOrStringAttr(element, 'foo')).toEqual('some text')

  describe 'up.element.numberAttr', ->

    it "returns the given attribute's value parsed as an integer", ->
      element = up.element.createFromHTML('<div foo="123">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBe(123)

    it "returns the given attribute's value parsed as a float", ->
      element = up.element.createFromHTML('<div foo="123.4">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBe(123.4)

    it "returns undefined if the given attribute value cannot be parsed as a number", ->
      element = up.element.createFromHTML('<div foo="bar">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBeUndefined()

    it "ignores underscores for digit groups", ->
      element = up.element.createFromHTML('<div foo="123_000">/div>')
      expect(up.element.numberAttr(element, 'foo')).toBe(123000)

  describe 'up.element.jsonAttr', ->

    it "returns the given attribute's value parsed as JSON", ->
      element = up.element.createFromHTML('<div foo=\'{ "key": "value" }\'></div>')
      expect(up.element.jsonAttr(element, 'foo')).toEqual({ 'key': 'value'})

    it "returns undefined if the given attribute's value is blank", ->
      element = up.element.createFromHTML('<div foo=""></div>')
      expect(up.element.jsonAttr(element, 'foo')).toBeUndefined()

    it "returns undefined if the element has no such attribute", ->
      element = up.element.createFromHTML('<div></div>')
      expect(up.element.jsonAttr(element, 'foo')).toBeUndefined()

  describe 'up.element.closestAttr', ->

    it 'returns the the value of the given attribute on the given element', ->
      element = fixture('div[foo=value]')
      expect(up.element.closestAttr(element, 'foo')).toEqual('value')

    it 'returns the the value of the given attribute of an ancestor of the given element', ->
      grandParent = fixture('div[foo=value]')
      parent = up.element.affix(grandParent, 'div')
      element = up.element.affix(parent, 'div')
      expect(up.element.closestAttr(element, 'foo')).toEqual('value')

    it 'returns a missing value if neither the given element nor an ancestor have the given attribute', ->
      parent = fixture('div')
      element = up.element.affix(parent, 'div')
      expect(up.element.closestAttr(element, 'foo')).toBeMissing()

    it 'uses the third optional argument to parse the attribute', ->
      grandParent = fixture('div[foo]')
      parent = up.element.affix(grandParent, 'div')
      element = up.element.affix(parent, 'div')
      expect(up.element.closestAttr(element, 'foo', up.element.booleanAttr)).toBe(true)

  describe 'up.element.setTemporaryStyle', ->

    it "sets the given inline styles and returns a function that will restore the previous inline styles", ->
      div = fixture('div[style="color: red"]')
      restore = up.element.setTemporaryStyle(div, { color: 'blue' })
      expect(div.getAttribute('style')).toContain('color: blue')
      expect(div.getAttribute('style')).not.toContain('color: red')
      restore()
      expect(div.getAttribute('style')).not.toContain('color: blue')
      expect(div.getAttribute('style')).toContain('color: red')

    it "does not restore inherited styles", ->
      div = fixture('div[class="red-background"]')
      restore = up.element.setTemporaryStyle(div, { backgroundColor: 'blue' })
      expect(div.getAttribute('style')).toContain('background-color: blue')
      restore()
      expect(div.getAttribute('style')).not.toContain('background-color')

  describe 'up.element.inlineStyle', ->

    describe 'with a string as second argument', ->

      it 'returns a CSS value string from an inline [style] attribute', ->
        div = $fixture('div').attr('style', 'background-color: #ff0000')[0]
        style = up.element.inlineStyle(div, 'backgroundColor')
        # Browsers convert colors to rgb() values, even IE11
        expect(style).toEqual('rgb(255, 0, 0)')

      it 'returns a blank value if the element does not have the given property in the [style] attribute', ->
        div = $fixture('div').attr('style', 'background-color: red')[0]
        style = up.element.inlineStyle(div, 'color')
        expect(style).toBeBlank()

      it 'returns a blank value the given property is a computed property, but not in the [style] attribute', ->
        div = $fixture('div[class="red-background"]')[0]
        inlineStyle = up.element.inlineStyle(div, 'backgroundColor')
        computedStyle = up.element.style(div, 'backgroundColor')
        expect(computedStyle).toEqual('rgb(255, 0, 0)')
        expect(inlineStyle).toBeBlank()

    describe 'with an array as second argument', ->

      it 'returns an object with the given inline [style] properties', ->
        div = $fixture('div').attr('style', 'background-color: #ff0000; color: #0000ff')[0]
        style = up.element.inlineStyle(div, ['backgroundColor', 'color'])
        expect(style).toEqual
          backgroundColor: 'rgb(255, 0, 0)'
          color: 'rgb(0, 0, 255)'

      it 'returns blank keys if the element does not have the given property in the [style] attribute', ->
        div = $fixture('div').attr('style', 'background-color: #ff0000')[0]
        style = up.element.inlineStyle(div, ['backgroundColor', 'color'])
        expect(style).toHaveOwnProperty('color')
        expect(style.color).toBeBlank()

      it 'returns a blank value the given property is a computed property, but not in the [style] attribute', ->
        div = fixture('div[class="red-background"]')
        inlineStyleHash = up.element.inlineStyle(div, ['backgroundColor'])
        computedBackground = up.element.style(div, 'backgroundColor')
        expect(computedBackground).toEqual('rgb(255, 0, 0)')
        expect(inlineStyleHash).toHaveOwnProperty('backgroundColor')
        expect(inlineStyleHash.backgroundColor).toBeBlank()

  describe 'up.element.setStyle', ->

    it "sets the given style properties as the given element's [style] attribute", ->
      div = fixture('div')
      up.element.setStyle(div, { color: 'red', 'background-color': 'blue' })
      style = div.getAttribute('style')
      expect(style).toContain('color: red')
      expect(style).toContain('background-color: blue')

    it "merges the given style properties into the given element's existing [style] value", ->
      div = fixture('div[style="color: red"]')
      up.element.setStyle(div, { 'background-color': 'blue' })
      style = div.getAttribute('style')
      expect(style).toContain('color: red')
      expect(style).toContain('background-color: blue')

    it "converts the values of known length properties to px values automatically (with kebab-case)", ->
      div = fixture('div')
      up.element.setStyle(div, { 'padding-top': 100 })
      style = div.getAttribute('style')
      expect(style).toContain('padding-top: 100px')

    it "converts the values of known length properties to px values automatically (with camelCase)", ->
      div = fixture('div')
      up.element.setStyle(div, { 'paddingTop': 100 })
      style = div.getAttribute('style')
      expect(style).toContain('padding-top: 100px')

    it "accepts CSS property names in camelCase", ->
      div = fixture('div')
      up.element.setStyle(div, { 'backgroundColor': 'blue' })
      style = div.getAttribute('style')
      expect(style).toContain('background-color: blue')

  describe 'up.element.style', ->

    it 'returns the computed style for the given CSS property in kebab-case', ->
      div = fixture('div')
      div.style.paddingTop = '10px'
      value = up.element.style(div, 'padding-top')
      expect(value).toEqual('10px')

    it 'returns the computed style for the given CSS property in camelCase', ->
      div = fixture('div')
      div.style.paddingTop = '10px'
      value = up.element.style(div, 'paddingTop')
      expect(value).toEqual('10px')

    it 'returns the computed style for multiple CSS properties in kebab-case', ->
      div = fixture('div')
      div.style.paddingTop = '10px'
      div.style.paddingBottom = '20px'
      value = up.element.style(div, ['padding-top', 'padding-bottom'])
      expect(value).toEqual { 'padding-top': '10px', 'padding-bottom': '20px' }

    it 'returns the computed style for multiple CSS properties in camelCase', ->
      div = fixture('div')
      div.style.paddingTop = '10px'
      div.style.paddingBottom = '20px'
      value = up.element.style(div, ['paddingTop', 'paddingBottom'])
      expect(value).toEqual { 'paddingTop': '10px', 'paddingBottom': '20px' }

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

  describe 'up.element.classSelector', ->
    it 'escapes all colons', ->
      element = fixture('div')
      element.classList.add('print:sm:hidden')
      expect(up.element.classSelector('print:sm:hidden')).toBe('.print\\:sm\\:hidden')

    it 'escapes all square-brackets', ->
      element = fixture('div')
      element.classList.add('text-[2rem]')
      expect(up.element.classSelector('text-[2rem]')).toBe('.text-\\[2rem\\]')

    it 'escapes all periods', ->
      element = fixture('div')
      element.classList.add('text-[.8125rem]')
      expect(up.element.classSelector('text-[.8125rem]')).toBe('.text-\\[\\.8125rem\\]')

    it 'escapes all exclamation marks', ->
      element = fixture('div')
      element.classList.add('!font-bold')
      expect(up.element.classSelector('!font-bold')).toBe('.\\!font-bold')


  describe 'up.element.hide()', ->

    it 'makes the given element invisible', ->
      element = fixture('div')
      expect(element).toBeVisible()

      up.element.hide(element)

      expect(element).not.toBeVisible()

    it 'allows users to implement custom hide behavior through CSS', ->
      fixtureStyle """
        .other[hidden] {
          display: block !important;
          height: 0px;
        }
      """

      other = fixture('.other')
      up.element.hide(other)

      expect(getComputedStyle(other).display).toBe('block')
      expect(getComputedStyle(other).height).toBe('0px')


  describe 'up.element.show()', ->

    it 'shows the given invisible element', ->
      element = fixture('div')
      up.element.hide(element)
      expect(element).not.toBeVisible()

      up.element.show(element)

      expect(element).toBeVisible()

    it 'restores the { display } property the element had before hiding', ->
      element = fixture('div', style: { display: 'flex'})
      expect(getComputedStyle(element).display).toBe('flex')
      up.element.hide(element)
      expect(element).not.toBeVisible()

      up.element.show(element)

      expect(element).toBeVisible()
      expect(getComputedStyle(element).display).toBe('flex')

  describe 'up.element.isEmpty()', ->

    it 'returns true for an element without text and without children', ->
      element = up.element.createFromHTML('<span></span>')

      expect(up.element.isEmpty(element)).toBe(true)

    it 'returns false for an element with text', ->
      element = up.element.createFromHTML('<span>text</span>')

      expect(up.element.isEmpty(element)).toBe(false)

    it 'returns false for an element with a child element', ->
      element = up.element.createFromHTML('<div><span>text</span></div>')

      expect(up.element.isEmpty(element)).toBe(false)

    it 'returns false for an element with an empty child element', ->
      element = up.element.createFromHTML('<div><span></span></div>')

      expect(up.element.isEmpty(element)).toBe(false)

  describe 'up.element.parseSelector()', ->

    it 'parses a selector with tag name, IDs, classes and attributes', ->
      parsed = up.element.parseSelector('tag-name#id.klass[attr=value]')

      expect(parsed.includePath).toEqual([{
        tagName: 'tag-name',
        id: 'id'
        classNames: ['klass'],
        attributes: { attr: 'value' }
      }])

    it 'unescapes quotes in attribute values', ->
      parsed = up.element.parseSelector('[attr="foo\\"bar"]')

      expect(parsed.includePath[0].attributes).toEqual({ attr: 'foo"bar' })

    it 'parses a descendant selector', ->
      parsed = up.element.parseSelector('.content > form[action="/"]')

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

    it 'parses a :not() suffix', ->
      parsed = up.element.parseSelector('.foo:not(.bar)')

      expect(parsed.includePath).toEqual([{
        tagName: null,
        id: null,
        classNames: ['foo'],
        attributes: {}
      }])

      expect(parsed.excludeRaw).toEqual(':not(.bar)')

  if up.migrate.loaded
    describe 'up.element.isAttached()', ->

      it 'returns true for the document', ->
        result = up.element.isAttached(document)
        expect(result).toBe(true)

      it 'returns true for the <html> element', ->
        result = up.element.isAttached(document.documentElement)
        expect(result).toBe(true)

      it 'returns true for the <body> element', ->
        result = up.element.isAttached(document.body)
        expect(result).toBe(true)

      it 'returns true for an attached element', ->
        element = fixture('.foo')
        result = up.element.isAttached(element)
        expect(result).toBe(true)

      it 'returns false for a detached element', ->
        element = document.createElement('div')
        result = up.element.isAttached(element)
        expect(result).toBe(false)

      it 'returns false for a once-attached that was removed', ->
        element = fixture('.foo')
        element.remove()
        result = up.element.isAttached(element)
        expect(result).toBe(false)
