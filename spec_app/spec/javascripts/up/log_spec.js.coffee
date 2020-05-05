u = up.util
$ = jQuery

describe 'up.log', ->

  describe 'JavaScript functions', ->

    describe 'up.log.puts', ->

      it 'sends a log message to the developer console iff the log is enabled', ->
        spyOn(console, 'log')

        up.log.disable()
        up.log.puts('trace', 'message')
        expect(console.log).not.toHaveBeenCalled()

        up.log.enable()
        up.log.puts('trace', 'message')
        expect(console.log.calls.mostRecent().args[0]).toMatch(/message/)

#    describe 'up.log.debug', ->
#
#      it 'sends a debug message to the developer console iff the log is enabled', ->
#        spyOn(console, 'debug')
#
#        up.log.disable()
#        up.log.debug('message')
#        expect(console.debug).not.toHaveBeenCalled()
#
#        up.log.enable()
#        up.log.debug('message')
#        expect(console.debug).toHaveBeenCalledWith('[UP] message')

    describe 'up.log.error', ->

      it 'sends an error message to the developer console regardless whether the log is enabled or not', ->
        spyOn(console, 'error')

        up.log.disable()
        up.log.error('trace', 'message1')
        expect(console.error.calls.mostRecent().args[0]).toMatch(/message1/)

        up.log.enable()
        up.log.error('trace', 'message2')
        expect(console.error.calls.argsFor(0)).toMatch(/message1/)
        expect(console.error.calls.argsFor(1)).toMatch(/message2/)

