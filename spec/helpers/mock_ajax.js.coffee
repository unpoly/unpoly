beforeEach ->
  jasmine.Ajax.install()

afterEach (done) ->
  up.util.task ->
    jasmine.Ajax.uninstall()
    done()

