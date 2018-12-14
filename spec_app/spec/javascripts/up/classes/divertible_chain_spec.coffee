u = up.util

describe 'up.DivertibleChain', ->

  describe '#asap', ->

    it "cancels all unstarted tasks, waits for the current task and starts the given task", (done) ->
      chain = new up.DivertibleChain()

      timer1Spy = jasmine.createSpy('timer1 has been called')
      timer1 = ->
        timer1Spy()
        up.testUtil.promiseTimer(50)

      timer2Spy = jasmine.createSpy('timer2 has been called')
      timer2 = ->
        timer2Spy()
        up.testUtil.promiseTimer(50)

      timer3Spy = jasmine.createSpy('timer3 has been called')
      timer3 = ->
        timer3Spy()
        up.testUtil.promiseTimer(50)

      timer4Spy = jasmine.createSpy('timer4 has been called')
      timer4 = ->
        timer4Spy()
        up.testUtil.promiseTimer(50)

      chain.asap(timer1)
      u.nextFrame ->
        expect(timer1Spy).toHaveBeenCalled()
        chain.asap(timer2)
        u.nextFrame ->
          # timer2 is still waiting for timer1 to finish
          expect(timer2Spy).not.toHaveBeenCalled()
          # Override the (2..n)th tasks. This unschedules timer2.
          chain.asap(timer3, timer4)
          u.setTimer 80, ->
            expect(timer2Spy).not.toHaveBeenCalled()
            expect(timer3Spy).toHaveBeenCalled()
            u.setTimer 70, ->
              expect(timer4Spy).toHaveBeenCalled()
              done()
