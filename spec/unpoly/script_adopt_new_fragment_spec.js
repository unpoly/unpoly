const u = up.util

extendDescribe('up.script', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.script.adoptNewFragment()', function() {

      describe('CSP nonces in body scripts', function() {

        function itBehavesLikeBlock({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'not known'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('blocks a script element without nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, cspInfo)

              expect(script).toBeInertScript()
            })

            it('blocks a script element with the correct page nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script[nonce="response123"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, cspInfo)

              expect(script).toBeInertScript()
            })

            it('blocks a script element with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script[nonce="wrong456"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, cspInfo)

              expect(script).toBeInertScript()
            })

            it('does not change a script element with a non-JavaScript type', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script[type="text/ramenscript"]', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, cspInfo)

              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

          })

        }

        function itBehavesLikePass({ strictDynamic } = {}) {

          describe(`when the CSP is ${strictDynamic ? 'strict-dynamic' : 'not strict-dynamic'}`, function() {

            beforeEach(function() {
              let strictDynamicPart = up.util.assert(strictDynamic, up.util.isBoolean) ? "'strict-dynamic'" : ""
              this.cspInfo ??= up.CSPInfo.fromHeader(`script-src 'self' 'nonce-response111' ${strictDynamicPart}`)
            })

            it('does not change a script element without a [nonce]', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it("does not change am inline script element when its [nonce] doesn't match the response nonce", function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { nonce: 'incorrect456', text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it('does not add a [nonce] to linked, un-nonced script, as that might bypass a host-based CSP (bugfix)', async function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { src: up.specUtil.staticFile('linked_noop_script.js') })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it("rewrites the [nonce] of a body script when it matches the response nonce", async function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { nonce: 'response111', text: 'console.log("hello")' })

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script).toHaveProperty('nonce', 'page000')
            })

            it('does not change a script element with an correct nonce, but the page nonce is unknown', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)

              const script = up.element.createFromSelector('script', { nonce: 'response111', text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it('does not change a script element with a non-JavaScript type', function() {
              const script = up.element.createFromSelector('script[type="text/ramenscript"]', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })
          })

        }

        function itBehavesLikeNonce({ strictDynamic } = {}) {

          describe(`when the CSP is ${strictDynamic ? 'strict-dynamic' : 'not strict-dynamic'}`, function() {

            beforeEach(function() {
              let strictDynamicPart = up.util.assert(strictDynamic, up.util.isGiven) ? "'strict-dynamic'" : ""
              this.cspInfo ??= up.CSPInfo.fromHeader(`script-src 'self' 'nonce-response111' ${strictDynamicPart}`)
            })

            it('blocks a script element without nonce', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeInertScript()
            })

            it('rewrites a script element nonce that matches its response', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script[nonce="response111"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script).toHaveProperty('nonce', 'page000')
            })

            it('blocks a script element whose nonce that matches its response, but the page nonce is unknown', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
              const script = up.element.createFromSelector('script[nonce="response111"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeInertScript()
            })

            it('blocks a script element with an incorrect nonce', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script[nonce="wrong222"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeInertScript()
            })

            it('does not change a script element with a non-JavaScript type', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script[type="text/ramenscript"]', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })
          })

        }

        describe('with up.script.config.scriptElementPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "block"
          })

          itBehavesLikeBlock({ pageNonce: 'page000' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.scriptElementPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "pass"
          })

          itBehavesLikePass({ strictDynamic: false })

          itBehavesLikePass({ strictDynamic: true })
        })

        describe('with up.script.config.scriptElementPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "nonce"
          })

          describe('when the page nonce is known', function() {
            itBehavesLikeNonce({ strictDynamic: false })
          })

          describe('when the page nonce is unknown', function() {
            itBehavesLikeBlock({ pageNonce: null })
          })

        })

        describe('with up.script.config.scriptElementPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "auto"
          })

          describe('without a strict-dynamic CSP', function() {
            itBehavesLikePass({ strictDynamic: false })
          })

          describe('with a strict-dynamic CSP', function() {
            itBehavesLikeNonce({ strictDynamic: true })
          })

          // it('rewrites the [nonce] of a body script with Content-Security-Policy-Report-Only response header', async function() {
          //   spyOn(up.script, 'cspNonce').and.returnValue('page-secret')
          //
          //   let [target] = htmlFixtureList(`
          //     <div id="target">
          //       old target text
          //     </div>
          //   `)
          //
          //   up.render('#target', { url: '/path' })
          //   await wait()
          //
          //   jasmine.respondWith({
          //     responseText: `
          //       <div id="target">
          //         new target text
          //         <script nonce="response-secret"></script>
          //       </div>
          //     `,
          //     responseHeaders: { 'Content-Security-Policy-Report-Only': "script-src 'nonce-response-secret'" }
          //   })
          //   await wait()
          //
          //   expect('#target').toHaveVisibleText('new target text')
          //   expect('#target script').toHaveProperty('nonce', 'page-secret')
          // })

        })

        if (up.migrate.loaded) {

          describe('with up.fragment.config.runScripts = true', function() {

            beforeEach(function() {
              up.fragment.config.runScripts = true
            })

            describe('without a strict-dynamic CSP', function() {
              itBehavesLikePass({ strictDynamic: false })
            })

            describe('with a strict-dynamic CSP', function() {
              itBehavesLikeNonce({ strictDynamic: true })
            })

          })

          describe('up.fragment.config.runScripts = false', function() {

            beforeEach(function() {
              up.fragment.config.runScripts = false
            })

            itBehavesLikeBlock({ pageNonce: 'page000' })
            itBehavesLikeBlock({ pageNonce: null })

          })


        }

      })

      describe('CSP nonces in callback attributes', function() {

        function itBehavesLikeBlock({ pageNonce } = {}) {
          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('blocks a callback without nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="console.log('hi')"></a>              
              `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            it('blocks a callback with the correct nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
              `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            it('blocks a callback with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-wrong456 console.log('hi')"></a>              
              `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

          })
        }

        function itBehavesLikePass({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {
            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('does not change a callback without a nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="console.log('hi')"></a>              
            `)

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
              expect(link.getAttribute('up-on-loaded')).toBe("console.log('hi')")
            })

            it('does not change a callback with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-wrong456 console.log('hi')"></a>              
            `)

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
              expect(link.getAttribute('up-on-loaded')).toBe("nonce-wrong456 console.log('hi')")
            })

            if (pageNonce) {

              it('rewrites a correct callback nonce', function() {
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
              `)

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
                expect(link.getAttribute('up-on-loaded')).toBe("nonce-page000 console.log('hi')")
              })

            } else {

              it('does not rewrite a correct callback nonce', function() {
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
              `)

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
                expect(link.getAttribute('up-on-loaded')).toBe("nonce-response123 console.log('hi')")
              })

            }
          })

        }

        function itBehavesLikeNonce({ pageNonce } = {}) {
          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('blocks a callback without nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="console.log('hi')"></a>              
            `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            it('blocks a callback with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-wrong456 console.log('hi')"></a>              
            `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            if (pageNonce) {
              it('rewrites a callback nonce that matches its response', function() {
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
            `)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
                expect(link.getAttribute('up-on-loaded')).toBe("nonce-page000 console.log('hi')")
              })
            } else {
              it('blocks a callback whose nonce matches its response', function() {
                spyOn(up.script, 'cspNonce').and.returnValue(undefined)
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
            `)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
              })
            }

          })

        }

        describe('with up.script.config.evalCallbackPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "block"
          })

          itBehavesLikeBlock({ pageNonce: 'page000' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "pass"
          })

          itBehavesLikePass({ pageNonce: 'page000' })
          itBehavesLikePass({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "nonce"
          })

          describe('when the page nonce is known', function() {
            itBehavesLikeNonce({ pageNonce: 'page000' })
          })

          describe('when the page nonce is not known', function() {
            itBehavesLikeBlock({ pageNonce: null })
          })

        })

        describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "auto"
            up.script.config.nonceableAttributes.push('callback')
          })

          describe('when the page nonce is known', function() {

            itBehavesLikeNonce({ pageNonce: 'page000' })

            // it("rewrites nonceable callbacks to use the current page's nonce with Content-Security-Policy-Report-Only response header", async function() {
            //   spyOn(up.script, 'cspNonce').and.returnValue('secret1')
            //   fixture('.target')
            //   up.render('.target', { url: '/path' })
            //
            //   await wait()
            //
            //   jasmine.respondWith({
            //     responseText: `
            //       <div class="target" callback="nonce-secret2 alert()">new text</div>
            //     `,
            //     responseHeaders: { 'Content-Security-Policy-Report-Only': "script-src 'nonce-secret2'" }
            //   })
            //
            //   await wait()
            //
            //   expect('.target').toHaveText('new text')
            //   expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
            // })
  
            // it("rewrites nonceable callbacks to use the current page's nonce when opening a new overlay (bugfix)", async function() {
            //   spyOn(up.script, 'cspNonce').and.returnValue('secret1')
            //   up.render('.target', { url: '/path', layer: 'new' })
            //
            //   await wait()
            //
            //   jasmine.respondWith({
            //     responseText: `
            //       <div class="target" callback="nonce-secret2 alert()">new text</div>
            //     `,
            //     responseHeaders: { 'Content-Security-Policy': "script-src 'nonce-secret2'" }
            //   })
            //
            //   await wait()
            //
            //   expect(up.layer.isOverlay()).toBe(true)
            //
            //   expect('.target').toHaveText('new text')
            //   expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
            // })

            // it("ensures nonced callbacks still match the current page's nonce after a render pass that updates history (meta tags are part of history state) (bugfix)", async function() {
            //   let suiteMeta = document.querySelector('meta[name="csp-nonce"]')
            //   suiteMeta.remove()
            //
            //   up.element.affix(document.head, 'meta#test-nonce[name="csp-nonce"][content="nonce-secret1"]')
            //   expect(up.script.cspNonce()).toBe('nonce-secret1')
            //
            //   const element = fixture('.element', { callback: 'nonce-secret1 alert()' })
            //   fixture('.target', { text: 'old text' })
            //
            //   up.render('.target', { url: '/path', history: true })
            //
            //   await wait()
            //
            //   jasmine.respondWith({
            //     responseHeaders: { 'Content-Security-Policy': "script-src 'nonce-secret2'" },
            //     responseText: `
            //       <html>
            //         <head>
            //           <meta id="test-nonce" name="csp-nonce" content="nonce-secret2">
            //         </head>
            //         <body>
            //           <div class="target">
            //             new text
            //           </div>
            //         </body>
            //       </html>
            //     `
            //   })
            //
            //   await wait()
            //
            //   const currentPageNonce = up.script.cspNonce()
            //   expect(element.getAttribute('callback')).toBe(`${currentPageNonce} alert()`)
            // })
  
          })

          describe('when the page nonce is not known', function() {

            itBehavesLikePass({ pageNonce: null })

          })

        })

      })

    })

  })

})
