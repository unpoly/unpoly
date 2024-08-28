describe 'up:fragment:load event', ->

  it('allows listeners to inspect event.renderOptions')

  it('allows listeners to inspect event.renderLayer')

  it('allows listeners to inspect event.fragments')

  it('is emitted after the guard event, but before up:request:load')

  it('allows listeners to request another URL')

  it('allows listeners to change the target selector')

  it('allows listeners to target another layer')

  it('allows listeners to add a preview function')

  it('can be prevented which aborts the render pass and stops a request from being sent')

  it('is emitted when re-using a cached response')

  it('is emitted on the fragment being updated')
