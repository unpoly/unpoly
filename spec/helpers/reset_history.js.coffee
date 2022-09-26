u = up.util
$ = jQuery

beforeAll ->
  jasmine.locationBeforeSuite = location.href
  jasmine.titleBeforeSuite = document.title

afterAll ->
  # Webkit ignores replaceState() calls after 100 calls / 30 sec.
  # Hence we only call it when the history was actually changed.
  if up.history.config.enabled && !up.util.matchURLs(location.href, jasmine.locationBeforeSuite)
    history.replaceState?({ fromResetPathHelper: true }, '', jasmine.locationBeforeSuite)
    document.title = jasmine.titleBeforeSuite

beforeEach ->
  # Webkit ignores replaceState() calls after 100 calls / 30 sec.
  # So specs need to explicitly enable history handling.
  up.history.config.enabled = false

  # Store original URL and title so specs may use it
  jasmine.locationBeforeExample = location.href
  jasmine.titleBeforeExample = document.title

afterEach ->
  up.viewport.root.scrollTop = 0
