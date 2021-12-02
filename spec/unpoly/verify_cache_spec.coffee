describe 'cache verification', ->

  beforeEach (done) ->
    up.network.config.requestMetaKeys = []
    up.network.config.verifyCache = (response) => response.age >= 0
    fixture('.target', text: 'initial text')

    up.request('/cached-path', { cache: true })

    u.microtask ->
      jasmine.respondWithSelector('.target', text: 'cached text')
      u.microtask ->
        request = up.request('/cached-path', { cache: true })
        expect(request.fromCache).toBe(true)
        done()

  it 'reloads a fragment that was rendered from an older cached response', asyncSpec (next) ->
    up.render('.target', { url: '/cached-path', cache: true })

    next ->
      expect('.target').toHaveText('cached text')
      expect(up.network.isBusy()).toBe(true)

      jasmine.respondWithSelector('.target', text: 'verified text')

    next ->
      expect(up.network.isBusy()).toBe(false)
      expect('.target').toHaveText('verified text')

  it 'does not verify a fragment rendered from a recent cached response', asyncSpec (next) ->
    up.network.config.verifyCache = (response) => response.age >= 10 * 1000

    up.render('.target', { url: '/cached-path', cache: true })

    next ->
      expect('.target').toHaveText('cached text')
      expect(up.network.isBusy()).toBe(false)

  it "does not verify a fragment that wasn't rendered from a cached response", asyncSpec (next) ->
    up.render('.target', { url: '/uncached-path', cache: true })

    next ->
      expect(up.network.isBusy()).toBe(true)

      jasmine.respondWithSelector('.target', text: 'server text')

    next ->
      expect('.target').toHaveText('server text')

      expect(up.network.isBusy()).toBe(false)

  it 'does not verify a fragment when prepending content with :before', asyncSpec (next) ->
    up.render('.target:before', { url: '/cached-path', cache: true })

    next ->
      expect('.target').toHaveText('cached text' + 'initial text')
      expect(up.network.isBusy()).toBe(false)

  it 'does not verify a fragment when appending content with :after', asyncSpec (next) ->
    up.render('.target:after', { url: '/cached-path', cache: true })

    next ->
      expect('.target').toHaveText('initial text' + 'cached text')
      expect(up.network.isBusy()).toBe(false)

  it 'does not render a second time if the verification response is a 304 Not Modified', asyncSpec (next) ->
    up.render('.target', { url: '/cached-path', cache: true })

    next ->
      expect('.target').toHaveText('cached text')
      expect(up.network.isBusy()).toBe(true)

      jasmine.respondWith(status: 304)

    next ->
      expect(up.network.isBusy()).toBe(false)
      expect('.target').toHaveText('cached text')

  it 'allows to define which responses to verify in up.network.config.verifyCache'

  it 'does not use options like { confirm } or { feedback } when verifying', asyncSpec (next) ->
    confirmSpy = spyOn(up.browser, 'assertConfirmed')

    up.render('.target', { url: '/cached-path', cache: true, confirm: true })
    expect(confirmSpy.calls.count()).toBe(1)

    next ->
      expect('.target').toHaveText('cached text')
      expect(up.network.isBusy()).toBe(true)

      expect(confirmSpy.calls.count()).toBe(1)

  it "delays verification until the original transition completed, so an element isn't changed in-flight", asyncSpec (next) ->
    up.render('.target', { url: '/cached-path', cache: true, transition: 'cross-fade', easing: 'linear', duration: 200 })

    next ->
      expect('.target').toHaveText('cached text')
      expect('.target:not(.up-destroying)').toHaveOpacity(0, 0.15)
      expect(up.network.isBusy()).toBe(false)

    next.after 300, ->
      expect('.target:not(.up-destroying)').toHaveOpacity(1)
      expect(up.network.isBusy()).toBe(true)

      jasmine.respondWithSelector('.target', text: 'verified text')

    next ->
      expect('.target').toHaveText('verified text')

  it 'delays { onFinished } until the fragment was verified'

  it 'calls { onFinished } with the verified up.RenderResult'

  it 'calls { onFinished } with the cached zo.RenderResult if verification responded with 304 Not Modified'
