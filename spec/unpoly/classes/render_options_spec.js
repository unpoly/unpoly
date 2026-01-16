describe('up.RenderOptions', function() {

  describe('.preprocess()', function() {

    it('sets global defaults', function() {
      const givenOptions = {}
      const options = up.RenderOptions.preprocess(givenOptions)
      expect(options.hungry).toBe(true)
      expect(options.keep).toBe(true)
      expect(options.abort).toBe('target')
    })

    it('normalizes a { layer } shortcut like "new drawer"', function() {
      const givenOptions = { layer: 'new drawer' }
      const options = up.RenderOptions.preprocess(givenOptions)
      expect(options.layer).toBe('new')
      expect(options.mode).toBe('drawer')
    })

    it('removes the "use" prefix from option keys', function() {
      const givenOptions = { target: '#content', useHungry: false, useKeep: false, useData: { foo: 'bar' } }
      const options = up.RenderOptions.preprocess(givenOptions)
      expect(options.target).toBe('#content')
      expect(options.hungry).toBe(false)
      expect(options).not.toHaveKey('useHungry')
      expect(options.keep).toBe(false)
      expect(options).not.toHaveKey('useKeep')
      expect(options.data).toEqual({ foo: 'bar' })
      expect(options).not.toHaveKey('useData')
    })

    describe('with { navigate: true }', function() {

      it('sets defaults appropriate for user navigation', function() {
        const givenOptions = { navigate: true }
        const options = up.RenderOptions.preprocess(givenOptions)

        expect(options.feedback).toBe(true)
        expect(options.fallback).toBe(true)
        expect(options.peel).toBe('dismiss')
        expect(options.cache).toBe('auto')
      })

      it('allows to configure defaults using up.fragment.config.navigateOptions', function() {
        up.fragment.config.navigateOptions.feedback = false
        up.fragment.config.navigateOptions.transition = 'move-left'

        const givenOptions = { navigate: true }
        const options = up.RenderOptions.preprocess(givenOptions)

        expect(options.feedback).toBe(false)
        expect(options.transition).toBe('move-left')
      })

      it('lets the given options override the defaults from up.fragment.config.navigateOptions', function() {
        up.fragment.config.navigateOptions.feedback = false
        const givenOptions = { navigate: true, feedback: true }
        const options = up.RenderOptions.preprocess(givenOptions)

        expect(options.feedback).toBe(true)
      })

      it('omits navigate options that may later be overridden by a layer config', function() {
        up.fragment.config.navigateOptions.focus = 'auto'
        up.fragment.config.navigateOptions.scroll = 'auto'
        up.fragment.config.navigateOptions.history = 'auto'

        const givenOptions = { navigate: true }
        const options = up.RenderOptions.preprocess(givenOptions)
        expect(options.focus).toBeUndefined()
        expect(options.scroll).toBeUndefined()
        expect(options.history).toBeUndefined()
      })
    })

    describe('with { navigate: false }', function() {

      it('does not set navigation defaults, which are often in the way for smaller fragment changes', function() {
        const givenOptions = { navigate: false }
        const options = up.RenderOptions.preprocess(givenOptions)

        expect(options.fallback).toBeUndefined()
        expect(options.peel).toBeUndefined()
        expect(options.cache).toBeUndefined()
        expect(options.scroll).toBeUndefined()
      })

      it('does not set a truthy { history } to not update { title, location } props, even in history-less layers', function() {
        const givenOptions = { navigate: false }
        const options = up.RenderOptions.preprocess(givenOptions)

        expect(options.history).toBeFalsy()
      })
    })

    it('overrides defaults with given options', function() {
      const givenOptions = { navigate: false, hungry: false, source: '/other-source' }
      const options = up.RenderOptions.preprocess(givenOptions)

      expect(options.hungry).toBe(false)
      expect(options.source).toBe('/other-source')
    })

    if (up.migrate.loaded) {
      it('moves an URL string from the { history } option (legacy syntax) to the { location } option (next syntax)', function() {
        const options = { history: '/foo' }
        const warnSpy = up.migrate.warn.mock()

        up.RenderOptions.preprocess(options)

        expect(options).toEqual(jasmine.objectContaining({ history: 'auto', location: '/foo' }))
        expect(warnSpy).toHaveBeenCalled()
      })

      it('does not migrate a { history: "auto" } string value into the { location } option', function() {
        const options = { location: '/foo' }
        const warnSpy = up.migrate.warn.mock()

        up.RenderOptions.preprocess(options)

        expect(options).toEqual(jasmine.objectContaining({ location: '/foo' }))
        expect(warnSpy).not.toHaveBeenCalled()
      })
    }
  })

  describe('.deriveFailOptions()', function() {

    // In the code flow in up.fragment, options are first preprocessed and then
    // failOptions are derived. Mimic this behavior here.
    const preprocessAndDerive = function(options) {
      options = up.RenderOptions.preprocess(options)
      options = up.RenderOptions.deriveFailOptions(options)
      return options
    }

    it('sets global defaults', function() {
      const givenOptions = {}
      const options = preprocessAndDerive(givenOptions)

      expect(options.hungry).toBe(true)
      expect(options.keep).toBe(true)
    })

    describe('with { navigate: true }', function() {
      it('sets defaults appropriate for user navigation', function() {
        const givenOptions = { navigate: true }

        const options = preprocessAndDerive(givenOptions)

        expect(options.feedback).toBe(true)
        expect(options.fallback).toBe(true)
        expect(options.history).toBe('auto')
        expect(options.peel).toBe('dismiss')
        expect(options.scroll).toBe('auto')
        expect(options.cache).toBe('auto')
      })
    })

    describe('with { navigate: false }', function() {
      it('only sets defaults appropriate to programmatic fragment changes', function() {
        const givenOptions = { navigate: false }
        const options = preprocessAndDerive(givenOptions)

        expect(options.history).toBeFalsy()
        expect(options.cache).toBe(undefined)
        expect(options.abort).toBe('target')
      })
    })

    it('inherits shared keys from success options', function() {
      const givenOptions = { confirm: 'Really?', origin: document.body, history: true }
      const options = preprocessAndDerive(givenOptions)

      expect(options.confirm).toBe('Really?')
      expect(options.origin).toBe(document.body)
      expect(options.history).toBe(true)
    })

    it('does not inherit non-shared keys from success options', function() {
      const givenOptions = { layer: 'new', mode: 'popup', scroll: '.selector', focus: 'restore' }
      const options = preprocessAndDerive(givenOptions)

      expect(options.scroll).toBeUndefined()
      expect(options.focus).toBe('keep')
    })

    it('overrides defaults with given fail-prefixed options', function() {
      const givenOptions = { failTarget: '.fail', failSource: '/fail-source', failMode: 'popup' }
      const options = preprocessAndDerive(givenOptions)

      expect(options.target).toBe('.fail')
      expect(options.mode).toBe('popup')
      expect(options.source).toBe('/fail-source')
    })

    it('prioritizes the prefix "on" over "fail", converting onFailCallback to onCallback', function() {
      const fn = function() {}
      const givenOptions = { onFailRendered: fn }
      const options = preprocessAndDerive(givenOptions)

      expect(options.onRendered).toBe(fn)
    })
  })
})

