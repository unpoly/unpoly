const u = up.util

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('execution of scripts', function() {

        beforeEach(function() {
          window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')
          this.linkedScriptPath = up.specUtil.staticFile('linked_script.js', { bustCache: true })
        })

        afterEach(function() {
          delete window.scriptTagExecuted
        })

        function itBehavesLikeBlock() {

          it('does not execute inline scripts', async function() {
            htmlFixtureList(`
              <div class="target">
                old text
              </div>
            `)

            up.render({ url: '/path', target: '.target' })
            await wait()

            jasmine.respondWith({
              responseHeaders: { 'Content-Security-Policy': "script-src 'specs-nonce'" },
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

          it('does not execute linked scripts', async function() {
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

          it('does not execute script elements when rendering from a string', async function() {
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
        }

        function itBehavesLikeNonce({ strictDynamic } = {}) {

          describe(`when the CSP is ${strictDynamic ? 'strict-dynamic' : 'not strict-dynamic'}`, function() {

            function cspString() {
              if (u.assert(strictDynamic, u.isGiven)) {
                return "script-src 'strict-dynamic' 'nonce-response111'"
              } else {
                return "script-src 'self' 'nonce-response111'"
              }
            }

            function respondWith(text) {
              jasmine.respondWith({
                responseText: text,
                responseHeaders: { 'Content-Security-Policy': cspString() },
              })
            }

            it('executes inline scripts with the correct [nonce]', async function() {
              fixture('.target', { text: 'old text' })

              up.render({ target: '.target', url: '/path' })
              await wait()

              respondWith(`
                <div class="target">
                  new text
                  <script type="text/javascript" nonce="response111">
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

            it('does not execute inline scripts with an incorrect [nonce]', async function() {
              fixture('.target', { text: 'old text' })

              up.render({ target: '.target', url: '/path' })
              await wait()

              respondWith(`
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

            it('executes linked scripts with the correct [nonce]', async function() {
              fixture('.target')

              up.render({ target: '.target', url: '/path' })
              await wait()

              respondWith(`
                <div class="target">
                new text
                  <script type="text/javascript" src="${this.linkedScriptPath}" nonce="specs-nonce"></script>
                </div>
              `)
              await wait(1500)

              expect(window.scriptTagExecuted).toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).toHaveSelector('.target script[type="text/javascript"]')
              expect('.target').toHaveVisibleText(/new text/)
            })

            it('does not execute linked scripts with an incorrect [nonce]', async function() {
              fixture('.target')

              up.render({ target: '.target', url: '/path' })
              await wait()

              respondWith(`
                <div class="target">
                  new text
                  <script type="text/javascript" src="${this.linkedScriptPath}" nonce="incorrect-nonce"></script>
                </div>
              `)
              await wait(1500)

              expect(window.scriptTagExecuted).not.toHaveBeenCalled()
              expect(document).toHaveSelector('.target script') // we did not disable, but the browser blocked it
              // Cannot use toHaveAttribute() here, because on pages with a CSP that value is masked by the browser.
              expect('.target script').toHaveProperty('nonce', 'incorrect-nonce')
              expect('.target').toHaveVisibleText(/new text/)
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
                responseHeaders: { 'Content-Security-Policy': "script-src 'strict-dynamic' 'specs-nonce'" },
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

          })

        }

        function itBehavesLikePass() {

          it('executes inline scripts the updated fragment', async function() {
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

          if (specs.config.csp === 'nonce-only') {
            it('does not execute inline scripts that violate the CSP', async function() {
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

            it('does not execute linked scripts that violate the CSP', async function() {
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
          }

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

        }

        describe('with up.script.config.scriptElementPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "block"
          })

          itBehavesLikeBlock()

        })

        describe('with up.script.config.scriptElementPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "pass"
          })

          itBehavesLikePass()

        })

        describe('with up.script.config.scriptElementPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "nonce"
          })

          describe('if the page nonce is known', function() {
            itBehavesLikeNonce({ strictDynamic: true })
            itBehavesLikeNonce({ strictDynamic: false })
          })

          describe('if the page nonce is not known', function() {
            beforeEach(function() {
              spyOn(up.script, 'cspNonce').and.returnValue(null)
            })

            itBehavesLikeBlock()
          })

        })

        describe('with up.script.config.scriptElementPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "auto"
          })

          itBehavesLikePass()

          itBehavesLikeNonce({ strictDynamic: true })

        }) // scriptElementPolicy == 'auto'

      })

    })

  })

})
