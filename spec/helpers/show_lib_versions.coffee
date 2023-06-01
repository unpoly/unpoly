u = up.util
$ = jQuery

showVersions = ->
  $('.jasmine-version').text """
  Jasmine #{jasmine.version}
  /
  Unpoly #{up.version}
  /
  jQuery #{$.fn.jquery}
  """

$ ->
  # Give Jasmine time to initialize
  setTimeout(showVersions, 0)
