const u = up.util
const $ = jQuery

describe('up.log', () => {
  describe('JavaScript functions', function() {

    describe('up.log.puts()', function() {

      it('sends a log message to the developer console iff the log is enabled', function() {
        spyOn(console, 'log')

        up.log.disable()
        up.log.puts('trace', 'message')
        expect(console.log).not.toHaveBeenCalled()

        up.log.enable()
        up.log.puts('trace', 'message')
        expect(console.log.calls.mostRecent().args[0]).toMatch(/message/)
      })

      it('does not format log messages if format is false', function() {
        spyOn(console, 'log')

        up.log.enable()
        up.log.config.format = false

        up.log.puts('trace', 'message')
        expect(console.log.calls.mostRecent().args[0]).toEqual('[trace] message')
      })

      it('formats log messages if format is true', function() {
        spyOn(console, 'log')

        up.log.enable()
        up.log.config.format = true

        up.log.puts('trace', 'message')
        expect(console.log.calls.mostRecent().args[0]).toMatch('%ctrace%c message')
      })
    })

    describe('up.log.error()', () => {
      it('sends an error message to the developer console regardless whether the log is enabled or not', function() {
        spyOn(console, 'error')

        up.log.disable()
        up.log.error('trace', 'message1')
        expect(console.error.calls.mostRecent().args[0]).toMatch(/message1/)

        up.log.enable()
        up.log.error('trace', 'message2')
        expect(console.error.calls.argsFor(0)).toMatch(/message1/)
        expect(console.error.calls.argsFor(1)).toMatch(/message2/)
      })
    })
  })
})

