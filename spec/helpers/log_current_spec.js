jasmine.getEnv().addReporter({
  specStarted(result) { jasmine.currentSpec = result },
  specDone(result) { jasmine.currentSpec = result }
})

beforeEach(function() {
  const specName = jasmine.currentSpec.fullName

  if (!specs.config.console) {
    console.debug(`%c${specName}`, 'color: white; background-color: #4477aa; padding: 3px 4px; border-radius: 2px; display: inline-block')
  }
})
