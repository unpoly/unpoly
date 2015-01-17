beforeEach ->
  @previousHref = location.href
  @previousTitle = document.title
  
afterEach ->
  window.history.replaceState({}, @previousTitle, @previousHref)
 