jasmine.getEnv().addReporter(
  specStarted: (result) -> jasmine.currentSpec = result
  specDone: (result) -> jasmine.currentSpec = result
)

beforeEach ->
  specName = jasmine.currentSpec.fullName

  console.debug("%c#{specName}%c", 'color: white; background-color: #4477aa; padding: 3px 4px; border-radius: 2px; display: inline-block', '')
