let pathBeforeSuite

jasmine.getEnv().addReporter({
  jasmineStarted(_result) {
    pathBeforeSuite = location.pathname
  },

  jasmineDone(_result) {
    // Jasmine hard-codes the current URL into the links to re-run a single spec.
    // When we temporarily change the history location in a spec, that temporary URL
    // is written into that link. Change all those links to use the suite's initial URL.
    for (let link of document.querySelectorAll('.jasmine-description a')) {
      let search = link.search
      if (search && search.includes("spec=")) {
        link.href = pathBeforeSuite + link.search
      }
    }
  }
})
