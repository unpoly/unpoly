beforeEach ->
  jasmine.Ajax.install()

afterEach (done) ->
  up.util.nextFrame ->
    jasmine.Ajax.uninstall()
    done()

