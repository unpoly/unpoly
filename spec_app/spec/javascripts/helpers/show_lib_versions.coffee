showVersions = ->
  $('.jasmine-version').text """
  jQuery #{$.fn.jquery}
  Jasmine #{jasmine.version}
  """

$ ->
  # Give Jasmine time to initialize
  setTimeout(showVersions, 0)