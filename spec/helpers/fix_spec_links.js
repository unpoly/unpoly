let pathBeforeSuite

jasmine.getEnv().addReporter({
  jasmineStarted(_result) {
    pathBeforeSuite = location.pathname
  },

  jasmineDone(_result) {
    for (let link of document.querySelectorAll('.jasmine-description a')) {
      let search = link.search
      if (search && search.includes("spec=")) {
        link.href = pathBeforeSuite + link.search
      }
    }
  }
})
