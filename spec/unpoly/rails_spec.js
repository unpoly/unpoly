const u = up.util
const $ = jQuery

describe('up.rails', function() {

  const upAttributes = ['up-follow', 'up-target']
  if (up.migrate.loaded) {
    upAttributes.push('up-modal', 'up-popup')
  }

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

      for (let upAttribute of upAttributes) {

        describe(`on an [${upAttribute}] element`, function() {

          it("is transformed to an up-method attribute so the element isn't handled a second time by Rails UJS", function() {
            const $element = $fixture(`a[href="/foo"][${upAttribute}][data-method="put"]`)
            up.hello($element)
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('put')
          })

          it("does not overwrite an existing up-method attribute, but gets deleted", function() {
            const $element = $fixture(`a[href="/foo"][${upAttribute}][up-method="patch"][data-method="put"]`)
            up.hello($element)
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('patch')
          })

          it('transforms an element that becomes followable through [up-expand]', function() {
            const $element = $fixture('a[up-expand][data-method="put"]')
            const $child = $element.affix('span[up-href="/foo"][up-follow]')
            up.hello($element)
            expect($element.attr('up-href')).toEqual('/foo')
            expect($element.attr('up-follow')).toEqual('')
            expect($element.attr('data-method')).toBeUndefined()
            expect($element.attr('up-method')).toEqual('put')
          })

          it('transforms an element that becomes followable through a user macro like [content-link]', function() {
            up.macro('[user-make-followable]', element => element.setAttribute('up-follow', ''))
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

      describe('on an element without Unpoly attributes', () => {
        it("is not changed", function() {
          const $element = $fixture(`a[href="/foo"][data-method="put"]`)
          up.hello($element)
          expect($element.attr('data-method')).toEqual('put')
        })
      })
    })

    describe('when Rails UJS is not loaded', function() {

      beforeEach(() => {
        $.rails = undefined
      })

      for (let upAttribute of upAttributes) {
        describe(`on an [${upAttribute}] element`, () => {
          it("is not changed", function() {
            const $element = $fixture(`a[href="/foo"][${upAttribute}][data-method="put"]`)
            up.hello($element)
            expect($element.attr('data-method')).toEqual('put')
          })
        })
      }
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

      u.each(upAttributes, upAttribute => describe(`on an [${upAttribute}] element`, function() {

        it("is transformed to an up-confirm attribute so the element isn't handled a second time by Rails UJS", function() {
          const $element = $fixture(`a[href="/foo"][${upAttribute}][data-confirm="Really?"]`)
          up.hello($element)
          expect($element.attr('data-confirm')).toBeUndefined()
          expect($element.attr('up-confirm')).toEqual('Really?')
        })

        it("does not overwrite an existing up-confirm attribute, but gets deleted", function() {
          const $element = $fixture(`a[href="/foo"][${upAttribute}][up-confirm="Seriously?"][data-confirm="Really?"]`)
          up.hello($element)
          expect($element.attr('data-confirm')).toBeUndefined()
          expect($element.attr('up-confirm')).toEqual('Seriously?')
        })
      }))

      describe('on an element without Unpoly attributes', () => it("is not changed", function() {
        const $element = $fixture(`a[href="/foo"][data-confirm="Really?"]`)
        up.hello($element)
        expect($element.attr('data-confirm')).toEqual('Really?')
      }))
    })

    describe('when Rails UJS is not loaded', function() {

      beforeEach(() => {
        $.rails = undefined
      })

      for (let upAttribute of upAttributes) {
        describe(`on an [${upAttribute}] element`, () => {
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
