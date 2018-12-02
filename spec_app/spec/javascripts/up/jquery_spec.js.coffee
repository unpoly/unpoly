describe 'window.$', ->

  it 'should be undefined to not accidentally pass on jQuery-dependent code', ->
    expect(window.$).toBeUndefined()
