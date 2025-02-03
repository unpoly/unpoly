beforeEach(function() {
  jasmine.Ajax.install()
})

afterEach(function(done) {
  up.util.task(function() {
    jasmine.Ajax.uninstall()
    done()
  })
})
