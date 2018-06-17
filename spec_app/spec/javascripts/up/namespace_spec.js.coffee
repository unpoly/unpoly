describe 'window.up namespace', ->

  describe 'deprecateRenamedModule()', ->

    it 'prints a warning and forwards the call to the new module', ->
      warnSpy = spyOn(up, 'warn')
      value = up.flow
      expect(warnSpy).toHaveBeenCalled()
      expect(value).toBe(up.dom)
