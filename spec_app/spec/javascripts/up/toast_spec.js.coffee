describe 'up.toast', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.toast.open()', ->

      it 'opens a toast box with the given message', ->
        up.toast.open('This is a message')
        expect('.up-toast').toBeInDOM()
        expect($('.up-toast-message').text()).toContain('This is a message')

      it 'opens a toast box with a close link', ->
        up.toast.open('This is a message')
        expect('.up-toast').toBeInDOM()
        $closeButton = $('.up-toast-action:contains("Close")')
        expect($closeButton).toBeInDOM()

        Trigger.clickSequence($closeButton)

        expect('.up-toast').not.toBeInDOM()

      it 'opens a toast box with the given custom action', ->
        action =
          label: 'Custom action'
          callback: jasmine.createSpy('action callback')
        up.toast.open('This is a message', { action })
        $actionButton = $('.up-toast-action:contains("Custom action")')
        expect($actionButton).toBeInDOM()
        expect(action.callback).not.toHaveBeenCalled()

        Trigger.clickSequence($actionButton)

        expect(action.callback).toHaveBeenCalled()

