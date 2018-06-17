describe 'up.FocusTracker', ->

  describe '#lastField', ->

    it 'returns undefined if no field is focused', ->
      tracker = new up.FocusTracker()
      expect(tracker.lastField()).toBeUndefined()

    it 'returns a <input type="text"> after it was focused', ->
      tracker = new up.FocusTracker()
      $form = affix('form')
      $input = $form.affix('input[type=text]')
      $input.focus()
      expect(tracker.lastField()).toEqual($input[0])

    it 'returns a <select> after it was focused', ->
      tracker = new up.FocusTracker()
      $form = affix('form')
      $select = $form.affix('select')
      $option = $select.affix('option')
      $select.focus()
      expect(tracker.lastField()).toEqual($select[0])

    it 'returns the field that was most recently focused after a series of focus/blur'

    it 'returns undefined after a field was focused, but then detached'

    it 'returns a previously focused field for some time after it was blurred, so we can retrieve the last field after the user submits'

    it 'returns undefined after a field was blurred and some time has passed'

