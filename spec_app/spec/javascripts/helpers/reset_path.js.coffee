beforeEach ->
  @hrefBeforeExample = location.href
  @titleBeforeExample = document.title
  
afterEach ->
  if up.browser.canPushState()
    history.replaceState?({ fromResetPathHelper: true }, @titleBeforeExample, @hrefBeforeExample)
  document.title = @titleBeforeExample
