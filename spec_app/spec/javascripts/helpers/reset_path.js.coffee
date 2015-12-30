beforeEach ->
  @previousHref = location.href
  @previousTitle = document.title
  
afterEach ->
  if up.browser.canPushState()
    history.replaceState?({}, @previousTitle, @previousHref)
    document.title = @previousTitle

