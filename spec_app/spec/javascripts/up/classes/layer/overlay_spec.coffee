describe 'up.Layer.Overlay', ->

  describe '#dismiss()', ->

    it 'closes this layer'

    it 'closes descendants before closing this layer'

    it 'aborts pending requests for this layer'

    it 'does not abort a pending request for another layer'

    it 'accepts a dismissal value that is passed to onDismissed handlers'

    it 'returns a resolved promise for the root layer'

    it 'focuses the link that originally opened the overlay'

    it 'pops this layer from the stack synchronously to prevent race conditions'

    describe 'events'

  describe '#accept()', ->

    it 'closes this layer'

    it 'closes descendants before closing this layer'

    it 'aborts pending requests for this layer'

    it 'does not abort a pending request for another layer'

    it 'accepts an acceptance value that is passed to onAccepted handlers'

    it 'returns a resolved promise for the root layer'

    it 'focuses the link that originally opened the overlay'

    it 'pops this layer from the stack synchronously to prevent race conditions'

    describe 'events'

  describe '#on()', ->

    it 'registers a listener for events on this layer'

    it 'allows to pass a selector for event delegation as second argument'

    it "does not call the listener for events on another layer"

    it "does not call the listener for events on another layer, even if the event target is a DOM child of the layer element"

  describe '#emit()', ->

    it "emits an event on this layer's element"

    it 'sets up.layer.current to this layer while listeners are running'
