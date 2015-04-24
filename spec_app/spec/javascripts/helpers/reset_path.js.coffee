beforeEach ->
  @previousHref = location.href
  @previousTitle = document.title
  
afterEach ->
  history.replaceState?({}, @previousTitle, @previousHref)
 