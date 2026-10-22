describe('up.Config', function() {

  describe('constructor', function() {
    it('creates an object from a function that productes the initial attributes', function() {
      const object = new up.Config('up.test.config', () => ({
        a: 1,
        b: 2
      }))
      expect(object.a).toBe(1)
      expect(object.b).toBe(2)
    })
  })

  describe('#reset', function() {

    it('resets the object to its original state', function() {
      const object = new up.Config('up.test.config', () => ({
        a: 1
      }))
      expect(object.b).toBeUndefined()
      object.a = 2
      expect(object.a).toBe(2)
      object.reset()
      expect(object.a).toBe(1)
    })

    it('does not remove the #reset method from the object', function() {
      const object = new up.Config('up.test.config', () => ({
        a: 1
      }))
      object.b = 2
      object.reset()
      expect(object.reset).toBeDefined()
    })
  })

  describe('#logUnknownKeys', function() {

    it('logs an error for a key that the default settings do not have', function() {
      const object = new up.Config('up.test.config', () => ({ a: 1 }))
      const errorSpy = spyOn(up.log, 'error')
      object.b = 2
      object.logUnknownKeys()
      expect(errorSpy).toHaveBeenCalledOnceWith('up.test.config', 'Ignoring unknown setting %s', 'b')
    })

    it('does not log an error for changed default settings', function() {
      const object = new up.Config('up.test.config', () => ({ a: 1 }))
      const errorSpy = spyOn(up.log, 'error')
      object.a = 2
      object.logUnknownKeys()
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('does not check keys of nested objects', function() {
      const object = new up.Config('up.test.config', () => ({ nested: { a: 1 } }))
      const errorSpy = spyOn(up.log, 'error')
      object.nested.b = 2
      object.logUnknownKeys()
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('does not log an error for the settings of Unpoly modules, which have no unknown keys', function() {
      const errorSpy = spyOn(up.log, 'error')
      for (let module of [up.fragment, up.link, up.form, up.layer, up.network, up.history, up.viewport, up.motion, up.radio, up.status, up.script, up.protocol, up.log]) {
        module.config.logUnknownKeys()
      }
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('runs one task after booting, so it sees settings made by an up:framework:booted listener', async function() {
      // The spec suite boots only once. Instead of booting again, we capture the listener
      // that a new up.Config registers for up:framework:boot, and call it ourselves.
      const addListenerSpy = spyOn(document, 'addEventListener')
      const object = new up.Config('up.test.config', () => ({ a: 1 }))
      const [_type, bootListener] = addListenerSpy.calls.allArgs().find(([type]) => type === 'up:framework:boot')
      const errorSpy = spyOn(up.log, 'error')

      bootListener()
      // Like a setting made by an up:framework:booted listener
      object.b = 2

      expect(errorSpy).not.toHaveBeenCalled()

      await wait()

      expect(errorSpy).toHaveBeenCalledOnceWith('up.test.config', 'Ignoring unknown setting %s', 'b')
    })

    if (up.migrate.loaded) {
      it('does not log an error for an old key that unpoly-migrate.js renames', function() {
        const errorSpy = spyOn(up.log, 'error')
        up.migrate.warn.mock()
        up.script.config.callbackPolicy = 'nonce'
        up.script.config.logUnknownKeys()
        expect(errorSpy).not.toHaveBeenCalled()
        expect(up.script.config.evalCallbackPolicy).toBe('nonce')
      })
    }
  })
})
