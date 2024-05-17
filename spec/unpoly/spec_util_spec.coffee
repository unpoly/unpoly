describe 'up.specUtil', ->

  describe 'up.specUtil.rootOverflowElement()', ->

    beforeEach ->
      @body = document.body
      @html = document.documentElement
      @restoreBodyOverflowY = e.setTemporaryStyle(@body, 'overflow-y': 'visible')
      @restoreHTMLOverflowY = e.setTemporaryStyle(@html, 'overflow-y': 'visible')

    afterEach ->
      @restoreBodyOverflowY()
      @restoreHTMLOverflowY()

    it 'returns the <html> element if the developer set { overflow-y: scroll } on it', ->
      @html.style.overflowY = 'scroll'
      expect(up.specUtil.rootOverflowElement()).toBe(@html)

    it 'returns the <html> element if the developer set { overflow-y: auto } on it', ->
      @html.style.overflowY = 'auto'
      expect(up.specUtil.rootOverflowElement()).toBe(@html)

    it 'returns the <body> element if the developer set { overflow-y: scroll } on it', ->
      @body.style.overflowY = 'scroll'
      expect(up.specUtil.rootOverflowElement()).toBe(@body)

    it 'returns the <body> element if the developer set { overflow-y: auto } on it', ->
      @body.style.overflowY = 'auto'
      expect(up.specUtil.rootOverflowElement()).toBe(@body)

    it 'returns the scrolling element if the developer set { overflow-y: visible } on both <html> and <body>', ->
      @html.style.overflowY = 'visible'
      @body.style.overflowY = 'visible'
      expect(up.specUtil.rootOverflowElement()).toBe(up.viewport.root)
