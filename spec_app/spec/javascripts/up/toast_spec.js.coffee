u = up.util
$ = jQuery

describe 'up.toast', ->

  describe 'JavaScript functions', ->

    describe 'up.toast.open()', ->

      it 'opens a toast box with the given message', ->
        up.toast.open('This is a message')
        expect('up-toast').toBeAttached()
        expect($('up-toast-message').text()).toContain('This is a message')

      it 'opens a toast box with a close link', ->
        up.toast.open('This is a message')
        expect('up-toast').toBeAttached()
        $closeButton = $('up-toast-action:contains("Close")')
        expect($closeButton).toBeAttached()

        Trigger.clickSequence($closeButton)

        expect('up-toast').not.toBeAttached()

      it 'opens a toast box with the given custom action', ->
        action =
          label: 'Custom action'
          callback: jasmine.createSpy('action callback')
        up.toast.open('This is a message', { action })
        $actionButton = $('up-toast-action:contains("Custom action")')
        expect($actionButton).toBeAttached()
        expect(action.callback).not.toHaveBeenCalled()

        Trigger.clickSequence($actionButton)

        expect(action.callback).toHaveBeenCalled()

