u = up.util
$ = jQuery

describe 'up.legacy', ->

  describe 'renamedModule()', ->

    it 'prints a warning and forwards the call to the new module', ->
      warnSpy = spyOn(up, 'warn')
      value = up.dom
      expect(warnSpy).toHaveBeenCalled()
      expect(value).toBe(up.fragment)
