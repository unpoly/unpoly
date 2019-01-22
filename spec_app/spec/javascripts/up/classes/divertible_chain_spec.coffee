u = up.util

describe 'up.DivertibleChain', ->

  describe '#asap', ->

    it "cancels all unstarted tasks, waits for the current task and starts the given task", (done) ->
      chain = new up.DivertibleChain()

      timer1Spy = jasmine.createSpy('timer1')
      timer1 = ->
        timer1Spy()
        up.specUtil.promiseTimer(100) # delay execution of next timer

      timer2Spy = jasmine.createSpy('timer2')
      timer2 = ->
        timer2Spy()
        up.specUtil.promiseTimer(100) # delay execution of next timer

      timer3Spy = jasmine.createSpy('timer3')
      timer3 = ->
        timer3Spy()
        up.specUtil.promiseTimer(100) # delay execution of next timer

      timer4Spy = jasmine.createSpy('timer4')
      timer4 = ->
        timer4Spy()
        up.specUtil.promiseTimer(100) # delay execution of next timer

      chain.asap(timer1)
      u.task ->
        expect(timer1Spy).toHaveBeenCalled()
        chain.asap(timer2)
        u.task ->
          # timer2 is still waiting for timer1 to finish
          expect(timer2Spy).not.toHaveBeenCalled()
          # Override the (2..n)th tasks. This unschedules timer2.
          chain.asap(timer3, timer4)
          u.setTimer 150, ->
            expect(timer2Spy).not.toHaveBeenCalled() # Has been canceled
            expect(timer3Spy).toHaveBeenCalled() # timer3 overrode timer2
            expect(timer4Spy).not.toHaveBeenCalled()
            u.setTimer 150, ->
              expect(timer4Spy).toHaveBeenCalled()
              done()
