describe 'up.RenderOptions', ->

  describe '.preprocess()', ->

    it 'sets global defaults', ->
      givenOptions = {}
      options = up.RenderOptions.preprocess(givenOptions)
      expect(options.useHungry).toBe(true)
      expect(options.useKeep).toBe(true)
      expect(options.abort).toBe('target')

    describe 'with { navigate: true }', ->

      it 'sets defaults appropriate for user navigation', ->
        givenOptions = { navigate: true }
        options = up.RenderOptions.preprocess(givenOptions)

        expect(options.feedback).toBe(true)
        expect(options.fallback).toBe(true)
        expect(options.peel).toBe(true)
        expect(options.cache).toBe('auto')

      it 'allows to configure defaults using up.fragment.config.navigateOptions', ->
        up.fragment.config.navigateOptions.feedback = false
        up.fragment.config.navigateOptions.transition = 'move-left'

        givenOptions = { navigate: true }
        options = up.RenderOptions.preprocess(givenOptions)

        expect(options.feedback).toBe(false)
        expect(options.transition).toBe('move-left')

      it 'lets the given options override the defaults from up.fragment.config.navigateOptions', ->
        up.fragment.config.navigateOptions.feedback = false
        givenOptions = { navigate: true, feedback: true }
        options = up.RenderOptions.preprocess(givenOptions)

        expect(options.feedback).toBe(true)

      it 'omits navigate options that may later be overridden by a layer config', ->
        up.fragment.config.navigateOptions.focus = 'auto'
        up.fragment.config.navigateOptions.scroll = 'auto'
        up.fragment.config.navigateOptions.history = 'auto'

        givenOptions = { navigate: true }
        options = up.RenderOptions.preprocess(givenOptions)
        expect(options.focus).toBeUndefined()
        expect(options.scroll).toBeUndefined()
        expect(options.history).toBeUndefined()

    describe 'with { navigate: false }', ->

      it 'does not set navigation defaults, which are often in the way for smaller fragment changes', ->
        givenOptions = { navigate: false }
        options = up.RenderOptions.preprocess(givenOptions)

        expect(options.fallback).toBeUndefined()
        expect(options.peel).toBeUndefined()
        expect(options.cache).toBeUndefined()
        expect(options.scroll).toBeUndefined()

      it 'does not set a truthy { history } to not update { title, location } props, even in history-less layers', ->
        givenOptions = { navigate: false }
        options = up.RenderOptions.preprocess(givenOptions)

        expect(options.history).toBeFalsy()

    it 'overrides defaults with given options', ->
      givenOptions = { navigate: false, useHungry: false, source: '/other-source' }
      options = up.RenderOptions.preprocess(givenOptions)

      expect(options.useHungry).toBe(false)
      expect(options.source).toBe('/other-source')

    describe 'with { preload: true }', ->

      it 'disables features inappropriate when preloading, regardless of given options', ->
        givenOptions = { preload: true, abort: true, confirm: true, feedback: true, url: '/path' }
        options = up.RenderOptions.preprocess(givenOptions)

        expect(options.abort).toBe(false)
        expect(options.confirm).toBe(false)
        expect(options.feedback).toBe(false)
        expect(options.cache).toBe(true)
        expect(options.background).toBe(true)

        # Other options are left unchanged
        expect(options.url).toBe('/path')

    if up.migrate.loaded
      it 'moves an URL string from the { history } option (legacy syntax) to the { location } option (next syntax)', ->
        options = { history: '/foo' }
        warnSpy = up.migrate.warn.mock()

        up.RenderOptions.preprocess(options)

        expect(options).toEqual { history: 'auto', location: '/foo' }
        expect(warnSpy).toHaveBeenCalled()

      it 'does nothing for { history: "auto" }', ->
        options = { location: '/foo' }
        warnSpy = up.migrate.warn.mock()

        up.RenderOptions.preprocess(options)

        expect(options).toEqual { location: '/foo' }
        expect(warnSpy).not.toHaveBeenCalled()

  describe '.deriveFailOptions()', ->

    # In the code flow in up.fragment, options are first preprocessed and then
    # failOptions are derived. Mimic this behavior here.
    preprocessAndDerive = (options) ->
      options = up.RenderOptions.preprocess(options)
      options = up.RenderOptions.deriveFailOptions(options)
      options

    it 'sets global defaults', ->
      givenOptions = {}
      options = preprocessAndDerive(givenOptions)

      expect(options.useHungry).toBe(true)
      expect(options.useKeep).toBe(true)

    describe 'with { navigate: true }', ->

      it 'sets defaults appropriate for user navigation', ->
        givenOptions = { navigate: true }

        options = preprocessAndDerive(givenOptions)

        expect(options.feedback).toBe(true)
        expect(options.fallback).toBe(true)
        expect(options.history).toBe('auto')
        expect(options.peel).toBe(true)
        expect(options.scroll).toBe('auto')
        expect(options.cache).toBe('auto')

    describe 'with { navigate: false }', ->

      it 'only sets defaults appropriate to programmatic fragment changes', ->
        givenOptions = { navigate: false }
        options = preprocessAndDerive(givenOptions)

        expect(options.history).toBeFalsy()
        expect(options.cache).toBe(undefined)
        expect(options.abort).toBe('target')

    it 'inherits shared keys from success options', ->
      givenOptions = { confirm: 'Really?', origin: document.body, history: true }
      options = preprocessAndDerive(givenOptions)

      expect(options.confirm).toBe('Really?')
      expect(options.origin).toBe(document.body)
      expect(options.history).toBe(true)

    it 'does not inherit non-shared keys from success options', ->
      givenOptions = { layer: 'new', mode: 'popup', scroll: '.selector' }
      options = preprocessAndDerive(givenOptions)

      expect(options.layer).toBe('current')
      expect(options.scroll).toBeUndefined()

    it 'overrides defaults with given fail-prefixed options', ->
      givenOptions = { failTarget: '.fail', failSource: '/fail-source', failMode: 'popup' }
      options = preprocessAndDerive(givenOptions)

      expect(options.target).toBe('.fail')
      expect(options.mode).toBe('popup')
      expect(options.source).toBe('/fail-source')

    it 'prioritizes the prefix "on" over "fail", converting onFailCallback to onCallback', ->
      fn = ->
      givenOptions = { onFailRendered: fn }
      options = preprocessAndDerive(givenOptions)

      expect(options.onRendered).toBe(fn)

