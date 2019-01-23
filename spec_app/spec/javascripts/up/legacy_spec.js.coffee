u = up.util
$ = jQuery

describe 'up.legacy', ->

  describe 'renamedModule()', ->

    it 'prints a warning and forwards the call to the new module', ->
      warnSpy = spyOn(up, 'warn')
      value = up.dom
      expect(warnSpy).toHaveBeenCalled()
      expect(value).toBe(up.fragment)

  describe 'warn()', ->

    it 'prepends a deprecation prefix to the given message and prints it to the warning log', ->
      spy = spyOn(up, 'warn')
      up.legacy.warn("a legacy warning")
      expect(spy).toHaveBeenCalledWith('[DEPRECATION] a legacy warning')

    it 'only prints a given message once', ->
      spy = spyOn(up, 'warn')
      up.legacy.warn("a very unique legacy warning")
      up.legacy.warn("a very unique legacy warning")
      expect(spy.calls.count()).toBe(1)

    it 'allows substitution'
