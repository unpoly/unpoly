describe('up.Preview', function() {

  describe('target', function() {

    it('returns the target selector')

    it('returns a resolved selector for :main')

  })

  describe('fragment', function() {

    it('returns the element that is being replaced')

    it('returns the first element for a multi-target update')

    it('returns a missing value when opening a new layer')

  })

  describe('fragments', function() {

    it('returns an array of all targeted elements')

    it('returns a missing value when opening a new layer')

  })

  describe('orgin', function() {

    it('returns the { origin } element (e.g. the link being followed)')

  })

  describe('layer', function() {

    it('returns the resolved up.Layer object that is being targeted')

    it('returns the first layer in an update that might match multiple layers')

    it('returns the string "new" when opening a new layer')

  })

  describe('setAttrs()', function() {

    it('temporarily sets attributes on an element')

  })

  describe('addClass()', function() {

    it('temporarily adds a class to an element')

  })

  describe('setStyle()', function() {

    it('temporarily sets inline styles on an element')

  })

  describe('setStyle()', function() {

    it('temporarily disables an input field')

    it('temporarily disables a container of input fields')

    it('does not re-enable fields that were already disabled before the preview')

  })

  describe('insert()', function() {

    it('temporarily appends the given element to the children of the given reference')

    it('accepts a position relative to the given reference')

    it('parses a new element from a string of HTML')

    it('compiles and cleans the temporary element as it enters and exits the DOM')

  })

  describe('swap()', function() {

    it('temporarily swaps an element with another')

    it('compiles and cleans the temporary element as it enters and exits the DOM')

    it('does not clean or re-compile the original element while it is detached')

    // it('transfers an .up-loading class to the new element')

  })

  describe('show()', function() {

    it('temporarily shows a hidden element')

    it('does not re-hide element that was visible before the preview')

  })

  describe('show()', function() {

    it('temporarily hides a visible element')

    it('does not re-show element that was hidden before the preview')

  })

  describe('run(String)', function() {

    it('runs another named preview')

    it('also reverts the effects of the other preview')

  })

  describe('run(Function)', function() {

    it('runs another preview function')

    it('also reverts the effects of the other preview')

  })

  describe('undo()', function() {

    it('tracks a function to run when the preview is reverted')

  })

})
