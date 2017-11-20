describe 'window.up namespace', ->

  describe 'renamedModule()', ->

    it 'prints a warning and forwards the call to the new module', ->
      warnSpy = spyOn(up.log, 'warn')
      value = up.flow
      expect(warnSpy).toHaveBeenCalled()
      expect(value).toBe(up.dom)
