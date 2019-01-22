u = up.util
$ = jQuery

replaceStateHelperCount = 0

beforeAll ->
  @hrefBeforeSuite = location.href
  @titleBeforeSuite = document.title

afterAll (done) ->
  up.util.task =>
    history.replaceState?({ fromResetPathHelper: true }, '', @hrefBeforeSuite)
    document.title = @titleBeforeSuite
    done()

beforeEach ->
  # Webkit ignores replaceState() calls after 100 calls / 30 sec.
  # So specs need to explicitely activate history handling.
  up.history.config.enabled = false

  # Store original URL and title so we can restore it in afterEach.
  @hrefBeforeExample = location.href
  @titleBeforeExample = document.title
