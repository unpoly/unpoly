describe 'up.log', ->

  describe 'JavaScript functions', ->

    describe 'up.log.puts', ->

      it 'sends a log message to the developer console iff the log is enabled', ->
        spyOn(up.browser, 'puts')

        up.log.disable()
        up.log.puts('message')
        expect(up.browser.puts).not.toHaveBeenCalled()

        up.log.enable()
        up.log.puts('message')
        expect(up.browser.puts).toHaveBeenCalledWith('log', '[UP] message')

    describe 'up.log.debug', ->

      it 'sends a debug message to the developer console iff the log is enabled', ->
        spyOn(up.browser, 'puts')

        up.log.disable()
        up.log.debug('message')
        expect(up.browser.puts).not.toHaveBeenCalled()

        up.log.enable()
        up.log.debug('message')
        expect(up.browser.puts).toHaveBeenCalledWith('debug', '[UP] message')

    describe 'up.log.error', ->

      it 'sends an error message to the developer console regardless whether the log is enabled or not', ->
        spyOn(up.browser, 'puts')

        up.log.disable()
        up.log.error('message1')
        expect(up.browser.puts).toHaveBeenCalledWith('error', '[UP] message1')

        up.log.enable()
        up.log.error('message2')
        expect(up.browser.puts.calls.allArgs()).toEqual [
          ['error', '[UP] message1'],
          ['error', '[UP] message2']
        ]
        