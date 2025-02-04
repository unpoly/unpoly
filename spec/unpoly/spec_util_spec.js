const e = up.element

describe('up.specUtil', function() {
  describe('up.specUtil.documentOverflowElement()', function() {

    beforeEach(function() {
      this.body = document.body
      this.html = document.documentElement
      this.restoreBodyOverflowY = e.setStyleTemp(this.body, { 'overflow-y': 'visible' })
      this.restoreHTMLOverflowY = e.setStyleTemp(this.html, { 'overflow-y': 'visible' })
    })

    afterEach(function() {
      this.restoreBodyOverflowY()
      this.restoreHTMLOverflowY()
    })

    it('returns the <html> element if the developer set { overflow-y: scroll } on it', function() {
      this.html.style.overflowY = 'scroll'
      expect(up.specUtil.documentOverflowElement()).toBe(this.html)
    })

    it('returns the <html> element if the developer set { overflow-y: auto } on it', function() {
      this.html.style.overflowY = 'auto'
      expect(up.specUtil.documentOverflowElement()).toBe(this.html)
    })

    it('returns the <body> element if the developer set { overflow-y: scroll } on it', function() {
      this.body.style.overflowY = 'scroll'
      expect(up.specUtil.documentOverflowElement()).toBe(this.body)
    })

    it('returns the <body> element if the developer set { overflow-y: auto } on it', function() {
      this.body.style.overflowY = 'auto'
      expect(up.specUtil.documentOverflowElement()).toBe(this.body)
    })

    it('returns the scrolling element if the developer set { overflow-y: visible } on both <html> and <body>', function() {
      this.html.style.overflowY = 'visible'
      this.body.style.overflowY = 'visible'
      expect(up.specUtil.documentOverflowElement()).toBe(up.viewport.root)
    })
  })
})
