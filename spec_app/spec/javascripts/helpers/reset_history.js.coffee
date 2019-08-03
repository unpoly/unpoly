u = up.util
$ = jQuery

#beforeAll ->
#  @hrefBeforeSuite = location.href
#  @titleBeforeSuite = document.title

afterEach ->
  if up.history.config.enabled
    history.replaceState?({ fromResetPathHelper: true }, '', @hrefBeforeExample)
    document.title = @titleBeforeExample

beforeEach ->
  # Webkit ignores replaceState() calls after 100 calls / 30 sec.
  # So specs need to explicitely enable history handling.
  up.history.config.enabled = false

  # Store original URL and title so we can restore it in afterEach.
  @hrefBeforeExample = location.href
  @titleBeforeExample = document.title
