beforeEach ->
  @hrefBeforeExample = location.href
  @titleBeforeExample = document.title
  
afterEach ->
  history.replaceState?({ fromResetPathHelper: true }, @titleBeforeExample, @hrefBeforeExample)
  document.title = @titleBeforeExample
