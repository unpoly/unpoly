describe 'up.specUtil', ->

  describe 'up.specUtil.documentOverflowElement()', ->

    beforeEach ->
      @body = document.body
      @html = document.documentElement
      @restoreBodyOverflowY = e.setStyleTemp(@body, 'overflow-y': 'visible')
      @restoreHTMLOverflowY = e.setStyleTemp(@html, 'overflow-y': 'visible')

    afterEach ->
      @restoreBodyOverflowY()
      @restoreHTMLOverflowY()

    it 'returns the <html> element if the developer set { overflow-y: scroll } on it', ->
      @html.style.overflowY = 'scroll'
      expect(up.specUtil.documentOverflowElement()).toBe(@html)

    it 'returns the <html> element if the developer set { overflow-y: auto } on it', ->
      @html.style.overflowY = 'auto'
      expect(up.specUtil.documentOverflowElement()).toBe(@html)

    it 'returns the <body> element if the developer set { overflow-y: scroll } on it', ->
      @body.style.overflowY = 'scroll'
      expect(up.specUtil.documentOverflowElement()).toBe(@body)

    it 'returns the <body> element if the developer set { overflow-y: auto } on it', ->
      @body.style.overflowY = 'auto'
      expect(up.specUtil.documentOverflowElement()).toBe(@body)

    it 'returns the scrolling element if the developer set { overflow-y: visible } on both <html> and <body>', ->
      @html.style.overflowY = 'visible'
      @body.style.overflowY = 'visible'
      expect(up.specUtil.documentOverflowElement()).toBe(up.viewport.root)
