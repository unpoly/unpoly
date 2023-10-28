e = up.element
u = up.util

describe('up.ResponseDoc', function() {

  describe('from { document }', function() {

    describe('#select()', function() {

      it('selects a matching element from the given, full HTML document', function() {
        let doc = new up.ResponseDoc({ document: `
          <html>
            <body>
              <div class="foo">foo text</div>
              <div class="bar">bar text</div>
            </body>
          </html>  
        `})

        expect(doc.select('.foo')).toHaveText('foo text')
        expect(doc.select('.bar')).toHaveText('bar text')
      })

      it('rediscovers the given { origin } element in the new document and prefers to match in its region', function() {
        let origin = fixture('.origin')

        let doc = new up.ResponseDoc({ origin, document: `
          <html>
            <body>
              <div class="foo" id="foo1"></div>
              <div class="foo" id="foo2"><span class="origin"></span></div>
              <div class="foo" id="foo3"></div>
            </body>
          </html>  
        `})

        expect(doc.select('.foo').id).toBe('foo2')
      })

      it('rediscovers the given detached { origin } element in the new document and prefers to match in its region', function() {
        let origin = fixture('.origin')

        // Detach origin before matching.
        // A common situation is revalidation. If the initial render pass from cache swaps the origin element,
        // the revalidation pass needs to handle a detached origin.
        origin.remove()

        let doc = new up.ResponseDoc({ origin, document: `
          <html>
            <body>
              <div class="foo" id="foo1"></div>
              <div class="foo" id="foo2"><span class="origin"></span></div>
              <div class="foo" id="foo3"></div>
            </body>
          </html>  
        `})

        expect(doc.select('.foo').id).toBe('foo2')
      })

      it('returns a missing value if no element matches', function() {
        let doc = new up.ResponseDoc({ document: `
          <html>
            <body>
              <div class="foo">foo text</div>
            </body>
          </html>  
        `})

        expect(doc.select('.bar')).toBeMissing()
      })

      it('no longer selects the root fragment once it has been attached to window.document (bugfix)', function() {
        let doc = new up.ResponseDoc({ document: `
          <html>
            <body>
              <div class="foo">foo text</div>
              <div class="bar">bar text</div>
            </body>
          </html>  
        `})

        let foo = doc.select('.foo')
        expect(foo).toEqual(jasmine.any(Element))

        try {
          document.body.append(foo)

          expect(doc.select('.foo')).toBeMissing()

        } finally {
          foo.remove()
        }
      })

    })

    describe('#title', function() {

      it("returns the document's <title> text", function() {
        let doc = new up.ResponseDoc({ document: `
          <html>
            <head>
              <title>Document title</title>
            </head>
            <body>
            </body>
          </html>  
        `})

        expect(doc.title).toBe('Document title')
      })

      it('returns a missing value if the document has no <title> element', function() {
        let doc = new up.ResponseDoc({ document: `
          <html>
            <body>
            </body>
          </html>  
        `})

        expect(doc.title).toBeMissing()
      })

    })

  })

  describe('from { fragment }', function() {

    describe('#select()', function() {

      it('selects a matching element from the given string fragment', function () {
        let doc = new up.ResponseDoc({ fragment: `
          <div class="foo">foo text</div>
        `})

        expect(doc.select('.foo')).toHaveText('foo text')
      })

      it('selects a matching element from the given element fragment', function () {
        let fragment = up.element.createFromHTML('<div class="foo">foo text</div>')
        let doc = new up.ResponseDoc({ fragment })

        expect(doc.select('.foo')).toHaveText('foo text')
      })

      it('no longer selects the root fragment once it has been attached to window.document (bugfix)', function() {
        let doc = new up.ResponseDoc({ fragment: `
          <div class="foo">foo text</div>
        `})

        let foo = doc.select('.foo')
        expect(foo).toEqual(jasmine.any(Element))

        try {
          document.body.append(foo)

          expect(doc.select('.foo')).toBeMissing()

        } finally {
          foo.remove()
        }
      })

    })

    describe('#rootSelector()', function() {

      it('returns a selector for the fragment', function() {
        let doc = new up.ResponseDoc({ fragment: `
          <div class="foo">foo text</div>
        `})

        expect(doc.rootSelector()).toBe('.foo')
      })

    })

    describe('#title', function() {

      it('returns a missing value', function() {
        let doc = new up.ResponseDoc({ fragment: `
          <div class="foo">foo text</div>
        `})

        expect(doc.title).toBeMissing()
      })

    })

  })

  describe('from { content }', function() {

    describe('#select()', function() {

      it('selects a matching element from the given target selector and inner HTML', function () {
        let doc = new up.ResponseDoc({ target: '.foo', content: 'foo text' })

        expect(doc.select('.foo')).toHaveText('foo text')
      })

      it('selects a matching element from the given target selector and child element', function () {
        let inner = e.createFromSelector('#inner', { text: 'inner text'})
        let doc = new up.ResponseDoc({ target: '.foo', content: inner })

        expect(doc.select('.foo')).toHaveText('inner text')
      })

      it('no longer selects the root fragment once it has been attached to window.document (bugfix)', function() {
        let doc = new up.ResponseDoc({ target: '.foo', content: 'foo text' })

        let foo = doc.select('.foo')
        expect(foo).toEqual(jasmine.any(Element))

        try {
          document.body.append(foo)

          expect(doc.select('.foo')).toBeMissing()

        } finally {
          foo.remove()
        }
      })

    })

    describe('#rootSelector()', function() {

      it('returns a selector for the fragment', function() {
        let doc = new up.ResponseDoc({ target: '.foo', content: 'foo text' })

        expect(doc.rootSelector()).toBe('.foo')
      })

    })

    describe('#title', function() {

      it('returns a missing value', function() {
        let doc = new up.ResponseDoc({ target: '.foo', content: 'foo text' })

        expect(doc.title).toBeMissing()
      })

    })


  })

})

