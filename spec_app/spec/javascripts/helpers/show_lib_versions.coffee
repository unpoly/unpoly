showVersions = ->
  $('.jasmine-version').text """
  jQuery #{$.fn.jquery}
  Unpoly #{up.version}
  Jasmine #{jasmine.version}
  """

$ ->
  # Give Jasmine time to initialize
  setTimeout(showVersions, 0)