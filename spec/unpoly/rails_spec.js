const u = up.util
const $ = jQuery

describe('up.rails', function() {

  const followableAttrs = ['up-follow', 'up-target']
  if (up.migrate.loaded) followableAttrs.push('up-modal', 'up-popup')

  const submittableAttrs = ['up-submit', 'up-target']

  describe('[data-method]', function() {

    beforeEach(function() {
      return this.oldRails = $.rails
    })

    afterEach(function() {
      $.rails = this.oldRails
    })

    describe('when Rails UJS is loaded', function() {

      beforeEach(() => {
        $.rails = {}
      })

      describe('links', function() {
        for (let followableAttr of followableAttrs) {
          describe(`on a [${followableAttr}] link`, function() {

            it("is transformed to an up-method attribute so the element isn't handled a second time by Rails UJS", function() {
              const $element = $fixture(`a[href="/foo"][${followableAttr}][data-method="put"]`)
              up.hello($element)
              expect($element.attr('data-method')).toBeUndefined()
              expect($element.attr('up-method')).toEqual('put')
            })

            it("does not overwrite an existing up-method attribute, but gets deleted", function() {
              window.SPEC = 1
              const $element = $fixture(`a[href="/foo"][${followableAttr}][up-method="patch"][data-method="put"]`)
              up.hello($element)
              expect($element.attr('data-method')).toBeUndefined()
              expect($element.attr('up-method')).toEqual('patch')
            })

            it('transforms an element that becomes followable through [up-expand]', function() {
              const $element = $fixture('a[href="/path"][up-expand][data-method="put"]')
              const $child = $element.affix('span[up-href="/foo"][up-follow]')
              up.hello($element)
              expect($element.attr('up-href')).toEqual('/foo')
              expect($element.attr('up-follow')).toEqual('')
              expect($element.attr('data-method')).toBeUndefined()
              expect($element.attr('up-method')).toEqual('put')
            })

            it('transforms an element that becomes followable through a user macro like [content-link]', function() {
              up.macro('[user-make-followable]', (element) => element.setAttribute('up-follow', ''))
              const $element = $fixture('a[href=/foo][user-make-followable][data-method="put"]')
              up.hello($element)
              expect($element.attr('data-method')).toBeUndefined()
              expect($element.attr('up-method')).toEqual('put')
            })

            it('does not transform the link if it matches a custom up.link.config.followSelectors, but also has [up-follow=false] (bugfix)', function() {
              up.link.config.followSelectors.push('.hyperlink')
              const link = fixture('a.hyperlink[data-method="patch"][href="/foo"][up-follow="false"]')
              up.hello(link)

              expect(link).toHaveAttribute('data-method', 'patch')
              expect(link).not.toHaveAttribute('up-method')
            })
          })
        }

        describe('on a link that is not followable', function() {
          it("is not changed", function() {
            const $element = $fixture(`a[href="/foo"][data-method="put"]`)
            up.hello($element)
            expect($element.attr('data-method')).toEqual('put')
          })
        })
      })

      describe('forms', function() {
        for (let submittableAttr of submittableAttrs) {
          describe(`on a [${submittableAttr}] form`, function() {

            it("is transformed to an up-method attribute so the element isn't handled a second time by Rails UJS", function() {
              const $form = $fixture(`form[action="/foo"][${submittableAttr}][data-method="put"]`)
              up.hello($form)
              expect($form.attr('data-method')).toBeUndefined()
              expect($form.attr('up-method')).toEqual('put')
            })

            it('transforms a submit button with [data-method]', function() {
              const $form = $fixture(`form[action="/foo"][${submittableAttr}]`)
              const $button = $form.affix('input[type=submit][data-method="put"]')
              up.hello($form)
              expect($button.attr('data-method')).toBeUndefined()
              expect($button.attr('up-method')).toEqual('put')
            })

            it('does not transform a non-submit button with [data-method]', function() {
              const $form = $fixture(`form[action="/foo"][${submittableAttr}]`)
              const $button = $form.affix('input[type=button][data-method="put"]')
              up.hello($form)
              expect($button.attr('data-method')).toEqual('put')
              expect($button.attr('up-method')).toBeUndefined()
            })

          })
        }
      })

      describe('on a form that is not submittable', function() {

        it('does not transform the form', function() {
          const $form = $fixture(`form[action="/foo"][data-method="put"]`)
          up.hello($form)
          expect($form.attr('data-method')).toEqual('put')
          expect($form.attr('up-method')).toBeUndefined()
        })

        it('does not transform a submit button', function() {
          const $form = $fixture(`form[action="/foo"]`)
          const $button = $form.affix('input[type=submit][data-method="put"]')
          up.hello($form)
          expect($button.attr('data-method')).toEqual('put')
          expect($button.attr('up-method')).toBeUndefined()
        })

      })

    })

    describe('when Rails UJS is not loaded', function() {

      beforeEach(() => {
        $.rails = undefined
      })

      describe('links', function() {
        for (let followAttr of followableAttrs) {
          describe(`on a [${followAttr}] link`, () => {

            it("is not changed", function() {
              const $element = $fixture(`a[href="/foo"][${followAttr}][data-method="put"]`)
              up.hello($element)
              expect($element.attr('data-method')).toEqual('put')
            })

          })
        }
      })

      describe('forms', function() {
        for (let submitAttr of submittableAttrs) {
          describe(`on a [${submitAttr}] form`, function() {

            it("is not changed", function() {
              const $element = $fixture(`form[action="/foo"][${submitAttr}][data-method="put"]`)
              up.hello($element)
              expect($element.attr('data-method')).toEqual('put')
            })

          })
        }
      })

    })
  })

  describe('[data-confirm]', function() {

    beforeEach(function() {
      this.oldRails = $.rails
    })

    afterEach(function() {
      $.rails = this.oldRails
    })

    describe('when Rails UJS is loaded', function() {

      beforeEach(() => {
        $.rails = {}
      })

      describe('links', function() {
        for (let followableAttr of followableAttrs) {
          describe(`on a [${followableAttr}] link`, function() {

            it("is transformed to an up-confirm attribute so the element isn't handled a second time by Rails UJS", function() {
              const $element = $fixture(`a[href="/foo"][${followableAttr}][data-confirm="Really?"]`)
              up.hello($element)
              expect($element.attr('data-confirm')).toBeUndefined()
              expect($element.attr('up-confirm')).toEqual('Really?')
            })

            it("does not overwrite an existing up-confirm attribute, but gets deleted", function() {
              const $element = $fixture(`a[href="/foo"][${followableAttr}][up-confirm="Seriously?"][data-confirm="Really?"]`)
              up.hello($element)
              expect($element.attr('data-confirm')).toBeUndefined()
              expect($element.attr('up-confirm')).toEqual('Seriously?')
            })
          })
        }

        describe('on link that is not followable', () => {
          it("is not changed", function() {
            const $element = $fixture(`a[href="/foo"][data-confirm="Really?"]`)
            up.hello($element)
            expect($element.attr('data-confirm')).toEqual('Really?')
          })
        })
      })

      describe('forms', function() {
        for (let submittableAttr of submittableAttrs) {
          describe(`on a [${submittableAttr}] form`, function() {

            it("is transformed to an up-confirm attribute so the element isn't handled a second time by Rails UJS", function() {
              const $form = $fixture(`form[action="/foo"][${submittableAttr}][data-confirm="put"]`)
              up.hello($form)
              expect($form.attr('data-confirm')).toBeUndefined()
              expect($form.attr('up-confirm')).toEqual('put')
            })

            it('transforms a submit button with [data-confirm]', function() {
              const $form = $fixture(`form[action="/foo"][${submittableAttr}]`)
              const $button = $form.affix('input[type=submit][data-confirm="put"]')
              up.hello($form)
              expect($button.attr('data-confirm')).toBeUndefined()
              expect($button.attr('up-confirm')).toEqual('put')
            })

            it('does not transform a non-submit button with [data-confirm]', function() {
              const $form = $fixture(`form[action="/foo"][${submittableAttr}]`)
              const $button = $form.affix('input[type=button][data-confirm="put"]')
              up.hello($form)
              expect($button.attr('data-confirm')).toEqual('put')
              expect($button.attr('up-confirm')).toBeUndefined()
            })

          })
        }
      })


    })

    describe('when Rails UJS is not loaded', function() {

      beforeEach(() => {
        $.rails = undefined
      })

      describe('links', function() {
        for (let upAttribute of followableAttrs) {
          describe(`on a [${upAttribute}] link`, () => {

            it("is not changed", function() {
              const $element = $fixture(`a[href="/foo"][${upAttribute}][data-confirm="Really?"]`)
              up.hello($element)
              expect($element.attr('data-confirm')).toEqual('Really?')
            })

          })
        }
      })

    })
  })
})
