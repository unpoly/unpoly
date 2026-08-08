jasmine.getEnv().addReporter({
  specStarted(result) { jasmine.currentSpec = result },
  specDone(result) { jasmine.currentSpec = result }
})

beforeEach(function() {
  const specName = jasmine.currentSpec.fullName

  // Only useful for a human watching the browser console. When the terminal
  // harness is driving, it prints spec progress to stdout instead.
  if (!specs.drivenByTerminal) {
    console.debug(`%c${specName}`, 'color: white; background-color: #4477aa; padding: 3px 4px; border-radius: 2px; display: inline-block')
  }
})
